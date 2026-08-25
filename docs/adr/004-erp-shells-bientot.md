# ADR 004 — ERP module maturity (enterprise update)

## Status
Accepted

## Decision
| Module | Backend | Frontend | Nav |
|--------|---------|----------|-----|
| CRM / Sales / Support | Full CRUD | Full CRUD | Active |
| RH / Stock / Juridique | Full CRUD | Full CRUD | Active |
| Accounting / Marketing | Full API + write UI | Active | Active |
| Audit | API + UI | Active (ADMIN) | Active |
| Analytics/BI, Stratégie/BPM | thin | thin | **Bientôt** |
| Administration ERP hub | thin docs | thin | **Bientôt** |
| CMS, PIM, SCM, MRP, ETL, EDI | — | Shell « Bientôt » | Disabled / library focus only |

## Next vertical (roadmap)
Priorité produit : **PIM** (référentiel produits) après stabilisation RAG/SSO — un seul shell → réel à la fois.

## UX honesty
Shell pages use `soon-pill` + blocked sidebar clicks (`soon: true` without libraryId).
