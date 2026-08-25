# Audit UI/UX frontend NIHAO — hors AI Office 3D

> **Tâche 1** · Date : 2026-08-25 · Périmètre : `apps/niha0-frontend` hors scène Three.js / AI Office 3D  
> Objectif : cartographier l’expérience actuelle, identifier frictions et prioriser les 49 tâches suivantes.

---

## 1. Cartographie des surfaces

### 1.1 Auth & guest (hors shell)

| Route | Fichier | Maturité UI | Notes |
|-------|---------|-------------|-------|
| `/login` | `features/auth/login/login.page.ts` | Bonne | Split brand + carte, OAuth optionnel, erreurs `role="alert"`, demo credentials |
| `/register` | `features/auth/register/register.page.ts` | Moyenne | Même layout que login mais styles dupliqués ; pas de force/indicateur MDP ; « Étape 0 » isolée |
| `/forgot-password` | `features/auth/forgot-password/forgot-password.page.ts` | Moyenne | Layout auth plus simple (pas de brand panel) |
| `/reset-password` | `features/auth/reset-password/reset-password.page.ts` | Moyenne | Aligné forgot |
| `/accept-invite` | `features/auth/accept-invite/accept-invite.page.ts` | Moyenne | Parcours invite |
| `/mfa` | `features/auth/mfa/mfa.page.ts` | Bonne | TOTP + recovery, labels corrects |
| `/auth/sso-callback` | `features/auth/sso-callback/sso-callback.page.ts` | Technique | Page de transit |
| `/privacy`, `/terms` | `features/legal-marketing/*` | Basique | Contenu légal marketing |

### 1.2 App shell

| Élément | Fichier | Maturité UI | Notes |
|---------|---------|-------------|-------|
| Shell | `core/layout/app-shell.component.ts` | Moyenne | Topbar sticky, FAB AI Office, pas de breadcrumbs ni recherche |
| Sidebar | `core/layout/sidebar.component.ts` | Moyenne–faible | Groupes clairs ; collapse n’a pas d’effet largeur ; icônes quasi identiques |
| Cloche validations | `core/layout/approval-notifications.component.ts` | Bonne | Dialog, Escape, ARIA ; toasts absents hors 3D |
| Cookie consent | `shared/ui/cookie-consent/*` | Présent | Banner global |

### 1.3 Onboarding & workspace

| Route | Fichier | Maturité UI | Notes |
|-------|---------|-------------|-------|
| `/app/onboarding` | `features/onboarding/onboarding.page.ts` | Bonne | 4 étapes, résumé, preview couleurs ; mix UI 2D + config 3D |
| `/app/workspace` | `features/workspace/workspace-settings.page.ts` | Bonne | Branding + preview |
| `/app/company-data` | `features/company-data/company-data.page.ts` | Moyenne | Upload + progress ARIA |

### 1.4 Dashboard & modules métier

| Route | Fichier | Données | UI |
|-------|---------|---------|-----|
| `/app/dashboard` | `dashboard.page.ts` | KPIs API | KPI grid + quick-nav ; pas de période/filtre |
| `/app/crm` | `crm.page.ts` | CRUD clients | Formulaire inline + table maison |
| `/app/sales` | `sales.page.ts` | Opp + leads | Deux blocs CRUD ; enums EN bruts |
| `/app/customer-relations` | `customer-relations.page.ts` | Tickets | CRUD partiel (pas de delete UI) |
| `/app/accounting` | `accounting.page.ts` | Factures + paiements | Utilise `app-data-table` ; callout conformité |
| `/app/marketing` | `marketing.page.ts` | Variable | Pattern module |
| `/app/hcm`, `/wms`, `/legal` | pages dédiées | CRUD partiel | Tables maison + `confirm()` |
| `/app/administration` | `administration.page.ts` | Docs ERP | Sidebar « Bientôt » vs page réelle — incohérence |
| `/app/bi` | `bi.page.ts` | KPIs | Quasi clone dashboard ; sidebar « Bientôt » |
| `/app/bpm`, `/cms`, `/pim`, `/scm`, `/mrp`, `/etl`, `/edi` | pages shell | Placeholder / léger | Peu de valeur UX distincte |
| `/app/ai-center` | `ai-center.page.ts` | Agents | Hors 3D mais lié agents |
| `/app/notifications` | `notifications.page.ts` | Liste | Lecture seule ; pas lu/non-lu actionnable |
| `/app/audit` | `audit.page.ts` | Logs | Table simple ; ADMIN only |
| `/app/settings` | `settings.page.ts` | Org, thème, membres, billing | Dense mais utilisable |
| `/app/help`, `/feedback`, `/changelog` | pages support | Contenu statique | FAQ claire |

### 1.5 Design system actuel

| Couche | Emplacement | État |
|--------|-------------|------|
| Tokens base | `styles/_variables.scss` | Fonts, radii, spaces 1–6, shadows, sidebar/header |
| Thèmes | `styles/_themes.scss` | Solar / Night (+ high-contrast) |
| Layout global | `styles/_layout.scss` | `.page`, `.card`, focus-visible, reduced-motion, scrollbars |
| Composants CSS | `styles/_components.scss` | `.btn`, `.input`, `.label`, `.tabs`, `.callout` |
| Composants Angular | `shared/ui/*` | kpi-card, data-table, empty/loading, status-badge, agent-* |
| Thème runtime | `core/theme/theme.service.ts` | AUTO/Solar/Night, persist local + API |

**Exclu de cet audit (ne pas modifier)** : `features/ai-office/**` (Three.js, caméra, agents 3D, toasts office, panneaux 3D).

---

## 2. Patterns positifs (à conserver)

1. **Tokens CSS variables** déjà en place (`--accent-*`, `--bg-*`, `--space-*`) — base saine pour T2–T5.
2. **`*:focus-visible`** global + **`prefers-reduced-motion`** dans `_layout.scss` et loading spinner.
3. **Lazy routes** Angular standalone sur toutes les pages app.
4. **États loading / empty** réutilisables (`LoadingStateComponent`, `EmptyStateComponent`) avec `role="status"` / messages.
5. **Erreurs HTTP** centralisées (`mapHttpError`) — messages FR sûrs.
6. **Login brand-first** : NIHAO hero + pitch B2B, responsive stack.
7. **Onboarding multi-étapes** avec progression, résumé, preview branding.
8. **Cloche validations** : ARIA expanded/haspopup, Escape, click-outside.
9. **Status badges** sémantiques (success/warning/danger/info).
10. **Callouts** conformité (accounting) — bon pattern enterprise.

---

## 3. Problèmes prioritaires (friction UX)

### P0 — Bloquants / perception « prototype »

| ID | Problème | Zones | Impact |
|----|----------|-------|--------|
| P0-1 | **Sidebar « collapse » inefficace** : largeur fixe 165px même en compact ; masque seulement tagline/org/groupes | `sidebar.component.ts` | Confusion, pas de gain d’espace |
| P0-2 | **Pas de navigation mobile réelle** : `@media 900px` fixe la sidebar sans hamburger/overlay/fermeture | sidebar + shell | Illisible / bloquant &lt;900px |
| P0-3 | **Enums techniques exposés** (`ACTIVE`, `QUALIFICATION`, `OPEN`…) dans selects et badges | CRM, Sales, Support, Accounting | Non professionnel, non localisé |
| P0-4 | **Suppressions via `window.confirm()`** | CRM, Sales, HCM, WMS, Legal, Settings… | UX native inconsistante, non themable, a11y faible |
| P0-5 | **Pas de toasts globaux hors AI Office** : succès = texte inline fragile ; cloche ≠ feedback action | Modules métier | Manque de confirmation action (T23/T42) |
| P0-6 | **Tables dupliquées** : CRM/Sales/Support réimplémentent table CSS au lieu de `app-data-table` | Pages métier | Divergence visuelle, dette |

### P1 — Cohérence SaaS B2B

| ID | Problème | Zones | Impact |
|----|----------|-------|--------|
| P1-1 | **Aucun breadcrumb** | Shell / pages profondes | Orientation faible |
| P1-2 | **Pas de recherche globale** ni command palette | Header | Navigation lente (T35) |
| P1-3 | **Header sans lien Notifications / Paramètres / Profil** (user-chip décoratif) | `app-shell` | Découverte faible |
| P1-4 | **Empty states sans CTA** | `empty-state` + pages | Dead-end (« Aucun client » sans bouton créer) |
| P1-5 | **Pas de skeletons** : spinners génériques uniquement | loading-state | Perception freeze (T20) |
| P1-6 | **Pas de pagination / tri / filtre** sur listes | data-table + pages | Non scalable |
| P1-7 | **Incohérence « Bientôt »** : BI/ERP cliquables dans routes mais `soon` dans sidebar ; Admin page réelle vs label ERP bientôt | sidebar + routes | Perte de confiance |
| P1-8 | **Styles auth dupliqués** login/register/mfa (pas de layout auth partagé) | auth/* | Drift visuel |
| P1-9 | **Labels formulaires métier** : structure `label > input` vs `.label` + `for` inconsistante | CRM vs login | a11y / CSS |
| P1-10 | **Icônes sidebar** : même SVG « desk » partout | sidebar | Pas de scan visuel |
| P1-11 | **Dashboard = BI** quasiment clone | dashboard / bi | Redondance |
| P1-12 | **Notifications page** lecture seule (`read` affiché brut) | notifications | Pas de centre notif actionnable |
| P1-13 | **`.btn-sm` redéfini localement** sur plusieurs pages | CRM, Sales, HCM… | Non dans design system |
| P1-14 | **Typographie** : pas d’échelle h1–h6 documentée ; labels UPPERCASE très petits (0.52–0.78rem) | tokens / components | Lisibilité / contraste |

### P2 — Accessibilité & polish

| ID | Problème | Zones | Impact |
|----|----------|-------|--------|
| P2-1 | **Pas de skip-link** « Aller au contenu » | shell / index | WCAG 2.4.1 |
| P2-2 | **Dialog cloche** : pas de focus trap ni restauration focus | approval-notifications | Clavier |
| P2-3 | **Panels overlay** (`.panel-overlay` / `.panel-slide`) définis en CSS mais peu/pas utilisés hors 3D | `_layout.scss` | Pattern drawer dormant |
| P2-4 | **Contraste** : `--text-muted` sur fond cyberpunk à vérifier AA ; warning badges | thèmes | WCAG 1.4.3 |
| P2-5 | **Register** : pas de validation live champ-par-champ ni indicateur force MDP | register | Friction inscription |
| P2-6 | **Onboarding** : erreurs step 0 affichées via `saveError` parfois hors section visible | onboarding | Feedback flou |
| P2-7 | **Animation pulse** topbar non gated reduced-motion localement (global reduced-motion OK) | shell | À vérifier |
| P2-8 | **ModulePlaceholder** existe mais non branché sur routes shell | module-placeholder | Opportunité non utilisée |
| P2-9 | **i18n partiel** : login/settings utilisent `LocaleService`, pages métier 100 % FR hardcodé | i18n | Incohérence EN |
| P2-10 | **Scrollbar webkit only** (Firefox `scrollbar-width: thin` seulement en nav) | layout | Polish Firefox |

### P3 — Performance & dette

| ID | Problème | Zones | Impact |
|----|----------|-------|--------|
| P3-1 | **Fonts Google** sync dans `index.html` | index | LCP |
| P3-2 | **Subscriptions HTTP** sans `takeUntilDestroyed` / destroy sur plusieurs pages | dashboard, crm… | Fuite si navigation rapide |
| P3-3 | **`AgentHubCard` utilise `@Input`** vs `input()` signals ailleurs | agent-hub-card | Incohérence Angular 21 |
| P3-4 | **Bundles** : pas d’analyse documentée hors 3D | build | T49 |
| P3-5 | **Pas de design system doc** | docs | T50 |

---

## 4. Analyse par parcours

### 4.1 Login → Dashboard / AI Office

- **Forces** : branding fort, erreurs claires, loading bouton, forgot link, CGU/privacy.
- **Frictions** : credentials démo visibles (voulu en env demo) ; pas d’état success avant redirect ; OAuth bouton sans icône Google standard.

### 4.2 Register → Onboarding

- **Forces** : champs entreprise + compte ; redirection onboarding post-session.
- **Frictions** : « Étape 0 » sans stepper visuel partagé avec onboarding 1–4 ; pas de confirmation email UI ; styles moins soignés que login (`radius-lg` vs `radius-xl`).

### 4.3 Navigation globale

- **Forces** : groupes Accueil / Espace client / Gestion / Pilotage / Données / Système ; lien AI Office récurrent.
- **Frictions** : over-emphasis AI Office (chip + FAB + back-ao sur chaque page) au détriment d’une IA secondaire pour users 2D-first ; collapse trompeur ; mobile cassé ; pas de breadcrumbs.

### 4.4 Modules CRM / Ventes / Support / Accounting

- **Forces** : CRUD réel, agent hub card, empty/loading, erreurs mappées.
- **Frictions** : formulaires « create » toujours visibles (pas drawer/modal) → pages longues ; enums EN ; pas filtre/recherche/pagination ; empty sans CTA ; confirm natif ; tables inconsistantes ; montants sans format monétaire uniforme (Sales affiche raw).

### 4.5 Notifications & feedback

- **Forces** : page liste + cloche CEO.
- **Frictions** : deux systèmes dissociés (approvals vs notifications API) ; pas de toast shell ; pas mark-as-read UI.

### 4.6 Paramètres & thèmes

- **Forces** : thèmes Solar/Night/Auto, high-contrast, langue, membres, billing, privacy export/erase.
- **Frictions** : page longue sans ancres/tabs ; preview thème limité aux boutons ; pas de « Corporate » séparé côté shell (présent côté 3D theme-switcher) — écart naming Solar/Night vs SolarPunk/Cyberpunk.

---

## 5. Scorecard UI/UX (hors 3D)

| Domaine | Note /5 | Commentaire |
|---------|---------|-------------|
| Design tokens | 3.5 | Présents mais incomplets (pas type scale, btn sizes) |
| Cohérence visuelle | 2.5 | Drift tables/forms/auth |
| Navigation | 2.0 | Mobile + collapse + breadcrumbs manquants |
| Formulaires | 3.0 | Labels OK auth ; métier perfectible |
| Listes / data | 2.0 | Pas tri/filtre/pagination |
| Feedback (toast/modal) | 1.5 | Hors 3D quasi absent |
| États vides/loading | 3.0 | Présents ; CTAs/skeletons manquent |
| Accessibilité | 3.0 | Bases OK ; dialogs/skip/contrast à durcir |
| Responsive | 1.5 | Shell fragile &lt;900px |
| Perception SaaS | 2.5 | Prototype crédible mais pas « commercial-ready » |

**Verdict** : fondations solides (tokens, thèmes, lazy routes, empty/loading, auth brand). L’écart commercial vient surtout de la **navigation responsive**, des **patterns data (table/filtre/toast/modal)**, et de la **localisation des enums métier**.

---

## 6. Mapping vers les tâches 2–50

| Priorité audit | Tâches planifiées |
|----------------|-------------------|
| P0-1, P0-2, P1-1–3 | T7, T8, T28, T35 |
| Tokens / type / couleur / space | T2, T3, T4, T5 |
| Composants bouton/input unifiés | T6, T41 |
| Auth polish | T9, T10, T11 |
| Dashboard / listes / filtres | T12–T16, T36, T37 |
| Forms / erreurs / empty / loading | T17–T20, T18, T33 |
| Modales / drawers / toasts / notifs | T21–T24, T42 |
| Motion / a11y | T25–T27, T29–T31 |
| Perf / bundles | T32, T49 |
| Settings / roles / audit / thèmes | T38–T40, T43, T44 |
| Docs / tests / checklist | T45–T48, T50 |

---

## 7. Inventaire fichiers UI hors 3D (référence)

```
src/styles/                     _variables, _themes, _layout, _components
src/app/core/layout/            app-shell, sidebar, approval-notifications
src/app/core/theme/             theme.service
src/app/shared/ui/              kpi-card, data-table, empty-state, loading-state,
                                status-badge, agent-hub-card, agent-office-link, cookie-consent
src/app/features/auth/**        login, register, mfa, forgot/reset, invite, sso
src/app/features/onboarding/
src/app/features/workspace/
src/app/features/dashboard/
src/app/features/{crm,sales,customer-relations,accounting,marketing,hcm,wms,legal,...}
src/app/features/{settings,notifications,audit,help,feedback,changelog,company-data}
src/app/features/module-placeholder/   (non branché)
```

---

## 8. Critères de validation Tâche 1

- [x] Toutes les pages hors 3D inventoriées
- [x] Frictions, incohérences, gaps a11y/responsive documentés
- [x] Patterns bons / mauvais listés
- [x] Problèmes priorisés P0–P3
- [x] Mapping vers tâches 2–50

**Livrable** : ce document (`docs/audit/frontend-uiux-audit.md`).

---

## 9. Risques pour la suite

- Ne pas toucher `features/ai-office/**` lors des refactors shell/toast (risque de collision naming).
- Unifier `data-table` sans casser Accounting qui l’utilise déjà.
- Mobile sidebar : attention overflow shell (`height: 100vh; overflow: hidden`).
- Remplacer `confirm()` par modales : garder le même comportement métier (pas de changement API).
