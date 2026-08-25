# Déploiement NIHAO — Cloudflare Pages + Render

> Cible recommandée pour le domaine **niha0** (pilote commercial).  
> Alternative documentée : Fly.io (`infra/fly.toml`, `docs/ops/host-choice.md`).

## Architecture

```text
  DNS / TLS          SPA + /api proxy              JVM API              Data
┌────────────┐    ┌─────────────────────┐    ┌──────────────┐    ┌─────────────┐
│ Cloudflare │───▶│ Cloudflare Pages    │───▶│ Render Web   │───▶│ Render PG  │
│  niha0.*   │    │ Angular + Function  │    │ Spring Boot  │    │ Redis      │
└────────────┘    │ /api → API_ORIGIN   │    │ Docker       │    │ R2 (S3)    │
                  └─────────────────────┘    └──────────────┘    └─────────────┘
```

- Frontend : `apps/niha0-frontend` → Pages (`wrangler.toml`, `functions/api/[[path]].ts`)
- Backend : `render.yaml` → service Docker + Postgres 17 + Redis
- Storage : Cloudflare **R2** (`STORAGE_MODE=s3`, endpoint R2)
- Auth cookies : same-origin via proxy `/api` (pas besoin de `COOKIE_SAME_SITE=None`)

## 1. Domaine

1. Acheter `niha0` (TLD au choix : `.com`, `.app`, `.io`…).
2. Nameservers → Cloudflare.
3. Pages custom domain : `niha0.tld` (+ `www` redirect).
4. (Optionnel) CNAME `api.niha0.tld` → service Render si accès API direct.

## 2. Render (API)

1. Dashboard → **New → Blueprint** → repo → appliquer `render.yaml`.
2. Remplir les secrets `sync: false` :

| Variable | Exemple |
|----------|---------|
| `JWT_SECRET` | ≥ 48 caractères aléatoires |
| `CORS_ORIGINS` | `https://niha0.tld` |
| `APP_PUBLIC_URL` | `https://niha0.tld` |
| `STORAGE_S3_ENDPOINT` | `https://<accountid>.r2.cloudflarestorage.com` |
| `STORAGE_S3_ACCESS_KEY` / `SECRET_KEY` / `BUCKET` | R2 API token |
| `AI_OPENAI_API_KEY` | clé OpenAI |
| `SPRING_MAIL_*` / `MAIL_FROM` | Resend / SMTP |
| `SUMUP_*` | sandbox puis live |
| `SUMUP_REDIRECT_URL` | `https://niha0.tld/app/settings?billing=success` |

3. Healthcheck : `GET /api/actuator/health`
4. Créer un **Deploy Hook** → secret GitHub `RENDER_DEPLOY_HOOK_URL`

`DATABASE_URL` `postgres://…` est converti en `jdbc:postgresql://…` au boot (`PostgresJdbcUrlEnvironmentPostProcessor`).

## 3. Cloudflare Pages (SPA)

1. Pages → Create → connecter le repo.
2. **Root directory** : `apps/niha0-frontend`
3. **Build command** : `npm ci && npm run build`
4. **Build output** : `dist/niha0-frontend/browser`
5. Env (Production) :
   - `API_ORIGIN` = `https://niha0-api.onrender.com` (URL Render, **sans** slash final)
6. Custom domain → `niha0.tld`
7. Token API Pages → secrets GH : `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT=niha0`

## 4. CD GitHub

Workflow : `.github/workflows/cd-cloudflare-render.yml`

- Tag `v*` ou `workflow_dispatch`
- Gate CI → deploy Pages + hook Render

Environment GitHub **`production`** avec les secrets listés ci-dessus.

## 5. Go / no-go (cocher)

- [ ] `DEMO_LOGIN_ENABLED=false` (défaut prod)
- [ ] Compte pilote via `/register` (pas Demo2026!)
- [ ] SMTP : invite + reset reçus
- [ ] SumUp sandbox checkout + webhook HTTPS
- [ ] `AI_PROVIDER=openai`, fallback off
- [ ] Upload doc → R2 OK
- [ ] Backup Postgres (Render dashboard ou `scripts/backup-render-postgres.sh`)
- [ ] Restore dry-run une fois
- [ ] Landing `/` + pricing `/pricing` publics
- [ ] Hypercare 2 semaines

## 6. Backups

```bash
# Avec DATABASE_URL Render (External) exporté :
export DATABASE_URL='postgres://…'
./scripts/backup-render-postgres.sh
make restore-dry DUMP=backups/postgres/niha0-….dump
```

Activer aussi les **logical backups** Render sur le plan Postgres.

## 7. SSE / timeouts

Le proxy Pages Function peut couper les connexions très longues.  
Si le realtime SSE est critique : brancher le client sur `api.niha0.tld` (custom domain Render) via `public/niha0-config.js` → `apiUrl`, et fixer `COOKIE_SAME_SITE=None` + `COOKIE_DOMAIN=.niha0.tld` côté API.

## 8. Secrets jamais en git

Voir `.env.prod.example` (section Cloudflare / Render).
