import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent, AgentAction } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { AgentStatusService } from '../../core/navigation/agent-status.service';
import { accentForAgentCode } from '../../core/navigation/agent-accents';
import { moduleRouteForAgent } from '../../core/navigation/agent-module.map';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { statusLabel } from '../../shared/ui/status-labels';

const VISIBLE_ROWS = 6;
const ROW_HEIGHT_REM = 2.85;

const QUICK_LINKS = [
  { label: 'Runtime', route: '/app/runtime', hint: 'Exécutions' },
  { label: 'Studio', route: '/app/studio', hint: 'Graphes' },
  { label: 'Stratégie', route: '/app/bpm', hint: 'Validations CEO' },
  { label: 'Gouvernance', route: '/app/governance', hint: 'Conformité' },
] as const;

@Component({
  selector: 'app-ai-center-page',
  imports: [
    FormsModule,
    LoadingStateComponent,
    EmptyStateComponent,
    RouterLink,
    StatusBadgeComponent,
    FeaturePageHeaderComponent,
  ],
  template: `
    <div class="page feature-module-page ai-center-page">
      <app-feature-page-header
        group="Hub IA"
        title="AI Center"
        backLabel="← AI Office"
      >
        <div actions>
          <a routerLink="/app/dashboard" class="btn btn-ghost">Dashboard</a>
          <a routerLink="/app/ai-office" class="btn btn-primary">Salle 3D</a>
        </div>
      </app-feature-page-header>

      <header class="center-command" aria-label="Vue d'ensemble agents">
        <div class="command-kpis">
          <div class="kpi-chip">
            <span class="kpi-val">{{ deskAgents().length }}</span>
            <span class="kpi-lbl">Agents</span>
          </div>
          <div class="kpi-chip warn">
            <span class="kpi-val">{{ pending().length }}</span>
            <span class="kpi-lbl">Validations</span>
          </div>
          <div class="kpi-chip">
            <span class="kpi-val">{{ activeCount() }}</span>
            <span class="kpi-lbl">Actifs</span>
          </div>
          <div class="kpi-chip">
            <span class="kpi-val">{{ actions().length }}</span>
            <span class="kpi-lbl">Actions</span>
          </div>
        </div>
        <nav class="quick-nav" aria-label="Modules liés">
          @for (link of quickLinks; track link.route) {
            <a [routerLink]="link.route" class="quick-link">
              <span class="quick-label">{{ link.label }}</span>
              <span class="quick-hint">{{ link.hint }}</span>
            </a>
          }
        </nav>
      </header>

      @if (loading()) {
        <app-loading-state message="Chargement du centre agents…" />
      } @else {
        @if (pending().length) {
          <section class="feature-hub card pending-section">
            <header class="section-toolbar" role="toolbar" aria-label="Validations en attente">
              <h2 class="section-title">Validations en attente</h2>
              <span class="section-search-spacer" aria-hidden="true"></span>
              <div class="section-toolbar-end">
                <span class="section-tag">Décision humaine requise</span>
                <span class="section-count">{{ pending().length }}</span>
                <a routerLink="/app/bpm" class="btn btn-ghost btn-sm">Stratégie →</a>
              </div>
            </header>
            <div class="pending-grid">
              @for (action of pending(); track action.id) {
                <article class="pending-card">
                  <div class="pending-head">
                    <strong>{{ action.title }}</strong>
                    <app-status-badge [status]="action.workflowStatus" />
                  </div>
                  <p>{{ action.description }}</p>
                  <div class="pending-meta">
                    <span class="meta-tag">{{ action.actionType }}</span>
                    <span class="meta-agent">{{ agentName(action.agentId) }}</span>
                  </div>
                  <div class="pending-actions">
                    <button type="button" class="btn btn-primary btn-sm" (click)="approve(action.id)">Approuver</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="defer(action.id)">Reporter</button>
                    <button type="button" class="btn btn-ghost btn-sm danger" (click)="reject(action.id)">Refuser</button>
                    <a
                      class="btn btn-ghost btn-sm"
                      [routerLink]="['/app/ai-office']"
                      [queryParams]="{ agent: agentCode(action.agentId) }"
                    >3D</a>
                  </div>
                </article>
              }
            </div>
          </section>
        }

        <section class="feature-hub card">
          <header class="section-toolbar" role="toolbar" aria-label="Agents">
            <h2 class="section-title">Agents</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher un agent</span>
              <input
                class="input section-search-input"
                type="search"
                placeholder="Nom, domaine, mission…"
                [ngModel]="query()"
                (ngModelChange)="query.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">Flotte opérationnelle</span>
              <span class="section-count">{{ filteredAgents().length }} / {{ deskAgents().length }}</span>
            </div>
          </header>

          @if (domains().length > 1) {
            <div class="filter-row" role="group" aria-label="Filtrer par domaine">
              <button
                type="button"
                class="filter-chip"
                [class.active]="!domainFilter()"
                (click)="domainFilter.set('')"
              >Tous</button>
              @for (d of domains(); track d) {
                <button
                  type="button"
                  class="filter-chip"
                  [class.active]="domainFilter() === d"
                  (click)="domainFilter.set(d)"
                >{{ d }}</button>
              }
            </div>
          }

          @if (!filteredAgents().length) {
            <app-empty-state title="Aucun agent" icon="AI" description="Ajustez la recherche ou le filtre domaine." />
          } @else {
            <div class="agent-grid">
              @for (agent of filteredAgents(); track agent.id) {
                <article class="agent-card" [style.--agent-accent]="accent(agent.code)">
                  <header class="agent-head">
                    <div class="agent-identity">
                      <span class="agent-dot" aria-hidden="true"></span>
                      <strong>{{ agent.name }}</strong>
                    </div>
                    <app-status-badge [status]="agent.status" />
                  </header>
                  <p class="domain">{{ agent.domain }}</p>
                  <p class="mission">{{ agent.mission }}</p>
                  <div class="agent-actions">
                    <button
                      type="button"
                      class="btn btn-primary btn-sm"
                      [disabled]="busyId() === agent.id"
                      (click)="recommend(agent)"
                    >
                      {{ busyId() === agent.id ? '…' : 'Recommander' }}
                    </button>
                    <a class="btn btn-ghost btn-sm" [routerLink]="moduleOf(agent.code)">Module</a>
                    <a
                      class="btn btn-ghost btn-sm"
                      [routerLink]="['/app/ai-office']"
                      [queryParams]="{ agent: agent.code }"
                    >Bureau 3D</a>
                  </div>
                </article>
              }
            </div>
          }
        </section>

        <section class="feature-hub card">
          <header class="section-toolbar" role="toolbar" aria-label="Historique d'actions">
            <h2 class="section-title">Historique d'actions</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher dans l'historique</span>
              <input
                class="input section-search-input"
                type="search"
                placeholder="Titre, statut…"
                [ngModel]="historyQuery()"
                (ngModelChange)="historyQuery.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">Journal agents</span>
              <span class="section-count">{{ filteredActions().length }}</span>
            </div>
          </header>

          @if (!filteredActions().length) {
            <app-empty-state title="Aucune action" icon="ACT" description="Les recommandations et exécutions apparaîtront ici." />
          } @else {
            <div class="feature-scroll-table" role="table">
              <div class="feature-scroll-cols head hist-cols" role="row">
                <span role="columnheader">Action</span>
                <span role="columnheader">Agent</span>
                <span role="columnheader">Statut</span>
              </div>
              <div class="feature-scroll-body" role="rowgroup" [style.max-height.rem]="visibleRows * rowHeightRem">
                @for (action of filteredActions(); track action.id) {
                  <div class="feature-scroll-cols row hist-cols" role="row">
                    <span class="feature-cell feature-cell-primary" role="cell">
                      {{ action.title }}
                      <span class="cell-sub">{{ action.actionType }}</span>
                    </span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ agentName(action.agentId) }}</span>
                    <span class="feature-cell" role="cell">
                      <app-status-badge [status]="action.workflowStatus" />
                    </span>
                  </div>
                }
              </div>
            </div>
          }
        </section>

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      }
    </div>
  `,
  styles: [`
    .center-command {
      display: flex;
      flex-wrap: wrap;
      align-items: stretch;
      gap: var(--dash-inline-gap);
      margin-bottom: var(--dash-inline-gap);
    }
    .command-kpis {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dash-inline-gap);
      flex: 1;
      min-width: min(100%, 16rem);
    }
    .kpi-chip {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
      padding: var(--dash-inline-gap) var(--dash-band-gap);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
    }
    .kpi-chip.warn .kpi-val { color: var(--accent-warning); }
    .kpi-val {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: var(--fw-bold);
      color: var(--accent-primary);
    }
    .kpi-lbl { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; }

    .quick-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      align-items: stretch;
      flex: 1;
      min-width: min(100%, 18rem);
    }
    .quick-link {
      flex: 1;
      min-width: 5.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      padding: 0.55rem 0.65rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      text-decoration: none;
      color: inherit;
      transition: border-color var(--transition), background var(--transition), box-shadow var(--transition);
    }
    .quick-link:hover {
      text-decoration: none;
      border-color: var(--border-strong);
      background: color-mix(in srgb, var(--accent-primary) 8%, var(--bg-elevated));
      box-shadow: var(--shadow-sm);
    }
    .quick-label { font-size: 0.78rem; font-weight: var(--fw-semibold); color: var(--text-primary); }
    .quick-hint { font-size: 0.65rem; color: var(--text-muted); }

    .section-toolbar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 0.65rem;
      margin-bottom: var(--dash-inline-gap);
      padding-bottom: var(--dash-inline-gap);
      border-bottom: 1px solid color-mix(in srgb, var(--border-color) 70%, transparent);
    }
    .section-title { margin: 0; font-size: 0.92rem; font-weight: var(--fw-semibold); white-space: nowrap; }
    .section-search { display: flex; align-items: center; gap: 0.35rem; min-width: 0; justify-self: center; width: min(100%, 18rem); }
    .section-search-input { width: 100%; min-width: 0; }
    .section-search-spacer { min-width: 0; }
    .section-toolbar-end { display: flex; align-items: center; gap: 0.4rem; justify-self: end; flex-wrap: wrap; }
    .section-tag { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .section-count {
      font-size: 0.72rem;
      color: var(--text-secondary);
      padding: 0.15rem 0.45rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-secondary);
    }
    .btn-sm { font-size: 0.72rem; padding: 0.32rem 0.55rem; }

    .pending-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.65rem;
    }
    .pending-card {
      border: 1px solid color-mix(in srgb, var(--accent-warning) 35%, var(--border-color));
      border-radius: var(--radius-md);
      padding: 0.75rem;
      background: color-mix(in srgb, var(--accent-warning) 6%, var(--bg-elevated));
    }
    .pending-head { display: flex; justify-content: space-between; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.35rem; }
    .pending-card p { margin: 0 0 0.5rem; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45; }
    .pending-meta { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.55rem; }
    .meta-tag, .meta-agent {
      font-size: 0.68rem;
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
    }
    .pending-actions { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .pending-actions .danger { color: var(--accent-danger); }

    .filter-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: var(--dash-inline-gap); }
    .filter-chip {
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      border-radius: 999px;
      padding: 0.25rem 0.6rem;
      font-size: 0.68rem;
      font-weight: 600;
      cursor: pointer;
      transition: background var(--transition), border-color var(--transition), color var(--transition);
    }
    .filter-chip:hover { background: var(--bg-hover); color: var(--text-primary); }
    .filter-chip.active {
      background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
      border-color: var(--accent-primary);
      color: var(--accent-primary);
    }

    .agent-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 0.65rem;
    }
    .agent-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.85rem;
      background: var(--bg-elevated);
      box-shadow: var(--shadow-sm);
      transition: border-color var(--transition), box-shadow var(--transition);
    }
    .agent-card:hover {
      border-color: color-mix(in srgb, var(--agent-accent) 45%, var(--border-color));
      box-shadow: var(--shadow-md);
    }
    .agent-head { display: flex; justify-content: space-between; gap: 0.5rem; align-items: center; }
    .agent-identity { display: flex; align-items: center; gap: 0.4rem; min-width: 0; }
    .agent-dot {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
      background: var(--agent-accent);
      box-shadow: 0 0 6px color-mix(in srgb, var(--agent-accent) 55%, transparent);
      flex-shrink: 0;
    }
    .domain {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin: 0.4rem 0 0.25rem;
    }
    .mission { margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45; min-height: 2.5rem; }
    .agent-actions { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.65rem; }

    .hist-cols { grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.9fr) minmax(100px, auto); }
    .cell-sub { display: block; font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem; }
    .error { color: var(--accent-danger); margin-top: 0.75rem; }

    @media (max-width: 900px) {
      .section-toolbar { grid-template-columns: 1fr; }
      .section-search { justify-self: stretch; width: 100%; }
      .section-toolbar-end { justify-self: start; }
      .center-command { flex-direction: column; }
    }
  `],
})
export class AiCenterPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly agentStatus = inject(AgentStatusService);

  readonly quickLinks = QUICK_LINKS;
  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;
  readonly accent = accentForAgentCode;

  readonly loading = signal(true);
  readonly agents = signal<Agent[]>([]);
  readonly actions = signal<AgentAction[]>([]);
  readonly pending = signal<AgentAction[]>([]);
  readonly busyId = signal<string | null>(null);
  readonly error = signal('');
  readonly query = signal('');
  readonly historyQuery = signal('');
  readonly domainFilter = signal('');

  readonly deskAgents = computed(() => this.agents().filter((a) => a.code !== 'CEO_DIRECTION'));

  readonly domains = computed(() => {
    const set = new Set(this.deskAgents().map((a) => a.domain).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
  });

  readonly activeCount = computed(() =>
    this.deskAgents().filter((a) => a.status !== 'OFFLINE' && a.status !== 'PAUSED').length,
  );

  readonly filteredAgents = computed(() => {
    const q = this.query().trim().toLowerCase();
    const domain = this.domainFilter();
    return this.deskAgents().filter((a) => {
      if (domain && a.domain !== domain) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.domain.toLowerCase().includes(q) ||
        a.mission.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q)
      );
    });
  });

  readonly filteredActions = computed(() => {
    const q = this.historyQuery().trim().toLowerCase();
    const list = this.actions();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.actionType.toLowerCase().includes(q) ||
        statusLabel(a.workflowStatus).toLowerCase().includes(q) ||
        this.agentName(a.agentId).toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.reload();
  }

  agentCode(agentId: string): string {
    return this.agents().find((a) => a.id === agentId)?.code ?? '';
  }

  agentName(agentId: string): string {
    return this.agents().find((a) => a.id === agentId)?.name ?? agentId.slice(0, 8);
  }

  moduleOf(code: string): string {
    return moduleRouteForAgent(code);
  }

  recommend(agent: Agent): void {
    this.error.set('');
    this.busyId.set(agent.id);
    this.api.recommendAgentAction(agent.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.agentStatus.refresh();
        this.reload();
      },
      error: () => {
        this.busyId.set(null);
        this.error.set('Impossible de générer la recommandation.');
      },
    });
  }

  approve(id: string): void {
    this.api.approveAction(id, 'Approuvé depuis AI Center').subscribe({
      next: () => {
        this.agentStatus.refresh();
        this.reload();
      },
    });
  }

  reject(id: string): void {
    this.api.rejectAction(id, 'Refusé depuis AI Center').subscribe({
      next: () => {
        this.agentStatus.refresh();
        this.reload();
      },
    });
  }

  defer(id: string): void {
    this.api.deferAction(id, 'Reporté depuis AI Center').subscribe({
      next: () => {
        this.agentStatus.refresh();
        this.reload();
      },
    });
  }

  private reload(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agents.set(agents);
        this.api.getAgentActions().subscribe({
          next: (actions) => {
            this.actions.set(actions);
            this.pending.set(actions.filter((a) => a.workflowStatus === 'REQUEST_APPROVAL'));
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }
}
