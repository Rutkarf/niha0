/**
 * NIHAO design tokens (mirror of CSS custom properties in styles/_variables.scss).
 * Prefer CSS variables in templates/styles; use this module for TS-driven UI
 * (charts, canvas overlays outside Three.js, computed layout).
 */
export const fontFamily = {
  display: "var(--font-display)",
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
} as const;

/** Type scale — matches --text-* / --fs-* */
export const fontSize = {
  xs: '0.6875rem', // 11px
  sm: '0.75rem', // 12px
  md: '0.875rem', // 14px
  base: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

/** Spacing scale — 4px base (space-1 … space-8) */
export const space = {
  1: '0.25rem', // 4
  2: '0.5rem', // 8
  3: '0.75rem', // 12
  4: '1rem', // 16
  5: '1.5rem', // 24
  6: '2rem', // 32
  7: '2.5rem', // 40
  8: '3rem', // 48
} as const;

export const radius = {
  none: '0',
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '22px',
  full: '999px',
} as const;

export const shadow = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
} as const;

export const zIndex = {
  base: 0,
  sticky: 15,
  sidebar: 20,
  dropdown: 50,
  fab: 60,
  overlay: 100,
  toast: 200,
  modal: 300,
} as const;

export const duration = {
  fast: '120ms',
  base: '180ms',
  slow: '320ms',
} as const;

export const easing = {
  standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const layout = {
  sidebarWidth: '165px',
  headerHeight: '58px',
  pageMaxWidth: '1280px',
  controlHeight: '2.5rem',
  controlHeightSm: '2rem',
} as const;

/** Semantic color CSS variable names (resolved by theme classes). */
export const colorToken = {
  bgPrimary: 'var(--bg-primary)',
  bgSecondary: 'var(--bg-secondary)',
  bgElevated: 'var(--bg-elevated)',
  bgHover: 'var(--bg-hover)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  accentPrimary: 'var(--accent-primary)',
  accentSecondary: 'var(--accent-secondary)',
  accentSuccess: 'var(--accent-success)',
  accentWarning: 'var(--accent-warning)',
  accentDanger: 'var(--accent-danger)',
  accentInfo: 'var(--accent-info)',
  border: 'var(--border-color)',
  borderStrong: 'var(--border-strong)',
  onAccent: 'var(--on-accent)',
  onDanger: 'var(--on-danger)',
  focusRing: 'var(--focus-ring)',
} as const;

export type FontSizeToken = keyof typeof fontSize;
export type SpaceToken = keyof typeof space;
export type RadiusToken = keyof typeof radius;
