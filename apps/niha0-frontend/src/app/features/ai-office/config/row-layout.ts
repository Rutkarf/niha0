import { OPEN_SPACE_CARPET, openSpaceCarpetBounds } from './open-space-carpet';
import { rowColor } from './colors';
import { chiefTitleForRow, keyPosition, memberTitleForRow } from './roles';
import { distributeAlongAxis } from './open-space-carpet';
import type { NihaoOfficeLayout, RowLayoutConfig } from '../models/row-config.model';

/** 10 équipes × 4 bureaux — colonnes droites le long de Z, chefs alignés sur X au fond. */
export const NIHAO_ROW_GRID = {
  teamCount: 10,
  desksPerTeam: 4,
} as const;

/** Pas de biais — bureaux axis-aligned. */
export const LAYOUT_SKEW_DEG = 0;
export const LAYOUT_SKEW_RAD = 0;

const CARPET = openSpaceCarpetBounds();
const PLATFORM_INNER_W = OPEN_SPACE_CARPET.width - OPEN_SPACE_CARPET.inset * 2;
const PLATFORM_DEPTH = 3.0;

/** Mur du fond de la salle (miroir layout.ts ROOM.minZ). */
export const BACK_WALL_Z = -11;
const WALL_CLEARANCE = 0.12;

/** Marge latérale pour aérer les colonnes d'équipes. */
const TEAM_SIDE_MARGIN = 1.25;

/**
 * Plateforme chefs — horizontale, plaquée contre le mur du fond, couvre les 10 chefs.
 */
export const CHIEF_PLATFORM = {
  x: OPEN_SPACE_CARPET.centerX,
  y: 0,
  z: BACK_WALL_Z + WALL_CLEARANCE + PLATFORM_DEPTH / 2,
  width: PLATFORM_INNER_W,
  depth: PLATFORM_DEPTH,
  deckY: 2.25,
  tiltDeg: 0,
  rotationY: 0,
} as const;

const CHIEF_Z = CHIEF_PLATFORM.z;

/** 10 colonnes X — espacement régulier avec marges latérales. */
const TEAM_X = distributeAlongAxis(
  CARPET.minX + TEAM_SIDE_MARGIN,
  CARPET.maxX - TEAM_SIDE_MARGIN,
  NIHAO_ROW_GRID.teamCount,
);

/** 4 profondeurs Z sur le tapis vert — espacement aéré (membres → avant). */
const MEMBER_Z = distributeAlongAxis(
  CARPET.minZ + 1.0,
  CARPET.maxZ - 1.0,
  NIHAO_ROW_GRID.desksPerTeam,
);

function buildTeamLayout(rowId: number): RowLayoutConfig {
  const i = rowId - 1;
  const teamX = TEAM_X[i]!;

  const agents = MEMBER_Z.map((z, col) => ({
    agentId: i * NIHAO_ROW_GRID.desksPerTeam + col + 1,
    title: memberTitleForRow(rowId, col),
    x: teamX,
    y: 0,
    z,
  }));

  return {
    rowId,
    color: rowColor(rowId),
    role: keyPosition(rowId),
    chiefTitle: chiefTitleForRow(rowId),
    agents,
    chief: {
      chiefId: rowId,
      title: chiefTitleForRow(rowId),
      x: teamX,
      y: CHIEF_PLATFORM.deckY,
      z: CHIEF_Z,
    },
  };
}

/** 10 colonnes × 4 bureaux + 10 chefs sur plateforme fond. */
export const NIHAO_ROW_LAYOUTS: readonly RowLayoutConfig[] = Array.from(
  { length: NIHAO_ROW_GRID.teamCount },
  (_, idx) => buildTeamLayout(idx + 1),
);

export function buildNihaoOfficeLayout(): NihaoOfficeLayout {
  const rows = [...NIHAO_ROW_LAYOUTS];
  return {
    rows,
    rowCount: rows.length,
    agentCount: rows.reduce((n, r) => n + r.agents.length, 0),
    chiefCount: rows.length,
  };
}

export function isChiefOnPlatform(x: number, z: number): boolean {
  const halfW = CHIEF_PLATFORM.width / 2;
  const halfD = CHIEF_PLATFORM.depth / 2;
  return (
    x >= CHIEF_PLATFORM.x - halfW &&
    x <= CHIEF_PLATFORM.x + halfW &&
    z >= CHIEF_PLATFORM.z - halfD &&
    z <= CHIEF_PLATFORM.z + halfD
  );
}

/** Centre de la colonne membres (chef regarde ce point). */
export function getRowCenter(row: RowLayoutConfig): { x: number; z: number } {
  const z = row.agents.reduce((sum, a) => sum + a.z, 0) / row.agents.length;
  return { x: row.chief.x, z };
}

/** Point cible lookAt pour un bureau membre (son chef). */
export function getChiefLookTarget(row: RowLayoutConfig): { x: number; y: number; z: number } {
  return { x: row.chief.x, y: row.chief.y, z: row.chief.z };
}

/** Vérifie que chef + 4 membres partagent le même X (colonne droite). */
export function isTeamColumnAligned(row: RowLayoutConfig, tolerance = 0.05): boolean {
  for (const agent of row.agents) {
    if (Math.abs(agent.x - row.chief.x) > tolerance) return false;
    if (agent.z <= row.chief.z) return false;
  }
  const zValues = row.agents.map((a) => a.z);
  return new Set(zValues).size === row.agents.length;
}

/** Espacement moyen entre colonnes d'équipes (axe X). */
export function teamColumnSpacing(): number {
  if (TEAM_X.length < 2) return 0;
  return (TEAM_X[TEAM_X.length - 1]! - TEAM_X[0]!) / (TEAM_X.length - 1);
}

/** Espacement moyen entre bureaux d'une même colonne (axe Z). */
export function memberDeskSpacing(): number {
  if (MEMBER_Z.length < 2) return 0;
  return (MEMBER_Z[MEMBER_Z.length - 1]! - MEMBER_Z[0]!) / (MEMBER_Z.length - 1);
}

/**
 * Code interne d'un bureau membre : `R{équipe}A{position}`.
 * Ex. R1A1 = équipe Accueil, 1er bureau (fond → avant).
 * Utilisé en interne (clic, API) — ne pas afficher tel quel à l'utilisateur.
 */
export function rowDeskCode(rowId: number, deskIndex: number): string {
  return `R${rowId}A${deskIndex + 1}`;
}

/** Résout un code bureau (R3A2…) en intitulé métier + pôle. */
export function resolveRowDeskCode(
  code: string,
): { rowId: number; deskIndex: number; title: string; pole: string } | null {
  const match = /^R(\d+)A(\d+)$/.exec(code);
  if (!match) return null;
  const rowId = Number(match[1]);
  const deskIndex = Number(match[2]) - 1;
  const row = NIHAO_ROW_LAYOUTS.find((r) => r.rowId === rowId);
  if (!row || deskIndex < 0 || deskIndex >= row.agents.length) return null;
  return {
    rowId,
    deskIndex,
    title: row.agents[deskIndex]!.title,
    pole: row.role,
  };
}
