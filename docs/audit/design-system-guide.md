# Design system NIHAO — guide d’utilisation

## Principes
1. Tokens CSS d’abord (`--fs-*`, `--space-*`, `--accent-*`).
2. Composants partagés avant styles locaux.
3. Pas de hex hors `_themes.scss`.
4. États : default / hover / focus-visible / disabled / loading / invalid.
5. Respecter `prefers-reduced-motion` et le contraste élevé.

## Tokens
Voir `docs/audit/design-tokens.md` et :
- `src/styles/_variables.scss`
- `src/styles/_themes.scss`
- `src/app/shared/design-tokens.ts`

## Typographie
Classes utilitaires : `.text-display`, `.text-h1`…`.text-caption`, `.text-label`, `.text-mono` (`_typography.scss`).

## Composants CSS
`.btn` (+ primary/secondary/ghost/danger/sm/is-loading), `.input`, `.label`, `.checkbox`, `.radio`, `.toggle`, `.tabs`, `.callout`, `.grid-2/3`.

## Composants Angular (`shared/ui`)
| Composant | Usage |
|-----------|--------|
| `app-kpi-card` | Indicateurs dashboard |
| `app-data-table` | Listes filtrables / triables / paginées |
| `app-empty-state` | Aucune donnée (+ CTA optionnel) |
| `app-loading-state` / `app-skeleton` | Chargement |
| `app-status-badge` | Statuts localisés FR |
| `app-toast-host` | Feedback non bloquant |
| `app-confirm-dialog` | Confirmations destructives |
| `app-drawer` | Panneau latéral |
| `app-breadcrumbs` | Orientation |
| `app-global-search` | Navigation rapide Ctrl+K |

## Patterns
- Pages : `.page` + `.page-header` + sections `.card`
- Erreurs API : `mapHttpError` + toast/erreur inline `role="alert"`
- Suppression : toujours `ConfirmDialogService`
- Succès mutation : `ToastService.success`

## Hors périmètre
Scène Three.js / AI Office 3D — ne pas importer ses patterns toast locaux dans le shell.
