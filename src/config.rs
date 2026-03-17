/// Application configuration loaded from environment variables.
#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub currency_api_url: String,
    pub currency_api_key: String,
    pub port: u16,
    pub allowed_origins: Vec<String>,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: std::env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
            currency_api_url: std::env::var("CURRENCY_API_URL")
                .unwrap_or_else(|_| String::from("https://api.currencyapi.com/v3/")),
            currency_api_key: std::env::var("CURRENCY_API_KEY")
                .unwrap_or_else(|_| String::from("")),
            port: std::env::var("PORT")
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(3000),
            allowed_origins: std::env::var("ALLOWED_ORIGINS")
                .map(|s| s.split(',').map(|o| o.trim().to_string()).collect())
                .unwrap_or_default(),
        }
    }
}
