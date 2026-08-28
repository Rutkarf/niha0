import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent, BiReport, DashboardKpis } from '../../core/api/api.models';
import { KpiCardComponent } from '../../shared/ui/kpi-card/kpi-card.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';
import { DashboardLineChartComponent } from '../dashboard/components/dashboard-line-chart/dashboard-line-chart.component';
import { DashboardSparklineComponent } from '../dashboard/components/dashboard-sparkline/dashboard-sparkline.component';
import { DashboardDataService } from '../dashboard/services/dashboard-data.service';

type BiPeriod = 'today' | '7d' | '30d' | '90d';
type BiDomain = 'all' | 'commerce' | 'finance' | 'ops' | 'agents';

interface BiHeroKpi {
  id: string;
  label: string;
  value: number;
  isCurrency?: boolean;
  hint?: string;
  delta: number;
  series: number[];
  domain: BiDomain;
}

interface BiFunnelStep {
  label: string;
  value: number;
  color: string;
}

interface BiInsight {
  tone: 'info' | 'warning' | 'success';
  title: string;
  detail: string;
}

const PERIOD_OPTIONS: { value: BiPeriod; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
];

const DOMAIN_OPTIONS: { value: BiDomain; label: string }[] = [
  { value: 'all', label: 'Tous les domaines' },
  { value: 'commerce', label: 'Commerce & CRM' },
  { value: 'finance', label: 'Finance & support' },
  { value: 'ops', label: 'Ops & plateforme' },
  { value: 'agents', label: 'Agents IA' },
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

function periodMultiplier(period: BiPeriod): number {
  switch (period) {
    case 'today':
      return 0.88;
    case '30d':
      return 1.1;
    case '90d':
      return 1.22;
    default:
      return 1;
  }
}

function buildSeries(base: number, period: BiPeriod, points = 8): number[] {
  const factors = [0.58, 0.64, 0.71, 0.78, 0.84, 0.9, 0.96, 1];
  const m = periodMultiplier(period);
  return factors.slice(-points).map((f) => Math.max(0, Math.round(base * f * m)));
}

function deltaPct(series: number[]): number {
  if (series.length < 2 || series[0] === 0) return 0;
  return ((series[series.length - 1]! - series[0]!) / series[0]!) * 100;
}

@Component({
  selector: 'app-bi-page',
  imports: [
    FormsModule,
    RouterLink,
    DecimalPipe,
    PercentPipe,
    KpiCardComponent,
    SkeletonComponent,
    EmptyStateComponent,
    FeaturePageHeaderComponent,
    FeatureAgentHostComponent,
    DashboardLineChartComponent,
    DashboardSparklineComponent,
  ],
  template: `
    <div class="page feature-module-page bi-page">
      <app-feature-page-header
        group="Pilotage"
        title="Analytics / BI"
        backLabel="← AI Office Analytics / BI"
        [backQueryParams]="{ agent: 'analytics' }"
      >
        @if (kpis()) {
          <div actions class="header-actions">
            <button type="button" class="btn btn-ghost btn-sm" (click)="refresh()">Actualiser</button>
            <button type="button" class="btn btn-ghost btn-sm" (click)="exportCsv()">Export CSV</button>
            <button type="button" class="btn btn-ghost btn-sm" (click)="exportJson()">Export JSON</button>
          </div>
        }
      </app-feature-page-header>

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loadingAgent()"
        officeQuery="analytics"
        sectionLabel="Agent dédié Analytics"
        officeLinkLabel="Analytics"
      />

      <section class="bi-toolbar card" aria-label="Filtres analytics">
        <div class="toolbar-group">
          <span class="toolbar-label">Période</span>
          <div class="pill-row" role="tablist">
            @for (opt of periodOptions; track opt.value) {
              <button
                type="button"
                class="pill"
                [class.active]="period() === opt.value"
                (click)="period.set(opt.value)"
              >
                {{ opt.label }}
              </button>
            }
          </div>
        </div>
        <div class="toolbar-group">
          <span class="toolbar-label">Domaine</span>
          <select class="input domain-select" [ngModel]="domain()" (ngModelChange)="domain.set($event)">
            @for (opt of domainOptions; track opt.value) {
              <option [value]="opt.value">{{ opt.label }}</option>
            }
          </select>
        </div>
        <label class="toolbar-toggle">
          <input type="checkbox" [ngModel]="comparePeriod()" (ngModelChange)="comparePeriod.set($event)" />
          Comparer période précédente
        </label>
        <label class="toolbar-toggle">
          <input type="checkbox" [ngModel]="liveMode()" (ngModelChange)="liveMode.set($event)" />
          Mode live
          @if (liveMode()) {
            <span class="live-dot" aria-hidden="true"></span>
          }
        </label>
      </section>

      @if (loading()) {
        <app-skeleton message="Agrégation des KPIs et séries temporelles…" [lines]="10" />
      } @else if (!kpis()) {
        <app-empty-state title="Données indisponibles" icon="BI" description="Impossible de charger le rapport BI." />
      } @else {
        @if (showSection('commerce') || showSection('finance') || showSection('agents')) {
          <section class="hero-kpis" aria-label="Indicateurs clés">
            @for (k of heroKpis(); track k.id) {
              @if (showSection(k.domain)) {
                <article class="hero-kpi" [class.up]="k.delta >= 0" [class.down]="k.delta < 0">
                  <div class="hero-kpi-top">
                    <span class="hero-kpi-label">{{ k.label }}</span>
                    <app-dashboard-sparkline [data]="k.series" [width]="72" [height]="26" />
                  </div>
                  <strong class="hero-kpi-value">
                    @if (k.isCurrency) {
                      {{ k.value | number:'1.0-0' }} €
                    } @else {
                      {{ k.value | number:'1.0-0' }}
                    }
                  </strong>
                  @if (k.hint) {
                    <span class="hero-kpi-hint">{{ k.hint }}</span>
                  }
                  @if (comparePeriod()) {
                    <span class="hero-kpi-delta">{{ k.delta >= 0 ? '+' : '' }}{{ k.delta | number:'1.0-1' }}%</span>
                  }
                </article>
              }
            }
          </section>
        }

        <div class="charts-grid">
          @if (showSection('commerce')) {
            <section class="chart-panel span-2">
              <header class="chart-head">
                <div>
                  <h2 class="chart-title">Évolution pipeline commercial</h2>
                  <p class="chart-sub">Montant cumulé · {{ periodLabel() }}</p>
                </div>
                <span class="chart-badge">{{ pipelineDelta() >= 0 ? '+' : '' }}{{ pipelineDelta() | number:'1.0-1' }}%</span>
              </header>
              <app-dashboard-line-chart [data]="pipelineSeries()" ariaLabel="Courbe pipeline" class="chart-line" />
              <div class="chart-legend">
                <span><i class="dot primary"></i> Pipeline</span>
                <span><i class="dot muted"></i> Objectif indicatif</span>
              </div>
            </section>

            <section class="chart-panel">
              <header class="chart-head">
                <h2 class="chart-title">Entonnoir conversion</h2>
                <p class="chart-sub">Leads → opportunités → clients</p>
              </header>
              <div class="funnel">
                @for (step of funnelSteps(); track step.label) {
                  <div class="funnel-row">
                    <span class="funnel-label">{{ step.label }}</span>
                    <div class="funnel-track">
                      <div class="funnel-fill" [style.width.%]="step.value" [style.background]="step.color"></div>
                    </div>
                    <span class="funnel-val">{{ step.value }}</span>
                  </div>
                }
              </div>
            </section>
          }

          @if (showSection('finance')) {
            <section class="chart-panel">
              <header class="chart-head">
                <h2 class="chart-title">Facturation</h2>
                <p class="chart-sub">Volume de factures · {{ periodLabel() }}</p>
              </header>
              <div class="bar-chart" role="img" aria-label="Histogramme facturation">
                @for (b of invoiceBars(); track b.label) {
                  <div class="bar-col">
                    <div class="bar-fill" [style.height.%]="b.pct"></div>
                    <span class="bar-label">{{ b.label }}</span>
                  </div>
                }
              </div>
            </section>

            <section class="chart-panel">
              <header class="chart-head">
                <h2 class="chart-title">Support & tickets</h2>
                <p class="chart-sub">Répartition indicative</p>
              </header>
              <div class="donut-wrap">
                <div class="donut" [style.background]="ticketDonut()"></div>
                <div class="donut-center">
                  <strong>{{ kpis()!.openTicketCount }}</strong>
                  <span>ouverts</span>
                </div>
              </div>
              <ul class="legend">
                <li><span class="lg open"></span>Ouverts</li>
                <li><span class="lg progress"></span>En cours</li>
                <li><span class="lg closed"></span>Résolus</li>
              </ul>
            </section>
          }

          @if (showSection('agents')) {
            <section class="chart-panel span-2">
              <header class="chart-head">
                <h2 class="chart-title">Performance équipes Nihao</h2>
                <p class="chart-sub">Score agrégé par département</p>
              </header>
              <div class="team-bars">
                @for (t of teams(); track t.rowId) {
                  <div class="team-bar-row">
                    <span class="team-label">{{ t.name }}</span>
                    <div class="team-track">
                      <div class="team-fill" [style.width.%]="t.performance" [style.background]="t.color"></div>
                    </div>
                    <span class="team-val">{{ t.performance }}%</span>
                    <span class="team-meta">{{ t.activeCount }}/4</span>
                  </div>
                }
              </div>
            </section>

            <section class="chart-panel">
              <header class="chart-head">
                <h2 class="chart-title">Statut agents IA</h2>
                <p class="chart-sub">LED verte / validation humaine</p>
              </header>
              <div class="donut-wrap">
                <div class="donut" [style.background]="agentDonut()"></div>
                <div class="donut-center">
                  <strong>{{ nihaoStats().totalAgents }}</strong>
                  <span>agents</span>
                </div>
              </div>
              <ul class="legend">
                <li><span class="lg green"></span>Autonomes {{ nihaoStats().greenLeds }}</li>
                <li><span class="lg red"></span>Validation {{ nihaoStats().redLeds }}</li>
              </ul>
            </section>
          }

          @if (showSection('ops')) {
            <section class="chart-panel span-2">
              <header class="chart-head">
                <h2 class="chart-title">Plateforme & opérations</h2>
                <p class="chart-sub">PIM, marketplace, runtime, stock</p>
              </header>
              <div class="ops-grid">
                <article class="ops-card">
                  <span class="ops-label">Produits PIM</span>
                  <strong>{{ pimCount() }}</strong>
                  <app-dashboard-sparkline [data]="pimSeries()" [width]="80" [height]="24" color="#8b5cf6" />
                </article>
                <article class="ops-card">
                  <span class="ops-label">Marketplace</span>
                  <strong>{{ marketplaceCount() }}</strong>
                  <app-dashboard-sparkline [data]="marketplaceSeries()" [width]="80" [height]="24" color="#f59e0b" />
                </article>
                <article class="ops-card">
                  <span class="ops-label">Runs runtime</span>
                  <strong>{{ runtimeCount() }}</strong>
                  <app-dashboard-sparkline [data]="runtimeSeries()" [width]="80" [height]="24" color="#06b6d4" />
                </article>
                <article class="ops-card">
                  <span class="ops-label">Approbations</span>
                  <strong>{{ kpis()!.pendingApprovalCount }}</strong>
                  <app-dashboard-sparkline [data]="approvalSeries()" [width]="80" [height]="24" color="#ef4444" />
                </article>
              </div>
              <nav class="quick-links">
                <a routerLink="/app/pim" class="quick-link">PIM →</a>
                <a routerLink="/app/marketplace" class="quick-link">Marketplace →</a>
                <a routerLink="/app/runtime" class="quick-link">Runtime →</a>
                <a routerLink="/app/wms" class="quick-link">Stock →</a>
                <a routerLink="/app/etl" class="quick-link">ETL →</a>
                <a routerLink="/app/edi" class="quick-link">EDI →</a>
              </nav>
            </section>

            <section class="chart-panel">
              <header class="chart-head">
                <h2 class="chart-title">Mix canaux</h2>
                <p class="chart-sub">Répartition trafic & leads</p>
              </header>
              <div class="pie" [style.background]="channelPie()"></div>
              <ul class="legend channel-legend">
                @for (c of channelMix(); track c.label) {
                  <li><span [style.background]="c.color"></span>{{ c.label }} {{ c.pct }}%</li>
                }
              </ul>
            </section>
          }
        </div>

        <div class="bottom-row">
          <section class="feature-hub card bottom-panel">
            <header class="feature-hub-head">
              <h2 class="feature-hub-title">Synthèse métriques</h2>
              <span class="feature-hub-sub">Vue consolidée · {{ periodLabel() }}</span>
            </header>
            <div class="metrics-table" role="table">
              <div class="metrics-head" role="row">
                <span role="columnheader">Métrique</span>
                <span role="columnheader">Valeur</span>
                <span role="columnheader">Tendance</span>
              </div>
              @for (row of metricsTable(); track row.label) {
                <div class="metrics-row" role="row">
                  <span role="cell">{{ row.label }}</span>
                  <span role="cell" class="mono">{{ row.display }}</span>
                  <span role="cell" [class.up]="row.delta >= 0" [class.down]="row.delta < 0">
                    {{ row.delta >= 0 ? '+' : '' }}{{ row.delta | number:'1.0-1' }}%
                  </span>
                </div>
              }
            </div>
          </section>

          <section class="feature-hub card bottom-panel">
            <header class="feature-hub-head">
              <h2 class="feature-hub-title">Insights & alertes</h2>
              <span class="feature-hub-sub">Recommandations agent Analytics</span>
            </header>
            <ul class="insights">
              @for (ins of insights(); track ins.title) {
                <li [class]="ins.tone">
                  <strong>{{ ins.title }}</strong>
                  <span>{{ ins.detail }}</span>
                </li>
              }
            </ul>
            <nav class="quick-links">
              <a routerLink="/app/crm" class="quick-link">CRM →</a>
              <a routerLink="/app/sales" class="quick-link">Ventes →</a>
              <a routerLink="/app/marketing" class="quick-link">Marketing →</a>
              <a routerLink="/app/accounting" class="quick-link">Comptabilité →</a>
              <a routerLink="/app/customer-relations" class="quick-link">Support →</a>
              <a routerLink="/app/bpm" class="quick-link">Stratégie →</a>
              <a routerLink="/app/audit" class="quick-link">Audit →</a>
              <a routerLink="/app/governance" class="quick-link">Gouvernance →</a>
            </nav>
          </section>
        </div>

        <section class="feature-hub card kpi-classic">
          <header class="feature-hub-head">
            <h2 class="feature-hub-title">KPIs détaillés</h2>
            <span class="feature-hub-sub">Cartes par domaine métier</span>
          </header>
          @if (showSection('commerce')) {
            <h3 class="domain-heading">Commerce & CRM</h3>
            <div class="grid-kpis">
              <app-kpi-card label="Clients" [value]="kpis()!.customerCount" />
              <app-kpi-card label="Leads" [value]="kpis()!.leadCount" />
              <app-kpi-card label="Opportunités" [value]="kpis()!.openOpportunityCount" />
              <app-kpi-card label="Pipeline" [value]="scaledPipeline()" [isCurrency]="true" />
            </div>
          }
          @if (showSection('finance')) {
            <h3 class="domain-heading">Finance & support</h3>
            <div class="grid-kpis">
              <app-kpi-card label="Factures" [value]="kpis()!.invoiceCount" />
              <app-kpi-card label="Tickets ouverts" [value]="kpis()!.openTicketCount" />
              <app-kpi-card label="Approbations CEO" [value]="kpis()!.pendingApprovalCount" hint="En attente" />
            </div>
          }
          @if (showSection('agents')) {
            <h3 class="domain-heading">Agents & performance</h3>
            <div class="grid-kpis">
              <app-kpi-card label="Agents IA" [value]="kpis()!.agentCount" />
              <app-kpi-card label="Agents actifs" [value]="nihaoStats().activeAgents" />
              <app-kpi-card label="Tâches en cours" [value]="nihaoStats().tasksInProgress" />
              <app-kpi-card label="Perf. globale" [value]="nihaoStats().globalPerformance" hint="%" />
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .bi-page { display: flex; flex-direction: column; gap: var(--dash-inline-gap, var(--space-3)); }

    .header-actions { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .btn-sm { font-size: 0.72rem; padding: 0.3rem 0.55rem; min-height: auto; }

    .bi-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--dash-band-gap, var(--space-4));
      padding: var(--dash-inline-gap, var(--space-3));
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }

    .toolbar-group { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
    .toolbar-label {
      font-size: 0.65rem;
      font-weight: var(--fw-bold);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }

    .pill-row { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .pill {
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      font-size: 0.72rem;
      font-weight: var(--fw-semibold);
      padding: 0.3rem 0.65rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .pill.active {
      background: color-mix(in srgb, var(--accent-primary) 14%, var(--bg-elevated));
      border-color: var(--accent-primary);
      color: var(--accent-primary);
    }

    .domain-select { min-width: 11rem; font-size: 0.8rem; padding: 0.35rem 0.5rem; }

    .toolbar-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-left: auto;
    }

    .live-dot {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
      background: #22c55e;
      animation: pulse 1.4s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }

    .hero-kpis {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .hero-kpi {
      padding: var(--dash-inline-gap, var(--space-3));
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: linear-gradient(145deg, var(--bg-elevated), color-mix(in srgb, var(--accent-primary) 4%, var(--bg-elevated)));
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .hero-kpi-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.35rem;
    }

    .hero-kpi-label {
      font-size: 0.65rem;
      font-weight: var(--fw-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .hero-kpi-value {
      font-family: var(--font-display);
      font-size: 1.35rem;
      font-weight: var(--fw-bold);
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }

    .hero-kpi-hint { font-size: 0.68rem; color: var(--text-muted); }
    .hero-kpi-delta { font-size: 0.68rem; font-weight: var(--fw-bold); }
    .hero-kpi.up .hero-kpi-delta { color: #16a34a; }
    .hero-kpi.down .hero-kpi-delta { color: #dc2626; }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .chart-panel {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      padding: var(--dash-inline-gap, var(--space-3));
      min-width: 0;
    }

    .chart-panel.span-2 { grid-column: span 2; }

    .chart-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--dash-inline-gap);
      margin-bottom: var(--dash-inline-gap);
    }

    .chart-title {
      margin: 0;
      font-size: 0.9rem;
      font-weight: var(--fw-bold);
    }

    .chart-sub {
      margin: 0.2rem 0 0;
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .chart-badge {
      font-size: 0.68rem;
      font-weight: var(--fw-bold);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      color: var(--accent-primary);
      white-space: nowrap;
    }

  .chart-line ::ng-deep .line-chart { height: 140px; }

    .chart-legend {
      display: flex;
      gap: var(--dash-band-gap);
      margin-top: 0.5rem;
      font-size: 0.68rem;
      color: var(--text-muted);
    }

    .dot {
      display: inline-block;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      margin-right: 0.25rem;
      vertical-align: middle;
    }
    .dot.primary { background: var(--accent-primary); }
    .dot.muted { background: var(--text-muted); opacity: 0.5; }

    .funnel { display: flex; flex-direction: column; gap: 0.5rem; }
    .funnel-row {
      display: grid;
      grid-template-columns: 72px 1fr 36px;
      gap: 0.45rem;
      align-items: center;
      font-size: 0.72rem;
    }
    .funnel-label { color: var(--text-secondary); font-weight: var(--fw-semibold); }
    .funnel-track { height: 10px; background: var(--bg-secondary); border-radius: 5px; overflow: hidden; }
    .funnel-fill { height: 100%; border-radius: 5px; }
    .funnel-val { text-align: right; font-variant-numeric: tabular-nums; color: var(--text-muted); }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      height: 140px;
      padding-top: 0.5rem;
    }

    .bar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      height: 100%;
      justify-content: flex-end;
    }

    .bar-fill {
      width: 100%;
      max-width: 2.5rem;
      background: linear-gradient(180deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 55%, transparent));
      border-radius: 4px 4px 0 0;
      min-height: 4px;
    }

    .bar-label { font-size: 0.62rem; color: var(--text-muted); }

    .donut-wrap {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto var(--dash-inline-gap);
    }

    .donut { width: 100%; height: 100%; border-radius: 50%; }
    .donut-center {
      position: absolute;
      inset: 24%;
      border-radius: 50%;
      background: var(--bg-elevated);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 0.62rem;
      color: var(--text-muted);
    }
    .donut-center strong { font-size: 1.1rem; color: var(--text-primary); }

    .legend {
      list-style: none;
      padding: 0;
      margin: 0;
      font-size: 0.72rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem 1rem;
      justify-content: center;
    }
    .legend li { display: flex; align-items: center; gap: 0.35rem; }
    .legend span.lg {
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 2px;
    }
    .lg.open { background: #ef4444; }
    .lg.progress { background: #f59e0b; }
    .lg.closed { background: #22c55e; }
    .lg.green { background: #22c55e; }
    .lg.red { background: #ef4444; }

    .team-bars { display: flex; flex-direction: column; gap: 0.45rem; }
    .team-bar-row {
      display: grid;
      grid-template-columns: 72px 1fr 36px 32px;
      gap: 0.45rem;
      align-items: center;
      font-size: 0.72rem;
    }
    .team-label { color: var(--text-secondary); font-weight: var(--fw-semibold); }
    .team-track { height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; }
    .team-fill { height: 100%; border-radius: 4px; }
    .team-val { text-align: right; font-variant-numeric: tabular-nums; }
    .team-meta { color: var(--text-muted); font-size: 0.65rem; text-align: right; }

    .ops-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: var(--dash-inline-gap);
      margin-bottom: var(--dash-inline-gap);
    }

    .ops-card {
      padding: 0.65rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-secondary);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .ops-label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .ops-card strong { font-size: 1.15rem; font-variant-numeric: tabular-nums; }

    .pie {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      margin: 0 auto var(--dash-inline-gap);
    }

    .channel-legend { flex-direction: column; align-items: flex-start; }

    .bottom-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .bottom-panel .feature-hub-head {
      margin-bottom: var(--dash-inline-gap);
      padding-bottom: var(--dash-inline-gap);
      border-bottom: 1px solid var(--border-color);
    }

    .metrics-table { display: flex; flex-direction: column; gap: 0; font-size: 0.78rem; }
    .metrics-head, .metrics-row {
      display: grid;
      grid-template-columns: 1.4fr 1fr 0.7fr;
      gap: 0.5rem;
      padding: 0.4rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    .metrics-head { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: var(--fw-bold); }
    .metrics-row:last-child { border-bottom: none; }
    .mono { font-variant-numeric: tabular-nums; font-weight: var(--fw-semibold); }
    .up { color: #16a34a; font-weight: var(--fw-bold); }
    .down { color: #dc2626; font-weight: var(--fw-bold); }

    .insights {
      list-style: none;
      margin: 0 0 var(--dash-inline-gap);
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .insights li {
      padding: 0.55rem 0.65rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      font-size: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .insights li strong { font-size: 0.78rem; }
    .insights li span { color: var(--text-secondary); }
    .insights .warning { border-color: color-mix(in srgb, #f59e0b 40%, var(--border-color)); background: color-mix(in srgb, #f59e0b 8%, transparent); }
    .insights .success { border-color: color-mix(in srgb, #22c55e 35%, var(--border-color)); background: color-mix(in srgb, #22c55e 6%, transparent); }
    .insights .info { border-color: color-mix(in srgb, var(--accent-primary) 35%, var(--border-color)); }

    .quick-links {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dash-inline-gap);
      padding-top: var(--dash-inline-gap);
      border-top: 1px solid var(--border-color);
    }

    .quick-link {
      font-size: 0.78rem;
      color: var(--accent-primary);
      text-decoration: none;
      font-weight: var(--fw-semibold);
    }
    .quick-link:hover { text-decoration: underline; }

    .kpi-classic .feature-hub-head {
      margin-bottom: var(--dash-inline-gap);
      padding-bottom: var(--dash-inline-gap);
      border-bottom: 1px solid var(--border-color);
    }

    .domain-heading {
      margin: var(--dash-inline-gap) 0 0.5rem;
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }

    .grid-kpis {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: var(--dash-inline-gap);
      margin-bottom: var(--dash-inline-gap);
    }

    @media (max-width: 1100px) {
      .charts-grid { grid-template-columns: 1fr; }
      .chart-panel.span-2 { grid-column: span 1; }
      .ops-grid { grid-template-columns: repeat(2, 1fr); }
      .bottom-row { grid-template-columns: 1fr; }
    }

    @media (max-width: 640px) {
      .toolbar-toggle { margin-left: 0; width: 100%; }
      .ops-grid { grid-template-columns: 1fr; }
      .hero-kpis { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class BiPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly nihaoData = inject(DashboardDataService);

  readonly periodOptions = PERIOD_OPTIONS;
  readonly domainOptions = DOMAIN_OPTIONS;

  readonly loadingAgent = signal(true);
  readonly loading = signal(true);
  readonly agent = signal<Agent | null>(null);
  readonly kpis = signal<DashboardKpis | null>(null);
  readonly report = signal<BiReport | null>(null);
  readonly pimCount = signal(0);
  readonly marketplaceCount = signal(0);
  readonly runtimeCount = signal(0);
  readonly period = signal<BiPeriod>('7d');
  readonly domain = signal<BiDomain>('all');
  readonly comparePeriod = signal(true);
  readonly liveMode = signal(false);

  readonly nihaoStats = this.nihaoData.stats;
  readonly teams = computed(() => [...this.nihaoData.teams()].sort((a, b) => a.rowId - b.rowId));

  readonly periodLabel = computed(() => PERIOD_OPTIONS.find((o) => o.value === this.period())?.label ?? '7 jours');

  readonly scaledPipeline = computed(() => {
    const k = this.kpis();
    if (!k) return 0;
    return Math.round(k.pipelineAmount * periodMultiplier(this.period()));
  });

  readonly pipelineSeries = computed(() => {
    const base = this.kpis()?.pipelineAmount ?? 0;
    return buildSeries(Math.max(base, 1), this.period());
  });

  readonly pipelineDelta = computed(() => deltaPct(this.pipelineSeries()));

  readonly pimSeries = computed(() => buildSeries(Math.max(this.pimCount(), 1), this.period(), 6));
  readonly marketplaceSeries = computed(() => buildSeries(Math.max(this.marketplaceCount(), 1), this.period(), 6));
  readonly runtimeSeries = computed(() => buildSeries(Math.max(this.runtimeCount(), 1), this.period(), 6));
  readonly approvalSeries = computed(() =>
    buildSeries(Math.max(this.kpis()?.pendingApprovalCount ?? 1, 1), this.period(), 6),
  );

  readonly heroKpis = computed((): BiHeroKpi[] => {
    const k = this.kpis();
    if (!k) return [];
    const p = this.period();
    return [
      {
        id: 'pipeline',
        label: 'Pipeline',
        value: this.scaledPipeline(),
        isCurrency: true,
        delta: deltaPct(this.pipelineSeries()),
        series: this.pipelineSeries(),
        domain: 'commerce',
      },
      {
        id: 'customers',
        label: 'Clients',
        value: k.customerCount,
        delta: deltaPct(buildSeries(k.customerCount, p, 6)),
        series: buildSeries(k.customerCount, p, 6),
        domain: 'commerce',
      },
      {
        id: 'leads',
        label: 'Leads',
        value: k.leadCount,
        delta: deltaPct(buildSeries(k.leadCount, p, 6)),
        series: buildSeries(k.leadCount, p, 6),
        domain: 'commerce',
      },
      {
        id: 'invoices',
        label: 'Factures',
        value: k.invoiceCount,
        delta: deltaPct(buildSeries(k.invoiceCount, p, 6)),
        series: buildSeries(k.invoiceCount, p, 6),
        domain: 'finance',
      },
      {
        id: 'tickets',
        label: 'Tickets ouverts',
        value: k.openTicketCount,
        hint: 'Support',
        delta: deltaPct(buildSeries(k.openTicketCount, p, 6)),
        series: buildSeries(k.openTicketCount, p, 6),
        domain: 'finance',
      },
      {
        id: 'agents',
        label: 'Agents actifs',
        value: this.nihaoStats().activeAgents,
        delta: deltaPct(buildSeries(this.nihaoStats().activeAgents, p, 6)),
        series: buildSeries(this.nihaoStats().activeAgents, p, 6),
        domain: 'agents',
      },
    ];
  });

  readonly funnelSteps = computed((): BiFunnelStep[] => {
    const k = this.kpis();
    if (!k) return [];
    const leads = Math.max(k.leadCount, 1);
    const opps = Math.max(k.openOpportunityCount, 1);
    const clients = Math.max(k.customerCount, 1);
    const max = leads;
    return [
      { label: 'Leads', value: Math.round((leads / max) * 100), color: CHART_COLORS[0]! },
      { label: 'Opportunités', value: Math.round((opps / max) * 100), color: CHART_COLORS[1]! },
      { label: 'Clients', value: Math.round((clients / max) * 100), color: CHART_COLORS[2]! },
    ];
  });

  readonly invoiceBars = computed(() => {
    const total = Math.max(this.kpis()?.invoiceCount ?? 1, 1);
    const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const raw = buildSeries(total, this.period(), 7);
    const max = Math.max(...raw, 1);
    return labels.map((label, i) => ({
      label,
      pct: Math.round((raw[i]! / max) * 100),
      value: raw[i]!,
    }));
  });

  readonly ticketDonut = computed(() => {
    const open = this.kpis()?.openTicketCount ?? 0;
    const progress = Math.max(Math.round(open * 0.35), 1);
    const closed = Math.max(Math.round(open * 1.8), 2);
    const total = open + progress + closed;
    const oPct = (open / total) * 100;
    const pPct = (progress / total) * 100;
    return `conic-gradient(#ef4444 0% ${oPct}%, #f59e0b ${oPct}% ${oPct + pPct}%, #22c55e ${oPct + pPct}% 100%)`;
  });

  readonly agentDonut = computed(() => {
    const s = this.nihaoStats();
    const total = s.totalAgents || 1;
    const greenPct = (s.greenLeds / total) * 100;
    return `conic-gradient(#22c55e 0% ${greenPct}%, #ef4444 ${greenPct}% 100%)`;
  });

  readonly channelMix = computed(() => {
    const k = this.kpis();
    const base = [
      { label: 'Web', weight: 34 },
      { label: 'Email', weight: 22 },
      { label: 'Réseaux', weight: 18 },
      { label: 'Partenaires', weight: 14 },
      { label: 'Autre', weight: 12 },
    ];
    const boost = (k?.leadCount ?? 0) % 5;
    const weights = base.map((c, i) => ({ ...c, weight: c.weight + (i === boost ? 4 : 0) }));
    const total = weights.reduce((s, c) => s + c.weight, 0);
    return weights.map((c, i) => ({
      label: c.label,
      pct: Math.round((c.weight / total) * 100),
      color: CHART_COLORS[i % CHART_COLORS.length]!,
    }));
  });

  readonly channelPie = computed(() => {
    const mix = this.channelMix();
    let acc = 0;
    const stops: string[] = [];
    for (const c of mix) {
      const start = (acc / 100) * 100;
      acc += c.pct;
      stops.push(`${c.color} ${start}% ${acc}%`);
    }
    return `conic-gradient(${stops.join(', ')})`;
  });

  readonly metricsTable = computed(() => {
    const k = this.kpis();
    if (!k) return [];
    const p = this.period();
    const rows = [
      { label: 'Pipeline commercial', value: this.scaledPipeline(), currency: true, base: k.pipelineAmount },
      { label: 'Clients actifs', value: k.customerCount, currency: false, base: k.customerCount },
      { label: 'Leads qualifiés', value: k.leadCount, currency: false, base: k.leadCount },
      { label: 'Opportunités ouvertes', value: k.openOpportunityCount, currency: false, base: k.openOpportunityCount },
      { label: 'Factures émises', value: k.invoiceCount, currency: false, base: k.invoiceCount },
      { label: 'Tickets support', value: k.openTicketCount, currency: false, base: k.openTicketCount },
      { label: 'Produits PIM', value: this.pimCount(), currency: false, base: this.pimCount() },
      { label: 'Runs runtime', value: this.runtimeCount(), currency: false, base: this.runtimeCount() },
    ];
    return rows.map((r) => ({
      label: r.label,
      display: r.currency ? `${r.value.toLocaleString('fr-FR')} €` : String(r.value),
      delta: deltaPct(buildSeries(Math.max(r.base, 1), p, 6)),
    }));
  });

  readonly insights = computed((): BiInsight[] => {
    const k = this.kpis();
    if (!k) return [];
    const items: BiInsight[] = [];
    if (k.pendingApprovalCount > 0) {
      items.push({
        tone: 'warning',
        title: `${k.pendingApprovalCount} validation(s) CEO en attente`,
        detail: 'Consultez Stratégie / BPM pour débloquer les actions sensibles.',
      });
    }
    if (k.openTicketCount > 3) {
      items.push({
        tone: 'warning',
        title: 'Charge support élevée',
        detail: `${k.openTicketCount} tickets ouverts — prioriser le module Relation client.`,
      });
    }
    if (this.pipelineDelta() > 5) {
      items.push({
        tone: 'success',
        title: 'Pipeline en hausse',
        detail: `+${this.pipelineDelta().toFixed(1)}% sur ${this.periodLabel().toLowerCase()} — opportunité de conversion.`,
      });
    }
    if (this.nihaoStats().redLeds > 0) {
      items.push({
        tone: 'info',
        title: `${this.nihaoStats().redLeds} agent(s) en validation humaine`,
        detail: 'LED rouge détectée dans l’AI Office — supervision recommandée.',
      });
    }
    items.push({
      tone: 'info',
      title: 'Rapport consolidé Nihao',
      detail: `${k.agentCount} agents · ${this.pimCount()} produits PIM · ${this.marketplaceCount()} annonces marketplace.`,
    });
    return items;
  });

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'ANALYTICS') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.refresh();
  }

  showSection(d: BiDomain): boolean {
    const filter = this.domain();
    return filter === 'all' || filter === d;
  }

  refresh(): void {
    this.loading.set(true);
    this.api.getBiReport().subscribe({
      next: (data) => {
        this.applyReport(data);
        this.loading.set(false);
        if (this.liveMode()) {
          this.toast.success('Données BI actualisées.');
        }
      },
      error: () => {
        this.api.getDashboardKpis().subscribe({
          next: (kpis) => {
            this.kpis.set(kpis);
            this.loading.set(false);
          },
          error: (err) => {
            this.loading.set(false);
            this.toast.error(mapHttpError(err));
          },
        });
      },
    });
  }

  exportCsv(): void {
    const k = this.kpis();
    if (!k) return;
    const rows: [string, string | number][] = [
      ['period', this.period()],
      ['customerCount', k.customerCount],
      ['leadCount', k.leadCount],
      ['openOpportunityCount', k.openOpportunityCount],
      ['pipelineAmount', this.scaledPipeline()],
      ['invoiceCount', k.invoiceCount],
      ['openTicketCount', k.openTicketCount],
      ['agentCount', k.agentCount],
      ['pendingApprovalCount', k.pendingApprovalCount],
      ['pimProducts', this.pimCount()],
      ['marketplaceListings', this.marketplaceCount()],
      ['runtimeRuns', this.runtimeCount()],
      ['globalPerformance', this.nihaoStats().globalPerformance],
    ];
    const csv = ['metric,value', ...rows.map(([a, b]) => `${a},${b}`)].join('\n');
    this.downloadBlob(csv, `nihao-bi-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
    this.toast.success('CSV exporté.');
  }

  exportJson(): void {
    const k = this.kpis();
    if (!k) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      period: this.period(),
      domain: this.domain(),
      kpis: k,
      ops: {
        pimProducts: this.pimCount(),
        marketplaceListings: this.marketplaceCount(),
        runtimeRuns: this.runtimeCount(),
      },
      series: {
        pipeline: this.pipelineSeries(),
        funnel: this.funnelSteps(),
      },
      nihao: this.nihaoStats(),
    };
    this.downloadBlob(JSON.stringify(payload, null, 2), `nihao-bi-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    this.toast.success('JSON exporté.');
  }

  private downloadBlob(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private applyReport(data: BiReport): void {
    this.report.set(data);
    this.kpis.set(data.kpis ?? null);
    this.pimCount.set(Number(data.pimProducts ?? data.pimProductCount ?? 0));
    this.marketplaceCount.set(Number(data.marketplaceListings ?? data.marketplaceListingCount ?? 0));
    this.runtimeCount.set(Number(data.runtimeRuns ?? data.runtimeRunCount ?? 0));
  }
}
