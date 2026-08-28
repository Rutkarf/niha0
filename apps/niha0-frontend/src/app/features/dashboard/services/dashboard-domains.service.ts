import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import {
  Agent,
  Customer,
  DashboardKpis,
  Invoice,
  Lead,
  Opportunity,
  Ticket,
} from '../../../core/api/api.models';
import type { DashboardDomainRow, DashboardDomainSection } from '../models/dashboard.models';
import { DashboardDataService } from './dashboard-data.service';
import {
  DEMO_CLIENT_ROWS,
  DEMO_INVOICE_ROWS,
  DEMO_LEAD_ROWS,
  DEMO_OPPORTUNITY_ROWS,
  DEMO_TICKET_ROWS,
  demoPipelineAmount,
  parseEuroAmount,
} from './dashboard-demo-rows';

function fmtEuro(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function statusTone(status: string): DashboardDomainRow['tone'] {
  const s = status.toUpperCase();
  if (['ACTIVE', 'PAID', 'QUALIFIED', 'RESOLVED', 'CLOSED_WON', 'AVAILABLE'].includes(s)) {
    return 'success';
  }
  if (['OPEN', 'NEW', 'SENT', 'NEGOTIATION', 'PROPOSAL', 'BUSY', 'WAITING_APPROVAL'].includes(s)) {
    return 'warning';
  }
  if (['HIGH', 'URGENT', 'OVERDUE'].includes(s)) {
    return 'danger';
  }
  return 'neutral';
}

function trendFromCount(count: number): number[] {
  const c = Math.max(count, 1);
  return [Math.max(1, c - 2), Math.max(1, c - 1), c, c];
}

function mergeRows(apiRows: DashboardDomainRow[], demoRows: DashboardDomainRow[]): DashboardDomainRow[] {
  const seen = new Set(apiRows.map((r) => r.id));
  const extra = demoRows.filter((r) => !seen.has(r.id));
  return [...apiRows, ...extra];
}

function countBadge(rows: DashboardDomainRow[], badge: string): number {
  return rows.filter((r) => r.badge === badge).length;
}

function avgLeadScore(rows: DashboardDomainRow[]): number {
  const scores = rows
    .map((r) => Number.parseInt(r.badge ?? '0', 10))
    .filter((n) => !Number.isNaN(n));
  return scores.length ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : 0;
}

function qualifiedLeadCount(apiLeads: Lead[]): number {
  const apiQualified = apiLeads.filter((l) => l.status === 'QUALIFIED').length;
  const demoQualified = DEMO_LEAD_ROWS.filter((r) => Number.parseInt(r.badge ?? '0', 10) >= 70).length;
  return apiQualified + demoQualified;
}

@Injectable({ providedIn: 'root' })
export class DashboardDomainsService {
  private readonly api = inject(ApiService);
  private readonly nihaoData = inject(DashboardDataService);

  readonly loading = signal(false);
  readonly sections = signal<DashboardDomainSection[]>([]);

  private loaded = false;

  load(kpis: DashboardKpis | null): void {
    if (this.loading() || this.loaded) return;
    this.loading.set(true);

    forkJoin({
      customers: this.api.getCustomers().pipe(catchError(() => of([] as Customer[]))),
      leads: this.api.getLeads().pipe(catchError(() => of([] as Lead[]))),
      opportunities: this.api.getOpportunities().pipe(catchError(() => of([] as Opportunity[]))),
      invoices: this.api.getInvoices().pipe(catchError(() => of([] as Invoice[]))),
      tickets: this.api.getTickets().pipe(catchError(() => of([] as Ticket[]))),
      agents: this.api.getAgents().pipe(catchError(() => of([] as Agent[]))),
    }).subscribe({
      next: (data) => {
        this.sections.set(this.buildSections(data, kpis));
        this.loaded = true;
        this.loading.set(false);
      },
      error: () => {
        this.sections.set(this.buildSections(
          {
            customers: [],
            leads: [],
            opportunities: [],
            invoices: [],
            tickets: [],
            agents: [],
          },
          kpis,
        ));
        this.loaded = true;
        this.loading.set(false);
      },
    });
  }

  refresh(kpis: DashboardKpis | null): void {
    this.loaded = false;
    this.load(kpis);
  }

  private buildSections(
    data: {
      customers: Customer[];
      leads: Lead[];
      opportunities: Opportunity[];
      invoices: Invoice[];
      tickets: Ticket[];
      agents: Agent[];
    },
    kpis: DashboardKpis | null,
  ): DashboardDomainSection[] {
    const customerById = new Map(data.customers.map((c) => [c.id, c.name]));
    const stats = this.nihaoData.stats();
    const nihaoAgents = this.nihaoData.agents();
    const demoPipeline = demoPipelineAmount();

    const apiPipeline = data.opportunities.reduce((s, o) => s + (o.amount ?? 0), 0);
    const totalPipeline = apiPipeline + demoPipeline;

    const clientRows = mergeRows(
      data.customers.map((c) => ({
        id: c.id,
        primary: c.name,
        secondary: c.email || c.industry,
        meta: c.industry,
        badge: c.status,
        tone: statusTone(c.status),
        route: '/app/crm',
      })),
      DEMO_CLIENT_ROWS,
    );

    const leadRows = mergeRows(
      [...data.leads]
        .sort((a, b) => b.score - a.score)
        .map((l) => ({
          id: l.id,
          primary: l.companyName,
          secondary: l.contactName,
          meta: l.source,
          badge: `${l.score}`,
          tone: statusTone(l.status),
          route: '/app/sales',
        })),
      DEMO_LEAD_ROWS,
    );

    const opportunityRows = mergeRows(
      data.opportunities.map((o) => ({
        id: o.id,
        primary: o.title,
        secondary: customerById.get(o.customerId) ?? 'Client',
        meta: fmtEuro(o.amount),
        badge: o.stage,
        tone: statusTone(o.stage),
        route: '/app/sales',
      })),
      DEMO_OPPORTUNITY_ROWS,
    );

    const invoiceRows = mergeRows(
      data.invoices.map((i) => ({
        id: i.id,
        primary: i.reference,
        secondary: customerById.get(i.customerId) ?? 'Client',
        meta: fmtEuro(i.totalAmount),
        badge: i.status,
        tone: statusTone(i.status),
        route: '/app/accounting',
      })),
      DEMO_INVOICE_ROWS,
    );

    const ticketRows = mergeRows(
      [...data.tickets]
        .sort((a, b) => (a.status === 'OPEN' ? -1 : 1) - (b.status === 'OPEN' ? -1 : 1))
        .map((t) => ({
          id: t.id,
          primary: t.subject,
          secondary: customerById.get(t.customerId) ?? 'Client',
          meta: t.priority,
          badge: t.status,
          tone: t.priority === 'HIGH' ? 'danger' : statusTone(t.status),
          route: '/app/customer-relations',
        })),
      DEMO_TICKET_ROWS,
    );

    const openTicketCount = countBadge(ticketRows, 'OPEN');
    const highTicketCount = ticketRows.filter((t) => t.meta === 'HIGH').length;
    const unpaidInvoiceCount = invoiceRows.filter((r) => r.badge !== 'PAID').length;
    const unpaidInvoiceAmount = invoiceRows
      .filter((r) => r.badge !== 'PAID')
      .reduce((s, r) => s + parseEuroAmount(r.meta), 0);
    const paidInvoiceCount = countBadge(invoiceRows, 'PAID');
    const activeClientCount = countBadge(clientRows, 'ACTIVE');
    const sectorCount = new Set(clientRows.map((r) => r.meta).filter(Boolean)).size;

    const apiAvgProb = data.opportunities.length
      ? data.opportunities.reduce((s, o) => s + o.probability, 0) / data.opportunities.length
      : 0;
    const demoAvgProb = 68;
    const avgProb = opportunityRows.length
      ? Math.round(
        (apiAvgProb * data.opportunities.length + demoAvgProb * DEMO_OPPORTUNITY_ROWS.length)
          / opportunityRows.length,
      )
      : 0;

    const agentRows: DashboardDomainRow[] = [...nihaoAgents]
      .sort((a, b) => {
        if (a.ledStatus === 'red' && b.ledStatus !== 'red') return -1;
        if (b.ledStatus === 'red' && a.ledStatus !== 'red') return 1;
        return b.performance - a.performance;
      })
      .slice(0, 20)
      .map((a) => ({
        id: a.id,
        primary: a.role,
        secondary: a.team,
        meta: `${a.performance}% · ${a.tasksInProgress} tâche(s)`,
        badge: a.ledStatus === 'red' ? 'Validation' : a.ledStatus === 'green' ? 'Actif' : 'Inactif',
        tone: a.ledStatus === 'red' ? 'warning' : a.ledStatus === 'green' ? 'success' : 'neutral',
        route: '/app/dashboard',
        routeQuery: { section: 'agents' },
      }));

    return [
      {
        id: 'clients',
        code: 'CRM',
        title: 'Clients',
        count: clientRows.length,
        route: '/app/crm',
        routeLabel: 'Ouvrir le CRM',
        sparkColor: 'var(--accent-primary)',
        trend: trendFromCount(clientRows.length),
        metrics: [
          { label: 'Actifs', value: activeClientCount, highlight: true },
          { label: 'Secteurs', value: sectorCount },
          { label: 'Total', value: clientRows.length },
        ],
        rows: clientRows,
      },
      {
        id: 'leads',
        code: 'LD',
        title: 'Leads',
        count: leadRows.length,
        route: '/app/sales',
        routeLabel: 'Pipeline ventes',
        sparkColor: 'var(--accent-primary)',
        trend: trendFromCount(leadRows.length),
        metrics: [
          { label: 'Qualifiés', value: qualifiedLeadCount(data.leads), highlight: true },
          { label: 'Score moy.', value: avgLeadScore(leadRows) },
          { label: 'Sources', value: new Set(leadRows.map((l) => l.meta).filter(Boolean)).size },
        ],
        rows: leadRows,
      },
      {
        id: 'opportunities',
        code: 'OP',
        title: 'Opportunités',
        count: opportunityRows.length,
        route: '/app/sales',
        routeLabel: 'Voir les opportunités',
        sparkColor: 'var(--accent-primary)',
        trend: trendFromCount(opportunityRows.length),
        metrics: [
          { label: 'Pipeline', value: fmtEuro(totalPipeline), highlight: true },
          { label: 'En cours', value: opportunityRows.length },
          { label: 'Prob. moy.', value: opportunityRows.length ? `${avgProb}%` : '—' },
        ],
        rows: opportunityRows,
      },
      {
        id: 'invoices',
        code: 'FA',
        title: 'Factures',
        count: invoiceRows.length,
        route: '/app/accounting',
        routeLabel: 'Comptabilité',
        sparkColor: 'var(--text-muted)',
        trend: trendFromCount(invoiceRows.length),
        metrics: [
          { label: 'Impayées', value: unpaidInvoiceCount, highlight: unpaidInvoiceCount > 0 },
          { label: 'Encours', value: fmtEuro(unpaidInvoiceAmount) },
          { label: 'Payées', value: paidInvoiceCount },
        ],
        rows: invoiceRows,
      },
      {
        id: 'tickets',
        code: 'TK',
        title: 'Tickets',
        count: openTicketCount,
        route: '/app/customer-relations',
        routeLabel: 'Support client',
        sparkColor: 'var(--accent-warning)',
        trend: trendFromCount(openTicketCount),
        metrics: [
          { label: 'Ouverts', value: openTicketCount, highlight: openTicketCount > 0 },
          { label: 'Priorité haute', value: highTicketCount },
          { label: 'Total', value: ticketRows.length },
        ],
        rows: ticketRows,
      },
      {
        id: 'agents',
        code: 'IA',
        title: 'Agents IA',
        count: stats.totalAgents,
        route: '/app/dashboard',
        routeQuery: { section: 'agents' },
        routeLabel: 'Voir tous les agents',
        sparkColor: 'var(--accent-primary)',
        trend: trendFromCount(stats.totalAgents),
        metrics: [
          { label: 'Autonomes', value: stats.greenLeds, highlight: true },
          { label: 'Validation', value: stats.redLeds },
          { label: 'Équipes', value: stats.totalTeams },
        ],
        rows: agentRows.length
          ? agentRows
          : data.agents.map((a) => ({
              id: a.id,
              primary: a.name,
              secondary: a.domain,
              meta: a.code,
              badge: a.status,
              tone: statusTone(a.status),
              route: '/app/dashboard',
              routeQuery: { section: 'agents' },
            })),
      },
    ];
  }
}
