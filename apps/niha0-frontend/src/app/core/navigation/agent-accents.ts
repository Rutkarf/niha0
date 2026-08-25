/** Accent colors for all 11 AI agent desk codes — shared by 3D scene and sidebar. */
export const AGENT_ACCENTS: Record<string, string> = {
  VENTES: '#34D399',
  COMPTABILITE: '#FBBF24',
  STOCK: '#FB923C',
  SUPPORT: '#2DD4BF',
  JURIDIQUE: '#94A3B8',
  ANALYTICS: '#60A5FA',
  STRATEGIE: '#5EEAD4',
  CRM: '#38BDF8',
  ERP: '#818CF8',
  RH: '#F87171',
  MARKETING: '#67E8F9',
};

export function accentForAgentCode(code: string): string {
  return AGENT_ACCENTS[code] ?? '#94A3B8';
}
