import * as THREE from 'three';
import { createCartoonAvatar } from './avatar.factory';
import { createAgentDesk } from './desk.factory';
import { createFocusRing, setFocusRingAccent } from './focus-ring.factory';
import { createLedPair, setLedMode } from './led.factory';
import {
  DESK_AVATAR_SEATED_Y,
  DESK_CHAIR_SEAT,
  deskForwardPointsToward,
  orientDeskToward,
} from './desk-orientation';
import { getChiefLookTarget, getRowCenter, rowDeskCode } from '../config/row-layout';
import { memberTitleForRow } from '../config/team-roles';
import { teamForRow } from '../config/team-colors';
import { RENDER_PERF, stripCastShadows } from './render-performance';
import { createCompactDeskLabel } from './desk-nameplate.factory';
import type { RowLayoutConfig } from '../models/row-config.model';
import type { ScenePalette } from './types';

const NIHAO_DESK_OPTS = {
  castShadow: RENDER_PERF.nihaoCastShadow,
  lowSegments: RENDER_PERF.nihaoLowSegments,
  includePlant: false,
} as const;

export interface RowAgentRuntime {
  id: string;
  rowId: number;
  deskIndex: number;
  agentId: number;
  role: string;
  color: string;
  label: string;
  desk: THREE.Group;
  avatar: THREE.Group;
  leds: THREE.Group;
  clickZone: THREE.Mesh;
  focusRing: THREE.Group;
  hoverLabel: THREE.Sprite | null;
}

function attachSeatedAvatar(desk: THREE.Group, avatar: THREE.Group): void {
  avatar.position.set(DESK_CHAIR_SEAT.x, DESK_CHAIR_SEAT.y, DESK_CHAIR_SEAT.z);
  avatar.rotation.y = DESK_AVATAR_SEATED_Y;
  desk.add(avatar);
  if (!RENDER_PERF.nihaoCastShadow) {
    stripCastShadows(avatar);
  }
}

/** 4 bureaux en colonne devant le chef — écran vers le chef, avatar assis sur la chaise. */
export function createAgentRowDesks(
  row: RowLayoutConfig,
  palette: ScenePalette,
): RowAgentRuntime[] {
  const team = teamForRow(row.rowId);
  const chiefTarget = getChiefLookTarget(row);

  return row.agents.map((pos, col) => {
    const code = rowDeskCode(row.rowId, col);
    const label = pos.title?.trim() || memberTitleForRow(row.rowId, col);
    const accent = team.color;

    const desk = createAgentDesk(label, accent, palette, code, NIHAO_DESK_OPTS);
    desk.position.set(pos.x, pos.y, pos.z);
    desk.userData['type'] = 'row-desk';
    desk.userData['rowId'] = row.rowId;
    desk.userData['deskIndex'] = col;
    desk.userData['rowDeskId'] = code;
    desk.scale.setScalar(0.82);
    orientDeskToward(desk, pos.x, pos.z, chiefTarget.x, chiefTarget.z);
    desk.userData['department'] = row.role;
    desk.userData['jobTitle'] = label;

    const hoverLabel = createCompactDeskLabel({ title: label, accentHex: accent });
    if (hoverLabel) desk.add(hoverLabel);

    const avatar = createCartoonAvatar(code, accent);
    avatar.scale.setScalar(0.82);
    avatar.userData['type'] = 'row-desk';
    avatar.userData['rowId'] = row.rowId;
    avatar.userData['deskIndex'] = col;
    avatar.userData['rowDeskId'] = code;
    attachSeatedAvatar(desk, avatar);
    avatar.userData['label'] = label;
    avatar.userData['jobTitle'] = label;
    avatar.userData['department'] = row.role;

    const leds = createLedPair(code);
    leds.position.set(0, 1.52, 0);
    avatar.add(leds);
    setLedMode(leds, 'green');

    const clickZone = new THREE.Mesh(
      new THREE.CircleGeometry(0.92, RENDER_PERF.clickZoneSegments),
      new THREE.MeshBasicMaterial({
        color: team.color,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    clickZone.rotation.x = -Math.PI / 2;
    clickZone.position.set(pos.x, pos.y + 0.04, pos.z);
    clickZone.userData['type'] = 'row-desk';
    clickZone.userData['rowDeskId'] = code;
    clickZone.userData['rowId'] = row.rowId;
    clickZone.userData['deskIndex'] = col;
    clickZone.userData['skipBounds'] = true;

    const focusRing = createFocusRing(code, accent);
    focusRing.position.set(pos.x, focusRing.position.y, pos.z);
    focusRing.userData['rowDeskId'] = code;
    focusRing.userData['type'] = 'row-desk';
    setFocusRingAccent(focusRing, accent);

    return {
      id: code,
      rowId: row.rowId,
      deskIndex: col,
      agentId: pos.agentId,
      role: row.role,
      color: team.color,
      label,
      desk,
      avatar,
      leds,
      clickZone,
      focusRing,
      hoverLabel,
    };
  });
}

export interface ChiefDeskRuntime {
  id: string;
  rowId: number;
  role: string;
  group: THREE.Group;
  desk: THREE.Group;
  avatar: THREE.Group;
  leds: THREE.Group;
}

function darkenHex(hex: string, factor = 0.82): string {
  const c = hex.replace('#', '');
  const r = Math.round(parseInt(c.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(c.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(c.slice(4, 6), 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Chef sur plateforme — bureau face à sa colonne, avatar assis sur la chaise. */
export function createChiefDesk(
  row: RowLayoutConfig,
  palette: ScenePalette,
): ChiefDeskRuntime {
  const code = `CHIEF-R${row.rowId}`;
  const team = teamForRow(row.rowId);
  const rowCenter = getRowCenter(row);
  const chiefAccent = darkenHex(team.color);

  const group = new THREE.Group();
  group.name = `chief-${row.rowId}`;
  group.position.set(row.chief.x, 0, row.chief.z);
  group.userData['type'] = 'chief';
  group.userData['rowId'] = row.rowId;
  group.userData['chiefId'] = row.chief.chiefId;
  group.userData['scenicId'] = code;

  const desk = createAgentDesk(row.chief.title, chiefAccent, palette, code, NIHAO_DESK_OPTS);
  desk.position.set(0, row.chief.y, 0);
  desk.scale.setScalar(0.88);
  orientDeskToward(desk, row.chief.x, row.chief.z, rowCenter.x, rowCenter.z);
  desk.userData['department'] = row.role;
  desk.userData['jobTitle'] = row.chief.title;
  const chiefHoverLabel = createCompactDeskLabel({ title: row.chief.title, accentHex: chiefAccent });
  if (chiefHoverLabel) desk.add(chiefHoverLabel);
  group.add(desk);

  const avatar = createCartoonAvatar(code, chiefAccent);
  avatar.scale.setScalar(0.9);
  avatar.userData['type'] = 'chief';
  avatar.userData['rowId'] = row.rowId;
  attachSeatedAvatar(desk, avatar);
  avatar.userData['label'] = row.chief.title;
  avatar.userData['jobTitle'] = row.chief.title;
  avatar.userData['department'] = row.role;

  const leds = createLedPair(code);
  leds.position.set(0, 1.52, 0);
  avatar.add(leds);
  setLedMode(leds, 'green');

  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 1.8, 0.9),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  hit.position.set(0, row.chief.y + 0.9, 0);
  hit.userData['type'] = 'chief';
  hit.userData['rowId'] = row.rowId;
  hit.userData['skipBounds'] = true;
  group.add(hit);

  return {
    id: code,
    rowId: row.rowId,
    role: row.role,
    group,
    desk,
    avatar,
    leds,
  };
}

/** Contrôle d'alignement chef → colonne (tests + debug visuel). */
export function isChiefDeskFacingRow(row: RowLayoutConfig, desk: THREE.Group): boolean {
  const center = getRowCenter(row);
  return deskForwardPointsToward(desk, row.chief.x, row.chief.z, center.x, center.z);
}
