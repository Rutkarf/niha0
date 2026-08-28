export interface AgentPosition {
  agentId: number;
  /** Intitulé de poste métier (ex. « Chargé de recrutement »). */
  title: string;
  x: number;
  y: number;
  z: number;
}

export interface ChiefPosition {
  chiefId: number;
  /** Intitulé du chef (ex. « Responsable RH »). */
  title: string;
  x: number;
  y: number;
  z: number;
}

export interface RowLayoutConfig {
  rowId: number;
  color: string;
  /** Nom court de l'équipe (Accueil, Vente, …). */
  role: string;
  /** Intitulé complet du chef d'équipe. */
  chiefTitle: string;
  agents: AgentPosition[];
  chief: ChiefPosition;
}

export interface NihaoOfficeLayout {
  rows: RowLayoutConfig[];
  agentCount: number;
  chiefCount: number;
  rowCount: number;
}

export interface RowDeskSelection {
  id: string;
  rowId: number;
  deskIndex: number;
  role: string;
  chiefTitle: string;
  color: string;
  label: string;
}
