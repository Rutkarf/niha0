/** French labels for domain status / stage enums (UI only). */
const LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  PROSPECT: 'Prospect',
  QUALIFICATION: 'Qualification',
  PROPOSAL: 'Proposition',
  NEGOTIATION: 'Négociation',
  WON: 'Gagnée',
  LOST: 'Perdue',
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  URGENT: 'Urgente',
  DRAFT: 'Brouillon',
  SENT: 'Envoyée',
  PAID: 'Payée',
  NEW: 'Nouveau',
  AVAILABLE: 'Disponible',
  APPROVED: 'Approuvé',
  REJECTED: 'Refusé',
  PENDING: 'En attente',
  COMPLETED: 'Terminé',
  FAILED: 'Échoué',
  CANCELLED: 'Annulé',
};

export function statusLabel(raw: string | null | undefined): string {
  if (!raw) return '—';
  const key = raw.toUpperCase();
  return LABELS[key] ?? raw.replaceAll('_', ' ');
}

export const CUSTOMER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'PROSPECT', label: 'Prospect' },
] as const;

export const OPP_STAGE_OPTIONS = [
  { value: 'QUALIFICATION', label: 'Qualification' },
  { value: 'PROPOSAL', label: 'Proposition' },
  { value: 'NEGOTIATION', label: 'Négociation' },
  { value: 'WON', label: 'Gagnée' },
  { value: 'LOST', label: 'Perdue' },
] as const;

export const TICKET_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Basse' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'URGENT', label: 'Urgente' },
] as const;

export const TICKET_STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Ouvert' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'RESOLVED', label: 'Résolu' },
  { value: 'CLOSED', label: 'Fermé' },
] as const;

export const INVOICE_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'SENT', label: 'Envoyée' },
] as const;
