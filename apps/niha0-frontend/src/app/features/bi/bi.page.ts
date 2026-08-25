import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { BiReport, DashboardKpis } from '../../core/api/api.models';
import { KpiCardComponent } from '../../shared/ui/kpi-card/kpi-card.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { TenancyService } from '../../core/tenancy/tenancy.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';

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
        @if (kpis()) {
          <button type="button" class="btn btn-ghost" (click)="exportCsv()">Export CSV</button>
        }
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
          <app-kpi-card label="Produits PIM" [value]="pimCount()" />
          <app-kpi-card label="Marketplace" [value]="marketplaceCount()" />
          <app-kpi-card label="Runs runtime" [value]="runtimeCount()" />
        </div>
        <p class="callout">
          Rapport BI consolidé (CRM, PIM, marketplace, runtime). Les actions sensibles passent par l’AI Office.
        </p>
      }
    </div>
  `,
})
export class BiPage implements OnInit {
  readonly tenancy = inject(TenancyService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly kpis = signal<DashboardKpis | null>(null);
  readonly report = signal<BiReport | null>(null);
  readonly pimCount = signal(0);
  readonly marketplaceCount = signal(0);
  readonly runtimeCount = signal(0);

  ngOnInit(): void {
    this.api.getBiReport().subscribe({
      next: (data) => {
        this.applyReport(data);
        this.loading.set(false);
      },
      error: () => {
        this.api.getDashboardKpis().subscribe({
          next: (kpis) => {
            this.kpis.set(kpis);
            this.loading.set(false);
          },
          error: (err) => {
            this.loading.set(false);
            this.toast.error(mapHttpError(err));
          },
        });
      },
    });
  }

  exportCsv(): void {
    const k = this.kpis();
    if (!k) return;
    const rows: [string, string | number][] = [
      ['customerCount', k.customerCount],
      ['leadCount', k.leadCount],
      ['openOpportunityCount', k.openOpportunityCount],
      ['pipelineAmount', k.pipelineAmount],
      ['invoiceCount', k.invoiceCount],
      ['openTicketCount', k.openTicketCount],
      ['agentCount', k.agentCount],
      ['pendingApprovalCount', k.pendingApprovalCount],
      ['pimProducts', this.pimCount()],
      ['marketplaceListings', this.marketplaceCount()],
      ['runtimeRuns', this.runtimeCount()],
    ];
    const csv = ['metric,value', ...rows.map(([a, b]) => `${a},${b}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nihao-bi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success('CSV exporté');
  }

  private applyReport(data: BiReport): void {
    this.report.set(data);
    const kpis = data.kpis ?? null;
    this.kpis.set(kpis);
    this.pimCount.set(Number(data.pimProducts ?? data.pimProductCount ?? 0));
    this.marketplaceCount.set(Number(data.marketplaceListings ?? data.marketplaceListingCount ?? 0));
    this.runtimeCount.set(Number(data.runtimeRuns ?? data.runtimeRunCount ?? 0));
  }
}
