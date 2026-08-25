import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Agent, Ticket } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { AgentHubCardComponent } from '../../shared/ui/agent-hub-card/agent-hub-card.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import {
  TICKET_PRIORITY_OPTIONS,
  TICKET_STATUS_OPTIONS,
} from '../../shared/ui/status-labels';
import { mapHttpError } from '../../core/api/http-error.util';

@Component({
  selector: 'app-customer-relations-page',
  imports: [
    FormsModule,
    AgentOfficeLinkComponent,
    RouterLink,
    LoadingStateComponent,
    EmptyStateComponent,
    AgentHubCardComponent,
    StatusBadgeComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Support</h1>
          <p>Tickets relation client — création et mise à jour</p>
          <app-agent-office-link moduleKey="support" label="Support" />
        </div>
      </header>

      @if (loadingAgent()) {
        <app-loading-state message="Chargement agent…" />
      } @else if (agent()) {
        <app-agent-hub-card [agent]="agent()!" officeQuery="support" />
      }

      <form class="create-form card" (ngSubmit)="save()">
        <h2>{{ editingId() ? 'Modifier le ticket' : 'Nouveau ticket' }}</h2>
        <div class="row">
          <label class="label">
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
        </div>
        <label class="label block">
          Description
          <textarea class="input" name="description" rows="3" [(ngModel)]="description" maxlength="4000"></textarea>
        </label>
        <div class="actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving() || !subject.trim()">
            {{ saving() ? 'Enregistrement…' : editingId() ? 'Mettre à jour' : 'Créer' }}
          </button>
          @if (editingId()) {
            <button type="button" class="btn btn-ghost" (click)="cancelEdit()">Annuler</button>
          }
        </div>
      </form>

      <h2 class="section-title">Tickets</h2>
      @if (loadingRows()) {
        <app-skeleton message="Chargement des tickets…" [lines]="5" />
      } @else if (!tickets().length) {
        <app-empty-state
          title="Aucun ticket"
          icon="TKT"
          description="Créez un ticket avec le formulaire ci-dessus pour suivre vos demandes support."
        />
      } @else {
        <div class="table-toolbar">
          <label class="search">
            <span class="sr-only">Filtrer</span>
            <input
              class="input"
              type="search"
              placeholder="Rechercher un ticket…"
              [ngModel]="listQuery()"
              (ngModelChange)="listQuery.set($event)"
            />
          </label>
          <p class="meta">{{ filteredTickets().length }} résultat(s)</p>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sujet</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (t of filteredTickets(); track t.id) {
                <tr>
                  <td>{{ t.subject }}</td>
                  <td><app-status-badge [status]="t.status" /></td>
                  <td><app-status-badge [status]="t.priority" /></td>
                  <td>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="edit(t)">Éditer</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="empty-cell">Aucun résultat pour cette recherche</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .create-form { padding: 1rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; }
    .label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; }
    .label.block { width: 100%; }
    .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .table-toolbar {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
      gap: 0.75rem; margin-bottom: 0.75rem;
    }
    .search { flex: 1; min-width: 180px; max-width: 320px; }
    .meta { margin: 0; font-size: 0.8rem; color: var(--text-muted); }
    .table-wrap { overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-elevated); }
    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    th, td { text-align: left; padding: 0.55rem 0.4rem; border-bottom: 1px solid var(--border-color); }
    .empty-cell { text-align: center; color: var(--text-muted); padding: 1.25rem; }
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;
    }
  `],
})
export class CustomerRelationsPage implements OnInit {
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
