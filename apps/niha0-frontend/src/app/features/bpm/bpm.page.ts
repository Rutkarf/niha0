import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent, AgentAction, AgentApproval } from '../../core/api/api.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';
import { statusLabel } from '../../shared/ui/status-labels';

const VISIBLE_ROWS = 5;
const ROW_HEIGHT_REM = 2.85;

@Component({
  selector: 'app-bpm-page',
  imports: [
    FormsModule,
    DatePipe,
    RouterLink,
    EmptyStateComponent,
    SkeletonComponent,
    StatusBadgeComponent,
    FeaturePageHeaderComponent,
    FeatureAgentHostComponent,
  ],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Pilotage"
        title="Stratégie / BPM"
        backLabel="← AI Office Stratégie / BPM"
        [backQueryParams]="{ agent: 'strategie' }"
      >
        <div actions>
          <a routerLink="/app/governance" class="btn btn-ghost">Gouvernance</a>
          <a routerLink="/app/ai-office" class="btn btn-ghost">Command Center</a>
        </div>
      </app-feature-page-header>

      <app-feature-agent-host
        [agent]="strategyAgent()"
        [loading]="loadingAgent()"
        officeQuery="strategie"
        sectionLabel="Agent dédié Stratégie"
        officeLinkLabel="Stratégie"
      />

      <div class="bpm-kpis">
        <div class="kpi-chip"><span class="kpi-val">{{ pending().length }}</span><span class="kpi-lbl">En attente</span></div>
        <div class="kpi-chip"><span class="kpi-val">{{ approvedCount() }}</span><span class="kpi-lbl">Approuvées</span></div>
        <div class="kpi-chip"><span class="kpi-val">{{ rejectedCount() }}</span><span class="kpi-lbl">Refusées</span></div>
        <div class="kpi-chip"><span class="kpi-val">{{ deferredCount() }}</span><span class="kpi-lbl">Reportées</span></div>
      </div>

      <div class="bpm-pair-row">
        <section class="feature-hub card bpm-half">
          <header class="section-toolbar" role="toolbar" aria-label="Décision">
            <h2 class="section-title">Décision</h2>
            <span class="section-search-spacer" aria-hidden="true"></span>
            <div class="section-toolbar-end">
              <span class="section-tag">Validation CEO</span>
              @if (selected()) {
                <span class="section-count">{{ statusLabel(selected()!.workflowStatus) }}</span>
              }
            </div>
          </header>

          @if (!selected()) {
            <app-empty-state
              title="Sélectionnez une action"
              icon="OKR"
              description="Choisissez une validation en attente dans la liste à droite."
            />
          } @else {
            <div class="action-detail">
              <h3>{{ selected()!.title }}</h3>
              <p class="action-desc">{{ selected()!.description }}</p>
              <div class="action-meta">
                <app-status-badge [status]="selected()!.workflowStatus" />
                <span class="meta-tag">{{ selected()!.actionType }}</span>
              </div>
              @if (payloadPreview(); as payload) {
                <details class="payload-box" open>
                  <summary>Payload proposé</summary>
                  <pre>{{ payload }}</pre>
                </details>
              }
              <label class="label">
                Commentaire
                <textarea class="input" rows="2" [(ngModel)]="comment" name="comment" placeholder="Motif de la décision…"></textarea>
              </label>
              <div class="decision-actions">
                <button type="button" class="btn btn-primary" [disabled]="deciding()" (click)="decide('approve')">Approuver</button>
                <button type="button" class="btn btn-ghost" [disabled]="deciding()" (click)="decide('reject')">Refuser</button>
                <button type="button" class="btn btn-ghost" [disabled]="deciding()" (click)="decide('defer')">Reporter</button>
                <button type="button" class="btn btn-ghost" [disabled]="deciding()" (click)="decide('modify')">Modifier</button>
              </div>
            </div>
          }
        </section>

        <section class="feature-hub card bpm-half">
          <header class="section-toolbar" role="toolbar" aria-label="Validations en attente">
            <h2 class="section-title">Validations en attente</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input
                class="input section-search-input"
                type="search"
                placeholder="Titre, type…"
                [ngModel]="query()"
                (ngModelChange)="query.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">OKR, risques, décisions</span>
              <span class="section-count">{{ pending().length }} action(s)</span>
            </div>
          </header>

          @if (loading()) {
            <app-skeleton message="Chargement des validations…" [lines]="5" />
          } @else if (!pending().length) {
            <app-empty-state title="Aucune validation" icon="OKR" description="Le command center est à jour." />
          } @else {
            <div class="feature-scroll-body pending-scroll" [style.max-height.rem]="visibleRows * rowHeightRem">
              @for (action of filteredPending(); track action.id) {
                <button
                  type="button"
                  class="pending-item"
                  [class.active]="selected()?.id === action.id"
                  (click)="selectAction(action)"
                >
                  <strong>{{ action.title }}</strong>
                  <span class="pending-sub">{{ action.actionType }} · {{ statusLabel(action.workflowStatus) }}</span>
                </button>
              } @empty {
                <p class="feature-empty-filter">Aucun résultat</p>
              }
            </div>
          }
        </section>
      </div>

      <section class="feature-hub card">
        <header class="section-toolbar" role="toolbar" aria-label="Historique des décisions">
          <h2 class="section-title">Historique des décisions</h2>
          <span class="section-search-spacer" aria-hidden="true"></span>
          <div class="section-toolbar-end">
            <span class="section-tag">Journal des validations</span>
            <span class="section-count">{{ history().length }} décision(s)</span>
          </div>
        </header>
        @if (!history().length) {
          <app-empty-state title="Aucun historique" icon="OKR" description="Les décisions apparaîtront ici." />
        } @else {
          <div class="feature-scroll-table" role="table">
            <div class="feature-scroll-cols head hist-cols" role="row">
              <span role="columnheader">Décision</span>
              <span role="columnheader">Commentaire</span>
              <span role="columnheader">Date</span>
            </div>
            <div class="feature-scroll-body" role="rowgroup" [style.max-height.rem]="visibleRows * rowHeightRem">
              @for (h of history(); track h.id) {
                <div class="feature-scroll-cols row hist-cols" role="row">
                  <span class="feature-cell feature-cell-primary" role="cell">
                    <app-status-badge [status]="h.decision" />
                    <span class="cell-sub">{{ actionTitle(h.actionId) }}</span>
                  </span>
                  <span class="feature-cell feature-cell-muted" role="cell">{{ h.comment || '—' }}</span>
                  <span class="feature-cell feature-cell-muted" role="cell">{{ h.decidedAt | date: 'short' }}</span>
                </div>
              }
            </div>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .bpm-kpis { display: flex; flex-wrap: wrap; gap: var(--dash-inline-gap); margin-bottom: var(--dash-inline-gap); }
    .kpi-chip { display: flex; align-items: baseline; gap: 0.4rem; padding: var(--dash-inline-gap) var(--dash-band-gap); border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-elevated); }
    .kpi-val { font-family: var(--font-display); font-size: 1.1rem; font-weight: var(--fw-bold); color: var(--accent-primary); }
    .kpi-lbl { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; }

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
    .section-count { font-size: 0.72rem; color: var(--text-secondary); padding: 0.15rem 0.45rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-secondary); }

    .bpm-pair-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--dash-inline-gap); align-items: stretch; }
    .bpm-half { min-width: 0; display: flex; flex-direction: column; }

    .action-detail h3 { margin: 0 0 0.5rem; font-size: 1rem; }
    .action-desc { margin: 0 0 0.75rem; color: var(--text-secondary); font-size: 0.85rem; }
    .action-meta { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .meta-tag { font-size: 0.72rem; padding: 0.2rem 0.45rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-muted); }
    .payload-box { margin-bottom: 0.75rem; font-size: 0.8rem; }
    .payload-box pre { margin: 0.5rem 0 0; padding: 0.65rem; background: var(--bg-secondary); border-radius: var(--radius-sm); font-size: 0.72rem; overflow-x: auto; white-space: pre-wrap; }
    .label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; margin-bottom: 0.75rem; }
    .decision-actions { display: flex; flex-wrap: wrap; gap: var(--dash-inline-gap); }

    .pending-scroll { display: flex; flex-direction: column; gap: 0.35rem; overflow-y: auto; }
    .pending-item {
      text-align: left; border: 1px solid var(--border-color); background: var(--bg-primary);
      border-radius: var(--radius-md); padding: 0.6rem 0.75rem; cursor: pointer; color: inherit;
    }
    .pending-item.active { border-color: var(--accent-primary); background: color-mix(in srgb, var(--accent-primary) 10%, transparent); box-shadow: inset 3px 0 0 var(--accent-primary); }
    .pending-item strong { display: block; font-size: 0.85rem; }
    .pending-sub { font-size: 0.72rem; color: var(--text-muted); }

    .hist-cols { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.4fr) minmax(100px, auto); }
    .cell-sub { display: block; font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem; }

    @media (max-width: 960px) {
      .bpm-pair-row { grid-template-columns: 1fr; }
      .section-toolbar { grid-template-columns: 1fr; }
      .section-search { justify-self: stretch; width: 100%; }
      .section-toolbar-end { justify-self: start; }
    }
  `],
})
export class BpmPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;
  readonly statusLabel = statusLabel;

  readonly loadingAgent = signal(true);
  readonly loading = signal(true);
  readonly deciding = signal(false);
  readonly strategyAgent = signal<Agent | null>(null);
  readonly pending = signal<AgentAction[]>([]);
  readonly allActions = signal<AgentAction[]>([]);
  readonly history = signal<AgentApproval[]>([]);
  readonly selected = signal<AgentAction | null>(null);
  readonly query = signal('');

  comment = '';

  readonly approvedCount = computed(() => this.history().filter((h) => h.decision === 'APPROVED').length);
  readonly rejectedCount = computed(() => this.history().filter((h) => h.decision === 'REJECTED').length);
  readonly deferredCount = computed(() => this.history().filter((h) => h.decision === 'DEFERRED').length);

  readonly filteredPending = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.pending();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.actionType.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q),
    );
  });

  readonly payloadPreview = computed(() => {
    const sel = this.selected();
    if (!sel?.draftPayload) return '';
    try {
      return JSON.stringify(JSON.parse(sel.draftPayload), null, 2);
    } catch {
      return sel.draftPayload;
    }
  });

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.strategyAgent.set(agents.find((a) => a.code === 'STRATEGIE') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.reload();
  }

  selectAction(action: AgentAction): void {
    this.selected.set(action);
    this.comment = '';
  }

  actionTitle(actionId: string): string {
    return this.allActions().find((a) => a.id === actionId)?.title ?? actionId.slice(0, 8);
  }

  decide(kind: 'approve' | 'reject' | 'defer' | 'modify'): void {
    const sel = this.selected();
    if (!sel) return;
    this.deciding.set(true);
    const c = this.comment.trim();
    const req =
      kind === 'approve'
        ? this.api.approveAction(sel.id, c)
        : kind === 'reject'
          ? this.api.rejectAction(sel.id, c)
          : kind === 'defer'
            ? this.api.deferAction(sel.id, c)
            : this.api.modifyAction(sel.id, c);
    req.subscribe({
      next: () => {
        this.deciding.set(false);
        this.toast.success('Décision enregistrée.');
        this.selected.set(null);
        this.comment = '';
        this.reload();
      },
      error: (err) => {
        this.deciding.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.api.getPendingApprovals().subscribe({
      next: (data) => {
        this.pending.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.api.getAgentActions().subscribe({
      next: (data) => this.allActions.set(data),
    });
    this.api.getApprovals().subscribe({
      next: (data) => this.history.set(data),
    });
  }
}
