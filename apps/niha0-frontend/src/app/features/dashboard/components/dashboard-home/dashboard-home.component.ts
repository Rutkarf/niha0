import { Component, computed, effect, inject, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DashboardKpis } from '../../../../core/api/api.models';
import { LoadingStateComponent } from '../../../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../../../shared/ui/agent-office-link/agent-office-link.component';
import { DashboardDataService } from '../../services/dashboard-data.service';
import { DashboardDomainsService } from '../../services/dashboard-domains.service';
import { DashboardPulseComponent } from '../dashboard-pulse/dashboard-pulse.component';
import { DashboardLineChartComponent } from '../dashboard-line-chart/dashboard-line-chart.component';
import { DashboardDomainPanelComponent } from '../dashboard-domain-panel/dashboard-domain-panel.component';
import {
  DEMO_OPPORTUNITY_ROWS,
  demoPipelineAmount,
} from '../../services/dashboard-demo-rows';
import type { DashboardDomainSection, DashboardSection } from '../../models/dashboard.models';

type PeriodKey = 'today' | '7d' | '30d';

interface ActivityItem {
  time: string;
  message: string;
  tone: 'neutral' | 'warning' | 'success';
}

@Component({
  selector: 'app-dashboard-home',
  imports: [
    DecimalPipe,
    LoadingStateComponent,
    EmptyStateComponent,
    AgentOfficeLinkComponent,
    DashboardPulseComponent,
    DashboardLineChartComponent,
    DashboardDomainPanelComponent,
  ],
  template: `
    @if (loading()) {
      <app-loading-state message="Chargement des KPIs…" />
    } @else if (!kpis()) {
      <app-empty-state
        title="KPIs indisponibles"
        description="Impossible de charger les indicateurs. Vérifiez que le backend est démarré, puis réessayez."
        icon="KPI"
      />
    } @else {
      <div class="home-v2">
        <div class="top-band">
          <article class="hero-card hero-half">
            <header class="hero-head">
              <span class="eyebrow">Pipeline · {{ periodLabel() }}</span>
              <span class="hero-value">{{ scaledPipeline() | number:'1.0-0' }} €</span>
              <span class="hero-meta">{{ opportunityCount() }} opp.</span>
              <span class="delta-badge">{{ pipelineDeltaLabel() }}</span>
            </header>
            <app-dashboard-line-chart [data]="pipelineSeries()" ariaLabel="Évolution pipeline sur la période" class="hero-chart" />
          </article>

          <div class="top-band-right">
            <app-dashboard-pulse [stats]="nihaoData.stats()" />
            @if (kpis()!.pendingApprovalCount > 0) {
              <div class="ceo-row">
                <span class="alert-dot" aria-hidden="true"></span>
                <strong>{{ kpis()!.pendingApprovalCount }} validation CEO</strong>
                <span class="ceo-sep">·</span>
                <span class="ceo-detail">Agent Stratégie · action requise</span>
                <app-agent-office-link moduleKey="strategie" label="Stratégie" />
              </div>
            }
          </div>
        </div>

        <div class="pair-row">
          @if (domains.loading()) {
            <div class="domain-skeleton" aria-hidden="true"></div>
            <div class="domain-skeleton" aria-hidden="true"></div>
          } @else {
            @if (panel('tickets'); as section) {
              <app-dashboard-domain-panel [section]="section" />
            }
            @if (panel('agents'); as section) {
              <app-dashboard-domain-panel [section]="section" />
            }
          }
        </div>

        <div class="pair-row pair-row--equal">
          <section class="panel panel-fill">
            <header class="panel-head">
              <h3 class="panel-title inline">Activité récente</h3>
              <span class="live-tag">Live</span>
            </header>
            <ul class="activity-scroll panel-body-scroll">
              @for (a of activity(); track a.time + a.message) {
                <li [class]="a.tone">
                  <time>{{ a.time }}</time>
                  <span>{{ a.message }}</span>
                </li>
              }
            </ul>
          </section>

          <section class="panel panel-fill">
            <h3 class="panel-title inline">Performance équipes</h3>
            <div class="team-scroll panel-body-scroll">
              <div class="h-bars">
                @for (t of allTeams(); track t.rowId) {
                  <div class="h-bar-row">
                    <span class="h-label">{{ t.name }}</span>
                    <div class="h-track">
                      <div class="h-fill" [style.width.%]="t.performance" [style.background]="t.color"></div>
                    </div>
                    <span class="h-val">{{ t.performance }}%</span>
                  </div>
                }
              </div>
            </div>
          </section>
        </div>

        <div class="pair-row">
          @if (domains.loading()) {
            <div class="domain-skeleton" aria-hidden="true"></div>
            <div class="domain-skeleton" aria-hidden="true"></div>
          } @else {
            @if (panel('leads'); as section) {
              <app-dashboard-domain-panel [section]="section" />
            }
            @if (panel('clients'); as section) {
              <app-dashboard-domain-panel [section]="section" />
            }
          }
        </div>

        <div class="pair-row">
          @if (domains.loading()) {
            <div class="domain-skeleton" aria-hidden="true"></div>
            <div class="domain-skeleton" aria-hidden="true"></div>
          } @else {
            @if (panel('opportunities'); as section) {
              <app-dashboard-domain-panel [section]="section" />
            }
            @if (panel('invoices'); as section) {
              <app-dashboard-domain-panel [section]="section" />
            }
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .home-v2 {
      display: flex;
      flex-direction: column;
      gap: var(--dash-band-gap, var(--space-5));
    }

    .top-band {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap, var(--space-3));
      align-items: stretch;
    }

    .hero-half {
      min-width: 0;
    }

    .top-band-right {
      display: flex;
      flex-direction: column;
      gap: var(--dash-inline-gap, var(--space-3));
      min-width: 0;
    }

    .top-band-right app-dashboard-pulse {
      flex: 1;
      min-height: 0;
      display: block;
    }

    .top-band-right ::ng-deep .pulse {
      flex-direction: column;
      align-items: stretch;
      height: 100%;
      justify-content: space-between;
      gap: var(--space-2);
    }

    .top-band-right ::ng-deep .pulse-line {
      flex-wrap: wrap;
      gap: 0.45rem 0.65rem;
    }

    .top-band-right ::ng-deep .bar {
      width: 100%;
    }

    .hero-card {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
    }

    .hero-head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--dash-inline-gap, var(--space-3));
      margin-bottom: var(--dash-inline-gap, var(--space-3));
    }

    .eyebrow {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .hero-value {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(1.25rem, 1.1rem + 0.8vw, 1.65rem);
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
      line-height: 1;
      white-space: nowrap;
    }

    .hero-meta {
      font-size: 0.72rem;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .delta-badge {
      margin-left: auto;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 0.2rem 0.45rem;
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
      color: var(--accent-primary);
      white-space: nowrap;
    }

    .jump-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.18rem 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      font-size: 0.65rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }

    .jump-chip span {
      font-variant-numeric: tabular-nums;
      color: var(--accent-primary);
    }

    .jump-chip:hover {
      color: var(--accent-primary);
      border-color: color-mix(in srgb, var(--accent-primary) 35%, var(--border-color));
    }

    .hero-head .jump-chip { margin-left: 0; }

    .hero-chart ::ng-deep .line-chart {
      height: 56px;
    }

    .ceo-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem 0.5rem;
      padding: var(--space-2) var(--space-3);
      border: 1px solid color-mix(in srgb, var(--accent-warning) 40%, var(--border-color));
      border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--accent-warning) 8%, var(--bg-elevated));
      flex-shrink: 0;
    }

    .ceo-row strong {
      font-size: var(--fs-sm);
      color: var(--accent-warning);
      white-space: nowrap;
    }

    .ceo-sep { color: var(--text-muted); font-size: 0.75rem; }
    .ceo-detail { font-size: 0.72rem; color: var(--text-secondary); white-space: nowrap; }

    .alert-dot {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
      background: var(--accent-warning);
      flex-shrink: 0;
    }

    .ceo-row ::ng-deep .ao-link {
      margin-top: 0;
      margin-left: auto;
      flex-shrink: 0;
      padding: 0.25rem 0.5rem;
      font-size: 0.68rem;
    }

    .pair-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap, var(--space-3));
      align-items: start;
    }

    .pair-row--equal {
      align-items: stretch;
    }

    .pair-row--equal .panel-fill {
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
    }

    .panel-body-scroll {
      flex: 1;
      min-height: 0;
      max-height: calc(5 * 1.5rem);
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .pair-row app-dashboard-domain-panel {
      display: block;
      min-width: 0;
    }

    .domain-skeleton {
      min-height: 9.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: linear-gradient(
        90deg,
        var(--bg-secondary) 0%,
        color-mix(in srgb, var(--bg-hover) 80%, transparent) 50%,
        var(--bg-secondary) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.2s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }

    .panel {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
    }

    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
      margin-bottom: var(--space-2);
    }

    .panel-head .panel-title { margin-bottom: 0; }

    .panel-jumps {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      justify-content: flex-end;
    }

    .panel-title {
      margin: 0 0 var(--space-2);
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }

    .panel-title.inline { margin-bottom: var(--space-2); }

    .live-tag {
      font-size: 0.62rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent-primary);
    }

    .h-bars { display: flex; flex-direction: column; gap: 0.3rem; }

    .team-scroll:not(.panel-body-scroll) {
      max-height: calc(5 * 1.35rem);
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .h-bar-row {
      display: grid;
      grid-template-columns: 64px 1fr 32px;
      gap: 0.4rem;
      align-items: center;
      font-size: 0.68rem;
    }

    .h-label { color: var(--text-secondary); font-weight: 600; }
    .h-val { text-align: right; font-variant-numeric: tabular-nums; color: var(--text-muted); }

    .h-track {
      height: 6px;
      border-radius: 4px;
      background: var(--bg-secondary);
      overflow: hidden;
    }

    .h-fill { height: 100%; border-radius: 4px; }

    .activity-scroll {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .activity-scroll:not(.panel-body-scroll) {
      max-height: calc(5 * 1.65rem);
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .activity-scroll li {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      padding: 0.28rem 0;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.72rem;
    }

    .activity-scroll li:last-child { border-bottom: none; }

    .activity-scroll time {
      font-variant-numeric: tabular-nums;
      color: var(--text-muted);
      font-size: 0.72rem;
    }

    .activity-scroll .warning span { color: var(--accent-warning); }
    .activity-scroll .success span { color: var(--accent-primary); }

    @media (max-width: 900px) {
      .top-band { grid-template-columns: 1fr; }
      .pair-row { grid-template-columns: 1fr; }
    }
  `],
})
export class DashboardHomeComponent {
  readonly nihaoData = inject(DashboardDataService);
  readonly domains = inject(DashboardDomainsService);

  readonly loading = input(true);
  readonly kpis = input<DashboardKpis | null>(null);
  readonly period = input<PeriodKey>('7d');
  readonly navigate = output<DashboardSection>();

  constructor() {
    effect(() => {
      const k = this.kpis();
      if (!this.loading() && k) {
        this.domains.load(k);
      }
    });
  }

  panel(id: string): DashboardDomainSection | undefined {
    return this.domains.sections().find((s) => s.id === id);
  }

  readonly periodMultiplier = computed(() => {
    switch (this.period()) {
      case 'today':
        return 0.92;
      case '30d':
        return 1.12;
      default:
        return 1;
    }
  });

  readonly scaledPipeline = computed(() => {
    const k = this.kpis();
    if (!k) return 0;
    const base = k.pipelineAmount + demoPipelineAmount();
    return Math.round(base * this.periodMultiplier());
  });

  readonly opportunityCount = computed(() => {
    const k = this.kpis();
    if (!k) return DEMO_OPPORTUNITY_ROWS.length;
    return k.openOpportunityCount + DEMO_OPPORTUNITY_ROWS.length;
  });

  readonly pipelineSeries = computed(() => {
    const base = (this.kpis()?.pipelineAmount ?? 27700) + demoPipelineAmount();
    const m = this.periodMultiplier();
    return [0.66, 0.7, 0.76, 0.82, 0.87, 0.93, 1].map((f) => Math.round(base * f * m));
  });

  readonly pipelineDeltaLabel = computed(() => {
    const series = this.pipelineSeries();
    if (series.length < 2 || series[0] === 0) return '—';
    const delta = ((series[series.length - 1] - series[0]) / series[0]) * 100;
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%`;
  });

  readonly periodLabel = computed(() => {
    switch (this.period()) {
      case 'today':
        return "Aujourd'hui";
      case '30d':
        return '30 jours';
      default:
        return '7 jours';
    }
  });

  readonly allTeams = computed(() =>
    [...this.nihaoData.teams()].sort((a, b) => a.rowId - b.rowId),
  );

  readonly activity = computed((): ActivityItem[] => {
    const k = this.kpis();
    const redAgents = this.nihaoData.agents().filter((a) => a.ledStatus === 'red');
    const items: ActivityItem[] = [];
    if (k && k.pendingApprovalCount > 0) {
      items.push({
        time: '02:04',
        message: `Validation CEO · ${k.pendingApprovalCount} en attente (Stratégie)`,
        tone: 'warning',
      });
    }
    if (k) {
      items.push({
        time: '01:58',
        message: `Pipeline ${this.scaledPipeline().toLocaleString('fr-FR')} € · ${this.opportunityCount()} opportunité(s)`,
        tone: 'success',
      });
    }
    for (const a of redAgents) {
      items.push({
        time: '01:42',
        message: `${a.team} · ${a.role} — validation humaine`,
        tone: 'warning',
      });
    }
    for (const t of this.allTeams()) {
      items.push({
        time: `01:${String(30 - t.rowId).padStart(2, '0')}`,
        message: `${t.name} · ${t.performance}% · chef ${t.chiefName} · ${t.activeCount}/4 actifs`,
        tone: t.performance >= 80 ? 'success' : 'neutral',
      });
    }
    items.push({
      time: '00:55',
      message: `${this.nihaoData.stats().greenLeds} agents autonomes · pulse Nihao OK`,
      tone: 'neutral',
    });
    return items;
  });
}
