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
use std::collections::HashMap;
use tokio::net::TcpListener;

#[derive(Debug, Deserialize)]
struct HistoryQuery {
    date: String, // "2024-01-01,2024-01-02"
    #[serde(default)]
    currencies: Option<String>, // "EUR,GBP,UAH"
}

const MAX_RESPONSE_SIZE: usize = 512 * 1024; // 512 KB

#[derive(Debug, Deserialize)]
struct CurrencyApiHistoryResponse {
    rates: HashMap<String, Option<f64>>,
}

#[derive(Debug, Deserialize)]
struct CurrencyApiRatesResponse {
    valid: bool,
    rates: HashMap<String, Option<f64>>,
}

#[derive(Debug, Serialize)]
struct DayRates {
    date: NaiveDate,
    rates: HashMap<String, f64>,
}

#[derive(Debug, Serialize)]
struct HistoryResponse {
    base: &'static str,
    data: Vec<DayRates>,
}

#[derive(Debug, sqlx::FromRow)]
struct ExchangeRate {
    currency_code: String,
    date: NaiveDate,
    rate: rust_decimal::Decimal,
}

#[derive(Clone)]
struct AppState {
    db: PgPool,
}

#[derive(Debug)]
enum ApiError {
    NotFound,
    InternalServerError,
    InvalidInput(String),
    PayloadTooLarge,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            ApiError::NotFound => (StatusCode::NOT_FOUND, "Data not found".to_string()),
            ApiError::InternalServerError => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
            ),
            ApiError::InvalidInput(message) => (StatusCode::BAD_REQUEST, message),
            ApiError::PayloadTooLarge => (
                StatusCode::PAYLOAD_TOO_LARGE,
                format!("Response exceeds {} KB limit", MAX_RESPONSE_SIZE / 1024),
            ),
        };

        let body = Json(json!({
            "status": "error",
            "code": status.as_u16(),
            "message": error_message,
        }));

        (status, body).into_response()
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
    // Parse dates
    let dates: Vec<NaiveDate> = query
        .date
        .split(',')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| {
            NaiveDate::parse_from_str(s, "%Y-%m-%d").map_err(|_| {
                ApiError::InvalidInput(format!("Invalid date format: '{}'. Use YYYY-MM-DD", s))
            })
        })
        .collect::<Result<Vec<_>, _>>()?;

    if dates.is_empty() {
        return Err(ApiError::InvalidInput("No dates provided".to_string()));
    }

    // Parse currencies filter
    let currency_filter: Option<Vec<String>> = query.currencies.map(|c| {
        c.split(',')
            .map(|s| s.trim().to_uppercase())
            .filter(|s| !s.is_empty())
            .collect()
    });

    // Build query with date placeholders
    let date_placeholders: Vec<String> = (1..=dates.len()).map(|i| format!("${}", i)).collect();

    let rates: Vec<ExchangeRate> = if let Some(ref currencies) = currency_filter {
        if currencies.is_empty() {
            return Err(ApiError::InvalidInput("Empty currencies list".to_string()));
        }

        let currency_placeholders: Vec<String> = (dates.len() + 1..=dates.len() + currencies.len())
            .map(|i| format!("${}", i))
            .collect();

        let sql = format!(
            "SELECT currency_code, date, rate FROM exchange_rates 
             WHERE date IN ({}) AND currency_code IN ({})
             ORDER BY date, currency_code",
            date_placeholders.join(", "),
            currency_placeholders.join(", ")
        );

        let mut q = sqlx::query_as::<_, ExchangeRate>(&sql);
        for date in &dates {
            q = q.bind(date);
        }
        for currency in currencies {
            q = q.bind(currency);
        }
        q.fetch_all(&state.db)
            .await
            .map_err(|_| ApiError::InternalServerError)?
    } else {
        let sql = format!(
            "SELECT currency_code, date, rate FROM exchange_rates 
             WHERE date IN ({})
             ORDER BY date, currency_code",
            date_placeholders.join(", ")
        );

        let mut q = sqlx::query_as::<_, ExchangeRate>(&sql);
        for date in &dates {
            q = q.bind(date);
        }
        q.fetch_all(&state.db)
            .await
            .map_err(|_| ApiError::InternalServerError)?
    };

    if rates.is_empty() {
        return Err(ApiError::NotFound);
    }

    // Group by date
    let mut data: HashMap<NaiveDate, HashMap<String, f64>> = HashMap::new();
    for r in rates {
        use rust_decimal::prelude::ToPrimitive;
        if let Some(rate_f64) = r.rate.to_f64() {
            data.entry(r.date)
                .or_default()
                .insert(r.currency_code, rate_f64);
        }
    }

    // Convert to sorted vec
    let mut day_rates: Vec<DayRates> = data
        .into_iter()
        .map(|(date, rates)| DayRates { date, rates })
        .collect();
    day_rates.sort_by_key(|d| d.date);

    let response = HistoryResponse {
        base: "USD",
        data: day_rates,
    };

    // Check response size
    let response_json =
        serde_json::to_string(&response).map_err(|_| ApiError::InternalServerError)?;

    if response_json.len() > MAX_RESPONSE_SIZE {
        return Err(ApiError::PayloadTooLarge);
    }

    Ok(Json(response))
}

async fn seed_database(pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    let api_url = std::env::var("CURRENCY_API_URL")?;
    let api_key = std::env::var("CURRENCY_API_KEY")?;

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
        let response: CurrencyApiHistoryResponse = client.get(&url).send().await?.json().await?;

        let filtered_rates: Vec<(String, f64)> = response
            .rates
            .into_iter()
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

async fn fetch_today_rates(pool: &PgPool) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let api_url = std::env::var("CURRENCY_API_URL")?;
    let api_key = std::env::var("CURRENCY_API_KEY")?;

    let today = chrono::Local::now().date_naive();

    // Check if we already have today's rates
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM exchange_rates WHERE date = $1")
        .bind(today)
        .fetch_one(pool)
        .await?;

    if count.0 > 0 {
        println!("Today's rates ({}) already exist, skipping fetch", today);
        return Ok(());
    }

    println!("Fetching today's rates ({})", today);

    let url = format!("{}rates?base=USD&output=json&key={}", api_url, api_key);
    let client = reqwest::Client::new();
    let response: CurrencyApiRatesResponse = client.get(&url).send().await?.json().await?;

    if !response.valid {
        return Err("API returned invalid response".into());
    }

    let filtered_rates: Vec<(String, f64)> = response
        .rates
        .into_iter()
        .filter_map(|(code, rate)| rate.map(|r| (code, r)))
        .collect();

    if filtered_rates.is_empty() {
        return Err("No rates received".into());
    }

    // Build batch insert query
    let mut query = String::from("INSERT INTO exchange_rates (currency_code, date, rate) VALUES ");
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

    let mut q = sqlx::query(&query);
    for (currency_code, rate) in &filtered_rates {
        q = q
            .bind(currency_code)
            .bind(today)
            .bind(rust_decimal::Decimal::try_from(*rate).unwrap_or_default());
    }
    q.execute(pool).await?;

    println!("Saved {} rates for {}", filtered_rates.len(), today);
    Ok(())
}

async fn daily_rate_updater(pool: PgPool) {
    loop {
        if let Err(e) = fetch_today_rates(&pool).await {
            eprintln!("Failed to fetch today's rates: {}", e);
        }

        // Sleep for 1 hour, then check again
        tokio::time::sleep(tokio::time::Duration::from_secs(3600)).await;
    }
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

    let state = AppState { db: pool.clone() };
    let app = create_app(state);

    // Spawn background task for daily rate updates
    tokio::spawn(daily_rate_updater(pool));

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
