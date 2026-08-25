# Checklist MVP NIHAO (Phase 30)

> Smoke manuel + automatisé. Cocher après validation sur stack locale (`make dev` + backend + frontend).

## Parcours critiques

| # | Parcours | Auto | Manuel | OK |
|---|----------|------|--------|----|
| 1 | Login démo → `/app/ai-office` | Vitest auth + E2E smoke | Navigateur | ☐ |
| 2 | Onboarding incomplet redirigé | Vitest onboardingGuard | Compte sans COMPLETED | ☐ |
| 3 | Upload document + barre progression | — | Company-data dropzone | ☐ |
| 4 | Validation CEO (approve/reject) | BE ApprovalWorkflowTest | AI Office sonnette | ☐ |
| 5 | CRM create/edit/delete client | BE CrmSalesCrudTest | `/app/crm` | ☐ |
| 6 | Sales leads/opportunities | BE CrmSalesCrudTest | `/app/sales` | ☐ |
| 7 | Tickets create/update | — | `/app/customer-relations` | ☐ |
| 8 | SSE notifications (ticket) | — | Approuver action → UI | ☐ |
| 9 | Dispose scène 3D sans fuite | Vitest scene-manager | Quitter AI Office | ☐ |
| 10 | Modules shell « Bientôt » | — | Sidebar CMS/PIM/… | ☐ |

## Sécurité MVP

| Contrôle | OK |
|----------|----|
| Compose prod sans JWT/DB par défaut | ☐ |
| Profil `prod` + `ProdSecurityValidator` | ☐ |
| Demo login désactivé en prod | ☐ |
| SSE sans JWT en query | ☐ |
| Upload logo magic-bytes + pas SVG | ☐ |

## Build

```bash
make lint && make test && make build
```

| Commande | OK |
|----------|----|
| `npm run lint` | ☐ |
| `npm run test` | ☐ |
| `npm run build` | ☐ |
| `./mvnw test` | ☐ |

## Verdict

- [ ] **MVP complet et cohérent** — prêt pour phase « produit fini »
- Date : __________
- Validateur : __________
