import { Component, inject, OnInit, signal } from '@angular/core';
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
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </label>
          <label class="label">
            Statut
            <select class="input" name="status" [(ngModel)]="status">
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
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
        @if (formError()) {
          <p class="error" role="alert">{{ formError() }}</p>
        }
        @if (formOk()) {
          <p class="ok" role="status">{{ formOk() }}</p>
        }
      </form>

      <h2 class="section-title">Tickets</h2>
      @if (loadingRows()) {
        <app-loading-state />
      } @else if (!tickets().length) {
        <app-empty-state title="Aucun ticket" icon="TKT" />
      } @else {
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
              @for (t of tickets(); track t.id) {
                <tr>
                  <td>{{ t.subject }}</td>
                  <td><app-status-badge [status]="t.status" /></td>
                  <td><app-status-badge [status]="t.priority" /></td>
                  <td>
                    <button type="button" class="btn btn-ghost" (click)="edit(t)">Éditer</button>
                  </td>
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
    .error { color: var(--accent-danger); margin: 0; }
    .ok { color: var(--accent-success, #16a34a); margin: 0; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    th, td { text-align: left; padding: 0.55rem 0.4rem; border-bottom: 1px solid var(--border-color); }
  `],
})
export class CustomerRelationsPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loadingAgent = signal(true);
  readonly loadingRows = signal(true);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly formOk = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly tickets = signal<Ticket[]>([]);
  readonly editingId = signal<string | null>(null);

  subject = '';
  description = '';
  priority = 'MEDIUM';
  status = 'OPEN';

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
    this.formOk.set('');
    this.formError.set('');
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
    this.formError.set('');
    this.formOk.set('');
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
        this.formOk.set('Ticket mis à jour.');
      } else {
        await firstValueFrom(
          this.api.createTicket({
            subject: this.subject.trim(),
            description: this.description.trim(),
            priority: this.priority,
            status: this.status,
          }),
        );
        this.formOk.set('Ticket créé.');
      }
      this.cancelEdit();
      await this.reload();
    } catch (err) {
      this.formError.set(mapHttpError(err, 'Enregistrement impossible'));
    } finally {
      this.saving.set(false);
    }
  }
}
