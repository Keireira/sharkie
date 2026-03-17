mod currencies;
mod health;
mod history;

use axum::{Json, Router, routing::get};
use tower_http::compression::CompressionLayer;
use utoipa::OpenApi;

use crate::models::{CurrenciesResponse, DayRates, ErrorResponse, HealthResponse, HistoryResponse};
use crate::state::AppState;

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Sharkie",
        description = "Exchange rates API with historical data back to 2000",
        version = "1.0.0",
    ),
    servers(
        (url = "https://sharkie.uha.app", description = "Production"),
        (url = "http://localhost:3000", description = "Local development"),
    ),
    paths(health::health_check, currencies::get_currencies, history::get_history,),
    components(schemas(
        HealthResponse,
        CurrenciesResponse,
        HistoryResponse,
        DayRates,
        ErrorResponse,
    ))
)]
struct ApiDoc;

/// Return the generated OpenAPI spec.
pub fn openapi_spec() -> utoipa::openapi::OpenApi {
    ApiDoc::openapi()
}

/// Build the application router with all routes.
pub fn router() -> Router<AppState> {
    Router::new()
        .route("/health", get(health::health_check))
        .route("/currencies", get(currencies::get_currencies))
        .route("/history", get(history::get_history))
        .route("/openapi.json", get(|| async { Json(ApiDoc::openapi()) }))
        .layer(CompressionLayer::new().gzip(true).br(true))
}
