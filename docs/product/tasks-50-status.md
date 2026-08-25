# Statut des 50 tâches MVP → produit fini

> Mis à jour : 2026-08-25.  
> Légende : **DONE** livré et vérifié · **DONE\*** déjà dans le MVP, re-vérifié · **PARTIAL** livré avec limites documentées · **IN_PROGRESS** en cours d’implémentation.

| # | Tâche | Statut | Notes |
|--:|-------|--------|-------|
| 1 | Audit codebase | **DONE** | `docs/audit/project-audit.md` |
| 2 | Stabilisation build / démarrage | **DONE** | lint, Vitest 12, Maven 16, FE+BE build OK ; Postgres up |
| 3 | Refresh token / sessions | **DONE\*** | Interceptor single-flight ; cookies httpOnly = PARTIAL (ADR) |
| 4 | Guards, rôles, onboarding | **DONE\*** | + invites / members mutation produit |
| 5 | Contrat API / DTO | **DONE\*** | ADR 005 ; extensions privacy/billing |
| 6 | Tests frontend | **DONE\*** | Vitest smoke |
| 7 | Tests backend | **DONE\*** | + ProductFinishTest |
| 8 | Object storage | **DONE\*** | |
| 9 | Upload FE documents | **DONE\*** | |
| 10 | États d’approbation | **DONE\*** | |
| 11 | MockAgent transparent | **DONE\*** | + fallback OpenAI honnête |
| 12 | OrbitControls / cadrage | **DONE\*** | |
| 13 | Lifecycle 3D | **DONE\*** | |
| 14 | Porte CEO / collisions | **DONE\*** | |
| 15 | Branding / thèmes | **DONE\*** | + contraste a11y |
| 16 | Modules ERP décision | **DONE\*** | ADR 004 |
| 17 | CRM / ventes / tickets MVP | **DONE\*** | + accounting/marketing write |
| 18 | Notifications SSE | **DONE\*** | Redis multi-instance = PARTIAL doc |
| 19 | Accessibilité / responsive | **DONE\*** | cookie consent + contrast |
| 20 | Logs / monitoring | **DONE\*** | + alertes Prometheus |
| 21 | Docker / environnements | **DONE\*** | |
| 22 | CI/CD | **DONE\*** | + `cd-staging.yml` template |
| 23 | Sécurité renforcée | **DONE\*** | rate-limit élargi ; MFA stub |
| 24 | Documentation | **DONE\*** | CHANGELOG, VERSION, audit |
| 25 | Dette technique | **DONE\*** | |
| 26 | E2E critiques | **DONE\*** | Playwright smoke |
| 27 | Backups | **DONE\*** | |
| 28 | Préparation RAG / IA | **PARTIAL** | keyword OK ; embeddings = post-0.2 |
| 29 | Checklist MVP | **DONE** | `docs/product/mvp-checklist.md` |
| 30 | Perf frontend | **DONE\*** | lazy routes ; bundle AI Office isolé |
| 31 | Perf backend | **PARTIAL** | indexes Flyway existants ; profiler ops |
| 32 | Erreurs utilisateur | **DONE\*** | `mapHttpError` + messages pages |
| 33 | Onboarding amélioré | **DONE\*** | + help/FAQ |
| 34 | Analytics | **PARTIAL** | `analytics.service` events (no SaaS vendor lock) |
| 35 | Support / help | **DONE** | `/app/help` + feedback |
| 36 | Rôles / permissions avancés | **DONE** | members PATCH/DELETE + invites |
| 37 | Audit logs | **DONE\*** | + privacy_requests |
| 38 | Environnements | **DONE\*** | local/docker/prod |
| 39 | Déploiement automatisé | **PARTIAL** | CD staging template (manual gate) |
| 40 | Monitoring / alertes | **DONE** | `infra/prometheus/alerts.yml` |
| 41 | Versions / changelog | **DONE** | `VERSION` `CHANGELOG.md` |
| 42 | Tests de charge | **DONE** | `scripts/load-smoke.sh` |
| 43 | Sécurité avancée | **PARTIAL** | rate-limit + MFA stub ; IDS = ops |
| 44 | Conformité légale | **DONE** | privacy/terms/export/erase/cookies |
| 45 | Internationalisation | **PARTIAL** | locale fr/en service (pas full extract) |
| 46 | Thèmes avancés | **PARTIAL** | Solar/Night/Auto + high-contrast |
| 47 | Intégrations tierces | **PARTIAL** | webhooks CRUD ; delivery deferred |
| 48 | IA avancée | **PARTIAL** | OpenAI provider + fallback flag ; RAG vectoriel later |
| 49 | Feedback utilisateur | **DONE** | `/feedback` API + page |
| 50 | Checklist produit fini | **DONE** | `docs/product/finished-checklist.md` |

## Limites assumées 0.2.0 (pas bloquantes doc)

1. Tokens encore en `localStorage` (migration cookies httpOnly planifiée — risque XSS documenté).
2. MFA = stub confirmation 6 chiffres (pas TOTP RFC réel).
3. Billing = plans locaux sans Stripe Checkout.
4. Webhooks = stockage config sans worker de livraison.
5. SSE toujours in-memory (Redis pub/sub non branché).
6. RAG = keyword, pas pgvector.
7. CD staging = template à câbler sur un registry/host réel.
