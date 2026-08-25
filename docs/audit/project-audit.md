# Audit complet NIHAO — Tâche 1

> **Date :** 2026-08-25  
> **Statut :** source de vérité audit (remplace le snapshot historique « Nova Atelier / SSE cassé »).  
> **Compléments :** [`architecture/map.md`](../architecture/map.md), [`mvp/phases-status.md`](../mvp/phases-status.md), [`product/finished-product-phases.md`](../product/finished-product-phases.md).

---

## 1. Résumé exécutif

| Indicateur | Valeur |
|------------|--------|
| Maturité globale | **MVP fonctionnel avancé** (30 phases MVP marquées DONE) — **pas encore produit commercialisable** |
| Frontend | Angular 21.2 standalone, signals, Vitest, Playwright, Three.js 0.185 |
| Backend | Spring Boot 4.1.1, Java 21, JPA, Security JWT, Flyway V1–V9 |
| Base | PostgreSQL 17 |
| Volume code | ~145 classes Java main, 8 tests BE ; ~95 fichiers TS app, 7 specs FE |
| Lancement local | `make dev` → Postgres ; `./mvnw spring-boot:run` ; `npm start` → `:4200` / `:8080/api` |

**Verdict :** le cœur (auth, multi-tenant, AI Office 3D, approvals CEO, CRM/Sales/Support/Legal/HR/Stock, storage, CI) est réel. L’IA reste **mock par défaut**, plusieurs modules ERP sont **shells**, accounting/marketing sont **API réelle / UI partielle**, et manquent billing, MFA/SSO, GDPR, cookies httpOnly, RAG vectoriel, SSE multi-instance.

---

## 2. Cartographie monorepo

```text
nIhAo/
├── apps/niha0-frontend/     Angular 21 + Three.js (AI Office)
├── apps/niha0-backend/      Spring Boot 4.1 / Java 21
├── infra/                   Nginx, Prometheus overlay, compose ops
├── docs/                    ADR, architecture, audit, mvp, ops, product, security
├── scripts/                 backup-postgres.sh
├── DocumentThinker/         Pitch / screenshots (hors runtime produit)
├── docker-compose.dev.yml   Postgres (+ MinIO optionnel)
├── docker-compose.yml       Stack prod-like
├── Makefile                 dev / build / test / lint / check
└── .github/workflows/ci.yml Lint + tests + builds + compose config
```

### Stack vérifiée

| Couche | Versions / chemins |
|--------|-------------------|
| FE | `apps/niha0-frontend` — Angular `^21.2`, Three `^0.185.1`, TS `~5.9`, Vitest `^4.1`, Playwright `^1.51` |
| BE | `apps/niha0-backend` — Boot `4.1.1`, JJWT `0.12.6`, SpringDoc `2.8.6`, AWS S3 SDK `2.30.36` |
| DB | Flyway `V1`…`V9` (+ miroir `src/test/resources/db/test-migration/`) |
| API | `http://localhost:8080/api` (context-path `/api`) |

---

## 3. Frontend — domaines

### Structure

```text
src/app/
├── core/     api, auth, guards, interceptors, layout, realtime, theme, workspace, approval, tenancy
├── features/ pages lazy (ai-office, crm, sales, …)
└── shared/ui/ kpi-card, data-table, empty-state, agent-hub-card, …
```

### Guards

| Guard | Comportement |
|-------|----------------|
| `guestGuard` | Login/register si non authentifié |
| `authGuard` | Session JWT / `loadMe` → sinon `/login` |
| `onboardingGuard` | Exige `onboardingStatus === COMPLETED` (sauf onboarding) |
| `roleGuard` | Rôles route (`OWNER` passe toujours) |

### Routes (maturité)

| Path | Maturité | Notes |
|------|----------|-------|
| `/login`, `/register` | **REAL** | |
| `/app/onboarding`, `/workspace`, `/company-data`, `/settings` | **REAL** | |
| `/app/ai-office` | **REAL** + IA **MOCK** défaut | Scène 3D, porte CEO, approvals |
| `/app/ai-center` | **REAL** + badge démo si mock | |
| `/app/crm`, `/sales`, `/customer-relations`, `/legal`, `/hcm`, `/wms` | **REAL** CRUD | Support = tickets write UI |
| `/app/accounting` | **REAL (RO)** UI | API create existe BE |
| `/app/dashboard`, `/administration`, `/notifications` | **REAL** thin / RO | |
| `/app/marketing`, `/bi`, `/bpm`, `/audit` | **THIN** + nav `soon` | Routes encore atteignables par URL |
| `/app/cms`, `/pim`, `/scm`, `/mrp`, `/etl`, `/edi` | **SHELL** | Pages « Bientôt » |
| `module-placeholder/` | Orphelin | Non routé |

### Navigation sidebar

- **Active :** AI Office, Dashboard, CRM, Ventes, Support, Comptabilité, RH, Juridique, Stock, AI Center, Workspace, Données, Notifications, Paramètres.
- **Bientôt (clic bloqué) :** Marketing, ERP (admin), Analytics/BI, Stratégie, Audit.
- **Bibliothèques 3D :** items Données → focus AI Office (`library` query), tag « Bientôt ».

### AI Office / Three.js

| Module | Rôle |
|--------|------|
| `scene-manager.ts` | OrbitControls, picking, walks, bulles, porte, `dispose()` |
| `office-builder.ts` | Salle, lumières, branding |
| `pathfinding.ts` | A* + obstacles porte |
| `camera-framing.ts` | `Box3` room-fit |
| Factories | desks, avatars, CEO door, library, comic dialogue |

**Critiques 3D :** dispose (géo/mat/textures/listeners/RAF/controls), collisions porte, `prefers-reduced-motion`, Firefox.

### Auth HTTP

- `authInterceptor` : Bearer + refresh single-flight sur 401 ; logout si refresh échoue.
- Tokens : **localStorage** (dette XSS → cookies httpOnly produit fini).

### Tests FE

- Vitest : auth service/interceptor, onboarding/role guards, onboarding page, scene-manager, pathfinding.
- Playwright : `e2e/critical-paths.spec.ts` (smoke).

---

## 4. Backend — domaines

Root package : `com.sasurd.niha0` — **145** fichiers Java main.

### Controllers / API

| Préfixe | Domaine | Maturité |
|---------|---------|----------|
| `/auth` | login, register, refresh, me | **REAL** |
| `/organizations` | org, logo, members, data-assets | **REAL** |
| `/theme-preferences` | thème | **REAL** |
| `/dashboard` | KPIs | **REAL** |
| `/crm` | customers, contacts, leads, opportunities, tasks | **REAL** |
| `/accounting` | quotes, invoices, payments | **REAL** API |
| `/tickets` | tickets | **REAL** |
| `/marketing` | posts, campaigns | **THIN** |
| `/administration/documents` | documents | **THIN** |
| `/agents`, `/approvals` | agents + workflow CEO | **REAL** |
| `/notifications`, `/audit` | liste / logs | **REAL** |
| `/realtime` | ticket SSE + events | **REAL** (JVM-local) |
| `/storage` | assets + signed-url | **REAL** |
| `/rag` | search keyword, stats | **REAL partiel** |
| `/hr`, `/stock`, `/legal` | employees, stock, contracts | **REAL** |

### Sécurité

- Public : `/auth/login|register|refresh`, `/actuator/health`, OPTIONS ; OpenAPI hors prod.
- JWT + `TenantContext` ; rate-limit login/register in-memory (30/min).
- SSE : `POST /realtime/ticket` puis `?ticket=` (**pas de JWT en query**).
- Profil `prod` : `ProdSecurityValidator` (JWT fort, CORS, storage ≠ local).
- `demo-login-enabled` désactivable en prod.

### IA

| Provider | Activation | Nature |
|----------|------------|--------|
| `MockAgentService` | `AI_PROVIDER=mock` (défaut) | Heuristiques démo — **MOCK** |
| `OpenAiAgentRecommendationProvider` | `AI_PROVIDER=openai` | LLM externe ; **fallback mock** si échec |
| `ApprovedActionExecutor` + bridges | post-approbation | **REAL** mutations domaine |

### Stockage & RAG

- `STORAGE_MODE=local|minio|s3` ; métadonnées `stored_assets` ; clés `{organizationId}/…`.
- RAG : chunks texte + recherche **keyword** (pas pgvector / embeddings).

### Tests BE

`ApprovalWorkflowTest`, `AuthRegisterTest`, `CrmSalesCrudTest`, `HrStockLegalModulesTest`, `OrganizationWorkspaceConfigTest`, `RagIndexingTest`, `StorageUploadTest`, `TenancyIsolationTest`.

---

## 5. Base de données / Flyway

| Version | Contenu |
|---------|---------|
| V1 | Schéma multi-tenant SaaS |
| V2 | Seed initial (rebrandé ensuite) |
| V3 | OptimusTest / Rutkarf Bzz |
| V4 | 11 agents |
| V5 | Workspace pro + `company_data_assets` |
| V6 | `stored_assets` + liens logo |
| V7 | exécution actions agents |
| V8 | `document_chunks` RAG |
| V9 | HR / stock + legal enrichi |

**Tenancy :** filtre applicatif `organizationId` (pas de RLS PostgreSQL).  
**Démo :** `rutkarf@optimustest.fr` / `Demo2026!` — ne pas modifier sans nécessité.

---

## 6. Infra / CI / Ops

| Élément | État |
|---------|------|
| `make dev` | Postgres via `docker-compose.dev.yml` |
| `docker-compose.yml` | Stack prod-like (secrets requis) |
| `infra/` | Nginx + Prometheus overlay |
| CI | lint FE, test FE/BE, builds, `compose config` |
| Backup | `scripts/backup-postgres.sh` + `docs/ops/backup-restore.md` |
| `.env` | gitignored ; templates `.env.example` / `.env.prod.example` |

---

## 7. Matrice REAL / MOCK / SHELL

| Domaine | Backend | Frontend | Nav | Label |
|---------|---------|----------|-----|-------|
| Auth + refresh + onboarding | REAL | REAL | — | OK |
| AI Office 3D + CEO approvals | REAL | REAL | Active | OK |
| Recommandations IA | mock\|openai | Badge démo | Active | **MOCK** défaut |
| CRM / Sales / Tickets | REAL CRUD | REAL CRUD | Active | OK |
| Legal / HR / Stock | REAL CRUD | REAL CRUD | Active | OK |
| Accounting | REAL API | **RO** | Active | Partial |
| Company data + upload + RAG keyword | REAL | REAL | Active | Partial (pas vecteurs) |
| Marketing / Admin / BI / BPM / Audit | thin | thin / RO | souvent `soon` | Partial |
| CMS PIM SCM MRP ETL EDI | — | SHELL | Bientôt | Shell |
| SSE | in-memory | REAL client | — | Single-JVM |
| Object storage | local/minio/s3 | Upload UI | — | OK selon mode |

---

## 8. Dettes techniques & risques

### Critiques (P0 produit)

1. **Tokens en localStorage** — XSS → vol de session (cible : cookies httpOnly + CSRF).
2. **IA mock par défaut + fallback silencieux OpenAI→mock** — risque de tromperie si badge absent.
3. **Comptes démo Flyway** — présents en toute base ; doivent être refusés en prod (`demo-login-enabled=false`).
4. **Tenancy applicative seule** — pas de RLS ; régressions isolation = fuite inter-org.
5. **SSE JVM-local** — pas de scale horizontal sans Redis/pubsub.
6. **Pas de monétisation / entitlements** — non commercialisable tel quel.
7. **Pas de GDPR export/effacement** — blocage B2B UE.

### Élevés (P1)

- Accounting / Marketing write UI incomplets vs API.
- Routes shell encore atteignables par URL directe (nav bloquée seulement).
- Rate-limit non distribué ; pas de MFA / SSO / invites / reset MDP.
- DTO : beaucoup d’entités JPA exposées (stratégie ADR 005 partielle).
- Couverture tests : 7 specs FE / 8 tests BE — parcours critiques partiels ; E2E non bloquant full-stack en CI.
- ADR 004 partiellement obsolète (tickets : UI write réelle ; doc dit encore RO).

### Moyens (P2)

- `DocumentThinker/` hors produit (pitch) — bruit monorepo.
- Checklist MVP (`mvp-checklist.md`) non cochée (validation manuelle ouverte).
- i18n FR only ; pas d’analytics produit ; feedback utilisateur absent.
- Embeddings / pgvector préparés conceptuellement seulement.

### TODO / FIXME dans le code app

- Pas de `TODO`/`FIXME` bloquants dans `apps/*/src` (hors libellés métier `status = "TODO"` sur tâches CRM).
- Shells ERP documentés via « Bientôt » + ADR 004.
- `MockAgentService` documenté comme démo honnête.

---

## 9. Zones critiques (priorité d’attention)

| Zone | Pourquoi |
|------|----------|
| `security/*`, `identity/*`, interceptor FE | Auth, refresh, tenancy |
| `agents/*`, `MockAgentService`, OpenAI provider | Honnêteté IA + exécution post-CEO |
| `features/ai-office/three/*` | Perf, fuites, Firefox, collisions |
| `storage/*`, upload FE company-data | Sécurité fichiers, isolation org |
| `notifications` + `realtime` | SSE ticket, resync |
| Flyway V2–V3 seed | Identité démo / prod |
| Compose prod + `ProdSecurityValidator` | Secrets, CORS, storage |

---

## 10. Écart MVP → produit commercialisable

Les **30 phases MVP** sont marquées DONE (`docs/mvp/phases-status.md`).  
Les **20 phases produit fini** (`docs/product/finished-product-phases.md`) restent à faire : identité (invites/reset), sessions cookies, RBAC admin UI, billing, IA prod, RAG vectoriel, Redis SSE, vertical Finance write, GDPR, CD staging/prod, go-live.

Alignement avec le backlog « 50 tâches » de la mission : la plupart des tâches 2–29 couvrent du travail **déjà largement livré** ; l’audit confirme qu’il faut **vérifier / durcir / compléter** plutôt que tout réécrire, puis enchaîner sur les gaps produit (T30–T50 / PF-*).

---

## 11. Incohérences documentaires détectées

| Doc | Problème | Action audit |
|-----|----------|--------------|
| Ancien `project-audit.md` | Nova Atelier, SSE cassé, pas de CI | **Remplacé** par ce document |
| ADR 004 | Tickets listés RO | Code = CRUD Support — ADR à mettre à jour (tâche doc ultérieure) |
| `mvp-checklist.md` | Cases non cochées | Validation manuelle encore ouverte |
| README | Pointe correctement vers map + audit | OK |

---

## 12. Critères de validation Tâche 1

- [x] Cartographie FE / BE / DB / 3D / infra
- [x] Identification REAL / MOCK / SHELL
- [x] Liste dettes, risques, zones critiques
- [x] Rapport versionné dans `docs/audit/project-audit.md`
- [x] Liens vers map architecture et plan produit fini
