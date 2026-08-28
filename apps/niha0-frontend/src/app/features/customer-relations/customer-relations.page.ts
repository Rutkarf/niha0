import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Agent, Ticket } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import {
  TICKET_PRIORITY_OPTIONS,
  TICKET_STATUS_OPTIONS,
} from '../../shared/ui/status-labels';
import { TenancyService } from '../../core/tenancy/tenancy.service';
import { mapHttpError } from '../../core/api/http-error.util';

const VISIBLE_ROWS = 5;
const ROW_HEIGHT_REM = 2.85;

@Component({
  selector: 'app-customer-relations-page',
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
        title="Support"
        backLabel="← AI Office Support"
        [backQueryParams]="{ agent: 'support' }"
      />

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loadingAgent()"
        officeQuery="support"
        sectionLabel="Agent dédié Support"
        officeLinkLabel="Support"
      />

      <div class="support-pair-row">
        <section class="feature-hub card support-half">
          <header class="feature-hub-head">
            <h2 class="feature-hub-title">{{ editingId() ? 'Modifier le ticket' : 'Nouveau ticket' }}</h2>
            <span class="feature-hub-sub">Création et mise à jour</span>
          </header>

          <form class="support-form" (ngSubmit)="save()">
            <div class="embedded-form-grid">
              <label class="label span-2">
                Sujet
                <input class="input" name="subject" [(ngModel)]="subject" required maxlength="200" />
              </label>
              <label class="label">
                Priorité
                <select class="input" name="priority" [(ngModel)]="priority">
                  @for (opt of priorityOptions; track opt.value) {
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
              <label class="label span-2">
                Description
                <textarea class="input" name="description" rows="4" [(ngModel)]="description" maxlength="4000"></textarea>
              </label>
              <div class="form-actions span-2">
                <button type="submit" class="btn btn-primary" [disabled]="saving() || !subject.trim()">
                  {{ saving() ? 'Enregistrement…' : editingId() ? 'Mettre à jour' : 'Créer le ticket' }}
                </button>
                @if (editingId()) {
                  <button type="button" class="btn btn-ghost" (click)="cancelEdit()">Annuler</button>
                }
              </div>
            </div>
          </form>
        </section>

        <section class="feature-hub card support-half">
          <header class="data-list-toolbar" role="toolbar" aria-label="Tickets">
            <h2 class="section-title">Tickets</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input
                class="input feature-search-input section-search-input"
                type="search"
                placeholder="Rechercher par sujet, statut, priorité…"
                [ngModel]="listQuery()"
                (ngModelChange)="listQuery.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">{{ tenancy.companyLabel() }} — création et suivi</span>
              <span class="section-count">{{ tickets().length }} ticket(s)</span>
            </div>
          </header>

          @if (loadingRows()) {
            <app-skeleton message="Chargement des tickets…" [lines]="5" />
          } @else if (!tickets().length) {
            <app-empty-state
              title="Aucun ticket"
              icon="TKT"
              description="Créez un ticket avec le formulaire à gauche."
            />
          } @else {
            @if (filteredTickets().length > visibleRows) {
              <p class="feature-scroll-hint table-hint">5 visibles · défilez</p>
            }
            <div class="feature-scroll-table" role="table">
              <div class="feature-scroll-cols head ticket-cols" role="row">
                <span role="columnheader">Sujet</span>
                <span role="columnheader">Statut</span>
                <span role="columnheader">Priorité</span>
                <span role="columnheader" class="feature-col-actions">·</span>
              </div>
              <div
                class="feature-scroll-body"
                role="rowgroup"
                [style.max-height.rem]="visibleRows * rowHeightRem"
              >
                @for (t of filteredTickets(); track t.id) {
                  <div
                    class="feature-scroll-cols row ticket-cols"
                    role="row"
                    [class.row-editing]="editingId() === t.id"
                  >
                    <span class="feature-cell feature-cell-primary" role="cell" [title]="t.subject">{{ t.subject }}</span>
                    <span role="cell"><app-status-badge [status]="t.status" /></span>
                    <span role="cell"><app-status-badge [status]="t.priority" /></span>
                    <span class="feature-row-actions feature-col-actions" role="cell">
                      <button type="button" class="btn btn-ghost btn-sm" (click)="edit(t)">
                        {{ editingId() === t.id ? '…' : 'Éditer' }}
                      </button>
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
    .support-pair-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap, var(--space-3));
      align-items: stretch;
    }

    .support-half {
      min-width: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .support-half .data-list-toolbar {
      display: grid;
      grid-template-columns: auto minmax(12rem, 1fr) minmax(0, auto);
      align-items: center;
      width: 100%;
    }

    .support-half .section-search {
      justify-self: center;
      max-width: 28rem;
      width: 100%;
    }

    .table-hint { margin: 0; }

    .support-half .feature-hub-head {
      margin-bottom: var(--dash-inline-gap);
      padding-bottom: var(--dash-inline-gap);
    }

    .support-form {
      flex: 1;
    }

    .embedded-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap);
      align-items: end;
    }

    .span-2 { grid-column: 1 / -1; }
    .label { margin-bottom: 0; min-width: 0; display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; }

    .form-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dash-inline-gap);
      padding-top: var(--dash-inline-gap);
      border-top: 1px solid var(--border-color);
    }

    .ticket-cols {
      grid-template-columns: minmax(0, 1.5fr) 88px 88px minmax(72px, auto);
    }

    .row-editing {
      background: color-mix(in srgb, var(--accent-primary) 10%, var(--bg-elevated));
      box-shadow: inset 3px 0 0 var(--accent-primary);
    }

    .support-half .feature-search { max-width: none; flex: 1; }

    @media (max-width: 960px) {
      .support-pair-row { grid-template-columns: 1fr; }
      .embedded-form-grid { grid-template-columns: 1fr; }
    }
`],
})
export class CustomerRelationsPage implements OnInit {
  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;

  readonly tenancy = inject(TenancyService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly loadingAgent = signal(true);
  readonly loadingRows = signal(true);
  readonly saving = signal(false);
  readonly agent = signal<Agent | null>(null);
  readonly tickets = signal<Ticket[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly listQuery = signal('');
  readonly priorityOptions = TICKET_PRIORITY_OPTIONS;
  readonly statusOptions = TICKET_STATUS_OPTIONS;

  subject = '';
  description = '';
  priority = 'MEDIUM';
  status = 'OPEN';

  readonly filteredTickets = computed(() => {
    const q = this.listQuery().trim().toLowerCase();
    const list = this.tickets();
    if (!q) return list;
    return list.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        (t.status ?? '').toLowerCase().includes(q) ||
        (t.priority ?? '').toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'SUPPORT') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loadingRows.set(true);
    try {
      const data = await firstValueFrom(this.api.getTickets());
      this.tickets.set(data);
    } catch {
      this.tickets.set([]);
    } finally {
      this.loadingRows.set(false);
    }
  }

  edit(t: Ticket): void {
    this.editingId.set(t.id);
    this.subject = t.subject;
    this.description = t.description ?? '';
    this.priority = t.priority || 'MEDIUM';
    this.status = t.status || 'OPEN';
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.subject = '';
    this.description = '';
    this.priority = 'MEDIUM';
    this.status = 'OPEN';
  }

  async save(): Promise<void> {
    if (!this.subject.trim()) return;
    this.saving.set(true);
    try {
      const id = this.editingId();
      if (id) {
        await firstValueFrom(
          this.api.updateTicket(id, {
            subject: this.subject.trim(),
            description: this.description.trim(),
            priority: this.priority,
            status: this.status,
          }),
        );
        this.toast.success('Ticket mis à jour.');
      } else {
        await firstValueFrom(
          this.api.createTicket({
            subject: this.subject.trim(),
            description: this.description.trim(),
            priority: this.priority,
            status: this.status,
          }),
        );
        this.toast.success('Ticket créé.');
      }
      this.cancelEdit();
      await this.reload();
    } catch (err) {
      this.toast.error(mapHttpError(err, 'Enregistrement impossible'));
    } finally {
      this.saving.set(false);
    }
  }
}
