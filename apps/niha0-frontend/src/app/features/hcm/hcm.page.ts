import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent, Employee, LeaveRequest } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { AgentHubCardComponent } from '../../shared/ui/agent-hub-card/agent-hub-card.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { mapHttpError } from '../../core/api/http-error.util';

@Component({
  selector: 'app-hcm-page',
  imports: [
    FormsModule,
    RouterLink,
    LoadingStateComponent,
    EmptyStateComponent,
    AgentOfficeLinkComponent,
    AgentHubCardComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>RH / HCM</h1>
          <p>Collaborateurs, congés et agent RH</p>
          <app-agent-office-link moduleKey="rh" label="RH" />
        </div>
      </header>

      @if (loadingAgent()) {
        <app-loading-state message="Chargement agent…" />
      } @else if (agent()) {
        <app-agent-hub-card [agent]="agent()!" officeQuery="rh" />
      }

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <form class="card form" (ngSubmit)="addEmployee()">
        <h2>Nouveau collaborateur</h2>
        <div class="row">
          <input class="input" placeholder="Prénom" [(ngModel)]="firstName" name="firstName" required />
          <input class="input" placeholder="Nom" [(ngModel)]="lastName" name="lastName" required />
          <input class="input" placeholder="Poste" [(ngModel)]="jobTitle" name="jobTitle" />
          <input class="input" placeholder="Département" [(ngModel)]="department" name="department" />
          <button class="btn btn-primary" type="submit" [disabled]="savingEmp()">Ajouter</button>
        </div>
      </form>

      <h2 class="section-title">Équipe</h2>
      @if (loadingEmp()) {
        <app-loading-state />
      } @else if (!employees().length) {
        <app-empty-state title="Aucun collaborateur" icon="RH" />
      } @else {
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nom</th><th>Poste</th><th>Département</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              @for (e of employees(); track e.id) {
                <tr>
                  <td>{{ e.firstName }} {{ e.lastName }}</td>
                  <td>{{ e.jobTitle }}</td>
                  <td>{{ e.department }}</td>
                  <td><app-status-badge [status]="e.status" /></td>
                  <td><button type="button" class="btn btn-danger btn-sm" (click)="removeEmployee(e)">Suppr.</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <h2 class="section-title">Congés</h2>
      @if (loadingLeaves()) {
        <app-loading-state />
      } @else if (!leaves().length) {
        <app-empty-state title="Aucune demande" icon="LV" />
      } @else {
        <div class="table-wrap">
          <table>
            <thead><tr><th>Employé</th><th>Type</th><th>Dates</th><th>Jours</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              @for (l of leaves(); track l.id) {
                <tr>
                  <td>{{ employeeLabel(l.employeeId) }}</td>
                  <td>{{ l.leaveType }}</td>
                  <td>{{ l.startDate }} → {{ l.endDate }}</td>
                  <td>{{ l.days }}</td>
                  <td><app-status-badge [status]="l.status" /></td>
                  <td class="actions">
                    @if (l.status === 'PENDING') {
                      <button type="button" class="btn btn-primary btn-sm" (click)="decide(l, 'APPROVED')">Approuver</button>
                      <button type="button" class="btn btn-ghost btn-sm" (click)="decide(l, 'REJECTED')">Refuser</button>
                    }
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
    .table-wrap { overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 1.5rem; background: var(--bg-elevated); }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.65rem 0.85rem; border-bottom: 1px solid var(--border-color); text-align: left; }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; min-height: auto; }
    .actions { display: flex; gap: 0.35rem; }
  `],
})
export class HcmPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loadingAgent = signal(true);
  readonly loadingEmp = signal(true);
  readonly loadingLeaves = signal(true);
  readonly savingEmp = signal(false);
  readonly error = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly employees = signal<Employee[]>([]);
  readonly leaves = signal<LeaveRequest[]>([]);
  firstName = '';
  lastName = '';
  jobTitle = '';
  department = '';

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'RH') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.reload();
  }

  employeeLabel(id: string): string {
    const e = this.employees().find((x) => x.id === id);
    return e ? `${e.firstName} ${e.lastName}` : id.slice(0, 8);
  }

  addEmployee(): void {
    this.error.set('');
    this.savingEmp.set(true);
    this.api.createEmployee({
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      jobTitle: this.jobTitle.trim(),
      department: this.department.trim(),
      status: 'ACTIVE',
    }).subscribe({
      next: () => {
        this.savingEmp.set(false);
        this.firstName = this.lastName = this.jobTitle = this.department = '';
        this.reload();
      },
      error: (err) => {
        this.savingEmp.set(false);
        this.error.set(mapHttpError(err));
      },
    });
  }

  removeEmployee(e: Employee): void {
    if (!confirm(`Supprimer ${e.firstName} ${e.lastName} ?`)) return;
    this.api.deleteEmployee(e.id).subscribe({
      next: () => this.reload(),
      error: (err) => this.error.set(mapHttpError(err)),
    });
  }

  decide(l: LeaveRequest, status: string): void {
    this.api.decideLeave(l.id, status).subscribe({
      next: () => this.reload(),
      error: (err) => this.error.set(mapHttpError(err)),
    });
  }

  private reload(): void {
    this.api.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.loadingEmp.set(false);
      },
      error: () => this.loadingEmp.set(false),
    });
    this.api.getLeaves().subscribe({
      next: (data) => {
        this.leaves.set(data);
        this.loadingLeaves.set(false);
      },
      error: () => this.loadingLeaves.set(false),
    });
  }
}
