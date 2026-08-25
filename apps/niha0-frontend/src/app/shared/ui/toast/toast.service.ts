import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  ttlMs: number;
}

const DEFAULT_TTL = 3500;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  readonly items = signal<ToastItem[]>([]);

  show(message: string, tone: ToastTone = 'info', ttlMs = DEFAULT_TTL): void {
    const id = ++this.seq;
    this.items.update((list) => [...list, { id, message, tone, ttlMs }]);
    const timer = setTimeout(() => this.dismiss(id), ttlMs);
    this.timers.set(id, timer);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error', 5000);
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  dismiss(id: number): void {
    const t = this.timers.get(id);
    if (t) clearTimeout(t);
    this.timers.delete(id);
    this.items.update((list) => list.filter((x) => x.id !== id));
  }

  clear(): void {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
    this.items.set([]);
  }
}
