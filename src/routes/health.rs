use axum::{
    Json,
    extract::State,
    http::{StatusCode, header},
    response::{IntoResponse, Response},
};
use serde_json::json;

use crate::state::AppState;

pub async fn health_check(State(state): State<AppState>) -> Response {
    let db_ok = sqlx::query_scalar::<_, i32>("SELECT 1")
        .fetch_one(&state.db)
        .await
        .is_ok();

    let status = if db_ok {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };

    let body = Json(json!({
        "status": if db_ok { "ok" } else { "degraded" },
        "message": "Sharkie is running",
        "db": db_ok,
    }));

    let mut response = (status, body).into_response();
    response.headers_mut().insert(
        header::CACHE_CONTROL,
        "no-store".parse().unwrap(),
    );
    response
}
