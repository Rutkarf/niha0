import * as THREE from 'three';

/** Brief scale / emissive pulse confirming a 3D click (Task 5). */
export function pulseObjectClick(
  root: THREE.Object3D,
  reducedMotion: boolean,
  durationMs = 180,
): void {
  if (reducedMotion) return;
  const start = performance.now();
  const base = root.scale.clone();
  const tick = (now: number): void => {
    const t = Math.min(1, (now - start) / durationMs);
    const s = 1 + Math.sin(t * Math.PI) * 0.045;
    root.scale.set(base.x * s, base.y * s, base.z * s);
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      root.scale.copy(base);
    }
  };
  requestAnimationFrame(tick);
}

/** Soft emissive boost for hover on MeshStandardMaterial trees (CEO / bell). */
export function setEmissiveBoost(
  root: THREE.Object3D,
  boost: boolean,
  intensity = 0.22,
): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const m = obj.material;
    if (Array.isArray(m)) return;
    if (!(m instanceof THREE.MeshStandardMaterial)) return;
    if (m.userData['baseEmissiveIntensity'] == null) {
      m.userData['baseEmissiveIntensity'] = m.emissiveIntensity;
    }
    const base = m.userData['baseEmissiveIntensity'] as number;
    m.emissiveIntensity = boost ? base + intensity : base;
  });
}

export type SceneTooltipKind = 'agent' | 'library' | 'ceo' | 'bell' | 'scenic' | 'centralizer' | 'totem' | null;

export interface SceneTooltipPayload {
  kind: SceneTooltipKind;
  title: string;
  subtitle?: string;
  /** Normalized 0–1 screen position relative to canvas. */
  ndcX: number;
  ndcY: number;
  visible: boolean;
}
