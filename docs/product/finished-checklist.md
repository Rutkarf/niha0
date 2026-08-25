# Checklist produit fini — NIHAO 0.2.0

> Objectif : SaaS B2B commercialisable en pilote (pas perfection enterprise).  
> Cocher après validation sur staging.

## P0 — Go / No-go

| # | Critère | OK |
|---|---------|----|
| 1 | Build CI vert (lint, tests FE/BE, package) | ☐ |
| 2 | `make dev` + backend + frontend démarrent | ☐ |
| 3 | Login / refresh / logout propres | ☐ |
| 4 | Invite membre → acceptation → rôle visible | ☐ |
| 5 | Reset mot de passe (token log local / e-mail staging) | ☐ |
| 6 | AI Office : scène + dispose sans fuite Firefox | ☐ |
| 7 | Approbation CEO → mutation métier | ☐ |
| 8 | CRM / Sales / Support CRUD | ☐ |
| 9 | Comptabilité : création facture UI | ☐ |
| 10 | Marketing : création campagne UI | ☐ |
| 11 | Upload document + isolation tenant | ☐ |
| 12 | Export GDPR + erase-me testés | ☐ |
| 13 | Mentions privacy/terms + cookie consent | ☐ |
| 14 | Profil `prod` : JWT fort, demo-login off, storage ≠ local | ☐ |
| 15 | Plan billing stub visible (FREE/PRO/BUSINESS) | ☐ |
| 16 | Badge IA : mock ou fallback démo jamais silencieux | ☐ |
| 17 | Backup Postgres documenté + dry-run restore | ☐ |
| 18 | Alertes Prometheus chargées | ☐ |
| 19 | CHANGELOG / VERSION alignés | ☐ |
| 20 | Compte pilote **sans** dépendre de Demo2026! | ☐ |

## P1 — Soft launch

| Critère | OK |
|---------|----|
| MFA TOTP réel (remplace stub) | ☐ |
| Cookies httpOnly + CSRF | ☐ |
| Stripe Checkout + webhooks payment | ☐ |
| E-mail transactionnel (invite/reset) | ☐ |
| Redis SSE multi-instance | ☐ |
| Embeddings / pgvector | ☐ |
| CD staging → smoke auto | ☐ |

## Verdict

- [x] **Code prêt pilote** (v0.6.1+) — ops staging à cocher ci-dessus
- Version : 0.6.1
- Date : 2026-08-25
- Validateur : __________

Guide deploy : [`../ops/cloudflare-render.md`](../ops/cloudflare-render.md).

Voir aussi : [`tasks-50-status.md`](./tasks-50-status.md), [`finished-product-phases.md`](./finished-product-phases.md).
