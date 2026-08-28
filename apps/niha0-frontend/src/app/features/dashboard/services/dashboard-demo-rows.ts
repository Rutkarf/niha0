import type { DashboardDomainRow } from '../models/dashboard.models';

function row(
  id: string,
  route: string,
  primary: string,
  secondary: string,
  meta: string,
  badge: string,
  tone: DashboardDomainRow['tone'] = 'neutral',
): DashboardDomainRow {
  return { id, primary, secondary, meta, badge, tone, route };
}

export const DEMO_TICKET_ROWS: DashboardDomainRow[] = [
  row('demo-tk-1', '/app/customer-relations', 'Accès portail bloqué', 'TechStart', 'MEDIUM', 'OPEN', 'warning'),
  row('demo-tk-2', '/app/customer-relations', 'Devis migration cloud', 'Industrie Nova', 'LOW', 'OPEN', 'warning'),
  row('demo-tk-3', '/app/customer-relations', 'Réclamation délai SAV', 'Éco Habitat', 'HIGH', 'OPEN', 'danger'),
];

export const DEMO_CLIENT_ROWS: DashboardDomainRow[] = [
  row('demo-crm-1', '/app/crm', 'Atelier Mercure', 'contact@mercure.fr', 'Retail', 'ACTIVE', 'success'),
  row('demo-crm-2', '/app/crm', 'Groupe Helios', 'compta@helios.fr', 'Industrie', 'ACTIVE', 'success'),
  row('demo-crm-3', '/app/crm', 'Studio Pixel', 'hello@pixel.st', 'Média', 'ACTIVE', 'success'),
];

export const DEMO_INVOICE_ROWS: DashboardDomainRow[] = [
  row('demo-fa-1', '/app/accounting', 'FAC-2026-019', 'Atelier Mercure', '3 800 €', 'SENT', 'warning'),
  row('demo-fa-2', '/app/accounting', 'FAC-2026-020', 'Groupe Helios', '12 500 €', 'OVERDUE', 'danger'),
  row('demo-fa-3', '/app/accounting', 'FAC-2026-021', 'Studio Pixel', '950 €', 'PAID', 'success'),
];

export const DEMO_OPPORTUNITY_ROWS: DashboardDomainRow[] = [
  row('demo-op-1', '/app/sales', 'Refonte CRM', 'Atelier Mercure', '8 400 €', 'PROPOSAL', 'warning'),
  row('demo-op-2', '/app/sales', 'Contrat support annuel', 'Groupe Helios', '15 000 €', 'NEGOTIATION', 'warning'),
  row('demo-op-3', '/app/sales', 'Audit sécurité', 'Studio Pixel', '4 200 €', 'QUALIFICATION', 'neutral'),
];

export const DEMO_LEAD_ROWS: DashboardDomainRow[] = [
  row('demo-ld-1', '/app/sales', 'Nord Énergie', 'M. Laurent', 'Salon Pro', '72', 'success'),
  row('demo-ld-2', '/app/sales', 'Bio Saveurs', 'S. Martin', 'Site web', '65', 'neutral'),
  row('demo-ld-3', '/app/sales', 'CloudNine SARL', 'A. Dupuis', 'Parrainage', '81', 'success'),
];

/** Montants des opportunités démo — alignés sur les métriques pipeline du dashboard. */
export function demoPipelineAmount(): number {
  return DEMO_OPPORTUNITY_ROWS.reduce((sum, r) => sum + parseEuroAmount(r.meta), 0);
}

export function parseEuroAmount(value: string | undefined): number {
  if (!value) return 0;
  const digits = value.replace(/\s/g, '').replace(/[^\d]/g, '');
  return Number(digits) || 0;
}
