use chrono::{NaiveDate, TimeDelta, Timelike, Utc};
use sqlx::PgPool;
use tracing::{error, info, warn};

use crate::models::{CurrencyApiHistoryResponse, CurrencyApiRatesResponse};
use crate::state::AppState;

/// Backfill missing historical rates from 2000-01-01 to yesterday.
/// Called once on startup to ensure data completeness.
pub async fn backfill_missing_rates(
    state: &AppState,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let start_date = NaiveDate::from_ymd_opt(2000, 1, 1).unwrap();
    let end_date = Utc::now().date_naive() - TimeDelta::days(1);

    let existing_dates: Vec<(NaiveDate,)> =
        sqlx::query_as("SELECT DISTINCT date FROM exchange_rates WHERE date >= $1 AND date <= $2")
            .bind(start_date)
            .bind(end_date)
            .fetch_all(&state.db)
            .await?;

    let existing_set: std::collections::HashSet<NaiveDate> =
        existing_dates.into_iter().map(|(d,)| d).collect();

    let mut missing_dates: Vec<NaiveDate> = Vec::new();
    let mut current = start_date;
    while current <= end_date {
        if !existing_set.contains(&current) {
            missing_dates.push(current);
        }
        current += TimeDelta::days(1);
    }

    if missing_dates.is_empty() {
        info!(from = %start_date, to = %end_date, "all historical data present");
        return Ok(());
    }

    info!(
        count = missing_dates.len(),
        "starting historical data backfill"
    );

    for date in missing_dates {
        let date_str = date.format("%Y-%m-%d").to_string();
        info!(date = %date_str, "fetching historical rates");

        let url = format!(
            "{}history?date={}&base=USD&key={}",
            state.config.currency_api_url, date_str, state.config.currency_api_key
        );

        let response: CurrencyApiHistoryResponse =
            state.http_client.get(&url).send().await?.json().await?;

        let filtered_rates: Vec<(String, f64)> = response
            .rates
            .into_iter()
            .filter_map(|(code, rate)| rate.map(|r| (code, r)))
            .collect();

        if filtered_rates.is_empty() {
            continue;
        }

        insert_rates(&state.db, &date, &filtered_rates).await?;

        info!(count = filtered_rates.len(), date = %date_str, "saved rates");
    }

    info!("backfill complete");
    Ok(())
}

/// Fetch today's rates from external API and upsert into database.
pub async fn fetch_today_rates(
    state: &AppState,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let today = Utc::now().date_naive();

    info!(date = %today, "fetching today's rates");

    let url = format!(
        "{}rates?base=USD&output=json&key={}",
        state.config.currency_api_url, state.config.currency_api_key
    );
    let response: CurrencyApiRatesResponse =
        state.http_client.get(&url).send().await?.json().await?;

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

    insert_rates(&state.db, &today, &filtered_rates).await?;

    info!(count = filtered_rates.len(), date = %today, "saved today's rates");
    Ok(())
}

/// Batch-insert rates using a single parameterized INSERT with ON CONFLICT.
async fn insert_rates(
    pool: &PgPool,
    date: &NaiveDate,
    rates: &[(String, f64)],
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut query = String::from("INSERT INTO exchange_rates (currency_code, date, rate) VALUES ");
    let mut values: Vec<String> = Vec::new();
    let mut param_idx = 1;

    for _ in rates {
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
    for (currency_code, rate) in rates {
        q = q
            .bind(currency_code)
            .bind(date)
            .bind(rust_decimal::Decimal::try_from(*rate).unwrap_or_default());
    }
    q.execute(pool).await?;

    Ok(())
}

/// Returns seconds until the next target fetch time (UTC schedule).
fn seconds_until_next_fetch() -> u64 {
    let now = Utc::now();
    let current_secs = now.hour() * 3600 + now.minute() * 60 + now.second();

    // Target times in seconds from midnight UTC
    let targets: &[u32] = &[
        5 * 60,              // 00:05
        4 * 3600,            // 04:00
        8 * 3600,            // 08:00
        12 * 3600,           // 12:00
        16 * 3600,           // 16:00
        20 * 3600,           // 20:00
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

/// Background task that periodically fetches today's rates.
pub async fn daily_rate_updater(state: AppState) {
    // Fetch on startup only if today's data is missing
    let today = Utc::now().date_naive();
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM exchange_rates WHERE date = $1")
        .bind(today)
        .fetch_one(&state.db)
        .await
        .unwrap_or((0,));

    if count.0 == 0 {
        if let Err(e) = fetch_today_rates(&state).await {
            error!(error = %e, "failed to fetch today's rates on startup");
        }
    } else {
        info!(date = %today, "today's rates already exist, skipping startup fetch");
    }

    loop {
        let wait = seconds_until_next_fetch();
        let hours = wait / 3600;
        let mins = (wait % 3600) / 60;
        info!(hours, mins, "next rate fetch scheduled");
        tokio::time::sleep(tokio::time::Duration::from_secs(wait)).await;

        if let Err(e) = fetch_today_rates(&state).await {
            warn!(error = %e, "failed to fetch today's rates");
        }
    }
}
