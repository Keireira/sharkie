use std::collections::HashMap;

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

// ── Database Models ────────────────────────────────

#[derive(Debug, sqlx::FromRow)]
pub struct ExchangeRate {
    pub currency_code: String,
    pub date: NaiveDate,
    pub rate: rust_decimal::Decimal,
}

// ── API Query Parameters ───────────────────────────

#[derive(Debug, Deserialize, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct HistoryQuery {
    /// Comma-separated dates (YYYY-MM-DD). Mutually exclusive with from/to.
    #[serde(default)]
    pub date: Option<String>,
    /// Range start date (YYYY-MM-DD). Use with `to`.
    #[serde(default)]
    pub from: Option<String>,
    /// Range end date (YYYY-MM-DD). Use with `from`.
    #[serde(default)]
    pub to: Option<String>,
    /// Comma-separated currency codes to filter (e.g. "EUR,GBP").
    #[serde(default)]
    pub currencies: Option<String>,
    /// Base currency for rate conversion. Defaults to USD.
    #[serde(default)]
    pub base: Option<String>,
    /// Max number of days to return (1–366). Defaults to 366.
    #[serde(default)]
    pub limit: Option<u32>,
    /// Number of days to skip for pagination. Defaults to 0.
    #[serde(default)]
    pub offset: Option<u32>,
}

// ── API Response DTOs ──────────────────────────────

#[derive(Debug, Serialize, ToSchema)]
pub struct DayRates {
    /// Date in YYYY-MM-DD format.
    pub date: NaiveDate,
    /// Currency code → exchange rate relative to base.
    pub rates: HashMap<String, f64>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct HistoryResponse {
    /// Base currency used for rate conversion.
    pub base: String,
    /// Total number of days matching the query (before pagination).
    pub total: usize,
    /// Paginated list of daily rates.
    pub data: Vec<DayRates>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct HealthResponse {
    /// "ok" or "degraded".
    pub status: String,
    pub message: String,
    /// Whether the database is reachable.
    pub db: bool,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct CurrenciesResponse {
    /// Sorted list of available currency codes.
    pub currencies: Vec<String>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ErrorResponse {
    /// Always "error".
    pub status: String,
    /// HTTP status code.
    pub code: u16,
    /// Human-readable error description.
    pub message: String,
}

// ── External Currency API Models ───────────────────

#[derive(Debug, Deserialize)]
pub struct CurrencyApiHistoryResponse {
    pub rates: HashMap<String, Option<f64>>,
}

#[derive(Debug, Deserialize)]
pub struct CurrencyApiRatesResponse {
    pub valid: bool,
    pub rates: HashMap<String, Option<f64>>,
}
