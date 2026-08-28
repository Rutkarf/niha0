.PHONY: help dev dev-stack prod up down build test lint check backend-test frontend-test frontend-build backend-build backend-run frontend-run backup backup-render restore-dry compose-config smoke-health

help:
	@echo "NIHAO — commandes disponibles"
	@echo "  make dev            Démarrer PostgreSQL (+ MinIO) via docker-compose.dev.yml"
	@echo "  make dev-stack      PostgreSQL + backend + frontend (live reload, 1 terminal)"
	@echo "  make prod           Stack production (docker compose up --build)"
	@echo "  make down           Arrêter les services Compose"
	@echo "  make build          Build frontend + backend"
	@echo "  make lint           Typecheck frontend (tsc --noEmit)"
	@echo "  make test           Tests frontend + backend"
	@echo "  make check          lint + test + build"
	@echo "  make backup         Dump Postgres (scripts/backup-postgres.sh)"
	@echo "  make backup-render  Dump via DATABASE_URL (Render)"
	@echo "  make restore-dry    Dry-run restore (DUMP=path.dump)"
	@echo "  make compose-config Valider docker-compose.yml avec secrets CI"
	@echo "  make smoke-health   GET /api/actuator/health"
	@echo "  make backend-run    Lancer le backend (PostgreSQL requis)"
	@echo "  make frontend-run   Lancer le frontend (ng serve)"

# Prefer docker compose; fall back to podman compose when Docker CLI is unavailable.
COMPOSE ?= $(shell command -v docker >/dev/null 2>&1 && echo docker || echo podman)

dev:
	$(COMPOSE) compose -f docker-compose.dev.yml up postgres -d

dev-stack:
	./scripts/dev-local.sh

prod:
	$(COMPOSE) compose up --build -d

down:
	-$(COMPOSE) compose down
	-$(COMPOSE) compose -f docker-compose.dev.yml down

build: frontend-build backend-build

frontend-build:
	cd apps/niha0-frontend && npm run build

backend-build:
	cd apps/niha0-backend && ./mvnw -q package -DskipTests

lint:
	cd apps/niha0-frontend && npm run lint

frontend-test:
	cd apps/niha0-frontend && npm run test -- --watch=false

backend-test:
	cd apps/niha0-backend && ./mvnw test

test: frontend-test backend-test

check: lint test build

backend-run:
	cd apps/niha0-backend && ./mvnw spring-boot:run

frontend-run:
	cd apps/niha0-frontend && npm start

backup:
	./scripts/backup-postgres.sh

backup-render:
	./scripts/backup-render-postgres.sh

restore-dry:
	@test -n "$(DUMP)" || (echo "Usage: make restore-dry DUMP=backups/postgres/niha0-….dump" >&2; exit 1)
	DRY_RUN=1 ./scripts/restore-postgres.sh "$(DUMP)"

compose-config:
	JWT_SECRET='ci-test-secret-at-least-forty-eight-characters-long!!' \
	POSTGRES_PASSWORD='ci-strong-db-password' \
	CORS_ORIGINS='https://staging.example.com' \
	APP_PUBLIC_URL='https://staging.example.com' \
	STORAGE_S3_ACCESS_KEY='ci' STORAGE_S3_SECRET_KEY='ci-secret-key' \
	AI_PROVIDER=openai AI_OPENAI_ALLOW_DEMO_FALLBACK=false \
	MAIL_MODE=smtp BILLING_PROVIDER=stub \
	$(COMPOSE) compose -f docker-compose.yml config >/dev/null
	@echo "compose config OK"

smoke-health:
	curl -fsS http://127.0.0.1:8080/api/actuator/health
