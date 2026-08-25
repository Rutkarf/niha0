import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  imports: [DecimalPipe],
  template: `
    <article class="kpi-card">
      <span class="kpi-label">{{ label() }}</span>
      <strong class="kpi-value">
        @if (isCurrency()) {
          {{ value() | number:'1.0-0' }} €
        } @else {
          {{ value() | number:'1.0-0' }}
        }
      </strong>
      @if (hint()) {
        <span class="kpi-hint">{{ hint() }}</span>
      }
    </article>
  `,
  styles: [`
    .kpi-card {
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      box-shadow: var(--shadow-sm);
      transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
      position: relative;
      overflow: hidden;
    }
    .kpi-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--accent-primary);
      opacity: 0.75;
    }
    .kpi-card:hover {
      border-color: var(--border-strong);
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }
    .kpi-label {
      font-size: var(--fs-xs);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      font-weight: var(--fw-bold);
      color: var(--text-muted);
      padding-left: 0.35rem;
    }
    .kpi-value {
      font-family: var(--font-display);
      font-size: var(--fs-2xl);
      font-weight: var(--fw-bold);
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
      letter-spacing: var(--tracking-tight);
      padding-left: 0.35rem;
      line-height: var(--lh-tight);
    }
    .kpi-hint {
      font-size: var(--fs-sm);
      color: var(--text-secondary);
      padding-left: 0.35rem;
    }
  `],
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly hint = input<string>('');
  readonly isCurrency = input(false);
}
