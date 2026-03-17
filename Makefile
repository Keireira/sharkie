.PHONY: dev dev-fe dev-be dev-db dev-docs \
       build build-fe build-be build-docs \
       up down logs ps \
       lint format check \
       migrate restore restore-force backup clean help

# ─── Development ────────────────────────────────────

dev: dev-db restore ## Start all services locally (db in docker, app + fe natively)
	@echo "Starting backend and frontend..."
	@trap 'kill 0' INT; \
		$(MAKE) dev-be & \
		$(MAKE) dev-fe & \
		wait

dev-fe: ## Start frontend dev server (port 3001)
	cd frontend && NEXT_PUBLIC_API_BASE=http://localhost:3000 pnpm dev

dev-be: ## Start Rust backend dev server (port 3000)
	cargo run

dev-db: ## Start PostgreSQL in Docker and wait until ready
	docker compose up -d db
	@echo "Waiting for database to be ready..."
	@until docker compose exec -T db pg_isready -U sharkie -d sharkie > /dev/null 2>&1; do sleep 1; done
	@echo "Database is ready."

dev-docs: ## Start docs dev server (port 3333)
	cd docs && pnpm dev --port 3333

# ─── Build ──────────────────────────────────────────

build: build-be build-fe ## Build all

build-fe: ## Build frontend (static export)
	cd frontend && pnpm build

build-be: ## Build Rust backend (release)
	cargo build --release

build-docs: ## Build documentation site
	cd docs && pnpm build

# ─── Docker ─────────────────────────────────────────

up: ## Start all services with Docker Compose
	docker compose up -d

down: ## Stop all services
	docker compose down

logs: ## Follow Docker Compose logs
	docker compose logs -f

ps: ## Show running containers
	docker compose ps

# ─── Code Quality ───────────────────────────────────

lint: ## Run all linters (biome + clippy)
	cd frontend && pnpm biome check .
	cargo clippy -- -D warnings

format: ## Format all code (biome + cargo fmt)
	cd frontend && pnpm biome check --fix --unsafe .
	cd frontend && pnpm biome format --write .
	cargo fmt

check: ## Run all checks (lint + typecheck + cargo check)
	cd frontend && pnpm biome check .
	cd frontend && pnpm tsc --noEmit
	cargo check
	cargo clippy -- -D warnings

# ─── Database ───────────────────────────────────────

migrate: ## Run SQLx database migrations
	cargo sqlx migrate run

restore: ## Restore latest dump from ./dumps (skips if DB already has data)
	@./scripts/restore-latest-dump.sh

restore-force: ## Restore latest dump, replacing existing data
	@./scripts/restore-latest-dump.sh --force

backup: ## Download database backups from remote
	./download-backups.sh

# ─── Cleanup ────────────────────────────────────────

clean: ## Clean all build artifacts
	cargo clean
	rm -rf frontend/.next frontend/out
	rm -rf docs/.next docs/out

# ─── Help ───────────────────────────────────────────

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
