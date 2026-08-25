# NIHAO_05 — Statut phases 0–6

Checklist de livraison (frontend + backend OS layers). Date de référence : 2026-08-25 · version **0.7.0**.

| Phase | Objectif | Statut | Preuves |
|-------|----------|--------|---------|
| 0 | Cadrage & architecture | **DONE** | `docs/NIHAO_03_PHASE0_CADRAGE.md`, `docs/NIHAO_03_ARCHITECTURE.md` |
| 1 | Core platform & AI Office | **DONE** | `apps/niha0-frontend`, `apps/niha0-backend`, AI Office 3D |
| 2 | Runtime agentique & mémoire | **DONE** | Backend `agents/runtime`, `agents/memory`, `chat/` ; UI `/app/runtime`, `/app/chat` ; Flyway `V16__nihao05_os_layers.sql` |
| 3 | Gouvernance & observabilité | **DONE** | Backend `governance/` ; UI `/app/governance` (roleGuard ADMIN, OWNER via guard) |
| 4 | Modules métier (PIM/BI) | **DONE** | Backend `pim/`, `bi/` ; UI `/app/pim` CRUD, `/app/bi` rapport + CSV |
| 5 | Studio & marketplace | **DONE** | Backend `marketplace/` ; UI `/app/studio`, `/app/marketplace` |
| 6 | Pricing & GTM | **DONE** | `pricing.page.ts` packs ; `/use-cases` ; `docs/gtm/*` ; aide `/app/help` |
| Deploy | Cloudflare Pages + Render | **READY** | `render.yaml`, `docs/ops/cloudflare-render.md`, `cd-cloudflare-render.yml` |
| Improve | RBAC + RAG chat + HITL UX | **DONE** | Authorities V18, Chat RAG, Runtime INTERRUPTED, rate-limit OS |
| Improve | Studio DnD · pgvector · CSRF cookies · ERP REAL | **DONE** | V19, Studio canvas, `/erp/{module}`, access cookie |

## Routes app (nouvelles)

- `/app/chat`, `/app/runtime`, `/app/studio`, `/app/marketplace`, `/app/governance`
- `/app/pim`, `/app/bi` (plus « bientôt »)

## Migrations

- Flyway **V1–V17** (`apps/niha0-backend/src/main/resources/db/migration/` — V16 OS layers, V17 RLS)

## Go-live ops (hors code)

Voir checklist dans [`ops/cloudflare-render.md`](./ops/cloudflare-render.md) et [`ops/phase-e-golive.md`](./ops/phase-e-golive.md).
