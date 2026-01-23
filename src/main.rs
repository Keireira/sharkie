use axum::{
    Json, Router,
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
};
use chrono::{NaiveDate, TimeDelta};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::collections::{HashMap, HashSet};
use tokio::net::TcpListener;

const BLACKLIST: [&str; 24] = [
    "YER", "XAG", "XAU", "SOS", "SAR", "QAR", "PKR", "LYD", "KWD", "JOD", "IQD", "IRR", "DZD",
    "BTG", "AFN", "BHD", "MAD", "SDG", "DJF", "GMD", "BND", "TND", "OMR", "MVR",
];

#[derive(Debug, Deserialize)]
struct HistoryQuery {
    date: String,
}

#[derive(Debug, Deserialize)]
struct CurrencyApiResponse {
    rates: HashMap<String, Option<f64>>,
}

#[derive(Debug, Serialize)]
struct HistoryResponse {
    date: NaiveDate,
    base: &'static str,
    rates: HashMap<String, f64>,
}

#[derive(Debug, sqlx::FromRow)]
struct ExchangeRate {
    currency_code: String,
    rate: rust_decimal::Decimal,
}

#[derive(Clone)]
struct AppState {
    db: PgPool,
}

#[derive(Debug)]
enum ApiError {
    NotFound,
    BadRequest,
    InternalServerError,
    InvalidInput(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            ApiError::NotFound => (StatusCode::NOT_FOUND, "Data not found".to_string()),
            ApiError::BadRequest => (StatusCode::BAD_REQUEST, "Bad request".to_string()),
            ApiError::InternalServerError => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
            ),
            ApiError::InvalidInput(message) => (StatusCode::BAD_REQUEST, message),
        };

        let body = Json(json!({
            "status": "error",
            "code": status.as_u16(),
            "message": error_message,
        }));

        return (status, body).into_response();
    }
}

async fn health_check() -> impl IntoResponse {
    return Json(json!({
        "status": "ok",
        "message": "Sharkie is running",
    }));
}

async fn get_history(
    State(state): State<AppState>,
    Query(query): Query<HistoryQuery>,
) -> Result<Json<HistoryResponse>, ApiError> {
    let date = NaiveDate::parse_from_str(&query.date, "%Y-%m-%d")
        .map_err(|_| ApiError::InvalidInput("Invalid date format. Use YYYY-MM-DD".to_string()))?;

    let rates: Vec<ExchangeRate> =
        sqlx::query_as("SELECT currency_code, rate FROM exchange_rates WHERE date = $1")
            .bind(date)
            .fetch_all(&state.db)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

    if rates.is_empty() {
        return Err(ApiError::NotFound);
    }

    let rates_map: HashMap<String, f64> = rates
        .into_iter()
        .filter_map(|r| {
            use rust_decimal::prelude::ToPrimitive;
            let rate_f64 = r.rate.to_f64()?;
            Some((r.currency_code, rate_f64))
        })
        .collect();

    Ok(Json(HistoryResponse {
        date,
        base: "USD",
        rates: rates_map,
    }))
}

async fn seed_database(pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    let api_url = std::env::var("CURRENCY_API_URL")?;
    let api_key = std::env::var("CURRENCY_API_KEY")?;
    let blacklist: HashSet<&str> = BLACKLIST.iter().copied().collect();

    let client = reqwest::Client::new();

    let start_date = NaiveDate::from_ymd_opt(2000, 1, 1).unwrap();
    let end_date = chrono::Local::now().date_naive();

    let mut current_date = start_date;
    while current_date <= end_date {
        let date_str = current_date.format("%Y-%m-%d").to_string();
        println!("Fetching rates for {}", date_str);

        let url = format!(
            "{}history?date={}&base=USD&key={}",
            api_url, date_str, api_key
        );
        let response: CurrencyApiResponse = client.get(&url).send().await?.json().await?;

        // Filter and collect rates (skip blacklisted and null values)
        let filtered_rates: Vec<(String, f64)> = response
            .rates
            .into_iter()
            .filter(|(code, _)| !blacklist.contains(code.as_str()))
            .filter_map(|(code, rate)| rate.map(|r| (code, r)))
            .collect();

        if filtered_rates.is_empty() {
            current_date = current_date + TimeDelta::days(1);
            continue;
        }

        // Build batch insert query
        let mut query =
            String::from("INSERT INTO exchange_rates (currency_code, date, rate) VALUES ");
        let mut values: Vec<String> = Vec::new();
        let mut param_idx = 1;

        for _ in &filtered_rates {
            values.push(format!(
                "(${}, ${}, ${})",
                param_idx,
                param_idx + 1,
                param_idx + 2
            ));
            param_idx += 3;
        }
        query.push_str(&values.join(", "));
        query.push_str(" ON CONFLICT (currency_code, date) DO UPDATE SET rate = EXCLUDED.rate");

        // Bind all parameters
        let mut q = sqlx::query(&query);
        for (currency_code, rate) in &filtered_rates {
            q = q
                .bind(currency_code)
                .bind(current_date)
                .bind(rust_decimal::Decimal::try_from(*rate).unwrap_or_default());
        }
        q.execute(pool).await?;

        println!("Saved {} rates for {}", filtered_rates.len(), date_str);
        current_date = current_date + TimeDelta::days(1);
    }

    println!("Seeding complete!");
    Ok(())
}

fn create_app(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/history", get(get_history))
        .with_state(state)
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    println!("Database connected and migrations applied");

    // Check for --seed argument
    let args: Vec<String> = std::env::args().collect();
    if args.contains(&"--seed".to_string()) {
        println!("Seeding database...");
        seed_database(&pool).await.expect("Failed to seed database");
        return;
    }

    let state = AppState { db: pool };
    let app = create_app(state);

    let listener = TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("Failed to bind to port 3000");

    println!(
        "Server is running on {}",
        listener.local_addr().expect("Failed to get local address")
    );

    axum::serve(listener, app)
        .await
        .expect("Failed to start server");
}
