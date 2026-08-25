# Prompts Cursor — Phases NIHAO

Utiliser avec le plan `NIHAO_05_PLAN_ACTION_COMPLET.md` et l’architecture `NIHAO_03_ARCHITECTURE.md`.

## Phase 1 — Core & AI Office
Implémente / vérifie le socle Angular + Spring Boot + Docker/Nginx. AI Office Three.js (bureaux, thèmes Solarpunk/Cyberpunk), auth JWT, modules de base. Ne casse pas les tests existants. Critère : `make check` vert.

## Phase 2 — Runtime & mémoire
Ajoute un runtime agentique (graphes d’état, outils, HITL), couche mémoire (session / persistante / équipe / entreprise), chat assistant, abstraction multi-modèles. Réutilise `agents/` et `rag/`. Tests Maven pour runtime + mémoire.

## Phase 3 — Gouvernance
RBAC via table permissions, guardrails LLM/PII, sandbox outils, évaluation (coût/latence/précision/escalades), UI admin/gouvernance. Aligné `enterprise-checklist.md`.

## Phase 4 — Modules métier
Passe PIM de SHELL à REAL (CRUD produits/variantes). Approfondis BI (rapport + export). Agents spécialisés branchés sur outils modules. Respecte ADR 004 pour les autres shells.

## Phase 5 — Studio & marketplace
Studio visuel (nodes/templates → définition JSON). Marketplace privé (org) puis public. APIs publish / version / install. UI catalogue + install.

## Phase 6 — GTM
Grille pricing modulaire (packs), pages use-cases, doc onboarding/training support. Mettre à jour `commercial-checklist.md` et help.
