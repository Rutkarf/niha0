import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly state = signal<ConfirmState | null>(null);

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({
        confirmLabel: 'Confirmer',
        cancelLabel: 'Annuler',
        danger: false,
        ...options,
        resolve,
      });
    });
  }

  accept(): void {
    const s = this.state();
    if (!s) return;
    s.resolve(true);
    this.state.set(null);
  }

  cancel(): void {
    const s = this.state();
    if (!s) return;
    s.resolve(false);
    this.state.set(null);
  }
}
