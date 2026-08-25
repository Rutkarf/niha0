import * as THREE from 'three';
import type { CompanyBranding } from '../../../core/workspace/professional.models';
import { createCompanyCarpet, createCompanyLogoPlaque } from './branding.factory';
import { createCeoAvatar } from './ceo-avatar.factory';
import { createCeoGlassEntrance, type CeoDoorParts } from './ceo-door.factory';
import { createGlassMaterial, createGoldFrameMaterial } from './glass.material';
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
    metalness: opts.metalness ?? 0.1,
    emissive: opts.emissive ?? hex,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}

/** Desk bezel / stand — theme-aware, never pure black. */
function bezelHex(palette: ScenePalette): string {
  return palette.wall;
}
function standHex(palette: ScenePalette): string {
  return palette.wood;
}

/** Agent desk: table, chair, glowing monitor, nameplate, plant + code accessory. */
export function createAgentDesk(
  label: string,
  accentHex: string,
  palette: ScenePalette,
  code?: string,
): THREE.Group {
  const group = new THREE.Group();
  group.name = `desk-${label}`;
  group.userData['type'] = 'desk';
  group.userData['label'] = label;
  group.userData['code'] = code ?? '';

  const wood = mat(palette.wood, { roughness: 0.68, metalness: 0.04 });
  const accent = mat(accentHex, { emissive: accentHex, emissiveIntensity: 0.14, metalness: 0.22 });
  const bezelMat = mat(bezelHex(palette), { roughness: 0.45, metalness: 0.28 });
  const standMat = mat(standHex(palette), { roughness: 0.55, metalness: 0.18 });

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.85), wood);
  top.position.y = 0.78;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(1.72, 0.04, 0.87),
    mat(accentHex, { emissive: accentHex, emissiveIntensity: 0.08, metalness: 0.35 }),
  );
  edge.position.y = 0.72;
  group.add(edge);

  const legMat = mat(palette.wood, { roughness: 0.7, metalness: 0.05 });
  const legGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.72, 8);
  for (const [x, z] of [
    [-0.7, -0.32],
    [0.7, -0.32],
    [-0.7, 0.32],
    [0.7, 0.32],
  ] as const) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, 0.36, z);
    leg.castShadow = true;
    group.add(leg);
  }

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.45), wood);
  seat.position.set(0, 0.45, 0.75);
  group.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.07), accent);
  back.position.set(0, 0.75, 0.95);
  group.add(back);
  const chairLegGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.42, 6);
  for (const [x, z] of [
    [-0.18, 0.6],
    [0.18, 0.6],
    [-0.18, 0.9],
    [0.18, 0.9],
  ] as const) {
    const cl = new THREE.Mesh(chairLegGeo, legMat);
    cl.position.set(x, 0.21, z);
    group.add(cl);
  }

  const bezelMesh = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.48, 0.05), bezelMat);
  bezelMesh.position.set(0, 1.15, -0.22);
  group.add(bezelMesh);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.38),
    mat(accentHex, { emissive: accentHex, emissiveIntensity: 0.45, roughness: 0.25, metalness: 0.12 }),
  );
  screen.position.set(0, 1.15, -0.19);
  group.add(screen);

  const standMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.22, 8), standMat);
  standMesh.position.set(0, 0.92, -0.22);
  group.add(standMesh);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.03, 12), standMat);
  base.position.set(0, 0.84, -0.22);
  group.add(base);

  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.12), accent);
  plate.position.set(0, 0.86, 0.3);
  group.add(plate);
  const plateTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.02, 0.1),
    mat(palette.wall, { emissive: accentHex, emissiveIntensity: 0.1 }),
  );
  plateTop.position.set(0, 0.9, 0.3);
  group.add(plateTop);

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 0.1, 10),
    mat('#B45309', { roughness: 0.8 }),
  );
  pot.position.set(0.65, 0.88, -0.2);
  group.add(pot);
  const foliage = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 8),
    mat(palette.plant, { roughness: 0.75, emissive: palette.plant, emissiveIntensity: 0.08 }),
  );
  foliage.position.set(0.65, 1.02, -0.2);
  group.add(foliage);

  if (code) addDeskAccessory(group, code, accentHex, palette);

  return group;
}

/** Distinct desktop props per agent code. */
function addDeskAccessory(
  group: THREE.Group,
  code: string,
  accentHex: string,
  palette: ScenePalette,
): void {
  switch (code) {
    case 'CRM': {
      // Contact orb
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 12, 10),
        mat(accentHex, { emissive: accentHex, emissiveIntensity: 0.5 }),
      );
      orb.position.set(-0.6, 0.95, 0.15);
      group.add(orb);
      break;
    }
    case 'VENTES': {
      const chart = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.28, 4),
        mat(accentHex, { emissive: accentHex, emissiveIntensity: 0.4 }),
      );
      chart.position.set(-0.55, 0.98, 0.2);
      group.add(chart);
      break;
    }
    case 'SUPPORT': {
      const ticket = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.02, 0.16),
        mat(accentHex, { emissive: accentHex, emissiveIntensity: 0.3 }),
      );
      ticket.position.set(-0.55, 0.86, 0.2);
      group.add(ticket);
      break;
    }
    case 'MARKETING': {
      const megaphone = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.22, 10),
        mat(accentHex, { emissive: accentHex, emissiveIntensity: 0.45 }),
      );
      megaphone.position.set(-0.55, 0.95, 0.15);
      megaphone.rotation.z = Math.PI / 2;
      group.add(megaphone);
      break;
    }
    case 'ERP': {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.16, 0.16),
        mat(accentHex, { emissive: accentHex, emissiveIntensity: 0.35, metalness: 0.4 }),
      );
      cube.position.set(-0.55, 0.95, 0.15);
      cube.rotation.y = Math.PI / 6;
      group.add(cube);
      break;
    }
    case 'COMPTABILITE': {
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.03, 16),
        mat('#FBBF24', { emissive: '#FBBF24', emissiveIntensity: 0.5, metalness: 0.7 }),
      );
      coin.position.set(-0.55, 0.88, 0.2);
      coin.rotation.x = Math.PI / 2;
      group.add(coin);
      break;
    }
    case 'RH': {
      const heart = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 10, 8),
        mat(accentHex, { emissive: accentHex, emissiveIntensity: 0.4 }),
      );
      heart.position.set(-0.55, 0.95, 0.15);
      group.add(heart);
      break;
    }
    case 'JURIDIQUE': {
      const scale = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.04, 0.04),
        mat(accentHex, { emissive: accentHex, emissiveIntensity: 0.35 }),
      );
      scale.position.set(-0.55, 0.95, 0.15);
      group.add(scale);
      break;
    }
    case 'STOCK': {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.14, 0.16),
        mat(accentHex, { emissive: accentHex, emissiveIntensity: 0.3, roughness: 0.7 }),
      );
      crate.position.set(-0.55, 0.92, 0.15);
      group.add(crate);
      break;
    }
    case 'ANALYTICS': {
      const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05), mat(accentHex, { emissive: accentHex, emissiveIntensity: 0.4 }));
      bar1.position.set(-0.62, 0.92, 0.15);
      const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), mat(palette.digital, { emissive: palette.digital, emissiveIntensity: 0.4 }));
      bar2.position.set(-0.55, 0.96, 0.15);
      const bar3 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.05), mat(accentHex, { emissive: accentHex, emissiveIntensity: 0.4 }));
      bar3.position.set(-0.48, 0.94, 0.15);
      group.add(bar1, bar2, bar3);
      break;
    }
    case 'STRATEGIE': {
      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.1),
        mat(accentHex, { emissive: accentHex, emissiveIntensity: 0.55 }),
      );
      star.position.set(-0.55, 0.98, 0.15);
      group.add(star);
      break;
    }
    default:
      break;
  }
}

export interface CeoOfficeOptions {
  companyName?: string;
  ownerLabel?: string;
  branding?: CompanyBranding;
  logoUrl?: string | null;
}

/**
 * Premium CEO Command Center — opens toward +x (room center).
 * Waiting ring at local (+2.5, 0, 0) = toward open space.
 */
export function createCeoOffice(
  palette: ScenePalette,
  options: CeoOfficeOptions = {},
  theme: SceneTheme = 'SOLARPUNK',
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ceo-office';
  group.userData['type'] = 'ceo';

  const companyName = options.companyName || 'Entreprise';
  const ownerLabel = options.ownerLabel || 'CEO';
  const branding = options.branding;

  const glassMat = createGlassMaterial(palette, theme);
  const frameMat = createGoldFrameMaterial(palette);
  const wood = mat(palette.wood, { roughness: 0.55 });
  const ceoMat = mat(palette.ceo, { emissive: palette.ceo, emissiveIntensity: 0.3, metalness: 0.25 });

  // Larger raised platform
  const platform = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.2, 5.0), wood);
  platform.position.y = 0.1;
  platform.receiveShadow = true;
  platform.castShadow = true;
  group.add(platform);

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(5.7, 0.04, 5.1),
    mat(palette.gold, { emissive: palette.gold, emissiveIntensity: 0.4, metalness: 0.75, roughness: 0.22 }),
  );
  trim.position.y = 0.22;
  group.add(trim);

  // Glass walls: closed on -x (outer), ±z sides; open toward +x (center)
  const wallH = 2.6;
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, wallH, 4.8), glassMat);
  backWall.position.set(-2.7, wallH / 2 + 0.2, 0);
  group.add(backWall);
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(5.2, wallH, 0.08), glassMat);
  leftWall.position.set(0, wallH / 2 + 0.2, -2.4);
  group.add(leftWall);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(5.2, wallH, 0.08), glassMat);
  rightWall.position.set(0, wallH / 2 + 0.2, 2.4);
  group.add(rightWall);

  for (const [x, z, sx, sz] of [
    [-2.7, 0, 0.06, 4.9],
    [0, -2.4, 5.3, 0.06],
    [0, 2.4, 5.3, 0.06],
  ] as const) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.06, sz), frameMat);
    frame.position.set(x, wallH + 0.2, z);
    group.add(frame);
  }

  // CEO desk facing +x (toward open space)
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 2.6), wood);
  deskTop.position.set(-0.8, 0.98, 0);
  deskTop.castShadow = true;
  group.add(deskTop);
  for (const [x, z] of [
    [-1.2, -1.1],
    [-0.4, -1.1],
    [-1.2, 1.1],
    [-0.4, 1.1],
  ] as const) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.88, 8), wood);
    leg.position.set(x, 0.52, z);
    group.add(leg);
  }

  const throne = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.75), ceoMat);
  throne.position.set(-1.6, 0.58, 0);
  group.add(throne);
  const throneBack = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.95, 0.75), ceoMat);
  throneBack.position.set(-1.9, 1.05, 0);
  group.add(throneBack);

  // Wall screen on outer wall (-x) — kept subtle; logo plaque overlays branding
  const wallScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 2.4),
    mat(palette.neon, { emissive: palette.neon, emissiveIntensity: 0.25, roughness: 0.3 }),
  );
  wallScreen.position.set(-2.65, 1.9, 0);
  wallScreen.rotation.y = Math.PI / 2;
  group.add(wallScreen);
  const screenFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 2.55, 1.55),
    mat(palette.wall, { metalness: 0.35, roughness: 0.4 }),
  );
  screenFrame.position.set(-2.68, 1.9, 0);
  group.add(screenFrame);

  addLabelPanel(group, ownerLabel, palette.ceo, -1.2, 2.7, -1.6);
  addLabelPanel(group, companyName, branding?.primaryColor || palette.accent, -1.2, 2.95, 0);
  addLabelPanel(group, 'Command Center', branding?.accentColor || palette.neon, -1.2, 2.7, 1.6);

  if (branding) {
    group.add(createCompanyLogoPlaque(branding, companyName, options.logoUrl ?? null, palette));
    group.add(createCompanyCarpet(branding, companyName, palette));
  }

  addLetterBlocks(group, palette);

  // Waiting ring at +2.5 local X (toward center / wait zone)
  const waitRing = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.75, 48),
    mat(palette.ceo, {
      emissive: palette.ceo,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.85,
      metalness: 0.3,
      roughness: 0.3,
    }),
  );
  waitRing.rotation.x = -Math.PI / 2;
  waitRing.position.set(2.5, 0.24, 0);
  group.add(waitRing);

  const waitGlow = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 32),
    mat(palette.ceo, {
      emissive: palette.ceo,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.35,
    }),
  );
  waitGlow.rotation.x = -Math.PI / 2;
  waitGlow.position.set(2.5, 0.23, 0);
  group.add(waitGlow);

  group.userData['waitLocal'] = new THREE.Vector3(2.5, 0, 0);

  const doorLabel = `${ownerLabel} · Validation`;
  const doorParts = createCeoGlassEntrance(palette, doorLabel);
  group.add(doorParts.root);

  const ceoAvatar = createCeoAvatar(palette);
  group.add(ceoAvatar);

  group.userData['doorParts'] = doorParts;
  group.userData['ceoAvatar'] = ceoAvatar;
  group.userData['wallScreen'] = wallScreen;

  return group;
}

export type { CeoDoorParts };

function addLabelPanel(parent: THREE.Group, title: string, color: string, x: number, y: number, z: number): void {
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.28, 1.35),
    mat(color, { emissive: color, emissiveIntensity: 0.45, metalness: 0.2 }),
  );
  panel.position.set(x, y, z);
  panel.userData['label'] = title;
  parent.add(panel);

  const barMat = mat('#FFFDF8', { emissive: '#FFFDF8', emissiveIntensity: 0.5 });
  const barCount = Math.min(title.length, 8);
  for (let i = 0; i < barCount; i++) {
    const w = 0.06 + (title.charCodeAt(i) % 5) * 0.02;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, w), barMat);
    bar.position.set(x + 0.04, y, z - 0.5 + i * 0.14);
    parent.add(bar);
  }
}

function addLetterBlocks(parent: THREE.Group, palette: ScenePalette): void {
  const colors = [palette.ceo, palette.accent, palette.neon, palette.plant, palette.magenta];
  const letters = ['R', 'B', 'O', 'T', 'C'];
  letters.forEach((letter, i) => {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.22, 0.22),
      mat(colors[i % colors.length], {
        emissive: colors[i % colors.length],
        emissiveIntensity: 0.35,
      }),
    );
    block.position.set(-2.5, 1.4, -1.0 + i * 0.5);
    block.userData['letter'] = letter;
    parent.add(block);
  });
}
