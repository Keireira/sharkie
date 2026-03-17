use sqlx::PgPool;

use crate::config::Config;

/// Shared application state available to all handlers via axum's State extractor.
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub config: Config,
    pub http_client: reqwest::Client,
}
