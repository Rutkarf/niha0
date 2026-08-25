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

# 2. Backend (Flyway V1–V10 au démarrage)
cd apps/niha0-backend && ./mvnw spring-boot:run
# ou : make backend-run

# 3. Frontend
cd apps/niha0-frontend && npm start
# ou : make frontend-run
```

- App : http://localhost:4200 → login → **/app/ai-office**
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
| Org | OptimusTest |
| Owner | Rutkarf Bzz |
| Email | `rutkarf@optimustest.fr` |
| Mot de passe | `Demo2026!` |

Ne pas modifier ces identifiants sans nécessité explicite.

## Thèmes

Interrupteur dans **AI Office** (☀ SolarPunk / 🌙 Cyberpunk / ◐ Auto).

- Auto : SolarPunk 08:00–19:59, Cyberpunk 20:00–07:59 (bascule sans rechargement)
- Préférence persistée (localStorage + `PUT /api/theme-preferences`)

## Docs

- [**Cartographie architecture (Phase 2)**](docs/architecture/map.md) — REAL / MOCK / SHELL
- [**Statut 50 tâches**](docs/product/tasks-50-status.md)
- [**Checklist produit fini**](docs/product/finished-checklist.md)
- [**Statut 30 phases MVP**](docs/mvp/phases-status.md)
- [Checklist MVP](docs/product/mvp-checklist.md)
- [Audit sécurité Phase 3](docs/security/phase-03-audit.md)
- [Three.js](docs/architecture/threejs-ai-office.md)
- [Données démo](docs/product/demo-data.md)
- [Ops / backup](docs/ops/)
- [Audit complet (Tâche 1)](docs/audit/project-audit.md) — REAL / MOCK / SHELL, risques, zones critiques
- [**Checklist commerciale 0.3**](docs/product/commercial-checklist.md) — SumUp, MFA, cookies, e-mails
- [SumUp billing](docs/ops/sumup-billing.md)
- [CHANGELOG](CHANGELOG.md) · version [`VERSION`](VERSION)
