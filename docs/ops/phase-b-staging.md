# Phase B — Staging professionnel

> Mis à jour avec le code (defaults prod, CD push GHCR, mail HTML, backups).

## Objectif

Une stack déployable hors laptop, avec defaults qui refusent la démo.

## Checklist opérationnelle

| # | Critère | Comment |
|---|---------|---------|
| 1 | Secrets hors git | Copier `.env.prod.example` → `.env` / Fly secrets |
| 2 | `DEMO_LOGIN_ENABLED=false` | Forcé dans `application-prod.yml` + `ProdSecurityValidator` |
| 3 | Comptes Demo2026! inactifs en prod | `DemoUserDeactivator` au démarrage profil `prod` |
| 4 | `AI_PROVIDER=openai` + fallback off | Prod defaults + validator |
| 5 | `MAIL_MODE=smtp` + templates HTML FR | `mail/*.html` + `SmtpMailService` |
| 6 | Storage ≠ local | MinIO/S3 required by validator |
| 7 | SumUp keys (sandbox staging) | `.env.prod.example` + compose passthrough |
| 8 | CD push images | `cd-staging.yml` / `cd-prod.yml` → GHCR ; `cd-cloudflare-render.yml` |
| 9 | Deploy | **Cloudflare Pages + Render** (`docs/ops/cloudflare-render.md`) ou Fly/SSH |
| 10 | Backup + restore dry-run | `make backup` · `scripts/backup-render-postgres.sh` · `make restore-dry DUMP=…` |

## Commandes locales

```bash
make compose-config   # valide docker-compose.yml
make backup           # nécessite Postgres up
make restore-dry DUMP=backups/postgres/niha0-….dump
```

## Déploiement Cloudflare + Render (recommandé)

Voir [`cloudflare-render.md`](./cloudflare-render.md) — Blueprint `render.yaml`, Pages Function `/api`, R2, CD `cd-cloudflare-render.yml`.

## Déploiement Fly.io (alternatif)

```bash
fly apps create niha0-api
fly secrets set -a niha0-api \
  JWT_SECRET=… SPRING_DATASOURCE_URL=… SPRING_DATASOURCE_USERNAME=… \
  SPRING_DATASOURCE_PASSWORD=… CORS_ORIGINS=https://app.example.com \
  APP_PUBLIC_URL=https://app.example.com \
  AI_OPENAI_API_KEY=… SUMUP_API_KEY=… SUMUP_MERCHANT_CODE=… \
  SPRING_MAIL_HOST=… SPRING_MAIL_USERNAME=… SPRING_MAIL_PASSWORD=… \
  STORAGE_MODE=s3 STORAGE_S3_…=…
fly deploy -c infra/fly.toml
```

Sans secrets host, le workflow CD **pousse les images** et skip le deploy avec un warning (pas un faux succès silencieux).
