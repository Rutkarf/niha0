import { Component, computed, input } from '@angular/core';
import { statusLabel } from '../status-labels';

@Component({
  selector: 'app-status-badge',
  template: `<span [class]="badgeClass()">{{ label() }}</span>`,
  styles: [`
    span {
      display: inline-flex;
      align-items: center;
      padding: 0.18rem 0.55rem;
      border-radius: var(--radius-sm);
      font-size: var(--fs-xs);
      font-weight: var(--fw-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: 1px solid transparent;
      font-variant-numeric: tabular-nums;
      line-height: var(--lh-snug);
    }
    .success {
      background: color-mix(in srgb, var(--accent-success) 16%, transparent);
      color: var(--accent-success);
      border-color: color-mix(in srgb, var(--accent-success) 30%, transparent);
    }
    .warning {
      background: color-mix(in srgb, var(--accent-warning) 16%, transparent);
      color: var(--accent-warning);
      border-color: color-mix(in srgb, var(--accent-warning) 30%, transparent);
    }
    .danger {
      background: color-mix(in srgb, var(--accent-danger) 14%, transparent);
      color: var(--accent-danger);
      border-color: color-mix(in srgb, var(--accent-danger) 28%, transparent);
    }
    .info {
      background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
      color: var(--accent-primary);
      border-color: color-mix(in srgb, var(--accent-primary) 28%, transparent);
    }
    .neutral {
      background: var(--bg-hover);
      color: var(--text-secondary);
      border-color: var(--border-color);
    }
  `],
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();

  readonly label = computed(() => statusLabel(this.status()));

  readonly badgeClass = computed(() => {
    const s = this.status().toUpperCase();
    if (['PAID', 'COMPLETED', 'RESOLVED', 'APPROVED', 'ACTIVE', 'AVAILABLE', 'WON'].includes(s)) return 'success';
    if (['OPEN', 'REQUEST_APPROVAL', 'WAITING_APPROVAL', 'SENT', 'HIGH', 'PREPARING', 'DEFERRED', 'URGENT', 'IN_PROGRESS'].includes(s)) return 'warning';
    if (['FAILED', 'REJECTED', 'ERROR', 'CANCELLED', 'LOST', 'INACTIVE'].includes(s)) return 'danger';
    if (['NEW', 'DRAFT', 'THINKING', 'EXECUTING', 'MODIFIED', 'PROSPECT', 'QUALIFICATION'].includes(s)) return 'info';
    return 'neutral';
  });
}
