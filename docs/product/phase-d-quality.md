# Phase D — Qualité vendable

## Livré

| Item | Détail |
|------|--------|
| E2E CI | Job `e2e-smoke` Playwright (login + marketing) |
| Devis → facture → paiement | `POST /accounting/quotes/{id}/convert-to-invoice` + paiement met à jour statut |
| PDF facture | `GET /accounting/invoices/{id}/pdf` (OpenPDF) |
| i18n | Clés élargies FR/EN (`LocaleService`) |
| Alertmanager | `infra/prometheus/alertmanager.yml` template |
| OpenAPI | SpringDoc hors prod — contrat : `/v3/api-docs` en local/docker |

## OpenAPI / client typé

```bash
# Local (profil non-prod)
curl -s http://localhost:8080/api/v3/api-docs -o docs/api/openapi.json
# Génération client (optionnelle) :
# npx openapi-typescript docs/api/openapi.json -o apps/niha0-frontend/src/app/core/api/openapi.d.ts
```

## a11y / perf 3D

Checklist manuelle : skip-link, focus-visible, `prefers-reduced-motion`, budget Firefox AI Office (pas de freeze après dispose). Voir `docs/audit/ai-office-3d-uiux-checklist.md`.
