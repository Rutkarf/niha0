/**
 * Spatial layout for the scaled AI Office.
 * CEO desk and data libraries stay at their original world positions.
 */
import type { NavigationObstacle } from './navigation.types';

export { OPEN_SPACE_CARPET, openSpaceCarpetBounds, isInsideOpenSpaceCarpet } from '../config/open-space-carpet';

export const ROOM = {
  minX: -16,
  maxX: 18,
  minZ: -11,
  maxZ: 12,
  wallH: 5.6,
} as const;

export const ROOM_WIDTH = ROOM.maxX - ROOM.minX;
export const ROOM_DEPTH = ROOM.maxZ - ROOM.minZ;
export const ROOM_CENTER_X = (ROOM.minX + ROOM.maxX) / 2;
export const ROOM_CENTER_Z = (ROOM.minZ + ROOM.maxZ) / 2;

/** Existing CEO Command Center — do not move. */
export const CEO_POS = { x: -10, y: 0, z: 0 } as const;

/** Circulation / luminous strip between CEO (left) and open-space (right). */
export const AISLE_X = -4.5;

/**
 * 11 bureaux legacy — positions de référence (non rendues en 3D depuis Nihao).
 * Disposition 7+4 hors tapis vert ; seuls les 50 bureaux Nihao sont visibles.
 */
export const DESK_BY_CODE: Record<string, [number, number]> = {
  CRM: [0.5, 9.4],
  VENTES: [3.0, 9.4],
  SUPPORT: [5.5, 9.4],
  MARKETING: [8.0, 9.4],
  ERP: [10.5, 9.4],
  COMPTABILITE: [13.0, 9.4],
  RH: [15.5, 9.4],
  JURIDIQUE: [2.0, 10.9],
  STOCK: [6.5, 10.9],
  ANALYTICS: [11.0, 10.9],
  STRATEGIE: [15.0, 10.9],
};

export const DESK_POSITIONS: Array<[number, number, number]> = [
  [0.5, 0, 9.4],
  [3.0, 0, 9.4],
  [5.5, 0, 9.4],
  [8.0, 0, 9.4],
  [10.5, 0, 9.4],
  [13.0, 0, 9.4],
  [15.5, 0, 9.4],
  [2.0, 0, 10.9],
  [6.5, 0, 10.9],
  [11.0, 0, 10.9],
  [15.0, 0, 10.9],
];

export const MEZZANINE = {
  x: 11.2,
  y: 2.15,
  z: -7.4,
  width: 8.6,
  depth: 3.8,
  tiltDeg: 5,
} as const;

export interface ScenicAssistantDef {
  id: string;
  code: string;
  name: string;
  role: string;
  accent: string;
  x: number;
  y: number;
  z: number;
}

/** Three elevated AI assistants on the glass mezzanine (right-back). */
export const MEZZANINE_ASSISTANTS: readonly ScenicAssistantDef[] = [
  {
    id: 'mezz-runtime',
    code: 'RUNTIME',
    name: 'Runtime',
    role: 'Assistant IA — plateforme',
    accent: '#60A5FA',
    x: 8.8,
    y: MEZZANINE.y,
    z: -7.4,
  },
  {
    id: 'mezz-studio',
    code: 'STUDIO',
    name: 'Studio',
    role: 'Assistant IA — plateforme',
    accent: '#A78BFA',
    x: 11.2,
    y: MEZZANINE.y,
    z: -7.4,
  },
  {
    id: 'mezz-governance',
    code: 'GOVERNANCE',
    name: 'Gouvernance',
    role: 'Assistant IA — plateforme',
    accent: '#34D399',
    x: 13.6,
    y: MEZZANINE.y,
    z: -7.4,
  },
];

/** Three CEO staff assistants — left front, postes direction. */
export const CEO_STAFF: readonly ScenicAssistantDef[] = [
  {
    id: 'ceo-protocol',
    code: 'PROTOCOL',
    name: 'Chief of Staff',
    role: 'Direction — Chief of Staff',
    accent: '#D4A017',
    x: -12.4,
    y: 0,
    z: 7.2,
  },
  {
    id: 'ceo-staff',
    code: 'STAFF',
    name: 'Assistant de direction',
    role: 'Direction — Assistant de direction',
    accent: '#178F5E',
    x: -10.0,
    y: 0,
    z: 7.2,
  },
  {
    id: 'ceo-advisor',
    code: 'ADVISOR',
    name: 'Conseiller stratégique',
    role: 'Direction — Conseiller stratégique',
    accent: '#67E8F9',
    x: -7.6,
    y: 0,
    z: 7.2,
  },
];

export const CENTRALIZERS = [
  { id: 'hub-north', name: 'Centralisateur Nord', x: AISLE_X, z: -3.8 },
  { id: 'hub-south', name: 'Centralisateur Sud', x: AISLE_X, z: 3.8 },
] as const;

/** Ground footprint of the invisible stair + mezzanine — agents must walk around. */
export const STAIRS_OBSTACLE: NavigationObstacle = {
  id: 'glass-stairs',
  minX: 6.2,
  maxX: 16.4,
  minZ: -9.8,
  maxZ: -5.2,
  active: true,
};

export type TotemKind = 'eagle' | 'wolf' | 'fox' | 'tiger' | 'owl' | 'dragon' | 'butterfly';

/** Re-export config rangées Nihao (50 agents + 10 chefs) — voir config/row-layout.ts */
export { NIHAO_ROW_LAYOUTS, buildNihaoOfficeLayout, CHIEF_PLATFORM, NIHAO_ROW_GRID } from '../config/row-layout';

export interface TotemDef {
  kind: TotemKind;
  label: string;
  color: string;
  height: number;
  speed: number;
  waypoints: Array<[number, number, number]>;
}

export const TOTEM_ANIMALS: readonly TotemDef[] = [
  {
    kind: 'eagle',
    label: 'Aigle',
    color: '#F8E1A0',
    height: 3.8,
    speed: 1.15,
    waypoints: [
      [-14, 3.8, -9],
      [15, 3.9, -8],
      [15, 3.7, 10],
      [-14, 3.8, 9],
    ],
  },
  {
    kind: 'wolf',
    label: 'Loup',
    color: '#94A3B8',
    height: 0.42,
    speed: 0.85,
    waypoints: [
      [-14.5, 0.42, -4],
      [-14.2, 0.42, 5],
      [-6, 0.42, 10],
      [-14.5, 0.42, 2],
    ],
  },
  {
    kind: 'fox',
    label: 'Renard',
    color: '#FB923C',
    height: 0.38,
    speed: 1.05,
    waypoints: [
      [-2, 0.38, 10],
      [4, 0.38, 8],
      [0, 0.38, -4],
      [-6, 0.38, 6],
    ],
  },
  {
    kind: 'tiger',
    label: 'Tigre',
    color: '#F59E0B',
    height: 0.48,
    speed: 0.72,
    waypoints: [
      [16, 0.48, 2],
      [16, 0.48, 10],
      [6, 0.48, 10],
      [15, 0.48, 6],
    ],
  },
  {
    kind: 'owl',
    label: 'Hibou',
    color: '#C4B5A0',
    height: 1.85,
    speed: 0.55,
    waypoints: [
      [-13, 1.9, -9.5],
      [-7, 1.7, -9.2],
      [-14, 2.0, -6],
      [-10, 1.8, -9.4],
    ],
  },
  {
    kind: 'dragon',
    label: 'Dragon',
    color: '#34D399',
    height: 2.7,
    speed: 0.95,
    waypoints: [
      [-1, 2.6, -2],
      [5, 2.9, 2],
      [-2, 2.5, 5],
      [2, 2.8, -3],
    ],
  },
  {
    kind: 'butterfly',
    label: 'Papillon',
    color: '#F472B6',
    height: 1.25,
    speed: 1.35,
    waypoints: [
      [-8, 1.3, 8],
      [2, 1.1, 9],
      [8, 1.4, 7],
      [-4, 1.2, 10],
    ],
  },
];
