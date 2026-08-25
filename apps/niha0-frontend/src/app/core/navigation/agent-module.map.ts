/** Maps module routes ↔ AI Office agent codes */
export const AGENT_MODULE_MAP: Record<string, { code: string; label: string; route: string }> = {
  crm: { code: 'CRM', label: 'CRM', route: '/app/crm' },
  sales: { code: 'VENTES', label: 'Ventes', route: '/app/sales' },
  accounting: { code: 'COMPTABILITE', label: 'Comptabilité', route: '/app/accounting' },
  comptabilite: { code: 'COMPTABILITE', label: 'Comptabilité', route: '/app/accounting' },
  wms: { code: 'STOCK', label: 'Stock', route: '/app/wms' },
  stock: { code: 'STOCK', label: 'Stock', route: '/app/wms' },
  'customer-relations': { code: 'SUPPORT', label: 'Support', route: '/app/customer-relations' },
  support: { code: 'SUPPORT', label: 'Support', route: '/app/customer-relations' },
  legal: { code: 'JURIDIQUE', label: 'Juridique', route: '/app/legal' },
  juridique: { code: 'JURIDIQUE', label: 'Juridique', route: '/app/legal' },
  bi: { code: 'ANALYTICS', label: 'Analytics', route: '/app/bi' },
  analytics: { code: 'ANALYTICS', label: 'Analytics', route: '/app/bi' },
  bpm: { code: 'STRATEGIE', label: 'Stratégie', route: '/app/bpm' },
  strategie: { code: 'STRATEGIE', label: 'Stratégie', route: '/app/bpm' },
  administration: { code: 'ERP', label: 'ERP', route: '/app/administration' },
  erp: { code: 'ERP', label: 'ERP', route: '/app/administration' },
  hcm: { code: 'RH', label: 'RH', route: '/app/hcm' },
  rh: { code: 'RH', label: 'RH', route: '/app/hcm' },
  marketing: { code: 'MARKETING', label: 'Marketing', route: '/app/marketing' },
  cms: { code: 'MARKETING', label: 'CMCMS', route: '/app/cms' },
  pim: { code: 'STOCK', label: 'PIM', route: '/app/pim' },
  chat: { code: 'CRM', label: 'Chat', route: '/app/chat' },
  studio: { code: 'ANALYTICS', label: 'Studio', route: '/app/studio' },
  marketplace: { code: 'ANALYTICS', label: 'Marketplace', route: '/app/marketplace' },
  runtime: { code: 'ANALYTICS', label: 'Runtime', route: '/app/runtime' },
  governance: { code: 'ANALYTICS', label: 'Gouvernance', route: '/app/governance' },
  scm: { code: 'STOCK', label: 'SCSC', route: '/app/scm' },
  mrp: { code: 'ERP', label: 'MRMRP', route: '/app/mrp' },
  etl: { code: 'ANALYTICS', label: 'ETETL', route: '/app/etl' },
  edi: { code: 'ERP', label: 'EDEDI', route: '/app/edi' },
};

export function agentCodeFromQuery(q: string | null | undefined): string | null {
  if (!q) return null;
  const key = q.toLowerCase();
  if (AGENT_MODULE_MAP[key]) return AGENT_MODULE_MAP[key].code;
  const upper = q.toUpperCase();
  const found = Object.values(AGENT_MODULE_MAP).find((m) => m.code === upper);
  return found?.code ?? (upper.length > 1 ? upper : null);
}

export function aiOfficeLinkForModule(moduleKey: string): string {
  const m = AGENT_MODULE_MAP[moduleKey];
  return m ? `/app/ai-office?agent=${moduleKey}` : '/app/ai-office';
}

export function moduleRouteForAgent(code: string): string {
  const found = Object.values(AGENT_MODULE_MAP).find((m) => m.code === code);
  return found?.route ?? '/app/ai-center';
}
