use axum::{
    Json,
    extract::State,
    http::header,
    response::{IntoResponse, Response},
};
use serde_json::json;

use crate::error::ApiError;
use crate::state::AppState;

#[utoipa::path(
    get,
    path = "/currencies",
    responses(
        (status = 200, description = "Available currency codes", body = crate::models::CurrenciesResponse),
        (status = 500, description = "Internal error", body = crate::models::ErrorResponse),
    )
)]
pub async fn get_currencies(State(state): State<AppState>) -> Result<Response, ApiError> {
    let rows: Vec<(String,)> =
        sqlx::query_as("SELECT DISTINCT currency_code FROM exchange_rates ORDER BY currency_code")
            .fetch_all(&state.db)
            .await?;

    let currencies: Vec<String> = rows.into_iter().map(|(code,)| code).collect();

    let mut response = Json(json!({ "currencies": currencies })).into_response();
    // CDN 1h, browser 5min — currency list changes rarely
    response.headers_mut().insert(
        header::CACHE_CONTROL,
        "public, s-maxage=3600, max-age=300".parse().unwrap(),
    );
    Ok(response)
}
