CREATE TABLE IF NOT EXISTS exchange_rates (
    currency_code VARCHAR(5) NOT NULL,
    date DATE NOT NULL,
    rate NUMERIC(20, 10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (currency_code, date)
);

CREATE INDEX IF NOT EXISTS idx_rates_date ON exchange_rates(date);
