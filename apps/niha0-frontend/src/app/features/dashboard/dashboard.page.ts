import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { DashboardKpis } from '../../core/api/api.models';
import { KpiCardComponent } from '../../shared/ui/kpi-card/kpi-card.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { TenancyService } from '../../core/tenancy/tenancy.service';

type PeriodKey = 'today' | '7d' | '30d';

@Component({
  selector: 'app-dashboard-page',
  imports: [KpiCardComponent, LoadingStateComponent, EmptyStateComponent, RouterLink, AgentOfficeLinkComponent],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Dashboard</h1>
          <p>Vue d’ensemble des KPIs {{ tenancy.organizationName() }}</p>
          <app-agent-office-link moduleKey="strategie" label="Stratégie" />
        </div>
        @if (kpis() && kpis()!.pendingApprovalCount > 0) {
          <a routerLink="/app/ai-office" class="approve-cta">
            {{ kpis()!.pendingApprovalCount }} validation(s) CEO
          </a>
        }
      </header>

      <div class="period-bar" role="group" aria-label="Période d’affichage">
        <span class="period-note">Période :</span>
        @for (p of periods; track p.key) {
          <button
            type="button"
            class="period-chip"
            [class.active]="period() === p.key"
            [attr.aria-pressed]="period() === p.key"
            (click)="period.set(p.key)"
          >
            {{ p.label }}
          </button>
        }
        <span class="period-hint">{{ periodLabel() }} — affichage indicatif (données globales)</span>
      </div>

      <nav class="quick-nav" aria-label="Accès rapide">
        @for (link of quickLinks; track link.route) {
          <a [routerLink]="link.route" class="quick-link">
            <span class="code">{{ link.code }}</span>
            <span class="name">{{ link.label }}</span>
          </a>
        }
      </nav>

      @if (loading()) {
        <app-loading-state message="Chargement des KPIs…" />
      } @else if (!kpis()) {
        <app-empty-state
          title="KPIs indisponibles"
          description="Impossible de charger les indicateurs. Vérifiez que le backend est démarré, puis réessayez."
          icon="KPI"
        />
      } @else {
        <div class="grid-kpis">
          <app-kpi-card label="Clients" [value]="kpis()!.customerCount" />
          <app-kpi-card label="Leads" [value]="kpis()!.leadCount" />
          <app-kpi-card label="Opportunités" [value]="kpis()!.openOpportunityCount" />
          <app-kpi-card label="Pipeline" [value]="kpis()!.pipelineAmount" [isCurrency]="true" />
          <app-kpi-card label="Factures" [value]="kpis()!.invoiceCount" />
          <app-kpi-card label="Tickets ouverts" [value]="kpis()!.openTicketCount" />
          <app-kpi-card label="Agents IA" [value]="kpis()!.agentCount" />
          <app-kpi-card label="Approbations" [value]="kpis()!.pendingApprovalCount" hint="En attente CEO" />
        </div>
      }
    </div>
  `,
  styles: [`
    .approve-cta {
      padding: 0.55rem 0.95rem;
      border-radius: var(--radius-sm);
      text-decoration: none;
      font-weight: 700;
      font-size: 0.78rem;
      letter-spacing: 0.02em;
      background: color-mix(in srgb, var(--accent-warning) 16%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent-warning) 45%, transparent);
      color: var(--accent-warning);
      white-space: nowrap;
      align-self: center;
    }
    .approve-cta:hover { text-decoration: none; filter: brightness(1.05); }
    .period-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem 0.55rem;
      margin: 0 0 1rem;
    }
    .period-note {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .period-chip {
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.3rem 0.65rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: border-color var(--transition), color var(--transition), background var(--transition);
    }
    .period-chip:hover {
      border-color: var(--border-strong);
      color: var(--text-primary);
    }
    .period-chip.active {
      border-color: color-mix(in srgb, var(--accent-primary) 50%, transparent);
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      color: var(--accent-primary);
    }
    .period-hint {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-left: 0.25rem;
    }
    .quick-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem 0.85rem;
      margin: -0.25rem 0 1.25rem;
      padding: 0.55rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    .quick-link {
      display: inline-flex;
      align-items: baseline;
      gap: 0.4rem;
      padding: 0.25rem 0;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color var(--transition), color var(--transition);
    }
    .quick-link:hover {
      border-bottom-color: var(--accent-primary);
      text-decoration: none;
    }
    .code {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }
    .name {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-primary);
    }
  `],
})
export class DashboardPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly tenancy = inject(TenancyService);
  readonly loading = signal(true);
  readonly kpis = signal<DashboardKpis | null>(null);
  readonly period = signal<PeriodKey>('7d');

  readonly periods: { key: PeriodKey; label: string }[] = [
    { key: 'today', label: "Aujourd'hui" },
    { key: '7d', label: '7j' },
    { key: '30d', label: '30j' },
  ];

  readonly periodLabel = computed(() => {
    switch (this.period()) {
      case 'today':
        return "Aujourd'hui";
      case '7d':
        return '7 derniers jours';
      case '30d':
        return '30 derniers jours';
    }
  });

  readonly quickLinks = [
    { code: 'CRM', label: 'CRM', route: '/app/crm' },
    { code: 'VE', label: 'Ventes', route: '/app/sales' },
    { code: 'SU', label: 'Support', route: '/app/customer-relations' },
    { code: 'CP', label: 'Compta', route: '/app/accounting' },
    { code: 'BI', label: 'Analytics', route: '/app/bi' },
    { code: 'AI', label: 'AI Center', route: '/app/ai-center' },
  ];

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
