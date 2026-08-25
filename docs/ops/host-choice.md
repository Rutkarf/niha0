# Choix d’hébergement NIHAO (enterprise / pilote)

## Décision recommandée (pilote → prod)

| Critère | **Cloudflare + Render** (recommandé) | **Fly.io** | Hetzner VPS + Caddy |
|---------|--------------------------------------|------------|--------------------|
| Frontend | Pages + CDN + DNS | Image nginx / CDN | Compose + Caddy |
| Backend JVM | Render Docker | Fly Machines | Docker Compose |
| Postgres | Render PG 17 | Fly PG / Neon | Self-managed |
| Object storage | **Cloudflare R2** (S3) | MinIO / S3 | MinIO |
| TLS / domaine | Automatique CF | Automatique Fly | Caddy LE |
| Complexité | Basse–moyenne | Basse | Moyenne |

**Choix documenté pour niha0 :** **Cloudflare Pages** (SPA + proxy `/api`) + **Render** (API + Postgres + Redis) + **R2**.  
Guide pas à pas : [`cloudflare-render.md`](./cloudflare-render.md).

Alternative : **Fly.io** (`infra/fly.toml`, CD `cd-prod.yml`) ou Hetzner + `docker compose`.

## Secrets (jamais en git)

`JWT_SECRET`, `JWT_PREVIOUS_SECRET`, `SUMUP_*`, `GOOGLE_CLIENT_*`, `SPRING_DATASOURCE_*` / `DATABASE_URL`, `STORAGE_S3_*`, `MAIL_*`, `CORS_ORIGINS`, `APP_PUBLIC_URL`, `API_ORIGIN` (Pages)

## Pipeline

1. `ci.yml` — lint/test/build
2. `cd-staging.yml` — images GHCR + SSH staging (optionnel)
3. `cd-cloudflare-render.yml` — Pages + Render deploy hook (tags `v*` / dispatch)
4. `cd-prod.yml` — Fly / SSH compose (legacy / alternatif)

## Checklist go-live host

- [ ] Domaine + DNS Cloudflare
- [ ] TLS valide + HSTS
- [ ] Healthcheck `/api/actuator/health`
- [ ] Backups Postgres + test restore
- [ ] `DEMO_LOGIN_ENABLED=false`
- [ ] `BILLING_PROVIDER=sumup` avec clés réelles
- [ ] Webhook SumUp HTTPS
- [ ] `API_ORIGIN` Pages → URL Render
