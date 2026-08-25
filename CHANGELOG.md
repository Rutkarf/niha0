# Changelog

All notable changes to NIHAO are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.7.0] — 2026-08-25

### Added
- **Studio drag-and-drop** : palette, canvas, arêtes par clic, positions persistées dans `graphJson`
- **pgvector** : colonne `embedding vector(384)` (V19), dual-write + recherche ANN (`RAG_PGVECTOR_ENABLED`)
- **Access cookie + CSRF complet** : `niha0_access` HttpOnly, prod `ACCESS_COOKIE_ENABLED` ; FE omet Bearer
- **ERP REAL** : CMS / SCM / MRP / ETL / EDI via `/erp/{module}/items` + UI CRUD (`erp.write`)

### Changed
- ADR 004 / 008 ; nav Gestion + bibliothèques Données hors « Bientôt »
- Flyway **V19**

## [0.6.2] — 2026-08-25

### Added
- **RBAC permissions enforced** : JWT authorities from `role_permissions` ; `@PreAuthorize(hasAuthority(…))` on runtime, chat, studio, marketplace, gouvernance, PIM write
- Flyway **V18** : permissions pour rôles ops (SALES, HR, OPS, …)
- Rate-limit OS API (chat / runtime / guardrail scan)
- Studio templates simple + HITL ; Runtime lit les définitions Studio par slug

### Fixed
- Bouton **Reprendre** runtime : statut UI aligné sur `INTERRUPTED` (plus `WAITING_HUMAN`)
- Chat : vrai contexte RAG (plus stub `rag:true` menteur) + badges provider / RAG / démo

### Changed
- UX gouvernance (onglets a11y, KPI eval) ; chat / studio / runtime labels & hints

## [0.6.1] — 2026-08-25

### Added
- **Deploy Cloudflare Pages + Render** : `render.yaml`, Pages Function `/api` proxy, `wrangler.toml`, `_redirects` / `_headers`, CD `cd-cloudflare-render.yml`
- Guide ops [`docs/ops/cloudflare-render.md`](docs/ops/cloudflare-render.md) ; backup `scripts/backup-render-postgres.sh`
- Normalisation `DATABASE_URL` Render (`postgres://` → `jdbc:postgresql://`)
- Cookie Domain / SameSite configurables ; FE `credentialsInterceptor` + `niha0-config.js` runtime API URL

### Fixed
- Rate-limit auth désactivé en profil test (fin des 429 flaky entre classes SpringBootTest)

### Changed
- Hébergement recommandé : Cloudflare + Render (Fly reste alternatif)
- `.env.prod.example` aligné R2 / Render / domaine niha0

## [0.6.0] — 2026-08-25

### Added
- **NIHAO_05 OS layers (Phases 0–6)** : runtime graphe d’agents, mémoire multi-niveaux, chat assistant, gouvernance (permissions / guardrails / sandbox / eval), PIM CRUD, BI rapport, studio + marketplace, pricing packs modulaires, docs GTM
- Flyway **V16** (tables OS) + **V17** (RLS sur tables V16)
- UI : `/app/chat`, `/app/runtime`, `/app/studio`, `/app/marketplace`, `/app/governance` ; PIM et BI hors « bientôt »
- Docs Phase 0 : `NIHAO_03_*`, `NIHAO_01_SYNTHESE_BENCHMARK.md`, `docs/prompts/`, `docs/NIHAO_05_STATUS.md`

### Tests
- `Nihao05OsLayersTest` (PIM, runtime, chat, gouvernance, marketplace, mémoire)

## [0.5.0] — 2026-08-25

### Added
- **Phase B staging** : prod defaults (OpenAI, SMTP, SumUp, no demo login), HTML mail FR, CD push GHCR, restore script, `DemoUserDeactivator`
- **Phase C hardening** : entitlements (seats/storage/AI), Postgres RLS V15, Redis rate-limit when available, GDPR erase blobs, CRM customer DTOs, CSRF on in prod, DPA template
- **Phase D quality** : quote→invoice→payment + PDF, Playwright marketing/login in CI, Alertmanager template, i18n keys expanded
- **Phase E go-live** : landing `/`, pricing `/pricing`, platform admin console (`PLATFORM_ADMIN`), suspend org blocks login

### Changed
- Default SPA route `/` is marketing landing (app remains under `/app/*`)
- Billing plan response includes storage/AI quota meters

## [0.4.0] — 2026-08-25

### Added
- **RAG vectoriel** : `EmbeddingProvider` (hash|openai), chunks Flyway V12, search hybride, UI company-data, contexte agents
- **SSO Google OIDC** (opt-in) : exchange code, login FE, Flyway V13 `oauth_identities` / `sso_codes`
- **CSRF cookie prep** (`CSRF_ENABLED`) + interceptor XSRF côté SPA (ADR 008)
- JWT **dual-secret** rotation (`JWT_PREVIOUS_SECRET`)
- Rate-limit auth élargi ; headers sécurité Spring + CSP nginx
- Audit writes LOGIN / BILLING_PAID ; nav Audit active
- CD prod template (Fly.io) : `infra/fly.toml`, `.github/workflows/cd-prod.yml`
- Docs : host-choice, RAG, SSO, enterprise checklist

### Changed
- Shells ERP : roadmap PIM explicite sur pages « Bientôt »

## [0.3.0] — 2026-08-25

### Added
- **SumUp Hosted Checkout** for PRO/BUSINESS (`BILLING_PROVIDER=sumup|stub`)
- Refresh token **httpOnly cookie** + access token in memory (FE)
- **TOTP MFA** réel + recovery codes + page `/mfa`
- E-mails transactionnels (SMTP ou mode log) avec liens reset/invite
- Worker de livraison des webhooks sortants (HMAC)
- Realtime Redis optionnel (`REALTIME_MODE=redis`)
- Flyway V11 (`billing_checkouts`, `webhook_deliveries`)

### Changed
- Upgrade de plan libre désactivé hors stub — paiement SumUp requis
- Demo login / AI fallback documentés pour prod

## [0.2.0] — 2026-08-25

### Added
- Password reset (`/auth/forgot-password`, `/auth/reset-password`) and organization invites
- Member role management (PATCH/DELETE memberships)
- GDPR export / erase-me endpoints and privacy/terms pages
- Feedback, help center, cookie consent banner
- Billing plan stub (FREE / PRO / BUSINESS entitlements)
- Outbound webhooks CRUD (delivery deferred)
- MFA enroll stub (replace with real TOTP before enterprise launch)
- Accounting & marketing write UI
- Locale preference (fr/en), analytics event helper
- CD staging workflow template, load-test script, product checklist
- OpenAI fallback honesty (`AI_OPENAI_ALLOW_DEMO_FALLBACK`)

### Changed
- Marketing module removed from sidebar “Bientôt”
- Audit report refreshed as source of truth for REAL/MOCK/SHELL

### Security
- Rate limit extended to password-reset endpoints
- Demo login remains disableable in production

## [0.1.0] — 2026-08-25

### Added
- MVP: AI Office 3D, JWT auth + refresh, CRM/Sales/Support/Legal/HR/Stock, approvals CEO, object storage, RAG keyword, SSE ticket, CI
