import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  template: `
    <div class="toast-region" aria-live="polite" aria-relevant="additions">
      @for (t of toasts.items(); track t.id) {
        <div class="toast" [class]="'toast tone-' + t.tone" role="status">
          <span class="msg">{{ t.message }}</span>
          <button type="button" class="close" (click)="toasts.dismiss(t.id)" aria-label="Fermer">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-region {
      position: fixed;
      right: var(--space-5);
      bottom: var(--space-5);
      z-index: var(--z-toast);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      max-width: min(360px, calc(100vw - 2rem));
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      box-shadow: var(--shadow-lg);
      color: var(--text-primary);
      font-size: var(--fs-md);
      line-height: var(--lh-snug);
      animation: toast-in var(--duration-base) var(--ease-standard) both;
    }
    .tone-success { border-color: color-mix(in srgb, var(--accent-success) 45%, var(--border-color)); }
    .tone-error { border-color: color-mix(in srgb, var(--accent-danger) 45%, var(--border-color)); }
    .tone-warning { border-color: color-mix(in srgb, var(--accent-warning) 45%, var(--border-color)); }
    .tone-info { border-color: color-mix(in srgb, var(--accent-info) 45%, var(--border-color)); }
    .msg { flex: 1; }
    .close {
      border: none;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.1rem;
      line-height: 1;
      padding: 0;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .toast { animation: none; }
    }
  `,
})
export class ToastHostComponent {
  readonly toasts = inject(ToastService);
}
