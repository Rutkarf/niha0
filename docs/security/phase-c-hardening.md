# Phase C — Durcissement (sécurité & contrat)

## Livré dans le code

| Item | Implémentation |
|------|----------------|
| Quotas sièges | `EntitlementService.assertInviteSlotAvailable` / `assertSeatAvailable` |
| Quotas stockage | `assertStorageAvailable` avant upload logo/document |
| Quotas IA | `assertAiActionAvailable` dans `AgentService.requestRecommendation` |
| RLS Postgres | Flyway `V15__row_level_security.sql` + `TenantRlsSupport` |
| Rate-limit Redis | `AuthRateLimitFilter` utilise `StringRedisTemplate` si `REALTIME_MODE=redis` |
| GDPR erase blobs | `PrivacyService.eraseMe` delete object storage + metadata |
| DTOs CRM customers | `CustomerRequest` / `CustomerResponse` (plus de JPA en body) |
| CSRF prod | `CSRF_ENABLED=true` par défaut sous profil `prod` (Bearer ignoré) |

## Checklist pentest OWASP (manuel)

- [ ] Auth: brute-force login (429), MFA bypass attempts
- [ ] IDOR: accès customer/invoice d’un autre tenant
- [ ] Upload: MIME spoof, path traversal, oversized
- [ ] XSS: tokens pas en localStorage access (refresh cookie)
- [ ] CSRF: mutations cookie-only refusées sans X-XSRF-TOKEN
- [ ] Secrets: aucun JWT/DB/SumUp dans images ou logs
- [ ] Admin: OWNER-only billing / privacy export-org

## DPA

Voir `docs/security/dpa-template.md` — à faire signer par un juriste avant go-live commercial.
