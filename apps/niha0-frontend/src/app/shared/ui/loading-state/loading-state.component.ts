import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  template: `
    <div class="loading" role="status" aria-live="polite">
      <div class="spinner" aria-hidden="true"></div>
      <p>{{ message() }}</p>
    </div>
  `,
  styles: [`
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-7) var(--space-5);
      color: var(--text-secondary);
      gap: var(--space-3);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-lg);
      background: color-mix(in srgb, var(--bg-elevated) 65%, transparent);
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 2px solid var(--border-color);
      border-top-color: var(--accent-primary);
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    p {
      margin: 0;
      font-size: var(--fs-md);
      font-weight: var(--fw-semibold);
      letter-spacing: 0.02em;
      color: var(--text-secondary);
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) {
      .spinner { animation: none; opacity: 0.85; }
    }
  `],
})
export class LoadingStateComponent {
  readonly message = input('Chargement…');
}
