import { Component, computed, inject, input } from '@angular/core';
import { KpiCardComponent } from '../../../../shared/ui/kpi-card/kpi-card.component';
import { DashboardDataService } from '../../services/dashboard-data.service';
import { DashboardKpis } from '../../../../core/api/api.models';

@Component({
  selector: 'app-dashboard-analytics',
  imports: [KpiCardComponent],
  template: `
    <div class="kpi-row">
      <app-kpi-card label="Total agents Nihao" [value]="stats().totalAgents" />
      <app-kpi-card label="Agents actifs (LED verte)" [value]="stats().activeAgents" />
      <app-kpi-card label="Validation humaine (LED rouge)" [value]="stats().redLeds" />
      <app-kpi-card label="Équipes" [value]="stats().totalTeams" />
      <app-kpi-card label="Tâches en cours" [value]="stats().tasksInProgress" />
      <app-kpi-card label="Performance globale" [value]="stats().globalPerformance" hint="%" />
    </div>

    @if (kpis(); as k) {
      <h3 class="section-title">KPIs entreprise</h3>
      <div class="kpi-row">
        <app-kpi-card label="Clients" [value]="k.customerCount" />
        <app-kpi-card label="Pipeline" [value]="k.pipelineAmount" [isCurrency]="true" />
        <app-kpi-card label="Tickets ouverts" [value]="k.openTicketCount" />
        <app-kpi-card label="Approbations CEO" [value]="k.pendingApprovalCount" />
      </div>
    }

    <div class="charts">
      <section class="chart-card">
        <h3>Répartition par équipe</h3>
        <div class="pie" [style.background]="pieGradient()"></div>
        <ul class="legend">
          @for (t of teams(); track t.rowId) {
            <li><span [style.background]="t.color"></span>{{ t.name }} ({{ t.agentCount }})</li>
          }
        </ul>
      </section>

      <section class="chart-card">
        <h3>Performance par équipe</h3>
        <div class="bars">
          @for (t of teams(); track t.rowId) {
            <div class="bar-row">
              <span class="label">{{ t.name }}</span>
              <div class="track"><div class="fill" [style.width.%]="t.performance" [style.background]="t.color"></div></div>
              <span class="val">{{ t.performance }}%</span>
            </div>
          }
        </div>
      </section>

      <section class="chart-card">
        <h3>Statut des agents</h3>
        <div class="donut-wrap">
          <div class="donut" [style.background]="donutGradient()"></div>
          <div class="donut-center">
            <strong>{{ stats().totalAgents }}</strong>
            <span>agents</span>
          </div>
        </div>
        <ul class="legend inline">
          <li><span class="g"></span>Actifs {{ stats().greenLeds }}</li>
          <li><span class="r"></span>Validation {{ stats().redLeds }}</li>
        </ul>
      </section>

      <section class="chart-card wide">
        <h3>Évolution temporelle (indicatif)</h3>
        <svg viewBox="0 0 400 120" class="line-chart" aria-hidden="true">
          <polyline [attr.points]="linePoints()" fill="none" stroke="var(--accent-primary)" stroke-width="2" />
          @for (p of lineCoords(); track p.x) {
            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="var(--accent-primary)" />
          }
        </svg>
      </section>
    </div>
  `,
  styles: [`
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }
    .section-title {
      margin: var(--space-4) 0 var(--space-3);
      font-size: var(--fs-sm);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }
    .charts {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-3);
    }
    .chart-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      padding: var(--space-3);
    }
    .chart-card.wide { grid-column: 1 / -1; }
    .chart-card h3 { margin: 0 0 var(--space-3); font-size: var(--fs-sm); }
    .pie {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      margin: 0 auto var(--space-3);
    }
    .legend { list-style: none; padding: 0; margin: 0; font-size: 0.72rem; }
    .legend li { display: flex; align-items: center; gap: 0.4rem; padding: 0.15rem 0; }
    .legend span { width: 0.5rem; height: 0.5rem; border-radius: 2px; }
    .legend.inline { display: flex; gap: var(--space-3); }
    .legend .g { background: #2ecc71; }
    .legend .r { background: #e74c3c; }
    .bars { display: flex; flex-direction: column; gap: 0.45rem; }
    .bar-row { display: grid; grid-template-columns: 72px 1fr 36px; gap: 0.5rem; align-items: center; font-size: 0.72rem; }
    .track { height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; }
    .fill { height: 100%; border-radius: 4px; }
    .donut-wrap { position: relative; width: 120px; height: 120px; margin: 0 auto var(--space-2); }
    .donut { width: 100%; height: 100%; border-radius: 50%; }
    .donut-center {
      position: absolute;
      inset: 22%;
      border-radius: 50%;
      background: var(--bg-elevated);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      color: var(--text-muted);
    }
    .donut-center strong { font-size: 1rem; color: var(--text-primary); }
    .line-chart { width: 100%; height: 120px; }
  `],
})
export class DashboardAnalyticsComponent {
  private readonly data = inject(DashboardDataService);

  readonly kpis = input<DashboardKpis | null>(null);
  readonly period = input<'today' | '7d' | '30d'>('7d');

  readonly stats = this.data.stats;
  readonly teams = this.data.teams;

  readonly pieGradient = computed(() => {
    const teams = this.teams();
    const total = teams.reduce((s, t) => s + t.agentCount, 0) || 1;
    let acc = 0;
    const stops: string[] = [];
    for (const t of teams) {
      const start = (acc / total) * 100;
      acc += t.agentCount;
      const end = (acc / total) * 100;
      stops.push(`${t.color} ${start}% ${end}%`);
    }
    return `conic-gradient(${stops.join(', ')})`;
  });

  readonly donutGradient = computed(() => {
    const s = this.stats();
    const total = s.totalAgents || 1;
    const greenPct = (s.greenLeds / total) * 100;
    return `conic-gradient(#2ecc71 0% ${greenPct}%, #e74c3c ${greenPct}% 100%)`;
  });

  readonly lineCoords = computed(() => {
    const mult = this.period() === 'today' ? 1 : this.period() === '7d' ? 1.05 : 1.12;
    const base = [72, 68, 75, 70, 78, 82, 80].map((v) => Math.min(95, Math.round(v * mult)));
    const step = 400 / (base.length - 1);
    return base.map((v, i) => ({ x: i * step, y: 110 - v }));
  });

  readonly linePoints = computed(() => this.lineCoords().map((p) => `${p.x},${p.y}`).join(' '));
}
