import * as THREE from 'three';
import { createGlassMaterial, createGoldFrameMaterial } from './glass.material';
import { CENTRALIZERS } from './layout';
import type { ScenePalette, SceneTheme } from './types';

export interface CentralizerRuntime {
  id: string;
  name: string;
  group: THREE.Group;
}

/**
 * Two data hubs standing on the luminous central strip.
 */
export function createCentralizers(
  palette: ScenePalette,
  theme: SceneTheme,
): CentralizerRuntime[] {
  return CENTRALIZERS.map((def, i) => {
    const group = new THREE.Group();
    group.name = `centralizer-${def.id}`;
    group.position.set(def.x, 0, def.z);
    group.userData['type'] = 'centralizer';
    group.userData['centralizerId'] = def.id;

    const glass = createGlassMaterial(palette, theme, { opacity: 0.5, transmission: 0.5 });
    const gold = createGoldFrameMaterial(palette);
    const glow = new THREE.MeshStandardMaterial({
      color: palette.digital,
      emissive: palette.digital,
      emissiveIntensity: 0.55,
      metalness: 0.35,
      roughness: 0.25,
    });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 0.14, 24), gold);
    base.position.y = 0.07;
    base.castShadow = true;
    group.add(base);

    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.55, 16), glass);
    column.position.y = 0.92;
    column.castShadow = true;
    group.add(column);

    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.045, 10, 28), glow);
    torus.rotation.x = Math.PI / 2;
    torus.position.y = 1.15 + (i % 2) * 0.12;
    torus.name = 'hub-ring';
    group.add(torus);

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), glow);
    core.position.y = 1.72;
    core.name = 'hub-core';
    group.add(core);

    const hit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 2.0, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    hit.position.y = 1;
    hit.userData['type'] = 'centralizer';
    hit.userData['centralizerId'] = def.id;
    hit.userData['skipBounds'] = true;
    group.add(hit);

    return { id: def.id, name: def.name, group };
  });
}

export function tickCentralizer(group: THREE.Group, t: number, reducedMotion: boolean): void {
  if (reducedMotion) return;
  group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (obj.name === 'hub-ring') obj.rotation.z = t * 0.8;
    if (obj.name === 'hub-core') {
      obj.rotation.y = t * 1.4;
      obj.position.y = 1.72 + Math.sin(t * 2.2) * 0.06;
    }
  });
}
