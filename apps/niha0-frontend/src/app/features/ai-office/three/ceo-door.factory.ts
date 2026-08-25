import * as THREE from 'three';
import type { CeoBellState, CeoDoorState } from '../../../core/approval/ceo-approval.models';
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
    side?: THREE.Side;
  } = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.08,
    emissive: opts.emissive ?? hex,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
  });
}

export interface CeoDoorParts {
  root: THREE.Group;
  doorLeaf: THREE.Mesh;
  bellButton: THREE.Mesh;
  bellIcon: THREE.Mesh;
  pendingGlow: THREE.Mesh;
  labelPanel: THREE.Mesh;
}

/** Glass partition + sliding door + intercom bell on the +x entrance of the CEO office. */
export function createCeoGlassEntrance(palette: ScenePalette, label = 'CEO · Direction'): CeoDoorParts {
  const root = new THREE.Group();
  root.name = 'ceo-glass-entrance';

  const frameColor = palette.text === '#123328' ? '#2A4A3A' : '#243552';
  const frameMat = mat(frameColor, { metalness: 0.55, roughness: 0.32, emissive: palette.neon, emissiveIntensity: 0.06 });
  const glassMat = mat(palette.glass, {
    transparent: true,
    opacity: palette.text === '#123328' ? 0.42 : 0.32,
    metalness: 0.72,
    roughness: 0.12,
    emissive: palette.neon,
    emissiveIntensity: 0.04,
    side: THREE.DoubleSide,
  });

  const wallH = 2.6;
  const entranceX = 2.72;

  // Fixed side panels (door is center, slides along +z)
  for (const z of [-1.55, 1.55] as const) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.06, wallH, 0.85), glassMat);
    panel.position.set(entranceX, wallH / 2 + 0.2, z);
    root.add(panel);
  }

  // Top / bottom frame
  for (const [y, sy] of [
    [wallH + 0.2, 0.08],
    [0.22, 0.06],
  ] as const) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, sy, 2.5), frameMat);
    bar.position.set(entranceX, y, 0);
    root.add(bar);
  }

  // Vertical frame posts
  for (const z of [-1.15, 1.15] as const) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, wallH, 0.08), frameMat);
    post.position.set(entranceX, wallH / 2 + 0.2, z);
    root.add(post);
  }

  const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.05, wallH - 0.15, 1.05), glassMat.clone());
  doorLeaf.position.set(entranceX - 0.02, wallH / 2 + 0.2, 0);
  doorLeaf.name = 'ceo-door-leaf';
  root.add(doorLeaf);

  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), frameMat);
  handle.position.set(entranceX - 0.06, 1.05, 0.35);
  doorLeaf.add(handle);

  const labelPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.22, 1.6),
    mat(palette.ceo, { emissive: palette.ceo, emissiveIntensity: 0.35, metalness: 0.2 }),
  );
  labelPanel.position.set(entranceX + 0.05, 2.35, 0);
  labelPanel.userData['label'] = label;
  root.add(labelPanel);

  // Label bars (same pattern as desk.factory)
  const barMat = mat('#FFFDF8', { emissive: '#FFFDF8', emissiveIntensity: 0.45 });
  const short = label.slice(0, 14);
  for (let i = 0; i < short.length; i++) {
    const w = 0.05 + (short.charCodeAt(i) % 4) * 0.015;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, w), barMat);
    bar.position.set(entranceX + 0.08, 2.35, -0.65 + i * 0.1);
    root.add(bar);
  }

  const pendingGlow = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.28, 32),
    mat(palette.accent, {
      emissive: palette.accent,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    }),
  );
  pendingGlow.position.set(entranceX + 0.06, 1.45, 0.42);
  pendingGlow.rotation.y = Math.PI / 2;
  root.add(pendingGlow);

  const bellButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.11, 0.06, 20),
    mat(frameColor, { metalness: 0.6, roughness: 0.28, emissive: palette.neon, emissiveIntensity: 0.12 }),
  );
  bellButton.rotation.z = Math.PI / 2;
  bellButton.position.set(entranceX + 0.07, 1.35, 0.42);
  bellButton.name = 'ceo-bell';
  bellButton.userData['type'] = 'ceo-bell';
  root.add(bellButton);

  const bellIcon = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.014, 8, 16, Math.PI * 1.35),
    mat(palette.accent, { emissive: palette.accent, emissiveIntensity: 0.55, metalness: 0.35 }),
  );
  bellIcon.rotation.set(Math.PI / 2, 0, Math.PI);
  bellIcon.position.set(0, 0.04, 0);
  bellButton.add(bellIcon);

  const clapper = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 8, 6),
    mat(palette.accent, { emissive: palette.accent, emissiveIntensity: 0.4 }),
  );
  clapper.position.set(0, -0.02, 0.04);
  bellButton.add(clapper);

  root.userData['doorState'] = 'closed' satisfies CeoDoorState;
  root.userData['bellState'] = 'idle' satisfies CeoBellState;

  return { root, doorLeaf, bellButton, bellIcon, pendingGlow, labelPanel };
}

export function updateCeoDoorVisuals(
  parts: CeoDoorParts,
  doorState: CeoDoorState,
  palette: ScenePalette,
  t: number,
  reducedMotion: boolean,
): void {
  const { doorLeaf, pendingGlow, labelPanel } = parts;
  const openOffset = doorState === 'open' ? 1.05 : doorState === 'request-pending' || doorState === 'reviewing' ? 0.15 : 0;
  const targetZ = openOffset;

  if (reducedMotion) {
    doorLeaf.position.z = targetZ;
  } else {
    doorLeaf.position.z += (targetZ - doorLeaf.position.z) * 0.08;
  }

  const glowMat = pendingGlow.material as THREE.MeshStandardMaterial;
  const active = doorState === 'request-pending' || doorState === 'reviewing';
  glowMat.opacity = active ? 0.55 + Math.sin(t * 5) * 0.2 : 0;
  pendingGlow.visible = active;

  const labelMat = labelPanel.material as THREE.MeshStandardMaterial;
  if (doorState === 'reviewing') {
    labelMat.emissiveIntensity = 0.55 + Math.sin(t * 3) * 0.15;
  } else if (doorState === 'request-pending') {
    labelMat.emissive.set(palette.accent);
    labelMat.emissiveIntensity = 0.5;
  } else if (doorState === 'open') {
    labelMat.emissive.set(palette.plant);
    labelMat.emissiveIntensity = 0.45;
  } else {
    labelMat.emissive.set(palette.ceo);
    labelMat.emissiveIntensity = 0.35;
  }

  parts.root.userData['doorState'] = doorState;
}

export function updateCeoBellVisuals(
  parts: CeoDoorParts,
  bellState: CeoBellState,
  palette: ScenePalette,
  t: number,
  reducedMotion: boolean,
): void {
  const btnMat = parts.bellButton.material as THREE.MeshStandardMaterial;
  const iconMat = parts.bellIcon.material as THREE.MeshStandardMaterial;

  switch (bellState) {
    case 'hovered':
      btnMat.emissiveIntensity = 0.35;
      iconMat.emissiveIntensity = 0.75;
      parts.bellButton.scale.set(1.06, 1.06, 1.06);
      break;
    case 'ringing':
      btnMat.emissiveIntensity = 0.5;
      iconMat.emissiveIntensity = 0.95;
      if (!reducedMotion) {
        const pulse = 1 + Math.sin(t * 18) * 0.08;
        parts.bellButton.scale.set(pulse, pulse, pulse);
        parts.bellIcon.rotation.z = Math.sin(t * 22) * 0.25;
      }
      break;
    case 'pending':
      btnMat.emissive.set(palette.accent);
      iconMat.emissive.set(palette.accent);
      btnMat.emissiveIntensity = 0.4 + Math.sin(t * 4) * 0.15;
      iconMat.emissiveIntensity = 0.7;
      parts.bellButton.scale.set(1, 1, 1);
      break;
    default:
      btnMat.emissive.set(palette.neon);
      iconMat.emissive.set(palette.accent);
      btnMat.emissiveIntensity = 0.12;
      iconMat.emissiveIntensity = 0.55;
      parts.bellButton.scale.set(1, 1, 1);
      parts.bellIcon.rotation.z = 0;
      break;
  }

  parts.root.userData['bellState'] = bellState;
}

/** Press animation when an agent rings or user clicks. */
export function triggerBellPress(parts: CeoDoorParts): void {
  parts.bellButton.position.x += 0.015;
  window.setTimeout(() => {
    parts.bellButton.position.x -= 0.015;
  }, 120);
}
