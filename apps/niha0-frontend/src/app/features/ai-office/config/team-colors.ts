/** 10 équipes — couleur principale + dégradé (4 bureaux + 1 chef). */
export interface TeamColor {
  row: number;
  role: string;
  color: string;
  gradient: [string, string, string];
}

export const TEAM_COLORS: readonly TeamColor[] = [
  { row: 1, role: 'Accueil', color: '#FF6B6B', gradient: ['#FF8E8E', '#FF6B6B', '#FF4848'] },
  { row: 2, role: 'Support', color: '#4ECDC4', gradient: ['#6EDBD4', '#4ECDC4', '#2EB9B0'] },
  { row: 3, role: 'Vente', color: '#45B7D1', gradient: ['#65C7E1', '#45B7D1', '#25A3C1'] },
  { row: 4, role: 'RH', color: '#96CEB4', gradient: ['#B6DECE', '#96CEB4', '#76BE9A'] },
  { row: 5, role: 'Finance', color: '#FFEEAD', gradient: ['#FFF4C7', '#FFEEAD', '#FFE893'] },
  { row: 6, role: 'Marketing', color: '#D4A5A5', gradient: ['#E4B5B5', '#D4A5A5', '#C49595'] },
  { row: 7, role: 'Dev', color: '#9B59B6', gradient: ['#AB69C6', '#9B59B6', '#8B49A6'] },
  { row: 8, role: 'Design', color: '#3498DB', gradient: ['#54A8EB', '#3498DB', '#1488CB'] },
  { row: 9, role: 'Ops', color: '#E67E22', gradient: ['#F69E42', '#E67E22', '#D66E12'] },
  { row: 10, role: 'QA', color: '#2ECC71', gradient: ['#4EDC81', '#2ECC71', '#1EBC61'] },
] as const;

export function teamForRow(rowId: number): TeamColor {
  return TEAM_COLORS[rowId - 1] ?? TEAM_COLORS[0]!;
}

export function deskAccentForColumn(rowId: number, _colIndex: number): string {
  return teamForRow(rowId).color;
}
