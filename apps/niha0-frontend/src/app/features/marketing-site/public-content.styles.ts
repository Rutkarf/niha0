/** Surfaces publiques denses — viewport fixe, navigation par onglets / grilles. */
export const PUBLIC_PAGE_SURFACE = `
  .page-surface {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: min(1080px, 100%);
    margin-inline: auto;
    gap: 0.55rem;
  }
  .page-head {
    flex-shrink: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: 0.5rem 1rem;
  }
  .page-kicker {
    margin: 0 0 0.15rem;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .page-title {
    margin: 0;
    font-family: var(--font-display, Georgia, serif);
    font-size: clamp(1.15rem, 2.2vw, 1.55rem);
    font-weight: 800;
    letter-spacing: 0.01em;
    color: var(--text-primary);
  }
  .page-lead {
    margin: 0.25rem 0 0;
    max-width: 42rem;
    font-size: 0.78rem;
    line-height: 1.4;
    color: var(--text-secondary);
  }
  .page-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
  }
  .meta-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: color-mix(in srgb, var(--bg-elevated) 80%, transparent);
    font-size: 0.65rem;
    color: var(--text-secondary);
    white-space: nowrap;
  }
`;

export const PUBLIC_PRO_PANEL = `
  .pro-panel {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    border-radius: 14px;
    background: color-mix(in srgb, var(--bg-elevated) 90%, transparent);
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-lg);
  }
  .pro-tabs {
    flex-shrink: 0;
    display: flex;
    gap: 0.2rem;
    padding: 0.45rem 0.55rem 0;
    border-bottom: 1px solid var(--border-color);
    overflow-x: auto;
    scrollbar-width: none;
  }
  .pro-tabs::-webkit-scrollbar {
    display: none;
  }
  .pro-tab {
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--text-muted);
    font: inherit;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.45rem 0.7rem;
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
  }
  .pro-tab:hover {
    color: var(--text-primary);
    background: color-mix(in srgb, var(--bg-primary) 35%, transparent);
  }
  .pro-tab.is-active {
    color: var(--text-primary);
    border-bottom-color: var(--accent-primary);
  }
  .pro-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 0.7rem 0.85rem 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }
  .pro-grid {
    flex: 1;
    min-height: 0;
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pro-grid--3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .pro-grid--4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .pro-tile {
    min-height: 0;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 0.55rem 0.65rem;
    background: color-mix(in srgb, var(--bg-primary) 45%, transparent);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .pro-tile h3 {
    margin: 0;
    font-family: var(--font-display, Georgia, serif);
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .pro-tile p,
  .pro-tile li {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.4;
    color: var(--text-secondary);
  }
  .pro-tile ul {
    margin: 0;
    padding-left: 0.95rem;
  }
  .pro-tile li + li {
    margin-top: 0.12rem;
  }
  .pro-tile .label {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent-primary);
  }
  .pro-foot {
    flex-shrink: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
    padding-top: 0.35rem;
    border-top: 1px solid color-mix(in srgb, var(--border-color) 80%, transparent);
    font-size: 0.68rem;
    color: var(--text-muted);
  }
  .pro-foot a {
    color: var(--accent-primary);
    font-weight: 600;
  }
  @media (max-width: 52rem) {
    .pro-grid,
    .pro-grid--3,
    .pro-grid--4 {
      grid-template-columns: 1fr 1fr;
    }
  }
  @media (max-width: 36rem) {
    .pro-grid,
    .pro-grid--3,
    .pro-grid--4 {
      grid-template-columns: 1fr;
    }
  }
`;

export const PUBLIC_AUTH_STYLES = `
  .auth-wrap {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: grid;
    place-items: center;
    width: 100%;
    padding: 0;
  }
  .auth-card {
    width: min(440px, 100%);
    max-height: 100%;
    overflow: hidden;
    background: color-mix(in srgb, var(--bg-elevated) 88%, transparent);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 0.85rem 1rem;
    box-shadow: var(--shadow-lg);
    backdrop-filter: blur(10px);
  }
  .auth-header h2 {
    margin: 0;
    font-family: var(--font-display, Georgia, serif);
    font-size: clamp(1.05rem, 2vw, 1.25rem);
    font-weight: 800;
  }
  .auth-header p {
    margin: 0.2rem 0 0.65rem;
    font-size: 0.78rem;
    color: var(--text-muted);
  }
  .form-group {
    margin-bottom: 0.5rem;
  }
  .form-group .label {
    font-size: 0.78rem;
    margin-bottom: 0.2rem;
  }
  .form-group .input {
    min-height: 2rem;
    padding: 0.35rem 0.55rem;
    font-size: 0.85rem;
  }
  .pwd-row {
    display: flex;
    gap: 0.35rem;
    align-items: stretch;
  }
  .pwd-row .input {
    flex: 1;
  }
  .toggle-pwd {
    flex-shrink: 0;
    align-self: center;
    font-size: 0.75rem;
    padding: 0.25rem 0.45rem;
  }
  .btn-ghost {
    color: var(--text-primary);
    border-color: var(--border-strong);
    background: color-mix(in srgb, var(--bg-elevated) 72%, transparent);
  }
  .forgot-row {
    margin: 0 0 0.45rem;
    text-align: right;
    font-size: 0.78rem;
  }
  .error {
    color: var(--accent-danger);
    font-size: 0.78rem;
    margin: 0 0 0.45rem;
  }
  .ok {
    color: var(--accent-success);
    font-size: 0.82rem;
  }
  .auth-btn {
    width: 100%;
    min-height: 2.1rem;
    font-size: 0.85rem;
  }
  .btn-oauth {
    width: 100%;
    min-height: 2.1rem;
    border: 1px solid var(--border-color);
    background: var(--bg-elevated);
    color: var(--text-primary);
    font-weight: 600;
    font-size: 0.85rem;
  }
  .divider {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.55rem 0;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-color);
  }
  .hint {
    margin: 0.65rem 0 0;
    font-size: 0.75rem;
    color: var(--text-muted);
    text-align: center;
  }
`;

/** @deprecated kept for any residual imports — prefer PUBLIC_PRO_PANEL */
export const PUBLIC_LEGAL_STYLES = PUBLIC_PRO_PANEL;
