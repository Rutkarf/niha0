# Checklist produit commercialisable — NIHAO

> Objectif : pilote payant B2B (SumUp) avec sessions durcies, MFA, e-mails, webhooks.  
> Version cible : **0.3.0**

## P0 — Go / No-go commercial

| # | Critère | OK |
|---|---------|----|
| 1 | CI lint/tests/builds verts | ☐ |
| 2 | Flyway V11 appliqué (billing_checkouts, webhook_deliveries) | ☐ |
| 3 | SumUp Hosted Checkout PRO/BUSINESS (ou stub local documenté) | ☐ |
| 4 | Webhook SumUp vérifié (signature) + plan mis à jour | ☐ |
| 5 | Access token en mémoire ; refresh httpOnly cookie | ☐ |
| 6 | MFA TOTP réel (Authenticator) + recovery codes | ☐ |
| 7 | Invite / reset MDP envoient un lien (SMTP ou log mode) | ☐ |
| 8 | Webhooks sortants livrés (worker scheduled) | ☐ |
| 9 | `DEMO_LOGIN_ENABLED=false` en prod | ☐ |
| 10 | Secrets SumUp / JWT / SMTP hors git | ☐ |
| 11 | Privacy/terms/cookies + GDPR export/erase | ☐ |
| 12 | Compte pilote **sans** Demo2026! | ☐ |

## Config prod minimale

```bash
SPRING_PROFILES_ACTIVE=prod
BILLING_PROVIDER=sumup
SUMUP_API_KEY=...
SUMUP_MERCHANT_CODE=...
SUMUP_WEBHOOK_SECRET=...
SUMUP_REDIRECT_URL=https://app.example.com/app/settings?billing=success
MAIL_MODE=smtp
APP_PUBLIC_URL=https://app.example.com
DEMO_LOGIN_ENABLED=false
AI_OPENAI_ALLOW_DEMO_FALLBACK=false
STORAGE_MODE=s3   # or minio
JWT_SECRET=<48+ chars>
```

Docs : [SumUp billing](../ops/sumup-billing.md) · [ADR 006 cookies](../adr/006-session-cookies.md)

## Verdict

- [ ] **Prêt pilote commercial**
- Date / validateur : __________
