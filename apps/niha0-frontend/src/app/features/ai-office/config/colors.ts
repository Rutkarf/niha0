/** 10 couleurs uniques — une par rangée d'agents IA. */
export const ROW_COLORS = [
  '#FF6B6B', // Rangée 1 — Accueil
  '#4ECDC4', // Rangée 2 — Support
  '#45B7D1', // Rangée 3 — Vente
  '#96CEB4', // Rangée 4 — RH
  '#FFEEAD', // Rangée 5 — Finance
  '#D4A5A5', // Rangée 6 — Marketing
  '#9B59B6', // Rangée 7 — Dev
  '#3498DB', // Rangée 8 — Design
  '#E67E22', // Rangée 9 — Ops
  '#2ECC71', // Rangée 10 — QA
] as const;

export type RowColor = (typeof ROW_COLORS)[number];

export function rowColor(rowId: number): string {
  const idx = rowId - 1;
  return ROW_COLORS[idx] ?? ROW_COLORS[0];
}
