/**
 * Shared auth layout styles — used by login, register, MFA, forgot/reset.
 * Import via styleUrls or duplicate class names matching this contract.
 */
export const AUTH_LAYOUT_STYLES = `
  .login-page, .auth-page {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: var(--space-5);
    position: relative;
    overflow: hidden;
    background: var(--gradient-page);
  }
  .atmosphere {
    position: absolute;
    inset: -20%;
    background:
      radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--accent-primary) 18%, transparent), transparent 42%),
      radial-gradient(circle at 80% 70%, color-mix(in srgb, var(--accent-secondary) 14%, transparent), transparent 40%);
    pointer-events: none;
    animation: auth-drift 18s ease-in-out infinite alternate;
  }
  .login-layout {
    position: relative;
    z-index: 1;
    width: min(920px, 100%);
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: var(--space-5);
    align-items: stretch;
  }
  .brand-panel {
    padding: var(--space-6) var(--space-4) var(--space-6) var(--space-2);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .eyebrow {
    margin: 0 0 var(--space-3);
    font-size: var(--fs-sm);
    font-weight: var(--fw-bold);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .brand-type, .brand-panel h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(var(--fs-3xl), 2rem + 3vw, var(--fs-4xl));
    font-weight: var(--fw-extrabold);
    letter-spacing: 0.08em;
    color: var(--text-primary);
    line-height: var(--lh-tight);
  }
  .acronym {
    margin: var(--space-3) 0 var(--space-4);
    font-size: var(--fs-md);
    color: var(--accent-primary);
    font-weight: var(--fw-semibold);
  }
  .pitch {
    margin: 0;
    max-width: 28rem;
    color: var(--text-secondary);
    font-size: var(--fs-base);
    line-height: var(--lh-normal);
  }
  .login-card, .auth-card {
    background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-xl);
    padding: var(--space-5);
    box-shadow: var(--shadow-lg);
    backdrop-filter: blur(10px);
    align-self: center;
    width: 100%;
  }
  .login-header h2 {
    margin: 0;
    font-size: var(--fs-xl);
    font-weight: var(--fw-bold);
    font-family: var(--font-display);
    letter-spacing: var(--tracking-tight);
  }
  .login-header p {
    margin: var(--space-1) 0 var(--space-5);
    font-size: var(--fs-md);
    color: var(--text-muted);
  }
  .login-btn { width: 100%; margin-top: var(--space-2); min-height: var(--control-height); }
  .forgot-row { margin: 0 0 var(--space-3); text-align: right; font-size: var(--fs-sm); }
  .error, .form-error {
    color: var(--accent-danger);
    font-size: var(--fs-md);
    margin: 0 0 var(--space-3);
  }
  .ok {
    color: var(--accent-success);
    font-size: var(--fs-md);
  }
  .demo-hint, .footer-row, .links {
    margin: var(--space-5) 0 0;
    font-size: var(--fs-sm);
    color: var(--text-muted);
    text-align: center;
  }
  .field-hint {
    margin: var(--space-1) 0 0;
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  .pwd-meter {
    display: flex;
    gap: 4px;
    margin-top: var(--space-2);
  }
  .pwd-meter span {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: var(--border-color);
  }
  .pwd-meter span.on { background: var(--accent-primary); }
  .pwd-meter.weak span.on { background: var(--accent-danger); }
  .pwd-meter.ok span.on { background: var(--accent-warning); }
  .pwd-meter.strong span.on { background: var(--accent-success); }
  .progress-dots {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }
  .progress-dots i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border-color);
  }
  .progress-dots i.on { background: var(--accent-primary); }
  .btn-oauth {
    width: 100%;
    min-height: var(--control-height);
    border: 1px solid var(--border-color);
    background: var(--bg-elevated);
    color: var(--text-primary);
    font-weight: var(--fw-semibold);
  }
  .divider {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin: var(--space-4) 0;
    color: var(--text-muted);
    font-size: var(--fs-sm);
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-color);
  }
  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
  @keyframes auth-drift {
    from { transform: translate3d(0, 0, 0) scale(1); }
    to { transform: translate3d(2%, -1.5%, 0) scale(1.04); }
  }
  @media (max-width: 800px) {
    .login-layout { grid-template-columns: 1fr; gap: var(--space-4); }
    .brand-panel { padding: var(--space-2) 0; text-align: center; align-items: center; }
    .pitch { margin-inline: auto; }
    .row-2 { grid-template-columns: 1fr; }
  }
  @media (prefers-reduced-motion: reduce) {
    .atmosphere { animation: none; }
  }
`;
