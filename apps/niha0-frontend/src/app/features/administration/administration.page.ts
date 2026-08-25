import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent } from '../../core/api/api.models';
import { DataTableComponent, DataColumn } from '../../shared/ui/data-table/data-table.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { AgentHubCardComponent } from '../../shared/ui/agent-hub-card/agent-hub-card.component';

@Component({
  selector: 'app-administration-page',
  imports: [
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
          <h1>Administration</h1>
          <p>Documents ERP et agent dédié</p>
          <app-agent-office-link moduleKey="erp" label="ERP" />
        </div>
      </header>

      @if (loadingAgent()) {
        <app-loading-state message="Chargement agent ERP…" />
      } @else if (agent()) {
        <app-agent-hub-card [agent]="agent()!" officeQuery="erp" />
      }

      <h2 class="section-title">Documents</h2>
      @if (loadingDocs()) {
        <app-loading-state />
      } @else if (!rows().length) {
        <app-empty-state title="Aucun document" icon="DOC" />
      } @else {
        <app-data-table [columns]="columns" [rows]="rows()" />
      }
    </div>
  `,
})
export class AdministrationPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loadingAgent = signal(true);
  readonly loadingDocs = signal(true);
  readonly agent = signal<Agent | null>(null);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly columns: DataColumn[] = [
    { key: 'title', label: 'Titre', badge: false },
    { key: 'category', label: 'Catégorie', badge: false },
    { key: 'status', label: 'Statut', badge: true },
    { key: 'content', label: 'Contenu', badge: false },
  ];

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'ERP') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.api.getDocuments().subscribe({
      next: (data) => {
        this.rows.set(data as unknown as Record<string, unknown>[]);
        this.loadingDocs.set(false);
      },
      error: () => this.loadingDocs.set(false),
    });
  }
}
