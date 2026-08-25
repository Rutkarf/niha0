# Architecture NIHAO (Phase 0)

> Source complémentaire : `docs/architecture/map.md` (détail REAL/MOCK/SHELL).  
> Plan global : `docs/NIHAO_05_PLAN_ACTION_COMPLET.md`.

## 1. Vue logique

```text
┌─────────────────────────────────────────────────────────────┐
│ Surfaces UX                                                  │
│  Chat / Assistant │ Studio │ AI Office 3D │ Admin │ Market  │
└────────────┬──────────────────┬──────────────┬──────────────┘
             │                  │              │
┌────────────▼──────────────────▼──────────────▼──────────────┐
│ Plateforme API  /api  (Spring Boot)                          │
│  Auth · Modules métier · Agents runtime · Mémoire · RAG      │
│  Gouvernance · Marketplace · Billing · Observabilité         │
└────────────┬──────────────────┬──────────────┬──────────────┘
             │                  │              │
        PostgreSQL 17      Object store     LLM providers
        (+ Flyway)         local|minio|s3   mock|openai|…
```

## 2. Couches OS agents

| Couche | Rôle | Packages / features |
|--------|------|---------------------|
| Runtime | Graphes d’état, outils, multi-agent, HITL | `agents/runtime`, `/agents/runtime` |
| Mémoire | Session, persistante, équipe, entreprise | `agents/memory`, `/memory` |
| RAG | Index + recherche hybride | `rag/` |
| Gouvernance | Permissions, guardrails, sandbox, eval | `governance/` |
| Studio | Éditeur de graphes / templates | `marketplace` definitions + FE studio |
| Marketplace | Publier, versionner, installer | `marketplace/` |
| Surfaces | Chat, AI Office, modules, admin | `features/*` |

## 3. Multi-tenancy

- `organization_id` sur toutes les entités métier
- `TenantContext` + filtre applicatif ; RLS PostgreSQL (V15) en filet
- Quotas via `billing/EntitlementService`

## 4. Sécurité

- JWT access + refresh (cookie httpOnly partiel / ADR 006)
- `@PreAuthorize` + table `permissions` (Phase 3)
- Rate-limit auth ; CSRF optionnel (ADR 008)
- Guardrails sur I/O LLM ; sandbox outils (timeouts, allowlist)

## 5. Déploiement

- Dev : `make dev` + backend/frontend locaux
- Prod recommandé : **Cloudflare Pages + Render** — `docs/ops/cloudflare-render.md`, `render.yaml`
- Prod alternatif : `docker-compose.yml` + Nginx / Fly.io (`infra/fly.toml`)
- CI : `.github/workflows/ci.yml` ; CD : `cd-cloudflare-render.yml`, `cd-staging.yml`, `cd-prod.yml`

## 6. Extensibilité modules

Un module REAL = package BE (`com.sasurd.niha0.<domain>`) + page FE + seed optionnel + entrée catalogue.  
Les SHELL restent des hubs agent jusqu’à promotion (ADR 004).
