# Phase E — Go-live pilote

## Livré dans le code

| Item | Détail |
|------|--------|
| Landing | `/` marketing + liens privacy/terms |
| Pricing | `/pricing` FREE / PRO / BUSINESS + CTA register |
| Console plateforme | `/app/platform` + `GET /platform/organizations` (rôle `PLATFORM_ADMIN` strict) |
| Nav | entrée « Console plateforme » visible uniquement pour `PLATFORM_ADMIN` |
| Suspend org | `POST /platform/organizations/{id}/suspend` — login **et** refresh bloqués si `onboardingStatus=SUSPENDED` |
| Audit | actions `ORG_SUSPEND` / `ORG_UNSUSPEND` |
| Runbook | ce document + `docs/ops/phase-b-staging.md` |

## Créer un PLATFORM_ADMIN

```sql
-- Après création d'un user de confiance :
UPDATE memberships SET role = 'PLATFORM_ADMIN' WHERE user_id = '<uuid>';
```

Puis se reconnecter pour obtenir un JWT avec le nouveau rôle.

## Checklist go / no-go

- [ ] Staging/prod HTTPS + smoke `/api/actuator/health` ([cloudflare-render](./cloudflare-render.md))
- [ ] `DEMO_LOGIN_ENABLED=false`, pas de Demo2026!
- [ ] SumUp sandbox testé (checkout + webhook)
- [ ] SMTP réel (invite + reset reçus)
- [ ] `AI_PROVIDER=openai`, fallback off
- [ ] Backup + restore dry-run (`scripts/backup-render-postgres.sh` ou Render backups)
- [ ] Compte pilote créé via `/register` (pas seed)
- [ ] Landing + pricing publics
- [ ] Pages `API_ORIGIN` → Render ; CORS = domaine public
- [ ] DPA signé (modèle `docs/security/dpa-template.md`)
- [ ] 0 P0 ouverts
- [ ] Hypercare 2 semaines planifié

## SLA suggéré (pilote)

- Disponibilité cible : 99 % mensuel hors maintenance annoncée
- Support : e-mail J+1 ouvré
- Incident P0 : acknowledgement < 4 h

## Tests automatisés

- Backend : `PlatformAdminTest` (OWNER forbidden, suspend bloque login, unsuspend restaure)
- Frontend E2E : `e2e/marketing.spec.ts` (landing + pricing)
- Guard : `role.guard.spec.ts` (OWNER bloqué sur routes `strictRoles`)
