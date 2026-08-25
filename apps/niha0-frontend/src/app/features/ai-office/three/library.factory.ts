import * as THREE from 'three';
import type { ScenePalette } from './types';
import type { WorkspaceEntity } from '../../../core/workspace/workspace-catalog';

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
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.12,
    emissive: opts.emissive ?? hex,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}

/**
 * Futuristic data library / vault module for soon-modules (CMCMS, PIPIM, …).
 * Distinct silhouette per library id (Task 18).
 * userData: type='library', libraryId
 */
export function createDataLibrary(
  entity: WorkspaceEntity,
  palette: ScenePalette,
): THREE.Group {
  const group = new THREE.Group();
  group.name = `library-${entity.id}`;
  group.userData['type'] = 'library';
  group.userData['libraryId'] = entity.id;

  const accent = entity.accent;
  const frame = mat(palette.wall, {
    roughness: 0.45,
    metalness: 0.35,
    emissive: accent,
    emissiveIntensity: 0.08,
  });
  const shelfMat = mat(palette.wood, { roughness: 0.7 });
  const glowMat = mat(accent, {
    emissive: accent,
    emissiveIntensity: 0.55,
    metalness: 0.4,
    roughness: 0.3,
  });

  const variant = entity.id.length % 3;

  let body: THREE.Mesh;
  if (variant === 0) {
    body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 0.55), frame);
  } else if (variant === 1) {
    body = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.58, 2.15, 12), frame);
  } else {
    body = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.0, 0.48), frame);
  }
  body.position.y = variant === 2 ? 1.05 : 1.1;
  body.castShadow = true;
  body.receiveShadow = true;
  body.name = 'library-body';
  group.add(body);

  const shelfCount = variant === 1 ? 3 : 4;
  for (let i = 0; i < shelfCount; i++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 0.42), shelfMat);
    shelf.position.set(0, 0.45 + i * 0.45, 0.02);
    group.add(shelf);

    for (let j = 0; j < 3; j++) {
      const cart = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.28, 0.12),
        glowMat.clone(),
      );
      cart.position.set(-0.28 + j * 0.28, 0.62 + i * 0.45, 0.12);
      group.add(cart);
    }
  }

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(variant === 1 ? 0.22 : 0.28, variant === 1 ? 0.38 : 0.42, 32),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = variant === 2 ? 2.2 : 2.35;
  halo.name = 'library-halo';
  group.add(halo);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(variant === 1 ? 0.48 : 0.55, 0.62, 0.12, 20),
    frame,
  );
  base.position.y = 0.06;
  group.add(base);

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.22, 0.04),
    mat(palette.wall, { emissive: accent, emissiveIntensity: 0.25, metalness: 0.4 }),
  );
  plate.position.set(0, variant === 2 ? 1.95 : 2.05, 0.3);
  group.add(plate);

  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.03, 0.02),
    mat(accent, { emissive: accent, emissiveIntensity: 0.55 }),
  );
  edge.position.set(0, plate.position.y - 0.14, 0.32);
  group.add(edge);

  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 2.5, 0.9),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  hit.position.y = 1.2;
  hit.userData['type'] = 'library';
  hit.userData['libraryId'] = entity.id;
  hit.userData['skipBounds'] = true;
  group.add(hit);

  group.userData['baseScale'] = 1;
  group.userData['accent'] = accent;
  group.userData['halo'] = halo;
  group.userData['body'] = body;

  return group;
}

export function setLibraryVisualState(
  group: THREE.Group,
  state: 'idle' | 'hover' | 'selected',
): void {
  const target = state === 'idle' ? 1 : state === 'hover' ? 1.06 : 1.1;
  group.userData['targetScale'] = target;

  const halo = group.userData['halo'] as THREE.Mesh | undefined;
  if (halo && halo.material instanceof THREE.MeshBasicMaterial) {
    halo.material.opacity = state === 'idle' ? 0.35 : state === 'hover' ? 0.7 : 0.95;
  }

  const body = group.userData['body'] as THREE.Mesh | undefined;
  if (body && body.material instanceof THREE.MeshStandardMaterial) {
    const base = (group.userData['bodyBaseEmissive'] as number | undefined) ?? 0.08;
    group.userData['bodyBaseEmissive'] = base;
    body.material.emissiveIntensity =
      state === 'idle' ? base : state === 'hover' ? base + 0.18 : base + 0.28;
  }
}
