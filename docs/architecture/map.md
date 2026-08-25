# NIHAO — Cartographie d’architecture (Phase 2)

> Source de vérité : code au **2026-08-25**.  
> Distingue **REAL** (API + UI opérationnels), **REAL (RO)** (lecture seule UI), **MOCK** (démo IA / heuristiques), **SHELL** (« Bientôt »).

---

## 1. Vue d’ensemble

```text
┌─────────────────┐     HTTP/SSE      ┌──────────────────────┐
│ niha0-frontend  │ ◄──────────────► │ niha0-backend        │
│ Angular 21.2    │   /api           │ Spring Boot 4.1.1    │
│ Three.js 0.185  │                  │ Java 21              │
└────────┬────────┘                  └──────────┬───────────┘
         │                                      │
         │                         ┌────────────┼────────────┐
         │                         ▼            ▼            ▼
         │                   PostgreSQL 17   Object store   (opt) OpenAI
         │                   Flyway V1–V10   local|minio|s3  AI_PROVIDER
         ▼
   Browser :4200  →  API :8080/api
```

| Couche | Chemin | Stack |
|--------|--------|-------|
| Frontend | `apps/niha0-frontend` | Angular 21 standalone, signals, Vitest, Three.js 0.185 |
| Backend | `apps/niha0-backend` | Spring Boot 4.1.1, JPA, Security JWT, Flyway, Actuator |
| Infra | `docker-compose*.yml`, `infra/` | Postgres 17, MinIO, Nginx, Prometheus overlay |
| Docs | `docs/` | ADR, ops, Three.js, audit Tâche 1, checklist produit 0.2 |

---

## 2. Versions & packages clés

### Frontend (`package.json`)
- Angular `^21.2.0`, CLI/build `^21.2.21`
- Three.js `^0.185.1`, `@types/three` `^0.185.4`
- RxJS `~7.8`, TypeScript `~5.9.2`, Vitest `^4.1.11`
- Scripts : `start`, `build`, `test`, `lint` (`tsc --noEmit`), `format`

### Backend (`pom.xml`)
- Spring Boot parent `4.1.1`, Java `21`
- JJWT `0.12.6`, SpringDoc `2.8.6`, AWS SDK S3 `2.30.36`
- Starters : webmvc, security, data-jpa, validation, actuator, Flyway + PostgreSQL
- Tests : H2 + `spring-security-test`

---

## 3. Frontend — structure & routes

```text
src/app/
├── core/     api, auth, guards, interceptors, layout, realtime, theme, workspace, approval
├── features/ pages lazy-loadées (ai-office, crm, sales, …)
└── shared/ui/  kpi-card, data-table, empty-state, …
```

### Guards
| Guard | Rôle |
|-------|------|
| `guestGuard` | Login/register si non authentifié |
| `authGuard` | Session JWT / `loadMe` ; sinon → `/login` |
| `onboardingGuard` | `onboardingStatus === COMPLETED` ; sinon → `/app/onboarding` (sauf workspace) |

### Routes (`app.routes.ts`) — résumé
| Path | Maturité |
|------|----------|
| `/login`, `/register` | **REAL** |
| `/app/onboarding`, `/workspace`, `/company-data`, `/settings` | **REAL** |
| `/app/ai-office` | **REAL** (scène 3D + approvals) ; moteur IA peut être **MOCK** |
| `/app/ai-center` | **REAL** API + libellé démo si mock |
| `/app/crm`, `/sales`, `/legal`, `/hcm`, `/wms` | **REAL** CRUD (HCM partiel) |
| `/app/dashboard`, `/accounting`, `/customer-relations`, `/marketing`, `/administration`, `/notifications`, `/audit`, `/bi`, `/bpm` | **REAL (RO)** ou thin |
| `/app/cms`, `/pim`, `/scm`, `/mrp`, `/etl`, `/edi` | **SHELL** |
| `module-placeholder/` | Orphelin (non routé) |

### Services cœur (signals, pas NgRx)
`AuthService`, `ApiService`, `RealtimeService` (SSE ticket), `ThemeService`, `ProfessionalWorkspaceService`, `CeoApprovalService`, `AgentStatusService`, `TenancyService`, `WorkspaceSelectionService`.

### Intercepteur
`authInterceptor` : Bearer + refresh single-flight sur 401 ; logout si refresh échoue.

### API URL
- Dev : `http://localhost:8080/api` (`environment.development.ts`)
- Prod build : `/api` (reverse-proxy)

---

## 4. AI Office / Three.js

| Fichier | Rôle |
|---------|------|
| `features/ai-office/ai-office.page.ts` | Page Angular ; crée / dispose le scene manager |
| `three/scene-manager.ts` | OrbitControls, picking, walks, bulles, porte CEO, `dispose()` |
| `three/office-builder.ts` | Sol, murs, lumières, plantes, logo |
| `three/pathfinding.ts` | Grille A* + obstacles porte |
| `three/desk.factory.ts`, `avatar*.ts`, `ceo-door.factory.ts` | Bureaux / avatars / porte-sonnette |
| `three/camera-framing.ts` | Cadrage `Box3` / room-fit |
| `three/branding.factory.ts`, `library.factory.ts` | Tapis, logo mural, bibliothèques données |

**Points critiques 3D :** cycle de vie `dispose()` (géométries, matériaux, contrôles, RAF, listeners) ; collisions porte ; `prefers-reduced-motion` ; Firefox (pas de freeze).

---

## 5. Backend — packages & API

Root : `com.sasurd.niha0` — context-path **`/api`**, port **8080**.

### Controllers (préfixe `/api`)
| Préfixe | Domaine |
|---------|---------|
| `/auth` | login, register, refresh, me |
| `/organizations` | org courante, logo, members, data-assets |
| `/theme-preferences` | thème user |
| `/dashboard` | KPIs |
| `/crm` | customers, contacts, leads, opportunities, tasks |
| `/accounting` | quotes, invoices, payments |
| `/tickets` | tickets |
| `/marketing` | posts, campaigns |
| `/administration/documents` | documents |
| `/agents` | agents, bubble, recommend, engine, actions |
| `/approvals` | pending + approve/reject/defer/modify |
| `/notifications` | liste + read |
| `/audit` | logs |
| `/realtime` | ticket SSE + `/events` |
| `/storage` | assets + signed-url |
| `/rag` | search, stats |
| `/hr` | employees, leaves |
| `/stock` | items, adjust, movements |
| `/legal/contracts` | contracts |
| `/privacy` | export GDPR, erase-me |
| `/feedback` | feedback utilisateur |
| `/billing` | plan FREE/PRO/BUSINESS (stub) |
| `/webhooks` | CRUD webhooks sortants (pas de delivery) |

### Entités JPA (30)
Multi-tenant via `TenantEntity.organizationId` (sauf `Organization`, `User`, `Membership`, `RefreshToken`, `ThemePreference`).  
Tables métier : agents, CRM, accounting, tickets, marketing, documents, contracts, notifications, audit, company_data_assets, stored_assets, document_chunks, employees, leave_requests, stock_*.

### Sécurité
- Public : `/auth/login|register|refresh|forgot-password|reset-password|accept-invite`, `/actuator/health`, OpenAPI hors prod, `OPTIONS`
- JWT Bearer + `TenantContext` ; rate-limit auth endpoints (30/min, in-memory)
- SSE : **pas de JWT en query** — `POST /realtime/ticket` puis `?ticket=`
- Profil `prod` : `ProdSecurityValidator` (JWT fort, CORS, DB, storage ≠ local)

### IA
- Interface `AgentRecommendationProvider`
- `AI_PROVIDER=mock` → `MockAgentService` (**MOCK**)
- `AI_PROVIDER=openai` → `OpenAiAgentRecommendationProvider` (**REAL** externe, fallback démo)
- Post-approbation : `ApprovedActionExecutor` + bridges domaine (**REAL**)

### Stockage
- `STORAGE_MODE=local|minio|s3` → `LocalObjectStorageService` | `S3CompatibleObjectStorageService`
- Métadonnées `stored_assets` ; clés préfixées `{organizationId}/…`

### RAG
- Indexation texte → `document_chunks` ; recherche **keyword** (pas vecteurs) — **REAL partiel**

---

## 6. Flyway V1–V10

| Version | Contenu |
|---------|---------|
| V1 | Schéma multi-tenant SaaS |
| V2 | Seed Nova Atelier (+ tenant rival) |
| V3 | Rebrand OptimusTest / Rutkarf Bzz |
| V4 | 11 agents |
| V5 | Workspace pro + `company_data_assets` |
| V6 | `stored_assets` + liens logo |
| V7 | `execution_result` / `executed_at` actions |
| V8 | `document_chunks` RAG |
| V9 | HR / stock + enrichissement legal |
| V10 | Reset MDP, invites, feedback, privacy, webhooks, billing_plan, MFA stub, locale |

Miroir tests : `src/test/resources/db/test-migration/`.

---

## 7. Config, env, secrets

| Fichier | Usage |
|---------|--------|
| `.env.example`, `.env.prod.example` | Templates (`.env` gitignored) |
| `application.yml` | Défaut `local`, Postgres, Flyway, JWT/CORS/storage/AI |
| `application-local.yml` | JWT faible **dev only** |
| `application-docker.yml` | Hosts Docker + JWT faible |
| `application-prod.yml` | Vars obligatoires ; springdoc off |
| `application-test.yml` | H2 + migrations test |

**Variables :** `JWT_SECRET`, `CORS_ORIGINS`, `SPRING_DATASOURCE_*`, `STORAGE_*`, `AI_*`, ports Compose.

**Risque :** secrets locaux faibles acceptés uniquement hors `prod` — à auditer en Phase 3.

---

## 8. Matrice maturité MVP

| Domaine | Backend | Frontend | Nav | Statut |
|---------|---------|----------|-----|--------|
| Auth + refresh | REAL | REAL | — | OK |
| Onboarding / workspace / branding | REAL | REAL | Active | OK |
| AI Office 3D + CEO approvals | REAL | REAL | Active | OK |
| Recommandations IA | mock\|openai | REAL + badge démo | Active | **MOCK** par défaut |
| CRM / Sales | REAL CRUD | REAL CRUD | Active | OK |
| Legal / HR / Stock | REAL CRUD | REAL (HCM partiel) | Active | OK |
| Company data + RAG keyword | REAL | REAL | Active | Partiel (pas embeddings) |
| Accounting / Tickets / Marketing | REAL API | **CRUD** UI (tickets/accounting/marketing write) | Mixte | OK 0.2 |
| Dashboard / BI / Notifications / Audit | REAL | RO | BI/Audit `soon` | Partial |
| CMS, PIM, SCM, MRP, ETL, EDI | — / thin | **SHELL** | Bientôt | Shell |
| SSE multi-instance | in-memory | REAL client | — | Single-JVM |
| Object storage prod | S3/MinIO | Upload UI | — | OK si `STORAGE_MODE` |

---

## 9. Points critiques (pour phases suivantes)

1. **Sécurité** — JWT local faible, Swagger public hors prod, rate-limit non distribué (→ Phases 3, 24).
2. **Contrats API** — beaucoup d’entités JPA exposées telles quelles ; DTOs incomplets (→ Phase 6).
3. **IA honnête** — mock par défaut ; UI doit rester transparente (→ Phase 12).
4. **SSE** — ticket OK ; broadcaster JVM-local (→ Phase 19).
5. **ERP shells** — navigation « Bientôt » vs routes encore atteignables (→ Phase 17).
6. **3D** — dispose / pathfinding / porte (→ Phases 13–15).
7. **Tenancy** — application-level only (pas RLS) ; tests `TenancyIsolationTest` (→ Phase 8/24).
8. **Docs audit** — `docs/audit/project-audit.md` **obsolète** (Nova Atelier, SSE cassé, etc.) ; cette carte prime.

---

## 10. Infra & CI

| Élément | Rôle |
|---------|------|
| `make dev` | Postgres via `docker-compose.dev.yml` |
| `docker-compose.yml` | Stack prod-like |
| `infra/docker-compose.yml` + observability | Nginx / Prometheus |
| `.github/workflows/ci.yml` | lint FE, tests FE/BE, builds, `compose config` |

---

## 11. Liens

- [Three.js AI Office](./threejs-ai-office.md)
- [ADR 001 SSE ticket](../adr/001-sse-ticket-auth.md)
- [ADR 002 Object storage](../adr/002-object-storage.md)
- [ADR 003 AI provider](../adr/003-ai-recommendation-provider.md)
- [ADR 004 ERP shells](../adr/004-erp-shells-bientot.md)
- [Demo data](../product/demo-data.md)
- [Backup](../ops/backup-restore.md)
