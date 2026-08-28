import * as THREE from 'three';
import { CHIEF_PLATFORM } from '../config/row-layout';
import { createGlassMaterial, createGoldFrameMaterial } from './glass.material';
import type { ScenePalette, SceneTheme } from './types';

/** Plateforme horizontale au fond du tapis — couvre les 10 bureaux de chefs. */
export function createChiefPlatform(palette: ScenePalette, theme: SceneTheme): THREE.Group {
  const root = new THREE.Group();
  root.name = 'chief-platform';
  root.position.set(CHIEF_PLATFORM.x, CHIEF_PLATFORM.y, CHIEF_PLATFORM.z);

  const glass = createGlassMaterial(palette, theme, { opacity: 0.42, transmission: 0.62 });
  const gold = createGoldFrameMaterial(palette);

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(CHIEF_PLATFORM.width, 0.08, CHIEF_PLATFORM.depth),
    glass,
  );
  deck.position.y = CHIEF_PLATFORM.deckY;
  deck.receiveShadow = true;
  deck.castShadow = true;
  deck.name = 'chief-platform-deck';
  root.add(deck);

  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(CHIEF_PLATFORM.width + 0.12, 0.03, CHIEF_PLATFORM.depth + 0.12),
    gold,
  );
  rim.position.y = CHIEF_PLATFORM.deckY + 0.05;
  root.add(rim);

  const postGeo = new THREE.CylinderGeometry(0.07, 0.09, CHIEF_PLATFORM.deckY, 10);
  const postXs = [-0.46, -0.23, 0, 0.23, 0.46].map((t) => t * CHIEF_PLATFORM.width);
  for (const lx of postXs) {
    for (const lz of [-CHIEF_PLATFORM.depth * 0.38, CHIEF_PLATFORM.depth * 0.38] as const) {
      const post = new THREE.Mesh(postGeo, glass);
      post.position.set(lx, CHIEF_PLATFORM.deckY / 2, lz);
      post.castShadow = true;
      root.add(post);
    }
  }

  for (const lz of [-CHIEF_PLATFORM.depth * 0.48, CHIEF_PLATFORM.depth * 0.48] as const) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(CHIEF_PLATFORM.width * 0.96, 0.04, 0.04),
      gold,
    );
    rail.position.set(0, CHIEF_PLATFORM.deckY + 0.55, lz);
    root.add(rail);
  }

  const glow = new THREE.PointLight(palette.gold, 0.45, CHIEF_PLATFORM.width);
  glow.position.set(0, CHIEF_PLATFORM.deckY + 1.0, 0);
  root.add(glow);

  // Panneau arrière — visuellement plaqué au mur du fond
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(CHIEF_PLATFORM.width + 0.08, CHIEF_PLATFORM.deckY + 0.35, 0.06),
    gold,
  );
  backPanel.position.set(0, (CHIEF_PLATFORM.deckY + 0.35) / 2, -CHIEF_PLATFORM.depth / 2 - 0.03);
  backPanel.receiveShadow = true;
  root.add(backPanel);

  root.userData['type'] = 'chief-platform';
  return root;
}
