import { NIHAO_ROW_LAYOUTS, rowDeskCode } from './row-layout';
import type { LedMode } from '../three/led.factory';

/** Liaison module legacy → bureau Nihao (colonne + slot). */
export const AGENT_CODE_TO_ROW_DESK: Record<string, string> = {
  CRM: 'R3A2',
  VENTES: 'R3A1',
  SUPPORT: 'R2A1',
  MARKETING: 'R6A1',
  ERP: 'R9A1',
  COMPTABILITE: 'R5A1',
  RH: 'R4A1',
  JURIDIQUE: 'R4A3',
  STOCK: 'R9A3',
  ANALYTICS: 'R5A3',
  STRATEGIE: 'R6A3',
};

export interface NihaoLedAgentRef {
  id: string;
  code: string;
  status: string;
}

export interface NihaoLedSnapshot {
  agents: NihaoLedAgentRef[];
  pendingAgentIds: ReadonlySet<string>;
}

/** Vert = poste autonome · Rouge = confirmation humaine requise. */
export function ledModeForAgentStatus(status: string, pendingApproval = false): LedMode {
  if (pendingApproval) return 'red';
  switch (status.toUpperCase()) {
    case 'WAITING_APPROVAL':
    case 'PENDING_APPROVAL':
    case 'ERROR':
      return 'red';
    case 'OFFLINE':
    case 'PAUSED':
      return 'off';
    default:
      return 'green';
  }
}

function parseRowIdFromDesk(deskId: string): number | null {
  const match = /^R(\d+)A\d+$/.exec(deskId);
  return match ? Number(match[1]) : null;
}

export interface NihaoLedLayout {
  /** rowDeskId → mode */
  rowDesks: Map<string, LedMode>;
  /** rowId → mode chef */
  chiefs: Map<number, LedMode>;
  /** scenicId → mode (CEO staff, etc.) */
  scenic: Map<string, LedMode>;
}

export function buildNihaoLedLayout(snapshot: NihaoLedSnapshot): NihaoLedLayout {
  const rowDesks = new Map<string, LedMode>();
  const chiefs = new Map<number, LedMode>();
  const scenic = new Map<string, LedMode>();
  const redRows = new Set<number>();
  const redDesks = new Set<string>();

  for (const agent of snapshot.agents) {
    const pending = snapshot.pendingAgentIds.has(agent.id);
    const mode = ledModeForAgentStatus(agent.status, pending);
    if (mode !== 'red') continue;

    const deskId = AGENT_CODE_TO_ROW_DESK[agent.code];
    if (deskId) {
      redDesks.add(deskId);
      const rowId = parseRowIdFromDesk(deskId);
      if (rowId != null) redRows.add(rowId);
    }
  }

  for (const row of NIHAO_ROW_LAYOUTS) {
    let rowNeedsHuman = redRows.has(row.rowId);
    row.agents.forEach((_, col) => {
      const deskId = rowDeskCode(row.rowId, col);
      const deskRed = redDesks.has(deskId);
      if (deskRed) rowNeedsHuman = true;
      rowDesks.set(deskId, deskRed ? 'red' : 'green');
    });
    chiefs.set(row.rowId, rowNeedsHuman ? 'red' : 'green');
  }

  const anyPending = snapshot.pendingAgentIds.size > 0;
  scenic.set('ceo-protocol', anyPending ? 'red' : 'green');
  scenic.set('ceo-staff', anyPending ? 'red' : 'green');
  scenic.set('ceo-advisor', anyPending ? 'red' : 'green');

  return { rowDesks, chiefs, scenic };
}
