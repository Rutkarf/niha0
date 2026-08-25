import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent, Contract } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { AgentHubCardComponent } from '../../shared/ui/agent-hub-card/agent-hub-card.component';
import { mapHttpError } from '../../core/api/http-error.util';

@Component({
  selector: 'app-legal-page',
  imports: [
    FormsModule,
    AgentOfficeLinkComponent,
    RouterLink,
    LoadingStateComponent,
    EmptyStateComponent,
    AgentHubCardComponent,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Juridique</h1>
          <p>Contrats, conformité et agent Juridique</p>
          <p class="callout callout-warning" role="note">
            L’agent Juridique est une aide documentaire. Il ne constitue pas un conseil juridique professionnel.
          </p>
          <app-agent-office-link moduleKey="legal" label="Juridique" />
        </div>
      </header>

      @if (loadingAgent()) {
        <app-loading-state message="Chargement agent…" />
      } @else if (agent()) {
        <app-agent-hub-card [agent]="agent()!" officeQuery="juridique" />
      }

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <form class="card form" (ngSubmit)="create()">
        <h2>Nouveau contrat</h2>
        <div class="row">
          <input class="input" placeholder="Titre" [(ngModel)]="title" name="title" required />
          <input class="input" placeholder="Catégorie" [(ngModel)]="category" name="category" />
          <select class="input" [(ngModel)]="status" name="status">
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="REVIEW_DUE">REVIEW_DUE</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
          <input class="input" type="date" [(ngModel)]="endDate" name="endDate" />
          <button class="btn btn-primary" type="submit" [disabled]="saving()">Créer</button>
        </div>
      </form>

      <h2 class="section-title">Contrats</h2>
      @if (loadingRows()) {
        <app-loading-state />
      } @else if (!contracts().length) {
        <app-empty-state title="Aucun contrat" icon="CTR" />
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Titre</th><th>Catégorie</th><th>Statut</th><th>Fin</th><th></th></tr>
            </thead>
            <tbody>
              @for (c of contracts(); track c.id) {
                <tr>
                  <td>{{ c.title }}</td>
                  <td>{{ c.category }}</td>
                  <td>
                    <select class="input stage" [ngModel]="c.status" (ngModelChange)="changeStatus(c, $event)">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="REVIEW_DUE">REVIEW_DUE</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </td>
                  <td>{{ c.endDate }}</td>
                  <td>
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
    .form { margin-bottom: 1rem; padding: 1rem; }
    .form h2 { margin: 0 0 0.75rem; font-size: 0.95rem; }
    .row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .row .input { flex: 1; min-width: 120px; }
    .error { color: var(--accent-danger); }
    .table-wrap { overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-elevated); }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.65rem 0.85rem; border-bottom: 1px solid var(--border-color); text-align: left; }
    .stage { min-width: 120px; font-size: 0.8rem; }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; min-height: auto; }
  `],
})
export class LegalPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loadingAgent = signal(true);
  readonly loadingRows = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly contracts = signal<Contract[]>([]);
  title = '';
  category = 'CLIENT';
  status = 'ACTIVE';
  endDate = '';

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

  create(): void {
    this.error.set('');
    this.saving.set(true);
    this.api.createContract({
      title: this.title.trim(),
      category: this.category.trim(),
      status: this.status,
      endDate: this.endDate || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.title = '';
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(mapHttpError(err));
      },
    });
  }

  changeStatus(c: Contract, status: string): void {
    this.api.updateContract(c.id, { ...c, status }).subscribe({
      next: () => this.reload(),
      error: (err) => this.error.set(mapHttpError(err)),
    });
  }

  remove(c: Contract): void {
    if (!confirm(`Supprimer ${c.title} ?`)) return;
    this.api.deleteContract(c.id).subscribe({
      next: () => this.reload(),
      error: (err) => this.error.set(mapHttpError(err)),
    });
  }

  private reload(): void {
    this.api.getContracts().subscribe({
      next: (data) => {
        this.contracts.set(data);
        this.loadingRows.set(false);
      },
      error: () => this.loadingRows.set(false),
    });
  }
}
