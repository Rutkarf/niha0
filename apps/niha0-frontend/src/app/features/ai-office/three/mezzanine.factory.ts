import * as THREE from 'three';
import { createCartoonAvatar } from './avatar.factory';
import { createGlassMaterial, createGoldFrameMaterial } from './glass.material';
import { MEZZANINE, MEZZANINE_ASSISTANTS } from './layout';
import { createLedPair } from './led.factory';
import type { ScenePalette, SceneTheme } from './types';

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
    metalness: opts.metalness ?? 0.12,
    emissive: opts.emissive ?? hex,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}

/**
 * Elevated glass mezzanine (right-back) with 3 AI assistants, LED pairs,
 * and an invisible staircase used only as a collision volume.
 */
export function createMezzanine(palette: ScenePalette, theme: SceneTheme): THREE.Group {
  const root = new THREE.Group();
  root.name = 'glass-mezzanine';
  root.position.set(MEZZANINE.x, 0, MEZZANINE.z);

  const glass = createGlassMaterial(palette, theme, { opacity: 0.42, transmission: 0.62 });
  const gold = createGoldFrameMaterial(palette);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(MEZZANINE.width, 0.08, MEZZANINE.depth), glass);
  deck.position.y = MEZZANINE.y;
  deck.rotation.x = THREE.MathUtils.degToRad(MEZZANINE.tiltDeg);
  deck.receiveShadow = true;
  deck.castShadow = true;
  deck.name = 'mezzanine-deck';
  root.add(deck);

  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(MEZZANINE.width + 0.12, 0.03, MEZZANINE.depth + 0.12),
    gold,
  );
  rim.position.y = MEZZANINE.y + 0.05;
  rim.rotation.x = deck.rotation.x;
  root.add(rim);

  const postGeo = new THREE.CylinderGeometry(0.07, 0.09, MEZZANINE.y, 10);
  for (const [lx, lz] of [
    [-MEZZANINE.width * 0.42, -MEZZANINE.depth * 0.38],
    [MEZZANINE.width * 0.42, -MEZZANINE.depth * 0.38],
    [-MEZZANINE.width * 0.42, MEZZANINE.depth * 0.38],
    [MEZZANINE.width * 0.42, MEZZANINE.depth * 0.38],
  ] as const) {
    const post = new THREE.Mesh(postGeo, glass);
    post.position.set(lx, MEZZANINE.y / 2, lz);
    post.castShadow = true;
    root.add(post);
  }

  const railMat = gold;
  for (const z of [-MEZZANINE.depth * 0.48, MEZZANINE.depth * 0.48] as const) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(MEZZANINE.width * 0.92, 0.04, 0.04), railMat);
    rail.position.set(0, MEZZANINE.y + 0.55, z);
    root.add(rail);
  }

  addInvisibleStairs(root);

  const glow = new THREE.PointLight(palette.gold, 0.45, 10);
  glow.position.set(0, MEZZANINE.y + 1.2, 0);
  root.add(glow);

  return root;
}

function addInvisibleStairs(parent: THREE.Group): void {
  const stairs = new THREE.Group();
  stairs.name = 'invisible-stairs';
  stairs.userData['type'] = 'stairs';

  const ghost = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const steps = 8;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 1.6), ghost);
    step.position.set(-MEZZANINE.width * 0.5 - 0.4 - t * 0.15, 0.12 + t * MEZZANINE.y, 0);
    step.userData['skipBounds'] = true;
    step.userData['type'] = 'stairs';
    stairs.add(step);
  }

  const volume = new THREE.Mesh(new THREE.BoxGeometry(3.4, MEZZANINE.y + 0.4, 2.2), ghost);
  volume.position.set(-MEZZANINE.width * 0.55, (MEZZANINE.y + 0.4) / 2, 0);
  volume.userData['skipBounds'] = true;
  volume.userData['type'] = 'stairs';
  stairs.add(volume);

  parent.add(stairs);
}

export interface ScenicRuntime {
  id: string;
  name: string;
  role: string;
  group: THREE.Group;
  avatar: THREE.Group;
  leds: THREE.Group;
}

export function createMezzanineAssistants(
  palette: ScenePalette,
): ScenicRuntime[] {
  return MEZZANINE_ASSISTANTS.map((def) => {
    const group = new THREE.Group();
    group.name = `scenic-${def.id}`;
    group.position.set(def.x, def.y, def.z);
    group.userData['type'] = 'scenic';
    group.userData['scenicId'] = def.id;

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.48, 0.06, 20),
      mat(palette.gold, { emissive: palette.gold, emissiveIntensity: 0.2, metalness: 0.55, roughness: 0.3 }),
    );
    pad.position.y = 0.03;
    group.add(pad);

    const miniDesk = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.06, 0.48),
      mat(palette.glass, {
        transparent: true,
        opacity: 0.4,
        metalness: 0.55,
        roughness: 0.12,
        emissive: def.accent,
        emissiveIntensity: 0.12,
      }),
    );
    miniDesk.position.set(0, 0.72, -0.15);
    group.add(miniDesk);

    const avatar = createCartoonAvatar(def.code, def.accent);
    avatar.position.set(0, 0, 0.22);
    avatar.userData['scenicId'] = def.id;
    avatar.userData['type'] = 'scenic';
    group.add(avatar);

    const leds = createLedPair(def.id);
    leds.position.set(0, 1.52, 0.22);
    group.add(leds);

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 2.0, 1.0),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    hit.position.y = 1;
    hit.userData['type'] = 'scenic';
    hit.userData['scenicId'] = def.id;
    hit.userData['skipBounds'] = true;
    group.add(hit);

    return { id: def.id, name: def.name, role: def.role, group, avatar, leds };
  });
}
