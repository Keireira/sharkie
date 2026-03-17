mod config;
mod error;
mod models;
mod routes;
mod services;
mod state;

use std::time::Duration;

use axum::http::{HeaderName, HeaderValue, header};
use sqlx::postgres::PgPoolOptions;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::request_id::{MakeRequestUuid, PropagateRequestIdLayer, SetRequestIdLayer};
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::TraceLayer;
use tracing::info;

use crate::config::Config;
use crate::state::AppState;

static REQUEST_ID_HEADER: HeaderName = HeaderName::from_static("x-request-id");

#[tokio::main]
async fn main() {
    // Local overrides first (gitignored), then production defaults.
    // dotenvy won't overwrite — first loaded value wins.
    dotenvy::from_filename("sharkie.local.env").ok();
    dotenvy::from_filename("sharkie.env").ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "sharkie=info,tower_http=info".into()),
        )
        .init();

    let config = Config::from_env();

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await
        .expect("failed to connect to database");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("failed to run migrations");

    info!("database connected and migrations applied");

    let http_client = reqwest::Client::new();
    let state = AppState {
        db: pool.clone(),
        config: config.clone(),
        http_client,
    };

    // Backfill missing historical data
    info!("checking for missing historical data");
    if let Err(e) = services::rates::backfill_missing_rates(&state).await {
        tracing::warn!(error = %e, "failed to backfill missing rates");
    }

    // ── CORS ───────────────────────────────────────
    let cors = if config.allowed_origins.is_empty() {
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any)
    } else {
        let origins: Vec<_> = config
            .allowed_origins
            .iter()
            .filter_map(|o| o.parse().ok())
            .collect();
        CorsLayer::new()
            .allow_origin(origins)
            .allow_methods(Any)
            .allow_headers(Any)
    };

    // ── Rate limiting (60 req/min per IP) ──────────
    // Uses SmartIpKeyExtractor: tries X-Forwarded-For/X-Real-IP first (behind Cloudflare/Nginx),
    // falls back to peer IP for direct connections.
    let governor_conf = std::sync::Arc::new(
        tower_governor::governor::GovernorConfigBuilder::default()
            .per_second(1)
            .burst_size(60)
            .key_extractor(tower_governor::key_extractor::SmartIpKeyExtractor)
            .use_headers()
            .finish()
            .expect("failed to build governor config"),
    );
    let governor_limiter = tower_governor::GovernorLayer::new(governor_conf);

    // ── Security headers ───────────────────────────
    let hsts = SetResponseHeaderLayer::overriding(
        header::STRICT_TRANSPORT_SECURITY,
        HeaderValue::from_static("max-age=63072000; includeSubDomains; preload"),
    );
    let nosniff = SetResponseHeaderLayer::overriding(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    );
    let frame_deny = SetResponseHeaderLayer::overriding(
        header::X_FRAME_OPTIONS,
        HeaderValue::from_static("DENY"),
    );
    let referrer = SetResponseHeaderLayer::overriding(
        header::REFERRER_POLICY,
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );

    // ── Assemble middleware stack ───────────────────
    // Order matters: outermost layer runs first.
    // Bottom-up: request flows from last .layer() → first .layer() → handler
    let app = routes::router()
        .layer(cors)
        // Security headers on every response
        .layer(hsts)
        .layer(nosniff)
        .layer(frame_deny)
        .layer(referrer)
        // Request ID: generate → trace → propagate to response
        .layer(PropagateRequestIdLayer::new(REQUEST_ID_HEADER.clone()))
        .layer(
            TraceLayer::new_for_http().make_span_with(|request: &axum::http::Request<_>| {
                let request_id = request
                    .headers()
                    .get(&REQUEST_ID_HEADER)
                    .and_then(|v| v.to_str().ok())
                    .unwrap_or("-");
                tracing::info_span!(
                    "http",
                    method = %request.method(),
                    uri = %request.uri(),
                    request_id = %request_id,
                )
            }),
        )
        .layer(SetRequestIdLayer::new(
            REQUEST_ID_HEADER.clone(),
            MakeRequestUuid,
        ))
        // Rate limiting (60 req/min per IP)
        .layer(governor_limiter)
        // Request body limit (1 MB — all endpoints are GET, but protect against abuse)
        .layer(RequestBodyLimitLayer::new(1024 * 1024))
        // Per-request timeout (30 seconds)
        .layer(TimeoutLayer::with_status_code(
            axum::http::StatusCode::REQUEST_TIMEOUT,
            Duration::from_secs(30),
        ))
        .with_state(state.clone());

    // Spawn background task for daily rate updates
    tokio::spawn(services::rates::daily_rate_updater(state));

    let addr = format!("0.0.0.0:{}", config.port);
    let listener = TcpListener::bind(&addr)
        .await
        .expect("failed to bind to address");

    info!(address = %listener.local_addr().expect("failed to get local address"), "server is running");

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<std::net::SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await
    .expect("failed to start server");
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        () = ctrl_c => info!("received Ctrl+C, shutting down"),
        () = terminate => info!("received SIGTERM, shutting down"),
    }
}
