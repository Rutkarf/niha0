import * as THREE from 'three';

/** Profil perf 3D — réduit ombres / géométrie sur les 60 bureaux Nihao sans casser le visuel global. */
export const RENDER_PERF = {
  maxPixelRatio: 1.75,
  antialias: true,
  disableShadowsOnMobile: true,
  mobileMaxWidth: 900,
  mobileMinDpr: 2.5,
  shadowMapSize: 1024,
  shadowMapSizeLow: 512,
  nihaoCastShadow: false,
  nihaoLowSegments: true,
  clickZoneSegments: 16,
  fpsLogIntervalFrames: 0,
} as const;

export type RenderPerfProfile = typeof RENDER_PERF;

export function resolvePixelRatio(cap: number): number {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.devicePixelRatio, cap);
}

export function shouldDisableShadows(profile: RenderPerfProfile): boolean {
  if (typeof window === 'undefined') return false;
  if (!profile.disableShadowsOnMobile) return false;
  return (
    window.matchMedia(`(max-width: ${profile.mobileMaxWidth}px)`).matches ||
    window.devicePixelRatio >= profile.mobileMinDpr
  );
}

export function resolveShadowMapSize(profile: RenderPerfProfile, shadowsEnabled: boolean): number {
  if (!shadowsEnabled) return profile.shadowMapSizeLow;
  return typeof window !== 'undefined' && window.devicePixelRatio > 1.5
    ? profile.shadowMapSizeLow
    : profile.shadowMapSize;
}

export function stripCastShadows(root: THREE.Object3D): void {
  root.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.castShadow = false;
    }
  });
}
