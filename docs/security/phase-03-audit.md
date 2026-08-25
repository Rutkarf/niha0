# NIHAO — Audit sécurité initial (Phase 3)

> Date : 2026-08-25. Complète la cartographie [`architecture/map.md`](../architecture/map.md).

## Objectif

Identifier les risques critiques avant d’ajouter des fonctionnalités ; aucun secret par défaut en production.

## Déjà en place

| Contrôle | Statut |
|----------|--------|
| JWT sans défaut sous profil `prod` + `ProdSecurityValidator` | OK |
| CORS allow-list ; `*` interdit en prod | OK |
| BCrypt | OK |
| Rate-limit login/register (30/min, in-memory) | OK |
| SSE via ticket (pas de JWT en query) | OK |
| SpringDoc désactivé en prod | OK |
| Uploads taille/MIME + clés `{orgId}/…` + isolation tenant | OK |
| `.env` gitignored | OK |

## Risques et plan

| Sévérité | Risque | Action Phase 3 | Différé |
|----------|--------|----------------|---------|
| CRITICAL | Comptes démo Flyway (`Demo2026!`) présents en toute base | `niha0.security.demo-login-enabled=false` en prod ; login FE sans préremplissage prod | Rotation comptes seed en ops |
| HIGH | `docker-compose.yml` « Production » avec JWT faible + profil `docker` | Profil `prod` ; `JWT_SECRET` / `POSTGRES_PASSWORD` obligatoires | — |
| HIGH | Tokens en `localStorage` (XSS) | Documenté + headers nginx de base | Cookies httpOnly (Phase 24) |
| MEDIUM | Pas de headers XSS/frame | Headers nginx | CSP stricte Phase 24 |
| MEDIUM | SVG logo XSS potentiel | SVG retiré des MIME logo | Magic-bytes Phase 24 |
| MEDIUM | `/auth/**` permitAll trop large | Seuls login/register/refresh publics | — |
| MEDIUM | Swagger `permitAll` même si désactivé | Matchers Swagger uniquement hors prod | — |
| MEDIUM | Rate-limit non distribué | Accepté MVP | Redis Phase 24 |

## Critères Phase 3

- [x] Liste des risques critiques
- [x] Plan de correction priorisé
- [x] Aucun secret JWT / DB par défaut sur la stack compose « production »
- [x] Login démo désactivable / masqué en prod
