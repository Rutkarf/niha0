# NIHAO — 20 phases vers le produit fini

> Prérequis : MVP 30 phases **terminé** (`docs/mvp/phases-status.md`).  
> Objectif : SaaS B2B payant, multi-tenant, IA fiable, ops production.  
> **0.2.0 (2026-08-25)** : une grande partie des P0 produit est livrée en mode pilote — voir [`tasks-50-status.md`](./tasks-50-status.md).

## État actuel (résumé codebase)

| Zone | MVP | Produit 0.2.0 | Reste |
|------|-----|---------------|-------|
| Auth JWT + refresh + onboarding | OK | Invites + reset MDP + MFA stub | Cookies httpOnly, TOTP réel, SSO |
| AI Office 3D + approvals CEO | OK | Fallback OpenAI honnête | RAG vectoriel, quotas |
| CRM / Sales / Legal / HR / Stock | CRUD OK | + Accounting/Marketing write | Shells ERP |
| IA | mock + OpenAI | `allow-demo-fallback` | Provider prod forcé |
| RAG | Keyword | Keyword | pgvector |
| Realtime | SSE ticket | SSE ticket | Redis (ADR 007) |
| Ops | CI + backup | + CD staging template + alertes | Deploy réel |
| Monétisation | — | Billing plan stub | Stripe |
| Conformité | — | GDPR export/erase + privacy/terms/cookies | DPA juridique |

---

## Les 20 phases produit fini

### PF-01 — Identité complète (invites + reset MDP)
**Objectif** : cycle de vie utilisateur sans partage de mot de passe démo.  
**Périmètre** : `POST /invites`, acceptation, `forgot-password` / `reset-password`, e-mails transactionnels.  
**Critères** : invitation → membre actif ; reset token à usage unique ; pas de Demo2026! requis.  
**Priorité** : P0 · **Complexité** : moyenne

### PF-02 — Sessions sécurisées (cookies httpOnly + CSRF)
**Objectif** : supprimer le vol de tokens via XSS/`localStorage`.  
**Périmètre** : refresh en cookie Secure/HttpOnly ; access token mémoire ou cookie court ; CSRF double-submit.  
**Critères** : plus de JWT/refresh dans `localStorage` ; login/logout E2E verts.  
**Priorité** : P0 · **Complexité** : élevée · **Dépend** : PF-01

### PF-03 — RBAC administrable
**Objectif** : le client gère ses rôles sans SQL.  
**Périmètre** : UI membres (rôle, désactivation, retrait) ; APIs mutation ; alignement `roleGuard` ↔ `@PreAuthorize`.  
**Critères** : OWNER change un MEMBER→MANAGER ; VIEWER bloqué sur routes sensibles.  
**Priorité** : P0 · **Complexité** : moyenne · **Dépend** : PF-01

### PF-04 — MFA (TOTP) optionnelle / obligatoire par org
**Objectif** : confiance entreprise.  
**Périmètre** : enrollment TOTP, challenge login, politique org.  
**Critères** : login MFA OK ; recovery codes ; désactivation OWNER uniquement.  
**Priorité** : P1 · **Complexité** : élevée · **Dépend** : PF-02

### PF-05 — E-mail transactionnel & digests
**Objectif** : notifications hors UI.  
**Périmètre** : SMTP/provider (SES/Resend) ; templates invite/reset/approval ; digest quotidien optionnel.  
**Critères** : e-mail reçu en staging ; secrets hors repo.  
**Priorité** : P0 · **Complexité** : moyenne · **Dépend** : PF-01

### PF-06 — Billing & entitlements
**Objectif** : monétiser (plans Free/Pro/Business).  
**Périmètre** : Stripe Checkout/Customer Portal ; webhooks ; quotas agents/storage/seats ; feature flags.  
**Critères** : upgrade → entitlements à jour ; downgrade respecte quotas.  
**Priorité** : P0 · **Complexité** : élevée · **Dépend** : PF-03

### PF-07 — IA production (plus de mock silencieux)
**Objectif** : recommandations réellement utiles et honnêtes.  
**Périmètre** : `AI_PROVIDER=openai` (ou autre) en prod ; retries/timeouts ; schema JSON strict ; **interdiction** fallback mock sans badge ; métriques coût/latence.  
**Critères** : échec LLM → erreur claire UI ; jamais « faux succès » démo.  
**Priorité** : P0 · **Complexité** : élevée · **Dépend** : PF-06 (quotas)

### PF-08 — RAG vectoriel (pgvector)
**Objectif** : recherche documentaire sémantique.  
**Périmètre** : embeddings à l’upload ; colonne/vector index ; `/rag/search` hybride keyword+vector ; reindex job.  
**Critères** : requête sémantique > keyword seul sur corpus démo ; isolation tenant.  
**Priorité** : P0 · **Complexité** : élevée · **Dépend** : PF-07

### PF-09 — Realtime horizontal (Redis)
**Objectif** : plusieurs instances backend.  
**Périmètre** : pub/sub Redis pour SSE ; tickets/rate-limit distribués ; sticky sessions ou multiplex.  
**Critères** : approve sur instance A → UI connectée à B notifiée.  
**Priorité** : P0 · **Complexité** : élevée

### PF-10 — Vertical métier « Finance » complet
**Objectif** : accounting + quotes/invoices/payments en UI write.  
**Périmètre** : CRUD FE ; PDF facture ; liens CRM ; permissions ACCOUNTANT.  
**Critères** : parcours devis→facture→paiement E2E.  
**Priorité** : P1 · **Complexité** : élevée

### PF-11 — Vertical « Marketing & Support » complet
**Objectif** : sortir du RO / thin.  
**Périmètre** : campagnes/posts write UI ; tickets SLA/assignation ; e-mail sur ticket (PF-05).  
**Critères** : agent SUPPORT + marketing utilisables au quotidien.  
**Priorité** : P1 · **Complexité** : moyenne · **Dépend** : PF-05

### PF-12 — Décision ERP : 1 module shell → réel
**Objectif** : un seul nouveau vertical (ex. WMS avancé ou PIM), pas 6 demi-modules.  
**Périmètre** : choisir CMS **ou** PIM **ou** SCM ; implémenter CRUD+parcours ; retirer « Bientôt » uniquement pour celui-là.  
**Critères** : ADR mis à jour ; nav honnête pour le reste.  
**Priorité** : P2 · **Complexité** : élevée

### PF-13 — DTO / OpenAPI / client typé
**Objectif** : contrat API figé et généré.  
**Périmètre** : DTOs BE sur hot paths ; OpenAPI source de vérité ; génération client FE ou schémas Zod/TS.  
**Critères** : plus d’exposition JPA brute sur endpoints publics ; breaking change détecté en CI.  
**Priorité** : P1 · **Complexité** : moyenne

### PF-14 — GDPR & conformité
**Objectif** : export / effacement / registre.  
**Périmètre** : export ZIP org/user ; soft-delete / anonymisation ; consentements ; DPA doc.  
**Critères** : export + erase testés ; audit log des demandes.  
**Priorité** : P0 · **Complexité** : élevée · **Dépend** : PF-03

### PF-15 — Console plateforme (ops SaaS)
**Objectif** : support interne NIHAO.  
**Périmètre** : liste orgs, suspend, usage storage/IA, impersonation auditée (break-glass).  
**Critères** : rôle `PLATFORM_ADMIN` hors tenant client.  
**Priorité** : P1 · **Complexité** : élevée · **Dépend** : PF-06, PF-14

### PF-16 — Observabilité & SLO
**Objectif** : savoir quand ça casse avant les clients.  
**Périmètre** : Alertmanager ; alertes error-rate/latency/SSE/disk ; runbooks ; tracing (OTel) optionnel.  
**Critères** : alerte staging simulée reçue ; dashboards documentés.  
**Priorité** : P1 · **Complexité** : moyenne

### PF-17 — CD staging + production
**Objectif** : déploiement reproductible.  
**Périmètre** : build images → registry ; deploy staging auto ; prod manuel/approuvé ; migrations Flyway gated ; smoke post-deploy.  
**Critères** : PR → staging vert ; rollback documenté.  
**Priorité** : P0 · **Complexité** : élevée · **Dépend** : PF-16

### PF-18 — Sécurité enterprise (SSO + hardening)
**Objectif** : adoption grand compte.  
**Périmètre** : OIDC (Google/Azure AD) ; CSP stricte partout ; secret rotation ; pen-test checklist.  
**Critères** : login SSO org ; rapport pentest P0 corrigés.  
**Priorité** : P1 · **Complexité** : élevée · **Dépend** : PF-02, PF-04

### PF-19 — Qualité produit (E2E CI + perf + a11y)
**Objectif** : non-régression continue.  
**Périmètre** : Playwright full-stack en CI (compose) ; budgets perf 3D Firefox ; audit a11y ; i18n FR/EN.  
**Critères** : CI bloquante sur E2E critiques ; score a11y minimal.  
**Priorité** : P1 · **Complexité** : moyenne · **Dépend** : PF-17

### PF-20 — Go-live & hypercare
**Objectif** : lancement commercial.  
**Périmètre** : checklist go-live ; seed prod sans comptes démo ; monitoring 2 semaines ; support runbook ; pricing page.  
**Critères** : 1 client pilote en prod ; 0 P0 ouverts ; SLA défini.  
**Priorité** : P0 · **Complexité** : moyenne · **Dépend** : PF-06, PF-07, PF-08, PF-09, PF-14, PF-17

---

## Ordre recommandé

```text
PF-01 → PF-05 → PF-03 → PF-02 → PF-06
                 ↓
              PF-07 → PF-08
PF-09 (parallèle dès multi-instance)
PF-10 / PF-11 (valeur métier)
PF-13, PF-14, PF-16 → PF-17 → PF-15 / PF-18 → PF-19 → PF-20
PF-04, PF-12 (selon marché)
```

## Hors scope immédiat (après go-live)

- Les 5 shells ERP restants
- Mobile native / offline
- Marketplace d’agents
- Multi-région active-active
