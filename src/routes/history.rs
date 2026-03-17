use std::collections::HashMap;

use axum::{
    Json,
    extract::{Query, State},
    http::header,
    response::{IntoResponse, Response},
};
use chrono::{NaiveDate, Utc};
use rust_decimal::prelude::ToPrimitive;
use tracing::info;

use crate::error::{ApiError, MAX_RESPONSE_SIZE};
use crate::models::{DayRates, ExchangeRate, HistoryQuery, HistoryResponse};
use crate::state::AppState;

enum DateFilter {
    Range(NaiveDate, NaiveDate),
    List(Vec<NaiveDate>),
}

pub async fn get_history(
    State(state): State<AppState>,
    Query(query): Query<HistoryQuery>,
) -> Result<Response, ApiError> {
    let start = std::time::Instant::now();

    let date_filter = parse_date_filter(&query)?;
    let currency_filter = parse_currency_filter(&query)?;

    let rates = fetch_rates(&state, &date_filter, &currency_filter).await?;
    let query_ms = start.elapsed().as_millis();

    if rates.is_empty() {
        return Err(ApiError::NotFound);
    }

    let base = query
        .base
        .map(|b| b.trim().to_uppercase())
        .unwrap_or_else(|| "USD".to_string());

    let mut data = group_by_date(rates);

    if base != "USD" {
        rebase_rates(&state, &mut data, &base, &currency_filter).await?;
    }

    let includes_today = includes_today_date(&date_filter);
    let response = build_response(base, data);
    validate_response_size(&response)?;

    let total_ms = start.elapsed().as_millis();
    info!(
        query_ms,
        total_ms,
        days = response.data.len(),
        includes_today,
        "history served"
    );

    let cache_control = if includes_today {
        // Today's data updates every 4h — short CDN TTL, shorter browser TTL
        "public, s-maxage=900, max-age=300"
    } else {
        // Historical data is immutable — aggressive caching
        "public, s-maxage=86400, max-age=86400, immutable"
    };

    let mut http_response = Json(response).into_response();
    http_response.headers_mut().insert(
        header::CACHE_CONTROL,
        cache_control.parse().unwrap(),
    );
    Ok(http_response)
}

/// Check if the requested date range includes today or future.
fn includes_today_date(filter: &DateFilter) -> bool {
    let today = Utc::now().date_naive();
    match filter {
        DateFilter::Range(_, to) => *to >= today,
        DateFilter::List(dates) => dates.iter().any(|d| *d >= today),
    }
}

fn parse_date_filter(query: &HistoryQuery) -> Result<DateFilter, ApiError> {
    let today = Utc::now().date_naive();

    if let (Some(from), Some(to)) = (&query.from, &query.to) {
        let from_date = NaiveDate::parse_from_str(from, "%Y-%m-%d").map_err(|_| {
            ApiError::InvalidInput(format!("Invalid 'from' date: '{}'. Use YYYY-MM-DD", from))
        })?;
        let to_date = NaiveDate::parse_from_str(to, "%Y-%m-%d").map_err(|_| {
            ApiError::InvalidInput(format!("Invalid 'to' date: '{}'. Use YYYY-MM-DD", to))
        })?;

        if from_date > to_date {
            return Err(ApiError::InvalidInput(
                "'from' must be before 'to'".to_string(),
            ));
        }

        let max_days = 365 * 5; // 5 years
        if (to_date - from_date).num_days() > max_days {
            return Err(ApiError::InvalidInput(format!(
                "Date range exceeds {} days limit",
                max_days
            )));
        }

        // Clamp future dates to today.
        // Handles timezone mismatch: client in GMT+N may request "tomorrow" (their today)
        // when the server (UTC) is still on the previous day.
        let to_clamped = to_date.min(today);

        Ok(DateFilter::Range(from_date, to_clamped))
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

        // Clamp each future date to today (timezone mismatch protection)
        let clamped: Vec<NaiveDate> = dates.into_iter().map(|d| d.min(today)).collect();

        Ok(DateFilter::List(clamped))
    } else {
        Err(ApiError::InvalidInput(
            "Provide 'date' or 'from'+'to' parameters".to_string(),
        ))
    }
}

fn parse_currency_filter(query: &HistoryQuery) -> Result<Option<Vec<String>>, ApiError> {
    let filter = query.currencies.as_ref().map(|c| {
        c.split(',')
            .map(|s| s.trim().to_uppercase())
            .filter(|s| !s.is_empty())
            .collect::<Vec<String>>()
    });

    if let Some(c) = &filter
        && c.is_empty()
    {
        return Err(ApiError::InvalidInput("Empty currencies list".to_string()));
    }

    Ok(filter)
}

async fn fetch_rates(
    state: &AppState,
    date_filter: &DateFilter,
    currency_filter: &Option<Vec<String>>,
) -> Result<Vec<ExchangeRate>, ApiError> {
    match date_filter {
        DateFilter::Range(from, to) => {
            let date_clause = "date BETWEEN $1 AND $2";
            let param_offset = 2;

            if let Some(currencies) = currency_filter {
                let currency_placeholders: Vec<String> = (1..=currencies.len())
                    .map(|i| format!("${}", param_offset + i))
                    .collect();

                let sql = format!(
                    "SELECT currency_code, date, rate FROM exchange_rates WHERE {} AND currency_code IN ({}) ORDER BY date, currency_code",
                    date_clause,
                    currency_placeholders.join(", ")
                );

                let mut q = sqlx::query_as::<_, ExchangeRate>(&sql).bind(from).bind(to);
                for currency in currencies {
                    q = q.bind(currency);
                }
                Ok(q.fetch_all(&state.db).await?)
            } else {
                let sql = format!(
                    "SELECT currency_code, date, rate FROM exchange_rates WHERE {} ORDER BY date, currency_code",
                    date_clause
                );

                Ok(sqlx::query_as::<_, ExchangeRate>(&sql)
                    .bind(from)
                    .bind(to)
                    .fetch_all(&state.db)
                    .await?)
            }
        }
        DateFilter::List(dates) => {
            let date_placeholders: Vec<String> =
                (1..=dates.len()).map(|i| format!("${}", i)).collect();

            if let Some(currencies) = currency_filter {
                let currency_placeholders: Vec<String> = (dates.len() + 1
                    ..=dates.len() + currencies.len())
                    .map(|i| format!("${}", i))
                    .collect();

                let sql = format!(
                    "SELECT currency_code, date, rate FROM exchange_rates WHERE date IN ({}) AND currency_code IN ({}) ORDER BY date, currency_code",
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
                Ok(q.fetch_all(&state.db).await?)
            } else {
                let sql = format!(
                    "SELECT currency_code, date, rate FROM exchange_rates WHERE date IN ({}) ORDER BY date, currency_code",
                    date_placeholders.join(", ")
                );

                let mut q = sqlx::query_as::<_, ExchangeRate>(&sql);
                for date in dates {
                    q = q.bind(date);
                }
                Ok(q.fetch_all(&state.db).await?)
            }
        }
    }
}

fn group_by_date(rates: Vec<ExchangeRate>) -> HashMap<NaiveDate, HashMap<String, f64>> {
    let mut data: HashMap<NaiveDate, HashMap<String, f64>> = HashMap::new();
    for r in rates {
        if let Some(rate_f64) = r.rate.to_f64() {
            data.entry(r.date)
                .or_default()
                .insert(r.currency_code, rate_f64);
        }
    }
    data
}

async fn rebase_rates(
    state: &AppState,
    data: &mut HashMap<NaiveDate, HashMap<String, f64>>,
    base: &str,
    currency_filter: &Option<Vec<String>>,
) -> Result<(), ApiError> {
    let dates_missing_base: Vec<NaiveDate> = data
        .iter()
        .filter(|(_, rates)| !rates.contains_key(base))
        .map(|(date, _)| *date)
        .collect();

    if !dates_missing_base.is_empty() {
        let placeholders: Vec<String> = (1..=dates_missing_base.len())
            .map(|i| format!("${}", i))
            .collect();
        let sql = format!(
            "SELECT currency_code, date, rate FROM exchange_rates WHERE date IN ({}) AND currency_code = ${}",
            placeholders.join(", "),
            dates_missing_base.len() + 1
        );
        let mut q = sqlx::query_as::<_, ExchangeRate>(&sql);
        for date in &dates_missing_base {
            q = q.bind(date);
        }
        q = q.bind(base);
        let base_rates = q.fetch_all(&state.db).await?;

        for r in base_rates {
            if let Some(rate_f64) = r.rate.to_f64() {
                data.entry(r.date)
                    .or_default()
                    .insert(r.currency_code.clone(), rate_f64);
            }
        }
    }

    for (_, rates) in data.iter_mut() {
        let base_rate = match rates.get(base) {
            Some(&r) if r != 0.0 => r,
            _ => {
                return Err(ApiError::InvalidInput(format!(
                    "No rate found for base currency '{}'",
                    base
                )));
            }
        };

        let recalculated: HashMap<String, f64> = rates
            .iter()
            .filter(|(code, _)| *code != base)
            .map(|(code, rate)| (code.clone(), rate / base_rate))
            .collect();

        *rates = recalculated;

        let include_usd = match currency_filter {
            Some(currencies) => currencies.iter().any(|c| c == "USD"),
            None => true,
        };
        if include_usd {
            rates.insert("USD".to_string(), 1.0 / base_rate);
        }
    }

    Ok(())
}

fn build_response(base: String, data: HashMap<NaiveDate, HashMap<String, f64>>) -> HistoryResponse {
    let mut day_rates: Vec<DayRates> = data
        .into_iter()
        .map(|(date, rates)| DayRates { date, rates })
        .collect();
    day_rates.sort_by_key(|d| d.date);

    HistoryResponse {
        base,
        data: day_rates,
    }
}

fn validate_response_size(response: &HistoryResponse) -> Result<(), ApiError> {
    let response_json =
        serde_json::to_string(response).map_err(|e| ApiError::Internal(e.to_string()))?;

    if response_json.len() > MAX_RESPONSE_SIZE {
        return Err(ApiError::PayloadTooLarge);
    }

    Ok(())
}
