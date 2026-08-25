import * as THREE from 'three';
import type { ScenePalette, SceneTheme } from './types';

function isDayTheme(theme: SceneTheme): boolean {
  return theme === 'SOLARPUNK' || theme === 'CORPORATE';
}

/** Premium frosted glass — MeshPhysicalMaterial with partial transmission. */
export function createGlassMaterial(
  palette: ScenePalette,
  theme: SceneTheme,
  opts: { opacity?: number; transmission?: number } = {},
): THREE.MeshPhysicalMaterial {
  const day = isDayTheme(theme);
  return new THREE.MeshPhysicalMaterial({
    color: palette.glass,
    metalness: 0.18,
    roughness: 0.12,
    transmission: opts.transmission ?? (day ? 0.55 : 0.38),
    thickness: 0.42,
    ior: 1.42,
    transparent: true,
    opacity: opts.opacity ?? (day ? 0.48 : 0.36),
    emissive: new THREE.Color(palette.neon),
    emissiveIntensity: day ? 0.05 : 0.1,
    clearcoat: 0.72,
    clearcoatRoughness: 0.14,
    side: THREE.DoubleSide,
  });
}

export function createGoldFrameMaterial(palette: ScenePalette): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: palette.gold,
    metalness: 0.82,
    roughness: 0.22,
    emissive: palette.gold,
    emissiveIntensity: 0.28,
  });
}
