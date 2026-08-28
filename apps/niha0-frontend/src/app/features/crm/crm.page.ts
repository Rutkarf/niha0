import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api/api.service';
import { Agent, Customer } from '../../core/api/api.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { CUSTOMER_STATUS_OPTIONS } from '../../shared/ui/status-labels';
import { TenancyService } from '../../core/tenancy/tenancy.service';
import { mapHttpError } from '../../core/api/http-error.util';

const VISIBLE_CLIENT_ROWS = 5;
const CLIENT_ROW_HEIGHT_REM = 2.85;

@Component({
  selector: 'app-crm-page',
  imports: [
    FormsModule,
    EmptyStateComponent,
    FeaturePageHeaderComponent,
    FeatureAgentHostComponent,
    StatusBadgeComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Espace client"
        title="CRM"
        backLabel="← AI Office CRM"
        [backQueryParams]="{ agent: 'crm' }"
      />

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loadingAgent()"
        officeQuery="crm"
        sectionLabel="Agent dédié CRM"
        officeLinkLabel="CRM"
      />

      <section class="feature-hub card crm-clients">
        <header class="data-list-toolbar" role="toolbar" aria-label="Clients">
          <h2 class="section-title">Clients</h2>
          <label class="section-search">
            <span class="feature-search-icon" aria-hidden="true">⌕</span>
            <span class="sr-only">Rechercher</span>
            <input
              class="input feature-search-input section-search-input"
              type="search"
              placeholder="Rechercher par nom, email, secteur…"
              [ngModel]="listQuery()"
              (ngModelChange)="listQuery.set($event)"
            />
          </label>
          <div class="section-toolbar-end">
            <span class="section-tag">{{ tenancy.companyLabel() }} — création, édition et liste</span>
            <span class="section-count">{{ customers().length }} client(s)</span>
          </div>
        </header>

        <form class="client-form-bar" (ngSubmit)="save()">
          <span class="form-bar-label">{{ editingId() ? 'Modifier' : 'Nouveau client' }}</span>
          <label class="field">
            <span class="field-lbl">Nom</span>
            <input class="input" name="name" [(ngModel)]="name" required maxlength="120" />
          </label>
          <label class="field">
            <span class="field-lbl">Email</span>
            <input class="input" name="email" type="email" [(ngModel)]="email" maxlength="180" />
          </label>
          <label class="field">
            <span class="field-lbl">Secteur</span>
            <input class="input" name="industry" [(ngModel)]="industry" maxlength="80" />
          </label>
          <label class="field field-status">
            <span class="field-lbl">Statut</span>
            <select class="input" name="status" [(ngModel)]="status">
              @for (opt of statusOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
          </label>
          <div class="form-bar-actions">
            <button type="submit" class="btn btn-primary btn-sm" [disabled]="saving() || !name.trim()">
              {{ saving() ? '…' : editingId() ? 'Mettre à jour' : 'Ajouter' }}
            </button>
            @if (editingId()) {
              <button type="button" class="btn btn-ghost btn-sm" (click)="cancelEdit()">Annuler</button>
            }
          </div>
        </form>

        <div class="clients-table-wrap">
          @if (loading()) {
            <app-skeleton message="Chargement des clients…" [lines]="5" />
          } @else if (!customers().length) {
            <app-empty-state
              title="Aucun client"
              icon="CRM"
              description="Renseignez le formulaire ci-dessus pour ajouter votre premier client."
            />
          } @else {
            @if (filteredCustomers().length > visibleRows) {
              <p class="feature-scroll-hint table-hint">5 visibles · défilez</p>
            }
            <div class="feature-scroll-table" role="table" aria-label="Clients">
              <div class="feature-scroll-cols head client-cols" role="row">
                <span role="columnheader">Nom</span>
                <span role="columnheader">Email</span>
                <span role="columnheader">Secteur</span>
                <span role="columnheader">Statut</span>
                <span role="columnheader" class="feature-col-actions">·</span>
              </div>
              <div
                class="feature-scroll-body"
                role="rowgroup"
                [style.max-height.rem]="visibleRows * rowHeightRem"
              >
                @for (c of filteredCustomers(); track c.id) {
                  <div
                    class="feature-scroll-cols row client-cols"
                    role="row"
                    [class.row-editing]="editingId() === c.id"
                  >
                    <span class="feature-cell feature-cell-primary" role="cell">{{ c.name }}</span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ c.email || '—' }}</span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ c.industry || '—' }}</span>
                    <span role="cell"><app-status-badge [status]="c.status" /></span>
                    <span class="feature-row-actions feature-col-actions" role="cell">
                      <button type="button" class="btn btn-ghost btn-sm" (click)="edit(c)">Éditer</button>
                      <button type="button" class="btn btn-danger btn-sm" (click)="remove(c)">×</button>
                    </span>
                  </div>
                } @empty {
                  <p class="feature-empty-filter">Aucun résultat pour « {{ listQuery() }} »</p>
                }
              </div>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .crm-clients {
      display: flex;
      flex-direction: column;
      gap: var(--dash-inline-gap, var(--space-3));
      min-width: 0;
    }

    .crm-clients .data-list-toolbar {
      display: grid;
      grid-template-columns: auto minmax(12rem, 1fr) minmax(0, auto);
      align-items: center;
      width: 100%;
    }

    .crm-clients .section-search {
      justify-self: center;
      max-width: 28rem;
      width: 100%;
    }

    .crm-clients .section-toolbar-end {
      justify-self: end;
    }

    .client-form-bar {
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
      min-width: 5.5rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      flex: 1 1 0;
      min-width: 120px;
      margin: 0;
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
      gap: 0.35rem;
      flex-shrink: 0;
      padding-bottom: 0.1rem;
    }

    .clients-table-wrap {
      min-width: 0;
    }

    .table-hint {
      margin: 0 0 var(--dash-inline-gap);
    }

    .client-cols {
      grid-template-columns: minmax(100px, 1.2fr) minmax(120px, 1.4fr) minmax(90px, 1fr) 96px minmax(100px, auto);
    }

    .row-editing {
      background: color-mix(in srgb, var(--accent-primary) 10%, var(--bg-elevated));
      box-shadow: inset 3px 0 0 var(--accent-primary);
    }

    .btn-sm {
      font-size: 0.72rem;
      padding: 0.3rem 0.55rem;
      min-height: auto;
      white-space: nowrap;
    }
@media (max-width: 900px) {
      .client-form-bar {
        flex-wrap: wrap;
      }
      .form-bar-label {
        width: 100%;
        padding-bottom: 0;
      }
    }
  `],
})
export class CrmPage implements OnInit {
  readonly visibleRows = VISIBLE_CLIENT_ROWS;
  readonly rowHeightRem = CLIENT_ROW_HEIGHT_REM;

  readonly tenancy = inject(TenancyService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly loading = signal(true);
  readonly loadingAgent = signal(true);
  readonly saving = signal(false);
  readonly agent = signal<Agent | null>(null);
  readonly customers = signal<Customer[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly listQuery = signal('');
  readonly statusOptions = CUSTOMER_STATUS_OPTIONS;
  name = '';
  email = '';
  industry = '';
  status = 'ACTIVE';

  readonly filteredCustomers = computed(() => {
    const q = this.listQuery().trim().toLowerCase();
    const list = this.customers();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.industry ?? '').toLowerCase().includes(q) ||
        (c.status ?? '').toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'CRM') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.reload();
  }

  edit(c: Customer): void {
    this.editingId.set(c.id);
    this.name = c.name;
    this.email = c.email ?? '';
    this.industry = c.industry ?? '';
    this.status = c.status || 'ACTIVE';
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.name = '';
    this.email = '';
    this.industry = '';
    this.status = 'ACTIVE';
  }

  save(): void {
    if (!this.name.trim()) return;
    this.saving.set(true);
    const body = {
      name: this.name.trim(),
      email: this.email.trim() || '',
      industry: this.industry.trim() || '',
      status: this.status,
    };
    const id = this.editingId();
    const req = id
      ? this.api.updateCustomer(id, body)
      : this.api.createCustomer(body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(id ? 'Client mis à jour.' : 'Client créé.');
        this.cancelEdit();
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(mapHttpError(err, 'Enregistrement impossible.'));
      },
    });
  }

  async remove(c: Customer): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Supprimer le client',
      message: `Voulez-vous supprimer « ${c.name} » ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteCustomer(c.id).subscribe({
      next: () => {
        this.toast.success('Client supprimé.');
        this.reload();
      },
      error: (err) => this.toast.error(mapHttpError(err, 'Suppression impossible.')),
    });
  }

  private reload(): void {
    this.api.getCustomers().subscribe({
      next: (data) => {
        this.customers.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
