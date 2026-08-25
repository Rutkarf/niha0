import * as THREE from 'three';

/**
 * Floor pad / halo around each agent desk.
 * Sized to wrap the desk footprint (~1.7 × 0.85) so each accent color clearly belongs to its station.
 */
export const FOCUS_RING = {
  /** Just above the floor to avoid z-fighting. */
  y: 0.035,
  /** Inner edge — sits outside the desk top silhouette. */
  innerRadius: 0.95,
  /** Main colored ring. */
  outerRadius: 1.18,
  /** Soft outer glow. */
  glowRadius: 1.42,
  /** Fill disc under the desk for ownership readability. */
  fillRadius: 0.88,
  idleOpacity: 0.42,
  hoverOpacity: 0.85,
  selectedOpacity: 0.98,
  fillIdleOpacity: 0.14,
  fillHoverOpacity: 0.28,
  fillSelectedOpacity: 0.38,
  pulseAmp: 0.028,
} as const;

/**
 * Soft cyberpunk ring + translucent floor pad around a desk.
 * userData: type='focus-ring', agentId
 */
export function createFocusRing(agentId: string, accentHex: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `focus-ring-${agentId}`;
  group.userData['type'] = 'focus-ring';
  group.userData['agentId'] = agentId;
  group.position.y = FOCUS_RING.y;

  // Soft filled disc under the desk — ties accent color to the station
  const fillGeo = new THREE.CircleGeometry(FOCUS_RING.fillRadius, 48);
  const fillMat = new THREE.MeshBasicMaterial({
    color: accentHex,
    transparent: true,
    opacity: FOCUS_RING.fillIdleOpacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const fill = new THREE.Mesh(fillGeo, fillMat);
  fill.rotation.x = -Math.PI / 2;
  fill.position.y = 0.001;
  fill.name = 'ring-fill';
  group.add(fill);

  const ringGeo = new THREE.RingGeometry(FOCUS_RING.innerRadius, FOCUS_RING.outerRadius, 56);
  const ringMat = new THREE.MeshBasicMaterial({
    color: accentHex,
    transparent: true,
    opacity: FOCUS_RING.idleOpacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.004;
  ring.name = 'ring-core';
  group.add(ring);

  const glowGeo = new THREE.RingGeometry(FOCUS_RING.outerRadius, FOCUS_RING.glowRadius, 56);
  const glowMat = new THREE.MeshBasicMaterial({
    color: accentHex,
    transparent: true,
    opacity: FOCUS_RING.idleOpacity * 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.006;
  glow.name = 'ring-glow';
  group.add(glow);

  // Invisible hit volume covering the desk pad (hover / keyboard)
  const hitGeo = new THREE.CylinderGeometry(
    FOCUS_RING.glowRadius * 1.02,
    FOCUS_RING.glowRadius * 1.02,
    0.5,
    28,
  );
  const hitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const hit = new THREE.Mesh(hitGeo, hitMat);
  hit.position.y = 0.25;
  hit.name = 'ring-hit';
  hit.userData['type'] = 'focus-ring';
  hit.userData['agentId'] = agentId;
  group.add(hit);

  group.userData['ringMat'] = ringMat;
  group.userData['glowMat'] = glowMat;
  group.userData['fillMat'] = fillMat;
  group.userData['accent'] = accentHex;

  return group;
}

export function setFocusRingAccent(group: THREE.Group, accentHex: string): void {
  const ringMat = group.userData['ringMat'] as THREE.MeshBasicMaterial | undefined;
  const glowMat = group.userData['glowMat'] as THREE.MeshBasicMaterial | undefined;
  const fillMat = group.userData['fillMat'] as THREE.MeshBasicMaterial | undefined;
  group.userData['accent'] = accentHex;
  if (ringMat) ringMat.color.set(accentHex);
  if (glowMat) glowMat.color.set(accentHex);
  if (fillMat) fillMat.color.set(accentHex);
}

export function setFocusRingState(
  group: THREE.Group,
  state: 'idle' | 'hover' | 'selected',
  t = 0,
  opts: { reducedMotion?: boolean; activityBoost?: boolean } = {},
): void {
  const ringMat = group.userData['ringMat'] as THREE.MeshBasicMaterial | undefined;
  const glowMat = group.userData['glowMat'] as THREE.MeshBasicMaterial | undefined;
  const fillMat = group.userData['fillMat'] as THREE.MeshBasicMaterial | undefined;
  if (!ringMat || !glowMat) return;

  let opacity: number = FOCUS_RING.idleOpacity;
  let fillOpacity: number = FOCUS_RING.fillIdleOpacity;
  if (state === 'hover') {
    opacity = FOCUS_RING.hoverOpacity;
    fillOpacity = FOCUS_RING.fillHoverOpacity;
  }
  if (state === 'selected') {
    opacity = FOCUS_RING.selectedOpacity;
    fillOpacity = FOCUS_RING.fillSelectedOpacity;
  }
  if (opts.activityBoost && state === 'idle') {
    opacity = Math.min(0.72, opacity + 0.18);
    fillOpacity = Math.min(0.28, fillOpacity + 0.08);
  }

  ringMat.opacity = opacity;
  glowMat.opacity = opacity * 0.45;
  if (fillMat) fillMat.opacity = fillOpacity;

  if (state !== 'idle' && !opts.reducedMotion) {
    const pulse = 1 + Math.sin(t * 3.2) * FOCUS_RING.pulseAmp;
    group.scale.set(pulse, 1, pulse);
  } else if (opts.activityBoost && !opts.reducedMotion && state === 'idle') {
    const pulse = 1 + Math.sin(t * 2.4) * (FOCUS_RING.pulseAmp * 0.55);
    group.scale.set(pulse, 1, pulse);
  } else {
    group.scale.set(1, 1, 1);
  }
}
