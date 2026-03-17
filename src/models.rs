use std::collections::HashMap;

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

// ── Database Models ────────────────────────────────

#[derive(Debug, sqlx::FromRow)]
pub struct ExchangeRate {
    pub currency_code: String,
    pub date: NaiveDate,
    pub rate: rust_decimal::Decimal,
}

// ── API Query Parameters ───────────────────────────

#[derive(Debug, Deserialize)]
pub struct HistoryQuery {
    #[serde(default)]
    pub date: Option<String>,
    #[serde(default)]
    pub from: Option<String>,
    #[serde(default)]
    pub to: Option<String>,
    #[serde(default)]
    pub currencies: Option<String>,
    #[serde(default)]
    pub base: Option<String>,
    #[serde(default)]
    pub limit: Option<u32>,
    #[serde(default)]
    pub offset: Option<u32>,
}

// ── API Response DTOs ──────────────────────────────

#[derive(Debug, Serialize)]
pub struct DayRates {
    pub date: NaiveDate,
    pub rates: HashMap<String, f64>,
}

#[derive(Debug, Serialize)]
pub struct HistoryResponse {
    pub base: String,
    pub total: usize,
    pub data: Vec<DayRates>,
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
