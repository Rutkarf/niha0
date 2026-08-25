# Checklist UI/UX finale — NIHAO frontend (hors AI Office 3D)

Date : 2026-08-25

## Navigation & shell
- [x] Sidebar collapse réel (56px)
- [x] Drawer mobile + scrim + Escape
- [x] Breadcrumbs hors AI Office
- [x] Recherche globale Ctrl+K
- [x] Skip link « Aller au contenu »
- [x] Liens header Notifications / Paramètres

## Auth
- [x] Login : labels, show password, loading, erreurs ARIA
- [x] Register : force MDP, progression, validations
- [x] Onboarding : barre de progression, erreurs étape

## Data & feedback
- [x] Data-table : filtre, tri, pagination
- [x] Empty states + descriptions
- [x] Skeletons + loading states
- [x] Toasts globaux
- [x] Confirm dialog (remplace `window.confirm`)
- [x] Labels FR des enums métier

## A11y & motion
- [x] focus-visible tokens
- [x] prefers-reduced-motion
- [x] Contrastes muted améliorés + high-contrast
- [x] Access denied page (roleGuard)

## Docs
- [x] Audit UI/UX
- [x] Design tokens
- [x] Design system guide
- [x] Tasks 9–50 status

## Tests
- [x] `npm run lint`
- [x] `npm run test`
- [x] `npm run build`
