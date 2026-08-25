# Plan d'action complet – Projet NIHAO

## 1. Vue d'ensemble

Ce document synthetise **toutes les applications / modules** à developper pour NIHAO, en appliquant les **points forts du marché** et en evitant les **points faibles**, comme decrit dans `NIHAO_01_SYNTHESE_BENCHMARK.md`.

- **Objectif** : construire un **OS de travail agentique** complet.
- **Approche** : par phases, en priorisant les briques les plus critiques.
- **Livrables** :
  - Code (frontend, backend, infra).
  - Documentation (architecture, guides, prompts Cursor).
  - Tests, CI/CD, deploiement.

---

## 2. Phasage global

### Phase 0 – Cadrage & architecture

- **Objectif** : fondations, vision, architecture, repos, CI/CD.
- **Livrables** :
  - `NIHAO_03_PHASE0_CADRAGE.md`
  - `NIHAO_03_ARCHITECTURE.md`
  - Structure des repos.
  - CI/CD de base.
  - Prompts de phases suivantes.

### Phase 1 – Core platform & AI Office 3D

- **Objectif** : socle technique + experience 3D de base.
- **Livrables** :
  - Frontend Angular (structure, AI Office, modules de base).
  - Backend Spring Boot (structure, auth, APIs de base).
  - Infra (Docker, Nginx, environnements).

### Phase 2 – Runtime agentique & memoire

- **Objectif** : moteur IA de NIHAO.
- **Livrables** :
  - Runtime d'agents (graphes, outils, workflows).
  - Couche memoire (session, persistante, equipe, entreprise).
  - RAG vectoriel.
  - Interfaces chat/assistant, configuration d'agents.

### Phase 3 – Gouvernance, securite, observabilite

- **Objectif** : rendre NIHAO « enterprise-ready ».
- **Livrables** :
  - RBAC/ABAC complet.
  - Audit trail, guardrails, sandbox.
  - Evaluation continue.
  - Interfaces admin/gouvernance, dashboards.

### Phase 4 – Modules metier & agents specialises

- **Objectif** : rendre NIHAO concret pour les entreprises.
- **Livrables** :
  - Modules (CRM, ERP, HCM, BI, etc.).
  - Agents specialises (sales, accounting, stock, support, legal, etc.).
  - Interfaces dediees par module.

### Phase 5 – Studio visuel & marketplace

- **Objectif** : permettre à des non-dev de creer et distribuer des agents.
- **Livrables** :
  - Studio visuel (drag-and-drop, templates).
  - Marketplace prive (par client).
  - Marketplace public (partenaires, community).
  - APIs pour publier, versionner, installer.

### Phase 6 – Distribution, pricing, go-to-market

- **Objectif** : preparer la commercialisation.
- **Livrables** :
  - Grille de pricing modulaire.
  - Go-to-market (wedge, cas clients, doc, communication).
  - Support, onboarding, formation.

---

## 3. Applications / modules à developper

### 3.1 Frontend (Angular)

- **Core** :
  - Routing, guards, interceptors.
  - Services d'auth, d'API, d'etat.
  - Composants partag es (UI, formulaires, tableaux, graphiques).
- **AI Office 3D** :
  - Scene Three.js, camera, lumieres.
  - Bureaux (CEO + 11 IA).
  - Agents avec animations.
  - Themes Solarpunk/Cyberpunk.
- **Modules** :
  - Dashboard (KPIs, activite, etat des agents).
  - Modules (liste, fiches, installation).
  - Analytics (graphiques, dashboards).
  - CRM, ERP, HCM, BI, etc. (interfaces dediees).
- **IA** :
  - Chat/assistant (interface utilisateur).
  - Configuration d'agents (nom, role, outils, memoire).
  - Studio visuel (drag-and-drop, templates).
- **Gouvernance** :
  - Gestion roles, permissions.
  - Logs, audit, recherche.
  - Configuration guardrails, policies.

### 3.2 Backend (Spring Boot)

- **Core** :
  - Config (securite, CORS, Swagger).
  - Auth (JWT, SSO optionnel).
  - RBAC/ABAC.
  - Audit trail.
- **Modules metier** :
  - CRM, ERP, HCM, BI, etc. (APIs, modeles, workflows).
- **Agents** :
  - Runtime (graphes, outils, workflows).
  - Memoire (session, persistante, equipe, entreprise).
  - RAG vectoriel.
  - Abstraction multi-modeles.
- **Gouvernance** :
  - Guardrails, sandbox, policies.
  - Evaluation (precision, cout, temps, escalades).
- **Marketplace** :
  - APIs pour publier, versionner, installer agents/modules.
  - Gestion licences, quotas, facturation.

### 3.3 Infra

- **Docker** :
  - Dockerfile frontend/backend.
  - docker-compose.yml (frontend, backend, DB, Nginx).
- **Nginx** :
  - Config reverse proxy, SSL.
- **Environnements** :
  - dev, staging, prod.
  - Variables, secrets, `.env.example`.
- **CI/CD** :
  - Build, test, deploy.
  - Workflows GitHub Actions / GitLab CI.
- **Monitoring** :
  - Logs, metrics, alertes.
  - Dashboards ops.

---

## 4. Points forts à appliquer (par brique)

### 4.1 Runtime agentique

- Inspiré·« LangGraph :
  - Graphes d'etat, outils, interruptions humaines.
  - Multi-agent, asynchrone.
- Abstraction multi-modeles :
  - OpenAI, Anthropic, Google, open source, prives.
- Memoire :
  - Session, persistante, equipe, entreprise.
  - Controle d'acces, audit, effacabilite.

### 4.2 Gouvernance

- RBAC/ABAC natif.
- Audit trail complet.
- Guardrails (prompts, PII, policies).
- Sandbox d'outils (limites, quotas).
- Evaluation continue (precision, cout, temps, escalades).

### 4.3 UX / UI

- Mode assistant simple pour utilisateurs finaux.
- Mode studio/advanced pour builders/admins.
- AI Office 3D fluide, leger, coherent.
- Themes Solarpunk/Cyberpunk bien differencies.
- Reveler la complexite progressivement.

### 4.4 Marketplace

- Catalogue d'agents/modules/connecteurs.
- Installation facile, configuration.
- Marketplace prive (par client) puis public.
- Monetaisation (revenue share, bundles, usage-based).

---

## 5. Points faibles à eviter

- **Fragmentation** :
  - Ne pas separer trop fort « dev » vs « business ».
  - Garder une plateforme unifiee, coherent.
- **UX trop complexe** :
  - Pas de suites enterprise illisibles.
  - Reveler la complexite progressivement.
- **Pricing opaque** :
  - Penser une grille modulaire et lisible.
- **Manque de vision OS d'agents** :
  - Toujours garder en tete : NIHAO = OS de travail agentique.

---

## 6. Prochaines etapes

1. Valider ce plan d'action avec l'utilisateur.
2. Commencer par **Phase 0** (cadrage, architecture).
3. Utiliser les prompts Cursor dedies (`docs/prompts/NIHAO_PHASE_PROMPTS.md`).
4. Iterer phase par phase, en ajustant si besoin.

---

## 7. Statut d'application (2026-08-25)

Toutes les phases **0 → 6** sont appliquees dans le monorepo. Suivi detaille : [`NIHAO_05_STATUS.md`](./NIHAO_05_STATUS.md).

| Phase | Statut |
|------:|--------|
| 0 Cadrage | **DONE** — `NIHAO_03_PHASE0_CADRAGE.md`, `NIHAO_03_ARCHITECTURE.md`, `NIHAO_01_SYNTHESE_BENCHMARK.md`, prompts |
| 1 Core + AI Office | **DONE** — deja present, README / map synchronises |
| 2 Runtime & memoire | **DONE** — `/agents/runtime`, `/memory`, `/chat`, providers multi-modeles |
| 3 Gouvernance | **DONE** — permissions, guardrails, sandbox, eval, `/app/governance` |
| 4 Modules | **DONE** — PIM REAL, BI rapport ; shells CMS/SCM/MRP/ETL/EDI conserves (ADR 004) |
| 5 Studio & marketplace | **DONE** — `/studio`, `/marketplace`, UI Studio + Marketplace |
| 6 GTM | **DONE** — pricing packs, `docs/gtm/*`, aide formation |

Migrations Flyway : **V1–V17**. Test d'integration : `Nihao05OsLayersTest`.