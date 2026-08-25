import * as THREE from 'three';
import type { ScenePalette, SceneTheme } from './types';

function isDayTheme(theme: SceneTheme): boolean {
  return theme === 'SOLARPUNK' || theme === 'CORPORATE';
}

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

/**
 * Builds the shared office shell: wider floor, left CEO zone, center aisle
 * with data streams, right open-space, theme-specific plants / neon, NIHAO logo.
 */
export function buildOfficeEnvironment(
  scene: THREE.Scene,
  palette: ScenePalette,
  theme: SceneTheme,
): void {
  scene.background = new THREE.Color(palette.bg);
  const isDay = isDayTheme(theme);
  // Far fog extended so a zoomed-out full-room framing does not dissolve walls/desks
  scene.fog = new THREE.Fog(palette.bg, isDay ? 34 : 24, isDay ? 78 : 54);

  addLights(scene, palette, theme);
  addFloor(scene, palette, theme);
  addWalls(scene, palette, theme);
  addCirculationAisle(scene, palette, theme);
  addDataStreams(scene, palette, theme);
  addZoneMarkers(scene, palette, theme);
  addPlants(scene, palette, theme);
  addNihaoLogo(scene, palette, theme);
}

function addLights(scene: THREE.Scene, palette: ScenePalette, theme: SceneTheme): void {
  const isDay = isDayTheme(theme);
  const shadowSize = typeof window !== 'undefined' && window.devicePixelRatio > 1.5 ? 512 : 1024;

  if (isDay) {
    const ambient = new THREE.AmbientLight(theme === 'CORPORATE' ? 0xf0f4f8 : 0xe8f4ec, theme === 'CORPORATE' ? 0.5 : 0.42);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(palette.sky, palette.floor, theme === 'CORPORATE' ? 0.42 : 0.48);
    hemi.position.set(0, 14, 0);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(theme === 'CORPORATE' ? 0xfff8f0 : 0xfff0d0, theme === 'CORPORATE' ? 0.85 : 0.92);
    sun.position.set(4, 16, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.bias = -0.0002;
    scene.add(sun);

    const soft = new THREE.PointLight(palette.digital, 0.28, 24);
    soft.position.set(2, 5.2, 0);
    scene.add(soft);

    const windowFill = new THREE.DirectionalLight(0xd8f0e4, 0.22);
    windowFill.position.set(-6, 8, 10);
    scene.add(windowFill);

    const ceoGlow = new THREE.PointLight(palette.ceo, 0.38, 14);
    ceoGlow.position.set(-10, 3.5, 0);
    scene.add(ceoGlow);

    // Accent key on open-space desks (Task 9)
    const deskKey = new THREE.SpotLight(palette.accent, 0.35, 22, Math.PI / 5, 0.45, 1);
    deskKey.position.set(3, 7.5, 4);
    deskKey.target.position.set(3, 0, 1);
    scene.add(deskKey);
    scene.add(deskKey.target);
  } else {
    const ambient = new THREE.AmbientLight(0x1b2a42, 0.62);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x3ec4ff, 0x0f1724, 0.35);
    hemi.position.set(0, 14, 0);
    scene.add(hemi);

    const cyan = new THREE.PointLight(palette.neon, 1.25, 20);
    cyan.position.set(4, 4.2, 3);
    scene.add(cyan);

    const teal = new THREE.PointLight(palette.ceo, 0.95, 16);
    teal.position.set(-8, 3.8, -1);
    scene.add(teal);

    const fill = new THREE.DirectionalLight(0x8ecae6, 0.4);
    fill.position.set(-2, 12, 6);
    fill.castShadow = true;
    fill.shadow.mapSize.set(shadowSize, shadowSize);
    fill.shadow.bias = -0.0002;
    scene.add(fill);

    const deskFill = new THREE.PointLight(0xffffff, 0.35, 18);
    deskFill.position.set(2, 5, 0);
    scene.add(deskFill);

    const ceoSpot = new THREE.SpotLight(palette.ceo, 0.55, 16, Math.PI / 6, 0.4, 1);
    ceoSpot.position.set(-10, 6, 2);
    ceoSpot.target.position.set(-10, 0, 0);
    scene.add(ceoSpot);
    scene.add(ceoSpot.target);
  }
}

function addFloor(scene: THREE.Scene, palette: ScenePalette, theme: SceneTheme): void {
  // Expanded floor for CEO left + 3 poles right
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(30, 0.12, 18),
    mat(palette.floor, {
      roughness: theme === 'CYBERPUNK' ? 0.25 : 0.8,
      metalness: theme === 'CYBERPUNK' ? 0.55 : 0.05,
      emissive: theme === 'CYBERPUNK' ? palette.floor : palette.plant,
      emissiveIntensity: theme === 'CYBERPUNK' ? 0.12 : 0.04,
    }),
  );
  floor.position.y = -0.06;
  floor.receiveShadow = true;
  scene.add(floor);

  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(30.5, 0.06, 18.5),
    mat(isDayTheme(theme) ? palette.wood : palette.wall, { roughness: 0.7 }),
  );
  skirt.position.y = -0.14;
  scene.add(skirt);

  if (theme === 'CYBERPUNK') {
    addSynthwaveGrid(scene, palette);
  } else {
    // Soft tinted panels under open space (Solar + Corporate)
    const tintHex = theme === 'CORPORATE' ? '#D0DAE6' : '#B8D9A8';
    const tint = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.02, 12),
      mat(tintHex, { roughness: 0.92, opacity: 0.55, transparent: true }),
    );
    tint.position.set(3, 0.01, 0);
    scene.add(tint);
  }
}

function addSynthwaveGrid(scene: THREE.Scene, palette: ScenePalette): void {
  const gridMat = mat(palette.neon, {
    emissive: palette.neon,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.55,
  });
  const magMat = mat(palette.magenta, {
    emissive: palette.magenta,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.45,
  });

  for (let i = -14; i <= 14; i += 2) {
    const lineZ = new THREE.Mesh(new THREE.BoxGeometry(28, 0.012, 0.04), i % 4 === 0 ? magMat : gridMat);
    lineZ.position.set(0, 0.02, i * 0.55);
    scene.add(lineZ);
  }
  for (let i = -14; i <= 14; i += 2) {
    const lineX = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 16), i % 4 === 0 ? magMat : gridMat);
    lineX.position.set(i, 0.02, 0);
    scene.add(lineX);
  }
}

function addCirculationAisle(scene: THREE.Scene, palette: ScenePalette, theme: SceneTheme): void {
  // Vertical aisle between CEO glass office (left) and open-space (right)
  const aisle = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.025, 14),
    mat(isDayTheme(theme) ? '#D4E8C8' : '#1E293B', {
      roughness: 0.85,
      emissive: theme === 'CYBERPUNK' ? palette.neon : palette.digital,
      emissiveIntensity: theme === 'CYBERPUNK' ? 0.18 : 0.08,
    }),
  );
  aisle.position.set(-4.5, 0.015, 0);
  aisle.receiveShadow = true;
  scene.add(aisle);

  const stripMat = mat(isDayTheme(theme) ? palette.digital : palette.magenta, {
    emissive: isDayTheme(theme) ? palette.digital : palette.magenta,
    emissiveIntensity: theme === 'CYBERPUNK' ? 0.55 : 0.2,
  });
  for (const x of [-5.7, -3.3]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.018, 14), stripMat);
    strip.position.set(x, 0.025, 0);
    scene.add(strip);
  }
}

function addDataStreams(scene: THREE.Scene, palette: ScenePalette, theme: SceneTheme): void {
  const streamGroup = new THREE.Group();
  streamGroup.name = 'data-streams';
  const color = isDayTheme(theme) ? palette.digital : palette.neon;
  const geo = new THREE.SphereGeometry(0.06, 10, 8);
  const m = mat(color, {
    emissive: color,
    emissiveIntensity: theme === 'CYBERPUNK' ? 0.55 : 0.28,
    metalness: 0.25,
    roughness: 0.35,
  });

  // Soft glowing spheres along circulation path (CEO ↔ desks)
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const x = -9 + t * 10;
    const z = Math.sin(i * 0.9) * 0.35;
    const s = new THREE.Mesh(geo, m);
    s.position.set(x, 0.18 + (i % 3) * 0.05, z);
    s.userData['streamPhase'] = i * 0.45;
    streamGroup.add(s);
  }
  scene.add(streamGroup);
}

function addZoneMarkers(scene: THREE.Scene, palette: ScenePalette, theme: SceneTheme): void {
  // Soft carpet under the three poles (right open-space)
  const carpetColor = isDayTheme(theme) ? (theme === 'CORPORATE' ? '#D0DAE6' : '#C5DFA8') : '#1E293B';
  const carpet = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.018, 10),
    mat(carpetColor, {
      roughness: 0.95,
      emissive: theme === 'CYBERPUNK' ? palette.ceo : palette.plant,
      emissiveIntensity: theme === 'CYBERPUNK' ? 0.08 : 0.05,
    }),
  );
  carpet.position.set(2.5, 0.008, 0);
  scene.add(carpet);

  // Left CEO zone platform hint
  const ceoZone = new THREE.Mesh(
    new THREE.BoxGeometry(7, 0.02, 8),
    mat(isDayTheme(theme) ? (theme === 'CORPORATE' ? '#C5D0DC' : '#B8E0C0') : '#0F172A', {
      roughness: 0.8,
      emissive: palette.ceo,
      emissiveIntensity: 0.1,
    }),
  );
  ceoZone.position.set(-10, 0.01, 0);
  scene.add(ceoZone);
}

function addWalls(scene: THREE.Scene, palette: ScenePalette, theme: SceneTheme): void {
  const wallH = 4.2;
  const wallMat = mat(palette.wall, {
    roughness: 0.75,
    side: THREE.DoubleSide,
    emissive: isDayTheme(theme) ? palette.plant : palette.neon,
    emissiveIntensity: isDayTheme(theme) ? 0.06 : 0.05,
  });

  const back = new THREE.Mesh(new THREE.BoxGeometry(30, wallH, 0.2), wallMat);
  back.position.set(0, wallH / 2, -9);
  back.receiveShadow = true;
  scene.add(back);

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.2, wallH, 18), wallMat);
  left.position.set(-15, wallH / 2, 0);
  scene.add(left);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.2, wallH, 18), wallMat);
  right.position.set(15, wallH / 2, 0);
  scene.add(right);

  const front = new THREE.Mesh(new THREE.BoxGeometry(30, 1.2, 0.15), wallMat);
  front.position.set(0, 0.6, 9);
  scene.add(front);

  if (theme === 'CYBERPUNK') {
    // Neon wall frames
    const frameMat = mat(palette.neon, { emissive: palette.neon, emissiveIntensity: 0.6 });
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(29.5, 0.08, 0.08), frameMat);
    topRail.position.set(0, wallH - 0.15, -8.88);
    scene.add(topRail);
    const magRail = new THREE.Mesh(
      new THREE.BoxGeometry(29.5, 0.06, 0.06),
      mat(palette.magenta, { emissive: palette.magenta, emissiveIntensity: 0.55 }),
    );
    magRail.position.set(0, 0.4, -8.88);
    scene.add(magRail);
  }

  addWindows(scene, palette, theme, wallH);
}

function addWindows(
  scene: THREE.Scene,
  palette: ScenePalette,
  theme: SceneTheme,
  wallH: number,
): void {
  const windowPositions: Array<[number, number, number, number]> = [
    [-14.85, 2.2, -3, Math.PI / 2],
    [-14.85, 2.2, 2, Math.PI / 2],
    [-14.85, 2.2, 6, Math.PI / 2],
    [14.85, 2.2, -3, -Math.PI / 2],
    [14.85, 2.2, 2, -Math.PI / 2],
    [14.85, 2.2, 6, -Math.PI / 2],
  ];

  for (const [x, y, z, rotY] of windowPositions) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.6, 0.08),
      mat(theme === 'CYBERPUNK' ? palette.neon : palette.wood, {
        emissive: theme === 'CYBERPUNK' ? palette.neon : palette.accent,
        emissiveIntensity: theme === 'CYBERPUNK' ? 0.5 : 0.08,
        metalness: theme === 'CYBERPUNK' ? 0.6 : 0.1,
      }),
    );
    frame.position.set(x, y, z);
    frame.rotation.y = rotY;
    scene.add(frame);

    const pane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 1.3),
      mat(palette.sky, {
        emissive: palette.sky,
        emissiveIntensity: isDayTheme(theme) ? 0.75 : 0.35,
        metalness: 0.2,
        roughness: 0.3,
      }),
    );
    pane.position.set(x + Math.sin(rotY) * 0.05, y, z + Math.cos(rotY) * 0.05);
    pane.rotation.y = rotY;
    scene.add(pane);

    const muntinH = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.04, 0.02),
      mat(theme === 'CYBERPUNK' ? palette.magenta : palette.wood),
    );
    muntinH.position.copy(pane.position);
    muntinH.rotation.y = rotY;
    scene.add(muntinH);
    const muntinV = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 1.3, 0.02),
      mat(theme === 'CYBERPUNK' ? palette.accent : palette.wood),
    );
    muntinV.position.copy(pane.position);
    muntinV.rotation.y = rotY;
    scene.add(muntinV);
  }

  const skyStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 1.5),
    mat(palette.sky, {
      emissive: palette.sky,
      emissiveIntensity: isDayTheme(theme) ? 0.55 : 0.3,
    }),
  );
  skyStrip.position.set(2, wallH - 1.2, -8.88);
  scene.add(skyStrip);
}

function addPlants(scene: THREE.Scene, palette: ScenePalette, theme: SceneTheme): void {
  const spots: Array<[number, number, number, number]> =
    isDayTheme(theme)
      ? [
          [-13.5, 0, -7, 1.3],
          [13.5, 0, -7, 1.15],
          [-13.2, 0, 7.2, 1.0],
          [13.2, 0, 7.2, 1.05],
          [-6, 0, -8, 0.95],
          [6, 0, -8, 1.0],
          [-8, 0, 7.5, 0.9],
          [0, 0, -8.2, 0.85],
          [10, 0, 7.5, 0.95],
          [4, 0, 7.8, 0.8],
          [-2, 0, 7.6, 0.85],
          [12, 0, 0, 1.1],
        ]
      : [
          [-13.5, 0, -7, 0.9],
          [13.5, 0, -7, 0.85],
          [-13, 0, 7, 0.8],
          [13, 0, 7, 0.8],
        ];

  for (const [x, y, z, scale] of spots) {
    scene.add(createPlant(palette, theme, x, y, z, scale));
  }
}

function createPlant(
  palette: ScenePalette,
  theme: SceneTheme,
  x: number,
  y: number,
  z: number,
  scale: number,
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.35, 0.4, 12),
    mat(theme === 'CYBERPUNK' ? palette.wall : '#A16207', { roughness: 0.85 }),
  );
  pot.position.y = 0.2;
  pot.castShadow = true;
  g.add(pot);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.08, 0.7, 8),
    mat(theme === 'CYBERPUNK' ? palette.magenta : '#5C4033', { roughness: 0.9 }),
  );
  trunk.position.y = 0.7;
  g.add(trunk);

  const foliageMat = mat(palette.plant, {
    roughness: 0.7,
    emissive: palette.plant,
    emissiveIntensity: theme === 'CYBERPUNK' ? 0.35 : 0.15,
  });
  const f1 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), foliageMat);
  f1.position.set(0, 1.25, 0);
  f1.castShadow = true;
  g.add(f1);
  const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), foliageMat);
  f2.position.set(0.28, 1.35, 0.1);
  g.add(f2);
  const f3 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), foliageMat);
  f3.position.set(-0.22, 1.4, -0.1);
  g.add(f3);

  return g;
}

function addNihaoLogo(scene: THREE.Scene, palette: ScenePalette, theme: SceneTheme): void {
  const logoGroup = new THREE.Group();
  logoGroup.position.set(-10, 2.6, -8.85);
  logoGroup.name = 'nihao-logo';

  const nColors =
    isDayTheme(theme)
      ? [palette.accent, palette.ceo, palette.sky, palette.wood, palette.digital]
      : [palette.neon, palette.ceo, palette.accent, palette.magenta, '#94A3B8'];

  const nBlocks: Array<[number, number, number, number, number]> = [
    [0, 0, 0.18, 1.4, 0],
    [0.35, 0.35, 0.18, 0.7, 1],
    [0.7, 0, 0.18, 1.4, 2],
    [0.18, 0.95, 0.35, 0.18, 3],
    [0.35, 0.15, 0.35, 0.18, 4],
  ];

  for (const [bx, by, bw, bh, ci] of nBlocks) {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, 0.12),
      mat(nColors[ci], {
        emissive: nColors[ci],
        emissiveIntensity: theme === 'CYBERPUNK' ? 0.6 : 0.3,
        metalness: 0.2,
      }),
    );
    block.position.set(bx, by, 0);
    logoGroup.add(block);
  }

  const letters = ['N', 'I', 'H', 'A', 'O'];
  letters.forEach((letter, i) => {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.55, 0.06),
      mat(nColors[i], {
        emissive: nColors[i],
        emissiveIntensity: theme === 'CYBERPUNK' ? 0.55 : 0.25,
      }),
    );
    panel.position.set(1.6 + i * 0.55, 0.2, 0);
    panel.userData['letter'] = letter;
    logoGroup.add(panel);

    const stroke = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.35, 0.04),
      mat('#FFFDF8', { emissive: '#FFFDF8', emissiveIntensity: 0.55 }),
    );
    stroke.position.set(1.6 + i * 0.55, 0.2, 0.05);
    logoGroup.add(stroke);
  });

  scene.add(logoGroup);
}
