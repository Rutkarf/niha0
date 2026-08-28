import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Agent } from '../../core/api/api.models';
import { mapHttpError } from '../../core/api/http-error.util';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';

const VISIBLE_ROWS = 5;
const ROW_HEIGHT_REM = 2.85;

@Component({
  selector: 'app-marketing-page',
  imports: [
    FormsModule,
    FeaturePageHeaderComponent,
    FeatureAgentHostComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Espace client"
        title="Marketing"
        backLabel="← AI Office Marketing"
        [backQueryParams]="{ agent: 'marketing' }"
      />

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loadingAgent()"
        officeQuery="marketing"
        sectionLabel="Agent dédié Marketing"
        officeLinkLabel="Marketing"
      />

      <div class="marketing-pair-row">
        <section class="feature-hub card marketing-form-half">
          <header class="feature-hub-head compact-head">
            <h2 class="feature-hub-title">Nouvelle campagne</h2>
          </header>

          <form class="campaign-form-bar" (ngSubmit)="saveCampaign()">
            <span class="form-bar-label">Nouvelle campagne</span>
            <label class="field">
              <span class="field-lbl">Nom</span>
              <input class="input" name="name" [(ngModel)]="name" required maxlength="120" />
            </label>
            <label class="field field-budget">
              <span class="field-lbl">Budget</span>
              <input class="input" type="number" name="budget" [(ngModel)]="budget" required min="0" step="1" />
            </label>
            <label class="field field-status">
              <span class="field-lbl">Statut</span>
              <select class="input" name="status" [(ngModel)]="campaignStatus">
                <option value="DRAFT">Brouillon</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">En pause</option>
              </select>
            </label>
            <div class="form-bar-actions">
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="saving() || !name.trim()">
                {{ saving() ? '…' : 'Créer' }}
              </button>
            </div>
            @if (formError()) {
              <p class="error span-all" role="alert">{{ formError() }}</p>
            }
            @if (formOk()) {
              <p class="ok span-all" role="status">{{ formOk() }}</p>
            }
          </form>
        </section>

        <section class="feature-hub card marketing-list-half">
          <header class="section-toolbar" role="toolbar" aria-label="Campagnes">
            <h2 class="section-title">Campagnes</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input
                class="input section-search-input"
                type="search"
                placeholder="Rechercher par nom, statut, budget…"
                [ngModel]="listQuery()"
                (ngModelChange)="listQuery.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">Création et suivi des campagnes</span>
              <span class="section-count">{{ rows().length }} campagne(s)</span>
            </div>
          </header>

          @if (loadingRows()) {
            <app-skeleton message="Chargement des campagnes…" [lines]="5" />
          } @else if (!rows().length) {
            <app-empty-state
              title="Aucune campagne"
              icon="CMP"
              description="Créez une campagne avec le formulaire à gauche."
            />
          } @else {
            @if (filteredRows().length > visibleRows) {
              <p class="feature-scroll-hint table-hint">5 visibles · défilez</p>
            }
            <div class="feature-scroll-table" role="table">
              <div class="feature-scroll-cols head camp-cols" role="row">
                <span role="columnheader">Campagne</span>
                <span role="columnheader">Statut</span>
                <span role="columnheader">Budget</span>
              </div>
              <div
                class="feature-scroll-body"
                role="rowgroup"
                [style.max-height.rem]="visibleRows * rowHeightRem"
              >
                @for (row of filteredRows(); track row['id']) {
                  <div class="feature-scroll-cols row camp-cols" role="row">
                    <span class="feature-cell feature-cell-primary" role="cell" [title]="String(row['name'])">{{ row['name'] }}</span>
                    <span role="cell"><app-status-badge [status]="$any(row)['status']" /></span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ row['budget'] }}</span>
                  </div>
                } @empty {
                  <p class="feature-empty-filter">Aucun résultat</p>
                }
              </div>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .marketing-pair-row {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: var(--dash-inline-gap, var(--space-3));
      align-items: stretch;
    }

    .marketing-form-half,
    .marketing-list-half {
      min-width: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .compact-head {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .campaign-form-bar {
      display: flex;
      flex-wrap: nowrap;
      align-items: flex-end;
      gap: var(--dash-inline-gap, var(--space-3));
      padding: var(--dash-inline-gap) 0;
      border-bottom: 1px solid var(--border-color);
      overflow-x: auto;
    }

    .form-bar-label {
      flex-shrink: 0;
      font-size: 0.72rem;
      font-weight: var(--fw-bold);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      padding-bottom: 0.45rem;
      min-width: 6rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      flex: 1 1 0;
      min-width: 100px;
      margin: 0;
    }

    .field-budget {
      flex: 0 0 100px;
      min-width: 90px;
    }

    .field-status {
      flex: 0 0 120px;
      min-width: 110px;
    }

    .field-lbl {
      font-size: 0.72rem;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .field .input {
      width: 100%;
      font-size: 0.85rem;
      padding: 0.4rem 0.5rem;
    }

    .form-bar-actions {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      padding-bottom: 0.1rem;
    }

    .span-all {
      flex: 1 1 100%;
      width: 100%;
      margin: 0.35rem 0 0;
    }

    .section-toolbar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: var(--dash-inline-gap, var(--space-3));
      padding-bottom: var(--dash-inline-gap);
      border-bottom: 1px solid var(--border-color);
    }

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

    .table-hint { margin: 0; }

    .marketing-form-half .feature-hub-head,
    .marketing-list-half .feature-hub-head {
      margin-bottom: var(--dash-inline-gap);
      padding-bottom: var(--dash-inline-gap);
    }

    .marketing-form {
      flex: 1;
    }

    .embedded-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap);
      align-items: end;
    }

    .span-2 { grid-column: 1 / -1; }
    .label {
      margin-bottom: 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.8rem;
    }

    .form-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dash-inline-gap);
      padding-top: var(--dash-inline-gap);
      border-top: 1px solid var(--border-color);
    }

    .camp-cols {
      grid-template-columns: minmax(0, 1.5fr) 88px minmax(64px, auto);
    }

    .btn-sm {
      font-size: 0.72rem;
      padding: 0.3rem 0.55rem;
      min-height: auto;
      white-space: nowrap;
    }

    .error { color: var(--accent-danger); font-size: var(--fs-sm); }
    .ok { color: var(--accent-success, #16a34a); font-size: var(--fs-sm); }

    @media (max-width: 960px) {
      .marketing-pair-row { grid-template-columns: 1fr; }
      .campaign-form-bar { flex-wrap: wrap; }
      .form-bar-label { width: 100%; padding-bottom: 0; }
      .section-toolbar {
        grid-template-columns: 1fr;
        gap: var(--dash-inline-gap);
      }
      .section-search { max-width: none; justify-self: stretch; }
      .section-toolbar-end { justify-self: start; flex-wrap: wrap; }
    }
`],
})
export class MarketingPage implements OnInit {
  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;
  protected readonly String = String;

  private readonly api = inject(ApiService);
  readonly loadingAgent = signal(true);
  readonly loadingRows = signal(true);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly formOk = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly listQuery = signal('');

  name = '';
  budget = 0;
  campaignStatus: 'DRAFT' | 'ACTIVE' | 'PAUSED' = 'DRAFT';

  readonly filteredRows = computed(() => {
    const q = this.listQuery().trim().toLowerCase();
    const list = this.rows();
    if (!q) return list;
    return list.filter((row) => {
      const name = String(row['name'] ?? '').toLowerCase();
      const status = String(row['status'] ?? '').toLowerCase();
      const budget = String(row['budget'] ?? '');
      return name.includes(q) || status.includes(q) || budget.includes(q);
    });
  });

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'MARKETING') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loadingRows.set(true);
    try {
      const data = await firstValueFrom(this.api.getCampaigns());
      this.rows.set(data as unknown as Record<string, unknown>[]);
    } catch {
      this.rows.set([]);
    } finally {
      this.loadingRows.set(false);
    }
  }

  async saveCampaign(): Promise<void> {
    if (!this.name.trim()) return;
    this.saving.set(true);
    this.formError.set('');
    this.formOk.set('');
    try {
      await firstValueFrom(
        this.api.createCampaign({ name: this.name.trim(), budget: this.budget, status: this.campaignStatus }),
      );
      this.formOk.set('Campagne créée.');
      this.name = '';
      this.budget = 0;
      await this.reload();
    } catch (err) {
      this.formError.set(mapHttpError(err, 'Création impossible'));
    } finally {
      this.saving.set(false);
    }
  }
}
