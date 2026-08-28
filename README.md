# NIHAO

> **Network Intelligence Hub Access Open**

Centre de contrôle : **AI Office** (agents IA + CEO).

## Prérequis

- Java 21, Maven Wrapper (`./mvnw`)
- Node.js 22+ / npm
- Docker ou Podman (PostgreSQL 17)
- Ports libres : `5432`, `8080`, `4200`

## Lancement local (recommandé)

```bash
# 1. Base de données
make dev
# équivalent : docker compose -f docker-compose.dev.yml up -d postgres

# 2. Backend (Flyway V1–V17 au démarrage)
cd apps/niha0-backend && ./mvnw spring-boot:run
# ou : make backend-run

# 3. Frontend
cd apps/niha0-frontend && npm start
# ou : make frontend-run
```

- App : http://localhost:4200 → login → **/app/ai-office**
- Modules NIHAO_05 : `/app/chat`, `/app/runtime`, `/app/studio`, `/app/marketplace`, `/app/governance`, `/app/pim`, `/app/bi`
- API : http://localhost:8080/api
- Health : http://localhost:8080/api/actuator/health
- Raccourci clavier : **O** (AI Office)
- FAB ◈ en bas à droite

Profil Spring par défaut : `local` (secret JWT de développement uniquement).

## Vérifications rapides

```bash
make lint    # tsc --noEmit
make test    # Vitest + Maven tests
make build   # builds frontend + backend
make check   # lint + test + build
```

## Démo

| | |
|---|---|
| Org | Optimus Test |
| Owner | Rutkarf Bzz |
| Email | `rutkarf@optimustest.fr` |
| Mot de passe | `Demo2026!` |

Ne pas modifier ces identifiants sans nécessité explicite.

## Thèmes

Interrupteur dans **AI Office** (☀ SolarPunk / 🌙 Cyberpunk / ◐ Auto).

- Auto : SolarPunk 08:00–19:59, Cyberpunk 20:00–07:59 (bascule sans rechargement)
- Préférence persistée (localStorage + `PUT /api/theme-preferences`)

## Docs

- [**Plan d’action NIHAO_05**](docs/NIHAO_05_PLAN_ACTION_COMPLET.md) · [statut](docs/NIHAO_05_STATUS.md) · [cadrage Phase 0](docs/NIHAO_03_PHASE0_CADRAGE.md)
- [**Cartographie architecture**](docs/architecture/map.md) — REAL / MOCK / SHELL
- [**NIHAO_05 statut phases**](docs/NIHAO_05_STATUS.md) — runtime, gouvernance, studio, GTM
- [**GTM onboarding**](docs/gtm/onboarding-training.md) · [cas d’usage](docs/gtm/use-cases.md)
- [**Statut 50 tâches**](docs/product/tasks-50-status.md)
- [**Checklist produit fini**](docs/product/finished-checklist.md)
- [**Statut 30 phases MVP**](docs/mvp/phases-status.md)
- [Checklist MVP](docs/product/mvp-checklist.md)
- [Audit sécurité Phase 3](docs/security/phase-03-audit.md)
- [Three.js](docs/architecture/threejs-ai-office.md)
- [Données démo](docs/product/demo-data.md)
- [**Ops / backup**](docs/ops/) · [**Cloudflare + Render**](docs/ops/cloudflare-render.md) · [choix d’hôte](docs/ops/host-choice.md)
- [Audit complet (Tâche 1)](docs/audit/project-audit.md) — REAL / MOCK / SHELL, risques, zones critiques
- [**Checklist commerciale 0.3**](docs/product/commercial-checklist.md) — SumUp, MFA, cookies, e-mails
- [SumUp billing](docs/ops/sumup-billing.md)
- [Phase B staging](docs/ops/phase-b-staging.md) · [Phase C hardening](docs/security/phase-c-hardening.md) · [Phase D quality](docs/product/phase-d-quality.md) · [Phase E go-live](docs/ops/phase-e-golive.md)
- [CHANGELOG](CHANGELOG.md) · version [`VERSION`](VERSION)
