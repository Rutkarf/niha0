import * as THREE from 'three';
import { createCartoonAvatar } from './avatar.factory';
import { CEO_STAFF, type ScenicAssistantDef } from './layout';
import { createLedPair } from './led.factory';
import type { ScenicRuntime } from './mezzanine.factory';
import type { ScenePalette } from './types';

function mat(
  hex: string,
  opts: {
    roughness?: number;
    metalness?: number;
    emissive?: string;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
  } = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: opts.roughness ?? 0.5,
    metalness: opts.metalness ?? 0.1,
    emissive: opts.emissive ?? hex,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}

export function createCeoStaffAssistants(palette: ScenePalette): ScenicRuntime[] {
  return CEO_STAFF.map((def) => buildStaff(def, palette));
}

function buildStaff(def: ScenicAssistantDef, palette: ScenePalette): ScenicRuntime {
  const group = new THREE.Group();
  group.name = `scenic-${def.id}`;
  group.position.set(def.x, def.y, def.z);
  group.userData['type'] = 'scenic';
  group.userData['scenicId'] = def.id;

  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 24),
    mat(palette.gold, {
      emissive: palette.gold,
      emissiveIntensity: 0.16,
      transparent: true,
      opacity: 0.55,
      metalness: 0.35,
      roughness: 0.4,
    }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.y = 0.02;
  group.add(rug);

  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.08, 0.7),
    mat(palette.wood, { roughness: 0.62, metalness: 0.08 }),
  );
  stand.position.y = 0.04;
  group.add(stand);

  const avatar = createCartoonAvatar(def.code, def.accent);
  avatar.userData['scenicId'] = def.id;
  avatar.userData['type'] = 'scenic';
  group.add(avatar);

  const leds = createLedPair(def.id);
  leds.position.set(0, 1.52, 0);
  group.add(leds);

  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 2.0, 1.0),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  hit.position.y = 1;
  hit.userData['type'] = 'scenic';
  hit.userData['scenicId'] = def.id;
  hit.userData['skipBounds'] = true;
  group.add(hit);

  return { id: def.id, name: def.name, role: def.role, group, avatar, leds };
}
