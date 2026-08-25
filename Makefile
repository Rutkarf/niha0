.PHONY: help dev prod up down build test lint check backend-test frontend-test frontend-build backend-build backend-run frontend-run

help:
	@echo "NIHAO — commandes disponibles"
	@echo "  make dev            Démarrer PostgreSQL (+ MinIO) via docker-compose.dev.yml"
	@echo "  make prod           Stack production (docker compose up --build)"
	@echo "  make down           Arrêter les services Compose"
	@echo "  make build          Build frontend + backend"
	@echo "  make lint           Typecheck frontend (tsc --noEmit)"
	@echo "  make test           Tests frontend + backend"
	@echo "  make check          lint + test + build"
	@echo "  make backend-run    Lancer le backend (PostgreSQL requis)"
	@echo "  make frontend-run   Lancer le frontend (ng serve)"

# Prefer docker compose; fall back to podman compose when Docker CLI is unavailable.
COMPOSE ?= $(shell command -v docker >/dev/null 2>&1 && echo docker || echo podman)

dev:
	$(COMPOSE) compose -f docker-compose.dev.yml up postgres -d

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
