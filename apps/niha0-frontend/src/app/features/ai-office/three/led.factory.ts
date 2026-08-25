import * as THREE from 'three';

export type LedMode = 'off' | 'red' | 'green' | 'both';

function bulb(color: string): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.12,
    roughness: 0.28,
    metalness: 0.15,
    transparent: true,
    opacity: 0.92,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), mat);
  mesh.userData['baseEmissive'] = 0.12;
  return mesh;
}

/**
 * Red / green LED pair that sits above an assistant.
 * Click lights them; `setLedMode` drives glow intensity.
 */
export function createLedPair(id: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `leds-${id}`;
  group.userData['type'] = 'leds';
  group.userData['ledId'] = id;

  const bar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8),
    new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.55, roughness: 0.35 }),
  );
  bar.rotation.z = Math.PI / 2;
  bar.position.y = 0;
  group.add(bar);

  const red = bulb('#EF4444');
  red.name = 'led-red';
  red.position.set(-0.09, 0, 0);
  group.add(red);

  const green = bulb('#22C55E');
  green.name = 'led-green';
  green.position.set(0.09, 0, 0);
  group.add(green);

  group.userData['red'] = red;
  group.userData['green'] = green;
  group.userData['mode'] = 'off' as LedMode;
  group.userData['pulseUntil'] = 0;

  return group;
}

export function setLedMode(group: THREE.Group, mode: LedMode): void {
  group.userData['mode'] = mode;
}

export function pulseLeds(group: THREE.Group, durationMs = 1600): void {
  group.userData['pulseUntil'] = performance.now() + durationMs;
  const current = (group.userData['mode'] as LedMode) ?? 'off';
  if (current === 'off') group.userData['mode'] = 'both';
}

export function tickLedPair(group: THREE.Group, t: number, reducedMotion: boolean): void {
  const red = group.userData['red'] as THREE.Mesh | undefined;
  const green = group.userData['green'] as THREE.Mesh | undefined;
  const mode = (group.userData['mode'] as LedMode) ?? 'off';
  const pulseUntil = (group.userData['pulseUntil'] as number) ?? 0;
  const pulsing = performance.now() < pulseUntil;
  const wave = reducedMotion ? 1 : 0.72 + Math.sin(t * 7) * 0.28;

  const apply = (mesh: THREE.Mesh | undefined, on: boolean): void => {
    if (!mesh || !(mesh.material instanceof THREE.MeshStandardMaterial)) return;
    const base = (mesh.userData['baseEmissive'] as number) ?? 0.12;
    if (!on) {
      mesh.material.emissiveIntensity = base;
      mesh.scale.setScalar(1);
      return;
    }
    const intensity = pulsing ? base + 1.35 * wave : base + 0.85;
    mesh.material.emissiveIntensity = intensity;
    mesh.scale.setScalar(pulsing && !reducedMotion ? 1 + wave * 0.18 : 1.08);
  };

  apply(red, mode === 'red' || mode === 'both');
  apply(green, mode === 'green' || mode === 'both');
}
