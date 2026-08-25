# Choix d’hébergement NIHAO (enterprise)

## Décision recommandée (pilote → prod)

| Critère | **Fly.io** (recommandé démarrer) | Hetzner VPS + Caddy | AWS ECS/Fargate |
|---------|----------------------------------|--------------------|-----------------|
| Coût démarrage | Faible | Faible | Moyen |
| Postgres géré | Fly Postgres / Neon externe | Self-managed | RDS |
| Docker | Natif | Docker Compose | Oui |
| TLS | Automatique | Caddy/Let’s Encrypt | ALB + ACM |
| Complexité | Basse | Moyenne | Haute |

**Choix documenté :** déployer sur **Fly.io** (apps) + **Neon** ou Fly Postgres pour la DB, MinIO/S3 pour le storage. Alternative budget : **Hetzner CX** + `docker compose` + Caddy.

## Secrets (jamais en git)

`JWT_SECRET`, `JWT_PREVIOUS_SECRET`, `SUMUP_*`, `GOOGLE_CLIENT_*`, `SPRING_DATASOURCE_*`, `STORAGE_S3_*`, `MAIL_*`

## Pipeline

1. `ci.yml` — lint/test/build (existant)
2. `cd-staging.yml` — build images + gate manuel (existant)
3. `cd-prod.yml` — promotion depuis tag `v*` / workflow_dispatch + environment `production`

## Checklist go-live host

- [ ] Domaine + DNS A/AAAA ou CNAME
- [ ] TLS valide + HSTS
- [ ] Healthcheck `/api/actuator/health`
- [ ] Backups Postgres quotidiens + test restore
- [ ] `DEMO_LOGIN_ENABLED=false`
- [ ] `BILLING_PROVIDER=sumup` avec clés réelles
- [ ] Webhook SumUp HTTPS
