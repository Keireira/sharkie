mod currencies;
mod health;
mod history;

use axum::{Router, routing::get};
use tower_http::compression::CompressionLayer;

use crate::state::AppState;

/// Build the application router with all routes.
pub fn router() -> Router<AppState> {
    Router::new()
        .route("/health", get(health::health_check))
        .route("/currencies", get(currencies::get_currencies))
        .route("/history", get(history::get_history))
        .layer(CompressionLayer::new().gzip(true).br(true))
}
