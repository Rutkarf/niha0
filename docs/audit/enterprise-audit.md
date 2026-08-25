# Audit enterprise NIHAO — 0.4

> Date : 2026-08-25 · Flyway **V1–V13** (RAG V12, OAuth V13).

## Scorecard

| Domaine | Statut | Notes |
|---------|--------|-------|
| JWT + refresh HttpOnly + access mémoire | **DONE** | Dual-secret `JWT_PREVIOUS_SECRET` |
| CSRF | **PREP** | `CSRF_ENABLED` ; Bearer ignoré ; ADR 008 |
| SSO OIDC Google | **DONE (opt-in)** | `OAUTH2_ENABLED` + docs |
| RBAC granulaire (permissions) | **DEBT** | Roles + `@PreAuthorize` |
| Audit logs | **PARTIAL→OK** | LOGIN + BILLING_PAID + UI admin |
| Rate limiting | **OK** | Auth paths élargis |
| Security headers | **OK** | Spring + nginx CSP |
| RAG | **DONE (hash/openai)** | Hybrid ; agents branchés |
| CD prod / vrai host | **TEMPLATE** | Fly.io + `cd-prod.yml` |
| ERP Bientôt | **DONE** | Shells + roadmap PIM |
| SumUp billing | **DONE** | stub\|sumup |
| MFA TOTP | **DONE** | |
| Redis SSE | **PARTIAL** | Opt-in |
| Flyway | **DONE** | V13 |

## Livré cette vague

1. Sécurité (CSRF prep, headers, rate-limit, JWT rotation, audit writes)
2. RAG vectoriel (EmbeddingProvider, chunks, search, UI)
3. SSO Google + FE login/callback
4. Host Fly.io documenté + CD prod template + ERP honesty

## Dettes restantes

- Permissions RBAC table
- pgvector / Tika PDF
- Déploiement réel (secrets host)
- Tests charge auth
