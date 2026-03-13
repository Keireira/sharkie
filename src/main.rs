use axum::{
    Json, Router,
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
};
use chrono::{NaiveDate, TimeDelta, Utc, Timelike};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::collections::HashMap;
use tokio::net::TcpListener;

#[derive(Debug, Deserialize)]
struct HistoryQuery {
    #[serde(default)]
    date: Option<String>,
    #[serde(default)]
    from: Option<String>,
    #[serde(default)]
    to: Option<String>,
    #[serde(default)]
    currencies: Option<String>,
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
    // Parse dates: either `from`+`to` range or comma-separated `date`
    enum DateFilter {
        Range(NaiveDate, NaiveDate),
        List(Vec<NaiveDate>),
    }

    let date_filter = if let (Some(from), Some(to)) = (&query.from, &query.to) {
        let from_date = NaiveDate::parse_from_str(from, "%Y-%m-%d")
            .map_err(|_| ApiError::InvalidInput(format!("Invalid 'from' date: '{}'. Use YYYY-MM-DD", from)))?;
        let to_date = NaiveDate::parse_from_str(to, "%Y-%m-%d")
            .map_err(|_| ApiError::InvalidInput(format!("Invalid 'to' date: '{}'. Use YYYY-MM-DD", to)))?;

        if from_date > to_date {
            return Err(ApiError::InvalidInput("'from' must be before 'to'".to_string()));
        }

        DateFilter::Range(from_date, to_date)
    } else if let Some(ref date) = query.date {
        let dates: Vec<NaiveDate> = date
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

        DateFilter::List(dates)
    } else {
        return Err(ApiError::InvalidInput(
            "Provide 'date' or 'from'+'to' parameters".to_string(),
        ));
    };

    // Parse currencies filter
    let currency_filter: Option<Vec<String>> = query.currencies.map(|c| {
        c.split(',')
            .map(|s| s.trim().to_uppercase())
            .filter(|s| !s.is_empty())
            .collect()
    });

    if let Some(ref c) = currency_filter {
        if c.is_empty() {
            return Err(ApiError::InvalidInput("Empty currencies list".to_string()));
        }
    }

    // Build and execute query
    let rates: Vec<ExchangeRate> = match &date_filter {
        DateFilter::Range(from, to) => {
            let date_clause = "date BETWEEN $1 AND $2";
            let param_offset = 2;

            if let Some(ref currencies) = currency_filter {
                let currency_placeholders: Vec<String> = (1..=currencies.len())
                    .map(|i| format!("${}", param_offset + i))
                    .collect();

                let sql = format!(
                    "SELECT currency_code, date, rate FROM exchange_rates
                     WHERE {} AND currency_code IN ({})
                     ORDER BY date, currency_code",
                    date_clause,
                    currency_placeholders.join(", ")
                );

                let mut q = sqlx::query_as::<_, ExchangeRate>(&sql)
                    .bind(from)
                    .bind(to);
                for currency in currencies {
                    q = q.bind(currency);
                }
                q.fetch_all(&state.db).await.map_err(|_| ApiError::InternalServerError)?
            } else {
                let sql = format!(
                    "SELECT currency_code, date, rate FROM exchange_rates
                     WHERE {}
                     ORDER BY date, currency_code",
                    date_clause
                );

                sqlx::query_as::<_, ExchangeRate>(&sql)
                    .bind(from)
                    .bind(to)
                    .fetch_all(&state.db)
                    .await
                    .map_err(|_| ApiError::InternalServerError)?
            }
        }
        DateFilter::List(dates) => {
            let date_placeholders: Vec<String> =
                (1..=dates.len()).map(|i| format!("${}", i)).collect();

            if let Some(ref currencies) = currency_filter {
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
                for date in dates {
                    q = q.bind(date);
                }
                for currency in currencies {
                    q = q.bind(currency);
                }
                q.fetch_all(&state.db).await.map_err(|_| ApiError::InternalServerError)?
            } else {
                let sql = format!(
                    "SELECT currency_code, date, rate FROM exchange_rates
                     WHERE date IN ({})
                     ORDER BY date, currency_code",
                    date_placeholders.join(", ")
                );

                let mut q = sqlx::query_as::<_, ExchangeRate>(&sql);
                for date in dates {
                    q = q.bind(date);
                }
                q.fetch_all(&state.db).await.map_err(|_| ApiError::InternalServerError)?
            }
        }
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

async fn backfill_missing_rates(
    pool: &PgPool,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let api_url = std::env::var("CURRENCY_API_URL")?;
    let api_key = std::env::var("CURRENCY_API_KEY")?;

    let start_date = NaiveDate::from_ymd_opt(2000, 1, 1).unwrap();
    let end_date = Utc::now().date_naive() - TimeDelta::days(1);

    // Get all dates that already have data
    let existing_dates: Vec<(NaiveDate,)> =
        sqlx::query_as("SELECT DISTINCT date FROM exchange_rates WHERE date >= $1 AND date <= $2")
            .bind(start_date)
            .bind(end_date)
            .fetch_all(pool)
            .await?;

    let existing_set: std::collections::HashSet<NaiveDate> =
        existing_dates.into_iter().map(|(d,)| d).collect();

    // Collect all dates without data
    let mut missing_dates: Vec<NaiveDate> = Vec::new();
    let mut current = start_date;
    while current <= end_date {
        if !existing_set.contains(&current) {
            missing_dates.push(current);
        }
        current = current + TimeDelta::days(1);
    }

    if missing_dates.is_empty() {
        println!(
            "All historical data present ({} to {})",
            start_date, end_date
        );
        return Ok(());
    }

    println!(
        "Found {} missing dates, starting backfill...",
        missing_dates.len()
    );

    let client = reqwest::Client::new();

    for date in missing_dates {
        let date_str = date.format("%Y-%m-%d").to_string();
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

        let mut q = sqlx::query(&query);
        for (currency_code, rate) in &filtered_rates {
            q = q
                .bind(currency_code)
                .bind(date)
                .bind(rust_decimal::Decimal::try_from(*rate).unwrap_or_default());
        }
        q.execute(pool).await?;

        println!("Saved {} rates for {}", filtered_rates.len(), date_str);
    }

    println!("Backfill complete!");
    Ok(())
}

async fn fetch_today_rates(pool: &PgPool) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let api_url = std::env::var("CURRENCY_API_URL")?;
    let api_key = std::env::var("CURRENCY_API_KEY")?;

    let today = Utc::now().date_naive();

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

/// Returns seconds until the next target time (00:05, 23:55, or every 4 hours in between).
fn seconds_until_next_fetch() -> u64 {
    let now = Utc::now();
    let current_secs = now.hour() * 3600 + now.minute() * 60 + now.second();

    // Target times in seconds from midnight UTC
    let targets: &[u32] = &[
        5 * 60,             // 00:05
        4 * 3600,           // 04:00
        8 * 3600,           // 08:00
        12 * 3600,          // 12:00
        16 * 3600,          // 16:00
        20 * 3600,          // 20:00
        23 * 3600 + 55 * 60, // 23:55
    ];

    for &t in targets {
        if current_secs < t {
            return (t - current_secs) as u64;
        }
    }

    // Past 23:55 today, wait until 00:05 tomorrow
    ((24 * 3600 - current_secs) + 5 * 60) as u64
}

async fn daily_rate_updater(pool: PgPool) {
    // Fetch on startup only if today's data is missing
    let today = Utc::now().date_naive();
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM exchange_rates WHERE date = $1")
        .bind(today)
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    if count.0 == 0 {
        if let Err(e) = fetch_today_rates(&pool).await {
            eprintln!("Failed to fetch today's rates: {}", e);
        }
    } else {
        println!("Today's rates ({}) already exist, skipping startup fetch", today);
    }

    loop {
        let wait = seconds_until_next_fetch();
        let hours = wait / 3600;
        let mins = (wait % 3600) / 60;
        println!("Next rate fetch in {}h {}m", hours, mins);
        tokio::time::sleep(tokio::time::Duration::from_secs(wait)).await;

        if let Err(e) = fetch_today_rates(&pool).await {
            eprintln!("Failed to fetch today's rates: {}", e);
        }
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

    // Check and backfill missing historical data
    println!("Checking for missing historical data...");
    if let Err(e) = backfill_missing_rates(&pool).await {
        eprintln!("Warning: Failed to backfill missing rates: {}", e);
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
