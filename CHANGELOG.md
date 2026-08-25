# Changelog

All notable changes to NIHAO are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
