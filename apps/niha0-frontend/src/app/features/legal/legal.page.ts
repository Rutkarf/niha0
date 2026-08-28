import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api/api.service';
import { Agent, Contract } from '../../core/api/api.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';

const VISIBLE_ROWS = 5;
const ROW_HEIGHT_REM = 2.85;

const CONTRACT_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'REVIEW_DUE', label: 'À réviser' },
  { value: 'EXPIRED', label: 'Expiré' },
];

const CONTRACT_CATEGORY_OPTIONS = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'FOURNISSEUR', label: 'Fournisseur' },
  { value: 'EMPLOYE', label: 'Employé' },
  { value: 'NDA', label: 'NDA' },
  { value: 'AUTRE', label: 'Autre' },
];

@Component({
  selector: 'app-legal-page',
  imports: [
    FormsModule,
    FeaturePageHeaderComponent,
    EmptyStateComponent,
    FeatureAgentHostComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Gestion"
        title="Juridique"
        backLabel="← AI Office Juridique"
        [backQueryParams]="{ agent: 'juridique' }"
      />
      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loadingAgent()"
        officeQuery="juridique"
        sectionLabel="Agent dédié Juridique"
        officeLinkLabel="Juridique"
      />

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <div class="legal-pair-row">
        <section class="feature-hub card legal-half">
          <header class="feature-hub-head">
            <h2 class="feature-hub-title">Nouveau contrat</h2>
            <span class="feature-hub-sub">Création et paramétrage</span>
          </header>

          <form class="legal-form" (ngSubmit)="create()">
            <div class="embedded-form-grid">
              <label class="label span-2">
                Titre
                <input class="input" name="title" [(ngModel)]="title" required maxlength="200" />
              </label>
              <label class="label">
                Catégorie
                <select class="input" name="category" [(ngModel)]="category">
                  @for (opt of categoryOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </label>
              <label class="label">
                Statut
                <select class="input" name="status" [(ngModel)]="status">
                  @for (opt of statusOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </label>
              <label class="label">
                Date de début
                <input class="input" type="date" name="startDate" [(ngModel)]="startDate" />
              </label>
              <label class="label">
                Date de fin
                <input class="input" type="date" name="endDate" [(ngModel)]="endDate" />
              </label>
              <div class="form-actions span-2">
                <button type="submit" class="btn btn-primary" [disabled]="saving() || !title.trim()">
                  {{ saving() ? 'Création…' : 'Créer le contrat' }}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section class="feature-hub card legal-half contracts-section">
          <header class="section-toolbar" role="toolbar" aria-label="Contrats">
            <h2 class="section-title">Contrats</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input
                class="input section-search-input"
                type="search"
                placeholder="Titre, catégorie, statut…"
                [ngModel]="contractQuery()"
                (ngModelChange)="contractQuery.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">Création, suivi et statut</span>
              <span class="section-count">{{ contracts().length }} contrat(s)</span>
            </div>
          </header>

          @if (loadingRows()) {
            <app-skeleton message="Chargement des contrats…" [lines]="5" />
          } @else if (!contracts().length) {
            <app-empty-state
              title="Aucun contrat"
              icon="CTR"
              description="Créez un contrat avec le formulaire à gauche."
            />
          } @else {
            @if (filteredContracts().length > visibleRows) {
              <p class="feature-scroll-hint table-hint">5 visibles · défilez</p>
            }
            <div class="feature-scroll-table" role="table" aria-label="Liste des contrats">
              <div class="feature-scroll-cols head contract-cols" role="row">
                <span role="columnheader">Titre</span>
                <span role="columnheader">Catégorie</span>
                <span role="columnheader">Statut</span>
                <span role="columnheader" class="feature-col-actions">·</span>
              </div>
              <div
                class="feature-scroll-body"
                role="rowgroup"
                [style.max-height.rem]="visibleRows * rowHeightRem"
              >
                @for (c of filteredContracts(); track c.id) {
                  <div class="feature-scroll-cols row contract-cols" role="row">
                    <span class="feature-cell feature-cell-primary" role="cell" [title]="c.title">{{ c.title }}</span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ categoryLabel(c.category) }}</span>
                    <span class="feature-cell" role="cell">
                      <select class="input stage" [ngModel]="c.status" (ngModelChange)="changeStatus(c, $event)">
                        @for (opt of statusOptions; track opt.value) {
                          <option [value]="opt.value">{{ opt.label }}</option>
                        }
                      </select>
                    </span>
                    <span class="feature-row-actions feature-col-actions" role="cell">
                      <button type="button" class="btn btn-danger btn-sm" (click)="remove(c)">×</button>
                    </span>
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
    .error { color: var(--accent-danger); }

    .legal-pair-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap, var(--space-3));
      align-items: stretch;
    }

    .legal-half {
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .legal-half .feature-hub-head {
      margin-bottom: var(--dash-inline-gap);
      padding-bottom: var(--dash-inline-gap);
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

    .contracts-section {
      display: flex;
      flex-direction: column;
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .table-hint { margin: 0; }

    .legal-form { flex: 1; }

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

    .contract-cols {
      grid-template-columns: minmax(0, 1.4fr) minmax(72px, 0.8fr) minmax(110px, 1fr) minmax(44px, auto);
    }

    .stage { min-width: 0; width: 100%; font-size: 0.78rem; padding: 0.3rem 0.4rem; }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.45rem; min-height: auto; }

    @media (max-width: 960px) {
      .legal-pair-row { grid-template-columns: 1fr; }
      .embedded-form-grid { grid-template-columns: 1fr; }
      .section-toolbar {
        grid-template-columns: 1fr;
        gap: var(--dash-inline-gap);
      }
      .section-search { max-width: none; justify-self: stretch; }
      .section-toolbar-end { justify-self: start; flex-wrap: wrap; }
    }
`],
})
export class LegalPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;
  readonly statusOptions = CONTRACT_STATUS_OPTIONS;
  readonly categoryOptions = CONTRACT_CATEGORY_OPTIONS;

  readonly loadingAgent = signal(true);
  readonly loadingRows = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly contracts = signal<Contract[]>([]);
  readonly contractQuery = signal('');

  title = '';
  category = 'CLIENT';
  status = 'DRAFT';
  startDate = '';
  endDate = '';

  readonly filteredContracts = computed(() => {
    const q = this.contractQuery().trim().toLowerCase();
    const list = this.contracts();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.category ?? '').toLowerCase().includes(q) ||
        (c.status ?? '').toLowerCase().includes(q) ||
        (c.endDate ?? '').includes(q),
    );
  });

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'JURIDIQUE') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.reload();
  }

  categoryLabel(value: string): string {
    return this.categoryOptions.find((o) => o.value === value)?.label ?? value;
  }

  create(): void {
    if (!this.title.trim()) return;
    this.error.set('');
    this.saving.set(true);
    this.api
      .createContract({
        title: this.title.trim(),
        category: this.category,
        status: this.status,
        startDate: this.startDate || undefined,
        endDate: this.endDate || undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.title = '';
          this.category = 'CLIENT';
          this.status = 'DRAFT';
          this.startDate = '';
          this.endDate = '';
          this.toast.success('Contrat créé.');
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          const msg = mapHttpError(err);
          this.error.set(msg);
          this.toast.error(msg);
        },
      });
  }

  changeStatus(c: Contract, status: string): void {
    this.api.updateContract(c.id, { ...c, status }).subscribe({
      next: () => {
        this.toast.success('Statut mis à jour.');
        this.reload();
      },
      error: (err) => {
        const msg = mapHttpError(err);
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  async remove(c: Contract): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Supprimer le contrat',
      message: `Supprimer le contrat « ${c.title} » ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteContract(c.id).subscribe({
      next: () => {
        this.toast.success('Contrat supprimé.');
        this.reload();
      },
      error: (err) => {
        const msg = mapHttpError(err);
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  private reload(): void {
    this.loadingRows.set(true);
    this.api.getContracts().subscribe({
      next: (data) => {
        this.contracts.set(data);
        this.loadingRows.set(false);
      },
      error: () => this.loadingRows.set(false),
    });
  }
}
