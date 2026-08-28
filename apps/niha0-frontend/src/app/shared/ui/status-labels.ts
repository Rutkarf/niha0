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
  ON_LEAVE: 'En congé',
  TERMINATED: 'Sorti',
  ANNUAL: 'Congés payés',
  SICK: 'Maladie',
  UNPAID: 'Sans solde',
  PARENTAL: 'Parental',
  OTHER: 'Autre',
  PUBLISHED: 'Publiée',
  ARCHIVED: 'Archivée',
  ORDERED: 'Commandée',
  IN_TRANSIT: 'En transit',
  RECEIVED: 'Réceptionnée',
  CANCELLED: 'Annulée',
  PLANNED: 'Planifié',
  RUNNING: 'En cours',
  IDLE: 'Inactif',
  SUCCESS: 'Succès',
  ACK: 'Accusé',
  ERROR: 'Erreur',
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

export const EMPLOYEE_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'ON_LEAVE', label: 'En congé' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'TERMINATED', label: 'Sorti' },
] as const;

export const LEAVE_TYPE_OPTIONS = [
  { value: 'ANNUAL', label: 'Congés payés' },
  { value: 'SICK', label: 'Maladie' },
  { value: 'UNPAID', label: 'Sans solde' },
  { value: 'PARENTAL', label: 'Parental' },
  { value: 'OTHER', label: 'Autre' },
] as const;

export const LEAVE_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'APPROVED', label: 'Approuvé' },
  { value: 'REJECTED', label: 'Refusé' },
  { value: 'CANCELLED', label: 'Annulé' },
] as const;
