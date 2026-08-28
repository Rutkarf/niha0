import { Component, computed, input } from '@angular/core';
import type { DashboardNihaoStats } from '../../models/dashboard.models';

@Component({
  selector: 'app-dashboard-pulse',
  template: `
    <section class="pulse" aria-label="État des agents Nihao">
      <div class="pulse-line">
        <div class="metric">
          <span class="val">{{ stats().totalAgents }}</span>
          <span class="lbl">Agents</span>
        </div>
        <div class="metric ok">
          <span class="dot" aria-hidden="true"></span>
          <span class="val">{{ stats().greenLeds }}</span>
          <span class="lbl">Autonomes</span>
        </div>
        <div class="metric warn">
          <span class="dot" aria-hidden="true"></span>
          <span class="val">{{ stats().redLeds }}</span>
          <span class="lbl">Validation</span>
        </div>
        <div class="metric">
          <span class="val">{{ autonomyPct() }}%</span>
          <span class="lbl">Uptime</span>
        </div>
        <span class="sep" aria-hidden="true">|</span>
        <div class="metric led">
          <span class="lbl">État LED</span>
          <span class="val-sm">{{ stats().greenLeds }} vert · {{ stats().redLeds }} rouge</span>
        </div>
      </div>
      <div class="bar" role="img" [attr.aria-label]="barAria()">
        <div class="seg green" [style.width.%]="greenPct()"></div>
        <div class="seg red" [style.width.%]="redPct()"></div>
      </div>
    </section>
  `,
  styles: [`
    .pulse {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
    }

    .pulse-line {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.65rem 1rem;
      flex: 1;
      min-width: 0;
    }

    .metric {
      display: inline-flex;
      align-items: baseline;
      gap: 0.3rem;
      font-size: 0.68rem;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .val {
      font-size: 1rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      color: var(--text-primary);
    }

    .val-sm {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .dot {
      width: 0.4rem;
      height: 0.4rem;
      border-radius: 50%;
      align-self: center;
    }

    .metric.ok .dot { background: #2ecc71; }
    .metric.warn .dot { background: #e74c3c; }

    .metric.led .lbl { margin-right: 0.15rem; }

    .sep {
      color: var(--border-color);
      font-size: 0.75rem;
      user-select: none;
    }

    .bar {
      display: flex;
      flex-shrink: 0;
      width: 120px;
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
      background: var(--bg-secondary);
    }

    .seg.green { background: #2ecc71; }
    .seg.red { background: #e74c3c; }

    @media (max-width: 720px) {
      .pulse { flex-wrap: wrap; }
      .bar { width: 100%; }
    }
  `],
})
export class DashboardPulseComponent {
  readonly stats = input.required<DashboardNihaoStats>();

  readonly greenPct = computed(() => {
    const t = this.stats().totalAgents || 1;
    return (this.stats().greenLeds / t) * 100;
  });

  readonly redPct = computed(() => {
    const t = this.stats().totalAgents || 1;
    return (this.stats().redLeds / t) * 100;
  });

  readonly autonomyPct = computed(() =>
    Math.round((this.stats().greenLeds / Math.max(1, this.stats().totalAgents)) * 100),
  );

  barAria(): string {
    const s = this.stats();
    return `${s.greenLeds} agents autonomes, ${s.redLeds} en validation sur ${s.totalAgents}`;
  }
}
