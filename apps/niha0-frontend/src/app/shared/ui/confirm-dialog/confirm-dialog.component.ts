import { Component, HostListener, inject } from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (dialog.state(); as s) {
      <div class="overlay" role="presentation" (click)="dialog.cancel()">
        <div
          class="dialog"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-labelledby]="'confirm-title'"
          [attr.aria-describedby]="'confirm-desc'"
          (click)="$event.stopPropagation()"
        >
          <h2 id="confirm-title">{{ s.title }}</h2>
          <p id="confirm-desc">{{ s.message }}</p>
          <div class="actions">
            <button type="button" class="btn btn-ghost" (click)="dialog.cancel()">
              {{ s.cancelLabel }}
            </button>
            <button
              type="button"
              class="btn"
              [class.btn-danger]="s.danger"
              [class.btn-primary]="!s.danger"
              (click)="dialog.accept()"
            >
              {{ s.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .overlay {
      position: fixed;
      inset: 0;
      z-index: var(--z-modal);
      background: var(--overlay-scrim);
      display: grid;
      place-items: center;
      padding: var(--space-5);
      animation: fade-in var(--duration-fast) ease both;
    }
    .dialog {
      width: min(420px, 100%);
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      box-shadow: var(--shadow-lg);
    }
    h2 {
      margin: 0 0 var(--space-2);
      font-family: var(--font-display);
      font-size: var(--fs-xl);
    }
    p {
      margin: 0 0 var(--space-5);
      color: var(--text-secondary);
      font-size: var(--fs-md);
      line-height: var(--lh-normal);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
      flex-wrap: wrap;
    }
  `,
})
export class ConfirmDialogComponent {
  readonly dialog = inject(ConfirmDialogService);

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.dialog.state()) this.dialog.cancel();
  }
}
