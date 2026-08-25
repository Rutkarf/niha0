# Design tokens NIHAO (frontend)

Source of truth:

- CSS : `apps/niha0-frontend/src/styles/_variables.scss` (structure) + `_themes.scss` (couleurs)
- TypeScript : `apps/niha0-frontend/src/app/shared/design-tokens.ts`

## Usage

```scss
.card-title {
  font-size: var(--fs-xl);
  margin-bottom: var(--space-3);
  color: var(--text-primary);
}
```

```ts
import { space, zIndex } from '../shared/design-tokens';
```

## Échelles

| Catégorie | Tokens |
|-----------|--------|
| Type | `--fs-xs` … `--fs-4xl`, `--fw-*`, `--lh-*`, `--tracking-*` |
| Space | `--space-1` (4px) … `--space-8` (48px) |
| Radius | `--radius-sm` … `--radius-full` |
| Motion | `--duration-fast/base/slow`, `--ease-standard`, `--transition` |
| Z | `--z-sticky` … `--z-modal` |
| Controls | `--control-height`, `--control-height-sm` |
| Colors | theme classes + `--accent-info`, `--on-danger`, `--focus-ring` |

Ne pas hardcoder couleurs hex dans les features hors thèmes.
