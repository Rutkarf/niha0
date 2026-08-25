import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { DashboardKpis } from '../../core/api/api.models';
import { KpiCardComponent } from '../../shared/ui/kpi-card/kpi-card.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { TenancyService } from '../../core/tenancy/tenancy.service';

@Component({
  selector: 'app-bi-page',
  imports: [
    RouterLink,
    KpiCardComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    AgentOfficeLinkComponent,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Analytics / BI</h1>
          <p>Indicateurs consolidés {{ tenancy.organizationName() }}</p>
          <app-agent-office-link moduleKey="analytics" label="Analytics" />
        </div>
      </header>

      @if (loading()) {
        <app-loading-state message="Agrégation des KPIs…" />
      } @else if (!kpis()) {
        <app-empty-state title="Données indisponibles" icon="BI" />
      } @else {
        <div class="grid-kpis">
          <app-kpi-card label="Clients" [value]="kpis()!.customerCount" />
          <app-kpi-card label="Leads" [value]="kpis()!.leadCount" />
          <app-kpi-card label="Opportunités" [value]="kpis()!.openOpportunityCount" />
          <app-kpi-card label="Pipeline" [value]="kpis()!.pipelineAmount" [isCurrency]="true" />
          <app-kpi-card label="Factures" [value]="kpis()!.invoiceCount" />
          <app-kpi-card label="Tickets ouverts" [value]="kpis()!.openTicketCount" />
          <app-kpi-card label="Agents IA" [value]="kpis()!.agentCount" />
          <app-kpi-card label="Approbations" [value]="kpis()!.pendingApprovalCount" hint="En attente" />
        </div>
        <p class="callout">
          Vue lecture seule. Les actions sensibles passent par l’AI Office et la validation CEO.
        </p>
      }
    </div>
  `,
})
export class BiPage implements OnInit {
  readonly tenancy = inject(TenancyService);
  private readonly api = inject(ApiService);
  readonly loading = signal(true);
  readonly kpis = signal<DashboardKpis | null>(null);

  ngOnInit(): void {
    this.api.getDashboardKpis().subscribe({
      next: (data) => {
        this.kpis.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
