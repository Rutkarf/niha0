import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent, AgentRuntimeRun, AgentRuntimeStep } from '../../core/api/api.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';

const VISIBLE_ROWS = 5;
const ROW_HEIGHT_REM = 2.85;

const GRAPH_PRESETS = ['default', 'demo-hitl', 'rag-query', 'approval-flow', 'batch-export'];

@Component({
  selector: 'app-runtime-page',
  imports: [
    FormsModule,
    RouterLink,
    EmptyStateComponent,
    FeaturePageHeaderComponent,
    FeatureAgentHostComponent,
    SkeletonComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header group="Pilotage" title="Runtime agents" backLabel="← AI Office">
        <div actions>
          <a routerLink="/app/studio" class="btn btn-ghost">Studio</a>
        </div>
      </app-feature-page-header>

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loadingAgent()"
        officeQuery="analytics"
        sectionLabel="Orchestration runtime"
        officeLinkLabel="Runtime"
      />

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <div class="rt-kpis">
        <div class="kpi-chip"><span class="kpi-val">{{ runs().length }}</span><span class="kpi-lbl">Runs</span></div>
        <div class="kpi-chip"><span class="kpi-val">{{ interruptedCount() }}</span><span class="kpi-lbl">En attente HITL</span></div>
        <div class="kpi-chip"><span class="kpi-val">{{ runningCount() }}</span><span class="kpi-lbl">En cours</span></div>
      </div>

      <div class="rt-pair-row">
        <section class="feature-hub card rt-half new-run-section">
          <header class="section-toolbar new-run-toolbar" role="toolbar" aria-label="Nouvelle exécution">
            <h2 class="section-title">Nouvelle exécution</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input
                class="input section-search-input"
                type="search"
                placeholder="Graphe, agent, preset…"
                [ngModel]="graphQuery()"
                (ngModelChange)="graphQuery.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">Graphe et agent</span>
            </div>
          </header>

          <form class="rt-form" (ngSubmit)="start()">
            <div class="run-form-bar">
              <label class="label run-field">
                <span class="field-label">Nom du graphe</span>
                <input
                  class="input"
                  id="graphName"
                  name="graphName"
                  [(ngModel)]="graphName"
                  placeholder="default, demo-hitl…"
                  list="graph-presets"
                  required
                />
                <datalist id="graph-presets">
                  @for (g of filteredGraphPresets(); track g) {
                    <option [value]="g"></option>
                  }
                </datalist>
              </label>
              <label class="label run-field">
                <span class="field-label">Agent</span>
                <select class="input" name="agentId" [(ngModel)]="agentId">
                  <option value="">— Automatique —</option>
                  @for (a of filteredAgents(); track a.id) {
                    <option [value]="a.id">{{ a.name }} ({{ a.code }})</option>
                  }
                </select>
              </label>
              <div class="run-submit">
                <button type="submit" class="btn btn-primary" [disabled]="starting() || !graphName.trim()">
                  {{ starting() ? 'Démarrage…' : 'Démarrer le run' }}
                </button>
              </div>
            </div>

            @if (filteredGraphPresets().length) {
              <div class="preset-row" aria-label="Graphes suggérés">
                @for (g of filteredGraphPresets(); track g) {
                  <button type="button" class="preset-chip" [class.active]="graphName === g" (click)="graphName = g">
                    {{ g }}
                  </button>
                }
              </div>
            }
          </form>
        </section>

        <section class="feature-hub card rt-half runs-section">
          <header class="section-toolbar" role="toolbar" aria-label="Exécutions">
            <h2 class="section-title">Exécutions</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input
                class="input section-search-input"
                type="search"
                placeholder="Graphe, statut, nœud…"
                [ngModel]="query()"
                (ngModelChange)="query.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">Suivi des runs</span>
              <span class="section-count">{{ runs().length }} run(s)</span>
            </div>
          </header>
          @if (loading()) {
            <app-skeleton message="Chargement des runs…" [lines]="5" />
          } @else if (!runs().length) {
            <app-empty-state title="Aucun run" icon="RT" description="Lancez une exécution à gauche." />
          } @else {
            @if (filteredRuns().length > visibleRows) {
              <p class="feature-scroll-hint table-hint">5 visibles · défilez</p>
            }
            <div class="feature-scroll-body runs-scroll" [style.max-height.rem]="visibleRows * rowHeightRem">
              @for (r of filteredRuns(); track r.id) {
                <button type="button" class="run-item" [class.active]="selected()?.id === r.id" (click)="select(r)">
                  <span class="run-name">{{ r.graphName }}</span>
                  <span class="run-meta">
                    <app-status-badge [status]="r.status" />
                    {{ r.currentNode || '—' }}
                  </span>
                </button>
              }
            </div>
          }
        </section>
      </div>

      @if (selected(); as sel) {
        <section class="feature-hub card">
          <header class="feature-hub-head">
            <h2 class="feature-hub-title">Détail — {{ sel.graphName }}</h2>
            <span class="feature-hub-sub">{{ sel.modelProvider || 'provider par défaut' }}</span>
            @if (sel.status === 'INTERRUPTED') {
              <div class="hitl-actions">
                <button type="button" class="btn btn-primary btn-sm" (click)="resume(sel, 'APPROVED')">Approuver</button>
                <button type="button" class="btn btn-ghost btn-sm" (click)="resume(sel, 'REJECTED')">Rejeter</button>
              </div>
            }
          </header>
          @if (sel.interruptReason) {
            <p class="feature-callout">Interrupt : {{ sel.interruptReason }}</p>
          }
          @if (runDetail()?.stateJson) {
            <details class="state-box">
              <summary>État du run (stateJson)</summary>
              <pre>{{ formatJson(runDetail()!.stateJson!) }}</pre>
            </details>
          }
          @if (loadingSteps()) {
            <app-skeleton message="Steps…" [lines]="4" />
          } @else if (!steps().length) {
            <app-empty-state title="Aucun step" icon="RT" />
          } @else {
            <div class="feature-scroll-table" role="table">
              <div class="feature-scroll-cols head step-cols" role="row">
                <span role="columnheader">#</span>
                <span role="columnheader">Nœud</span>
                <span role="columnheader">Statut</span>
                <span role="columnheader">ms</span>
              </div>
              <div class="feature-scroll-body" role="rowgroup" [style.max-height.rem]="visibleRows * rowHeightRem">
                @for (s of steps(); track s.id) {
                  <div class="feature-scroll-cols row step-cols" role="row">
                    <span class="feature-cell" role="cell">{{ s.stepIndex }}</span>
                    <span class="feature-cell feature-cell-primary" role="cell">{{ s.nodeName }}</span>
                    <span role="cell"><app-status-badge [status]="s.status" /></span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ s.latencyMs }}</span>
                  </div>
                  @if (s.inputJson || s.outputJson) {
                    <div class="step-io">
                      @if (s.inputJson) { <pre><strong>in:</strong> {{ formatJson(s.inputJson) }}</pre> }
                      @if (s.outputJson) { <pre><strong>out:</strong> {{ formatJson(s.outputJson) }}</pre> }
                    </div>
                  }
                }
              </div>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .error { color: var(--accent-danger); }
    .rt-kpis { display: flex; flex-wrap: wrap; gap: var(--dash-inline-gap); margin-bottom: var(--dash-inline-gap); }
    .kpi-chip { display: flex; align-items: baseline; gap: 0.4rem; padding: var(--dash-inline-gap) var(--dash-band-gap); border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-elevated); }
    .kpi-val { font-size: 1.1rem; font-weight: var(--fw-bold); color: var(--accent-primary); }
    .kpi-lbl { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; }

    .rt-pair-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--dash-inline-gap); margin-bottom: var(--dash-inline-gap); }
    .rt-half { min-width: 0; display: flex; flex-direction: column; }

    .section-toolbar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: var(--dash-inline-gap, var(--space-3));
      padding-bottom: var(--dash-inline-gap);
      border-bottom: 1px solid var(--border-color);
    }

    .new-run-toolbar {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      gap: var(--dash-inline-gap, var(--space-3));
      min-width: 0;
    }

    .new-run-toolbar .section-title { flex: 0 0 auto; }
    .new-run-toolbar .section-search {
      flex: 1 1 auto;
      min-width: 0;
      max-width: none;
      justify-self: unset;
    }
    .new-run-toolbar .section-toolbar-end { flex: 0 1 auto; justify-self: unset; }

    .section-title {
      margin: 0;
      font-size: 1rem;
      font-weight: var(--fw-bold);
      white-space: nowrap;
    }

    .section-search {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      justify-self: center;
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }

    .section-search-input {
      flex: 1;
      min-width: 0;
      font-size: 0.85rem;
    }

    .section-toolbar-end {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      justify-self: end;
      white-space: nowrap;
    }

    .section-tag {
      font-size: 0.72rem;
      font-weight: var(--fw-semibold);
      color: var(--text-secondary);
    }

    .section-count {
      font-size: 0.72rem;
      color: var(--text-muted);
      padding: 0.2rem 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
    }

    .new-run-section,
    .runs-section {
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .table-hint { margin: 0; }

    .run-form-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: var(--dash-inline-gap);
    }

    .run-field { flex: 1 1 10rem; min-width: 0; margin: 0; }
    .run-submit { flex: 0 0 auto; padding-bottom: 0.05rem; }

    .field-label {
      font-size: 0.72rem;
      font-weight: var(--fw-semibold);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .label {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.8rem;
    }

    .preset-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: var(--dash-inline-gap);
      padding-top: var(--dash-inline-gap);
      border-top: 1px solid var(--border-color);
    }

    .preset-chip {
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      font-size: 0.72rem;
      font-weight: var(--fw-semibold);
      padding: 0.25rem 0.55rem;
      border-radius: 999px;
      cursor: pointer;
    }

    .preset-chip:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
    .preset-chip.active {
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      border-color: var(--accent-primary);
      color: var(--accent-primary);
    }

    .rt-half .feature-hub-head { margin-bottom: var(--dash-inline-gap); padding-bottom: var(--dash-inline-gap); display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem; }

    .runs-scroll { display: flex; flex-direction: column; gap: 0.35rem; overflow-y: auto; }
    .run-item { text-align: left; border: 1px solid var(--border-color); background: var(--bg-primary); border-radius: var(--radius-md); padding: 0.6rem 0.75rem; cursor: pointer; color: inherit; }
    .run-item.active { border-color: var(--accent-primary); background: color-mix(in srgb, var(--accent-primary) 10%, transparent); }
    .run-name { display: block; font-weight: var(--fw-semibold); font-size: 0.85rem; }
    .run-meta { display: flex; gap: 0.5rem; align-items: center; font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem; }

    .hitl-actions { margin-left: auto; display: flex; gap: 0.35rem; }
    .state-box { margin-bottom: 0.75rem; font-size: 0.8rem; }
    .state-box pre { margin: 0.5rem 0 0; padding: 0.65rem; background: var(--bg-secondary); border-radius: var(--radius-sm); font-size: 0.72rem; overflow-x: auto; }
    .step-cols { grid-template-columns: 40px minmax(0, 1fr) 100px 60px; }
    .step-io { grid-column: 1 / -1; padding: 0 0.75rem 0.5rem; }
    .step-io pre { margin: 0.25rem 0; font-size: 0.68rem; background: var(--bg-secondary); padding: 0.4rem; border-radius: var(--radius-sm); overflow-x: auto; }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; min-height: auto; }

    @media (max-width: 960px) {
      .rt-pair-row { grid-template-columns: 1fr; }
      .new-run-toolbar { flex-wrap: wrap; }
      .new-run-toolbar .section-search { flex: 1 1 100%; order: 2; }
      .new-run-toolbar .section-title { order: 1; }
      .new-run-toolbar .section-toolbar-end { order: 3; }
      .run-form-bar { flex-direction: column; align-items: stretch; }
      .run-submit .btn { width: 100%; }
      .section-toolbar { grid-template-columns: 1fr; }
      .section-search { justify-self: stretch; }
      .section-toolbar-end { justify-self: start; flex-wrap: wrap; }
    }
`],
})
export class RuntimePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;

  readonly loadingAgent = signal(true);
  readonly loading = signal(true);
  readonly loadingSteps = signal(false);
  readonly starting = signal(false);
  readonly error = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly agents = signal<Agent[]>([]);
  readonly runs = signal<AgentRuntimeRun[]>([]);
  readonly steps = signal<AgentRuntimeStep[]>([]);
  readonly selected = signal<AgentRuntimeRun | null>(null);
  readonly runDetail = signal<AgentRuntimeRun | null>(null);
  readonly query = signal('');
  readonly graphQuery = signal('');

  graphName = 'default';
  agentId = '';

  readonly filteredGraphPresets = computed(() => {
    const q = this.graphQuery().trim().toLowerCase();
    const list = GRAPH_PRESETS;
    if (!q) return list;
    return list.filter((g) => g.toLowerCase().includes(q));
  });

  readonly filteredAgents = computed(() => {
    const q = this.graphQuery().trim().toLowerCase();
    const list = this.agents();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        (a.domain ?? '').toLowerCase().includes(q),
    );
  });

  readonly interruptedCount = computed(() => this.runs().filter((r) => r.status === 'INTERRUPTED').length);
  readonly runningCount = computed(() => this.runs().filter((r) => r.status === 'RUNNING').length);

  readonly filteredRuns = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.runs();
    return this.runs().filter(
      (r) =>
        r.graphName.toLowerCase().includes(q) ||
        (r.status ?? '').toLowerCase().includes(q) ||
        (r.currentNode ?? '').toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (list) => {
        this.agents.set(list);
        this.agent.set(list.find((a) => a.code === 'ANALYTICS') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.reload();
  }

  formatJson(raw: string): string {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  start(): void {
    this.starting.set(true);
    this.api
      .startAgentRuntime({
        graphName: this.graphName.trim() || 'default',
        agentId: this.agentId || undefined,
      })
      .subscribe({
        next: (run) => {
          this.starting.set(false);
          this.toast.success(run.status === 'INTERRUPTED' ? 'Run en attente humaine.' : 'Run démarré.');
          this.reload(() => this.select(run));
        },
        error: (err) => {
          this.starting.set(false);
          this.toast.error(mapHttpError(err));
        },
      });
  }

  select(r: AgentRuntimeRun): void {
    this.selected.set(r);
    this.loadingSteps.set(true);
    this.api.getAgentRuntimeRun(r.id).subscribe({
      next: (detail) => this.runDetail.set(detail),
    });
    this.api.getAgentRuntimeSteps(r.id).subscribe({
      next: (data) => {
        this.steps.set(data);
        this.loadingSteps.set(false);
      },
      error: (err) => {
        this.loadingSteps.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }

  resume(r: AgentRuntimeRun, decision: 'APPROVED' | 'REJECTED'): void {
    this.api.resumeAgentRuntime(r.id, decision).subscribe({
      next: (updated) => {
        this.toast.success(decision === 'APPROVED' ? 'Run approuvé.' : 'Run rejeté.');
        this.reload(() => this.select(updated));
      },
      error: (err) => this.toast.error(mapHttpError(err)),
    });
  }

  private reload(after?: () => void): void {
    this.loading.set(true);
    this.api.listAgentRuntimeRuns().subscribe({
      next: (data) => {
        this.runs.set(data);
        this.loading.set(false);
        after?.();
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }
}
