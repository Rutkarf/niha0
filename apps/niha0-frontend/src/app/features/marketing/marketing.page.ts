import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Agent } from '../../core/api/api.models';
import { mapHttpError } from '../../core/api/http-error.util';
import { DataTableComponent, DataColumn } from '../../shared/ui/data-table/data-table.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { AgentHubCardComponent } from '../../shared/ui/agent-hub-card/agent-hub-card.component';

@Component({
  selector: 'app-marketing-page',
  imports: [
    FormsModule,
    AgentOfficeLinkComponent,
    RouterLink,
    DataTableComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    AgentHubCardComponent,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Marketing</h1>
          <p>Campagnes, contenus et agent Marketing</p>
          <app-agent-office-link moduleKey="marketing" label="Marketing" />
        </div>
      </header>

      @if (loadingAgent()) {
        <app-loading-state message="Chargement agent…" />
      } @else if (agent()) {
        <app-agent-hub-card [agent]="agent()!" officeQuery="marketing" />
      }

      <form class="create-form card" (ngSubmit)="saveCampaign()">
        <h2>Nouvelle campagne</h2>
        <div class="row">
          <label class="label">
            Nom
            <input class="input" name="name" [(ngModel)]="name" required maxlength="120" />
          </label>
          <label class="label">
            Budget
            <input class="input" type="number" name="budget" [(ngModel)]="budget" required min="0" step="1" />
          </label>
          <label class="label">
            Statut
            <select class="input" name="status" [(ngModel)]="campaignStatus">
              <option value="DRAFT">DRAFT</option>
            </select>
          </label>
        </div>
        <div class="actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving() || !name.trim()">
            {{ saving() ? 'Création…' : 'Créer la campagne' }}
          </button>
        </div>
        @if (formError()) {
          <p class="error" role="alert">{{ formError() }}</p>
        }
        @if (formOk()) {
          <p class="ok" role="status">{{ formOk() }}</p>
        }
      </form>

      <h2 class="section-title">Campagnes</h2>
      @if (loadingRows()) {
        <app-loading-state />
      } @else if (!rows().length) {
        <app-empty-state title="Aucune campagne" icon="CMP" />
      } @else {
        <app-data-table [columns]="columns" [rows]="rows()" />
      }
    </div>
  `,
  styles: [`
    .create-form { padding: 1rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; }
    .label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; }
    .actions { display: flex; gap: 0.5rem; }
    .error { color: var(--accent-danger); margin: 0; }
    .ok { color: var(--accent-success, #16a34a); margin: 0; }
  `],
})
export class MarketingPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loadingAgent = signal(true);
  readonly loadingRows = signal(true);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly formOk = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly rows = signal<Record<string, unknown>[]>([]);

  name = '';
  budget = 0;
  campaignStatus: 'DRAFT' = 'DRAFT';

  readonly columns: DataColumn[] = [
    { key: 'name', label: 'Campagne', badge: false },
    { key: 'status', label: 'Statut', badge: true },
    { key: 'budget', label: 'Budget', badge: false },
    { key: 'startDate', label: 'Début', badge: false },
  ];

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
