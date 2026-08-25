import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent, Customer } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { AgentHubCardComponent } from '../../shared/ui/agent-hub-card/agent-hub-card.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { TenancyService } from '../../core/tenancy/tenancy.service';
import { mapHttpError } from '../../core/api/http-error.util';

@Component({
  selector: 'app-crm-page',
  imports: [
    FormsModule,
    LoadingStateComponent,
    EmptyStateComponent,
    AgentOfficeLinkComponent,
    AgentHubCardComponent,
    StatusBadgeComponent,
    RouterLink,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>CRM</h1>
          <p>Clients {{ tenancy.organizationName() }} — création, édition, suppression</p>
          <app-agent-office-link moduleKey="crm" label="CRM" />
        </div>
      </header>

      @if (loadingAgent()) {
        <app-loading-state message="Chargement agent…" />
      } @else if (agent()) {
        <app-agent-hub-card [agent]="agent()!" officeQuery="crm" />
      }

      <form class="create-form card" (ngSubmit)="save()">
        <h2>{{ editingId() ? 'Modifier le client' : 'Nouveau client' }}</h2>
        <div class="row">
          <label class="label">
            Nom
            <input class="input" name="name" [(ngModel)]="name" required maxlength="120" />
          </label>
          <label class="label">
            Email
            <input class="input" name="email" type="email" [(ngModel)]="email" maxlength="180" />
          </label>
          <label class="label">
            Secteur
            <input class="input" name="industry" [(ngModel)]="industry" maxlength="80" />
          </label>
          <label class="label">
            Statut
            <select class="input" name="status" [(ngModel)]="status">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="PROSPECT">PROSPECT</option>
            </select>
          </label>
          <button type="submit" class="btn btn-primary" [disabled]="saving() || !name.trim()">
            {{ saving() ? 'Enregistrement…' : editingId() ? 'Mettre à jour' : 'Ajouter' }}
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

      <h2 class="section-title">Clients</h2>
      @if (loading()) {
        <app-loading-state />
      } @else if (!customers().length) {
        <app-empty-state title="Aucun client" icon="CRM" />
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Secteur</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (c of customers(); track c.id) {
                <tr>
                  <td>{{ c.name }}</td>
                  <td>{{ c.email }}</td>
                  <td>{{ c.industry }}</td>
                  <td><app-status-badge [status]="c.status" /></td>
                  <td class="actions">
                    <button type="button" class="btn btn-ghost btn-sm" (click)="edit(c)">Éditer</button>
                    <button type="button" class="btn btn-danger btn-sm" (click)="remove(c)">Suppr.</button>
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
    .create-form { margin: 0 0 1.25rem; max-width: 980px; }
    .create-form h2 { margin: 0 0 0.85rem; font-size: 0.95rem; font-family: var(--font-display); }
    .row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end; }
    .label { margin-bottom: 0; min-width: 140px; flex: 1; }
    .btn-primary { align-self: flex-end; min-height: 2.4rem; }
    .error { color: var(--accent-danger); font-size: 0.8rem; margin: 0.65rem 0 0; }
    .ok { color: var(--accent-success); font-size: 0.8rem; margin: 0.65rem 0 0; }
    .table-wrap {
      overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);
      background: var(--bg-elevated);
    }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border-color); }
    th {
      font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted);
    }
    .actions { display: flex; gap: 0.35rem; white-space: nowrap; }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; min-height: auto; }
  `],
})
export class CrmPage implements OnInit {
  readonly tenancy = inject(TenancyService);
  private readonly api = inject(ApiService);
  readonly loading = signal(true);
  readonly loadingAgent = signal(true);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly formOk = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly customers = signal<Customer[]>([]);
  readonly editingId = signal<string | null>(null);
  name = '';
  email = '';
  industry = '';
  status = 'ACTIVE';

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
    this.formOk.set('');
    this.formError.set('');
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.name = '';
    this.email = '';
    this.industry = '';
    this.status = 'ACTIVE';
  }

  save(): void {
    this.formError.set('');
    this.formOk.set('');
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
        this.formOk.set(id ? 'Client mis à jour.' : 'Client créé.');
        this.cancelEdit();
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(mapHttpError(err, 'Enregistrement impossible.'));
      },
    });
  }

  remove(c: Customer): void {
    if (!confirm(`Supprimer ${c.name} ?`)) return;
    this.api.deleteCustomer(c.id).subscribe({
      next: () => this.reload(),
      error: (err) => this.formError.set(mapHttpError(err, 'Suppression impossible.')),
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
