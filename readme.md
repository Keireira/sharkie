# Sharkie

[![GitHub License](https://img.shields.io/github/license/Keireira/sharkie?&style=flat-square)](https://github.com/Keireira/sharkie/blob/master/LICENSE)
[![Registry](https://img.shields.io/github/deployments/Keireira/sharkie/registry?label=registry&style=flat-square)](https://github.com/Keireira/sharkie/deployments/registry)
[![Production](https://img.shields.io/github/deployments/Keireira/sharkie/production?label=production&style=flat-square)](https://github.com/Keireira/sharkie/deployments/production)
![GitHub repo size](https://img.shields.io/github/repo-size/Keireira/sharkie)
![GitHub last commit](https://img.shields.io/github/last-commit/keireira/sharkie)

Real-time currency exchange rates dashboard. Tracks 150+ fiat currencies and 12 cryptocurrencies with historical data from 2000.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Rust (Axum, SQLx, Tokio, Tracing) |
| Frontend | Next.js 16, React 19, TypeScript, styled-components |
| Database | PostgreSQL 17 |
| Linting | Biome 2 (frontend), Clippy (backend) |
| Deploy | Docker Compose, GitHub Actions |

## Quick Start

```bash
# Copy env files
cp sharkie.env.example sharkie.env        # edit CURRENCY_API_KEY
cp sharkie_db.env.example sharkie_db.env
cp sharkie.local.env.example sharkie.local.env

# Start everything (DB + restore + backend + frontend)
make dev
```

See `make help` for all commands.

## Environment Files

| File | Purpose | Used by |
|------|---------|---------|
| `sharkie.env` | API keys, DB URL (`@db`) | Docker Compose `app` service, `cargo run` fallback |
| `sharkie_db.env` | Postgres credentials | Docker Compose `db` service |
| `sharkie.local.env` | Local overrides (`@localhost`) | `cargo run` (loaded first, wins) |

All `*.env` are gitignored. Only `*.env.example` are committed.

## API

Base: `http://localhost:3000` (dev) / `https://sharkie.uha.app` (prod)

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Server + DB status |
| `GET /currencies` | List available currency codes |
| `GET /history?from=&to=&currencies=&base=` | Historical rates (date range) |
| `GET /history?date=&currencies=&base=` | Historical rates (specific dates) |

Date range limit: 5 years. Response limit: 512 KB.

## Project Structure

```
src/                    Rust backend (Axum)
├── routes/             HTTP handlers
├── services/           Business logic (backfill, scheduler)
├── config.rs           Env configuration
├── error.rs            Unified ApiError
├── models.rs           DB models + API DTOs
└── state.rs            Shared app state

frontend/               Next.js 16 (static export)
├── src/app/            App Router pages
├── src/components/     React components
├── src/hooks/          Custom hooks
├── src/lib/            Utilities, API client, i18n, theme
└── biome.json          Linter/formatter config

docs/                   Documentation (Fumadocs)
scripts/                Dev scripts (DB restore)
migrations/             SQLx migrations
rules/                  Coding standards
```

## Background Tasks

- **Startup**: backfills missing dates from 2000-01-01 to yesterday
- **Scheduled**: fetches today's rates at 00:05, 04:00, 08:00, 12:00, 16:00, 20:00, 23:55 UTC

## Documentation

Full docs: `make dev-docs` then open `http://localhost:3000/docs`

## Crontab (production)

```
0 3 * * * /path/to/backup.sh && find $HOME/sharkie_backups -name "*.dump" -mtime +30 -delete
```

## Frontend

The frontend was built with assistance of claude.ai (opus-4.6) as a prototype.

## License

[AGPL-3.0](LICENSE)
