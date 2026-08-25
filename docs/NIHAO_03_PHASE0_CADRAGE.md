# Phase 0 — Cadrage NIHAO

> Aligné sur `NIHAO_05_PLAN_ACTION_COMPLET.md`.  
> Date : 2026-08-25 · Produit : **0.5.0+**

## 1. Vision

**NIHAO** (*Network Intelligence Hub Access Open*) est un **OS de travail agentique** : unifier assistant simple, runtime d’agents, gouvernance enterprise et marketplace — sans fragmenter « dev » vs « business ».

## 2. Objectifs Phase 0

| Objectif | Statut |
|----------|--------|
| Vision & périmètre OS agents | **DONE** (ce doc + NIHAO_05) |
| Architecture cible | **DONE** → `NIHAO_03_ARCHITECTURE.md` + `architecture/map.md` |
| Structure monorepo | **DONE** (`apps/`, `infra/`, `docs/`, `scripts/`) |
| CI/CD de base | **DONE** (`.github/workflows/ci.yml`, CD templates) |
| Prompts phases suivantes | **DONE** → `docs/prompts/` |

## 3. Périmètre produit

### Dans le socle
- AI Office 3D (Solarpunk / Cyberpunk)
- Auth JWT + refresh, MFA, SSO optionnel
- Modules métier REAL : CRM, Sales, Support, Accounting, Marketing, Legal, HCM, WMS
- Runtime agents (graphes, outils, interruptions humaines)
- Mémoire multi-niveaux + RAG
- Gouvernance (RBAC/permissions, audit, guardrails, sandbox, eval)
- Studio visuel + marketplace privé/public
- Pricing modulaire + onboarding/help/training

### Hors scope immédiat (SHELL documentés)
- CMS, SCM, MRP, ETL, EDI (placeholders UI — ADR 004 ; PIM passé en REAL en Phase 4)

## 4. Principes (points forts marché / points faibles à éviter)

**Appliquer :** graphes d’état type LangGraph, multi-modèles, mémoire gouvernée, RBAC/ABAC, audit, guardrails, UX progressive, marketplace installable.

**Éviter :** fragmentation outils, UX enterprise illisible, pricing opaque, absence de vision « OS ».

## 5. Stack figée

| Couche | Choix |
|--------|--------|
| Frontend | Angular 21, Three.js, Vitest, Playwright |
| Backend | Spring Boot 4.1, Java 21, JPA, Flyway, JWT |
| Data | PostgreSQL 17 (+ embeddings JSON / vector path) |
| Infra | Docker Compose, Nginx, MinIO/S3, Prometheus |

## 6. Critères de sortie Phase 0

- [x] Docs cadrage + architecture nommés
- [x] Carte REAL / MOCK / SHELL à jour
- [x] Prompts Cursor pour Phases 1–6
- [x] CI verte sur lint/test/build

## 7. Enchaînement

Phase 0 → Phase 1 (core + AI Office) → Phase 2 (runtime/mémoire) → Phase 3 (gouvernance) → Phase 4 (modules) → Phase 5 (studio/marketplace) → Phase 6 (GTM).
