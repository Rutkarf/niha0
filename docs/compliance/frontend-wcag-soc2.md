# Frontend — conformité W3C / WCAG & contrôles SOC 2 Type I

Ce document cartographie les contrôles frontend applicables à la conformité **W3C/WCAG 2.1 AA** et aux exigences **SOC 2 Type I** (conception des contrôles au moment de l’audit). Il ne remplace pas un audit tiers.

## W3C / WCAG 2.1

| Critère | Implémentation | Fichiers clés |
|---------|----------------|---------------|
| **1.3.1 Info et relations** | Landmarks (`main`, `banner`, `nav`, `aside`), tables sémantiques ou `role="table"` | `app-shell.component.ts`, `data-table.component.ts`, `_feature-module.scss` |
| **2.1.1 Clavier** | Navigation clavier, raccourci `O`, `Ctrl+K`, `Escape` sur modales | `app-shell`, `global-search`, `confirm-dialog`, `drawer` |
| **2.4.1 Contourner des blocs** | Lien d’évitement « Aller au contenu » | `app.ts` → `#main-content` |
| **2.4.3 Ordre du focus** | Piège de focus dans les dialogues | `shared/a11y/focus-trap.directive.ts` |
| **2.4.7 Focus visible** | `:focus-visible` global | `styles/_layout.scss`, `styles/_components.scss` |
| **3.1.1 Langue** | `<html lang="fr">` + sync `document.documentElement.lang` | `index.html`, `locale.service.ts` |
| **3.3.2 Étiquettes** | Labels explicites / `.sr-only` global | `styles/_components.scss`, formulaires auth |
| **4.1.2 Nom, rôle, valeur** | ARIA sur modales, boutons icône, live regions | Composants `shared/ui/*` |
| **1.4.3 Contraste** | Thèmes Solar/Night + mode contraste élevé | `theme.service.ts`, `_themes.scss` |
| **2.3.3 Animations** | `prefers-reduced-motion` | `_components.scss`, composants critiques |

### Tests automatisés

```bash
cd apps/niha0-frontend
npm run e2e:a11y
```

Utilise **@axe-core/playwright** avec tags WCAG 2.1 A/AA (`e2e/a11y.spec.ts`).

### Utilitaires partagés

- `src/app/shared/a11y/focus-trap.directive.ts` — piège de focus (modales)
- `src/app/shared/a11y/focusable.util.ts` — éléments focusables
- `.sr-only` / `.visually-hidden` — `styles/_components.scss`

---

## SOC 2 Type I — contrôles frontend (CC)

| Domaine SOC 2 | Contrôle | Implémentation Nihao |
|---------------|----------|----------------------|
| **CC6.1** Accès logique | Authentification, RBAC, guards | `auth.service.ts`, `guards/*`, `roleGuard` |
| **CC6.1** Session | Cookies HttpOnly (prod), refresh token | `auth.interceptor.ts`, `environment.ts` |
| **CC6.6** CSRF | Token double-submit `X-XSRF-TOKEN` | `auth.interceptor.ts` |
| **CC6.7** Transmission | `withCredentials`, HTTPS en prod | `credentials.interceptor.ts` |
| **CC7.2** Détection | Journal audit UI | `audit.page.ts` |
| **CC8.1** Changements | Changelog versionné | `changelog.page.ts` |
| **P4.x** Confidentialité | Export / effacement compte | `settings.page.ts` → API privacy |
| **P4.x** Consentement | Bannière cookies | `cookie-consent.component.ts` |
| **CC6.8** MFA | Enrollment TOTP | `settings.page.ts`, API `/auth/mfa/*` |

### Pratiques interdites (vérifiées)

- Pas de `[innerHTML]` ni `DomSanitizer.bypassSecurityTrust*` dans le frontend
- Pas de secrets API dans le bundle client
- Confirmations destructives via `ConfirmDialogService` (pas `window.confirm`)

### Preuves pour audit

1. Rapport axe CI : `npm run e2e:a11y`
2. `npm run lint` — typage strict TypeScript
3. Revue des intercepteurs auth/CSRF
4. Captures Paramètres (MFA, export RGPD, membres)

---

## Maintenance

- Nouvelle modale → `appFocusTrap` + `aria-modal` + `Escape`
- Nouveau champ → `<label>` ou `.sr-only` + `id`/`for`
- Nouvelle page → landmark dans le shell, test axe sur route publique ou mockée
