# Checklist enterprise NIHAO 0.4

> Mise à jour : 2026-08-25

## Scope 0.3 — livré / préparé

| Item | Statut | Notes |
|------|--------|-------|
| RAG vectoriel | **DONE (hash + OpenAI opt)** | JSON embeddings ; hybrid search ; agents branchés |
| CSRF cookie prep | **PREP** | `CSRF_ENABLED` ; ignore Bearer ; ADR 008 |
| CD vrai host | **READY** | Cloudflare Pages + Render (`docs/ops/cloudflare-render.md`) ; Fly alternatif |
| RBAC granulaire (permissions) | **DONE** | `PermissionCatalogService` + `hasAuthority` OS APIs |
| ERP Bientôt | **DONE** | Sidebar + shells + roadmap PIM |
| SSO Google | **DONE (opt-in)** | `OAUTH2_ENABLED` + client Google ; coexistence JWT |

## Sécurité

| Item | Statut |
|------|--------|
| JWT dual-secret | DONE |
| Refresh HttpOnly | DONE (0.3) |
| Rate-limit auth élargi | DONE |
| Headers Spring + nginx CSP | DONE |
| Audit LOGIN / BILLING_PAID | DONE |
| Audit nav active | DONE |
| RBAC permissions granulaires | **DONE** | Authorities JWT + `@PreAuthorize` (V16/V18) |

## Commercial

| Item | Statut |
|------|--------|
| SumUp | DONE (stub|sumup) |
| MFA TOTP | DONE |
| RGPD export/erase | DONE |
| Mentions / cookies | DONE |

## Go-live restant

1. Appliquer `docs/ops/cloudflare-render.md` (domaine, secrets, R2, Pages `API_ORIGIN`)
2. `DEMO_LOGIN_ENABLED=false`, SumUp réel, backups Render
3. `RAG_EMBEDDING_PROVIDER=openai` si corpus réel
4. ~~Permissions RBAC~~ — livré (authorities + V18)
5. pgvector en prod si volume documents élevé
6. Shells ERP restants (CMS/SCM/MRP/ETL/EDI) — hors périmètre pilote
