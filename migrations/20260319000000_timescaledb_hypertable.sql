-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert exchange_rates to a hypertable partitioned by date.
-- Chunk interval: 7 days (~150 currencies × 7 days ≈ 1,050 rows per chunk).
-- migrate_data: moves existing rows into chunks.
SELECT create_hypertable(
    'exchange_rates',
    'date',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE,
    migrate_data => TRUE
);

-- Enable native columnar compression.
-- segment_by groups each currency into its own compressed segment,
-- order_by sorts within segments for efficient range scans.
ALTER TABLE exchange_rates SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'currency_code',
    timescaledb.compress_orderby = 'date DESC'
);

-- Auto-compress chunks older than 3 days (immutable historical data).
SELECT add_compression_policy('exchange_rates', INTERVAL '3 days', if_not_exists => TRUE);
