/** Carré vert open-space (tapisserie sous les bureaux agents). Source unique pour layout + Three.js. */
export const OPEN_SPACE_CARPET = {
  centerX: 7.2,
  centerZ: 1.2,
  width: 22,
  depth: 16,
  /** Marge intérieure pour que les meshes de bureau restent dans le carré vert. */
  inset: 1.0,
} as const;

export interface CarpetBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function openSpaceCarpetBounds(): CarpetBounds {
  const halfW = OPEN_SPACE_CARPET.width / 2 - OPEN_SPACE_CARPET.inset;
  const halfZ = OPEN_SPACE_CARPET.depth / 2 - OPEN_SPACE_CARPET.inset;
  return {
    minX: OPEN_SPACE_CARPET.centerX - halfW,
    maxX: OPEN_SPACE_CARPET.centerX + halfW,
    minZ: OPEN_SPACE_CARPET.centerZ - halfZ,
    maxZ: OPEN_SPACE_CARPET.centerZ + halfZ,
  };
}

/** Répartit `count` points uniformément entre min et max (inclus). */
export function distributeAlongAxis(min: number, max: number, count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [(min + max) / 2];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + i * step);
}

export function isInsideOpenSpaceCarpet(x: number, z: number, slack = 0): boolean {
  const b = openSpaceCarpetBounds();
  return (
    x >= b.minX - slack &&
    x <= b.maxX + slack &&
    z >= b.minZ - slack &&
    z <= b.maxZ + slack
  );
}

/** Rotation Y autour du centre du tapis (biais global des colonnes). */
export function rotateAroundCarpetCenter(
  localX: number,
  localZ: number,
  angleRad: number,
): { x: number; z: number } {
  const dx = localX - OPEN_SPACE_CARPET.centerX;
  const dz = localZ - OPEN_SPACE_CARPET.centerZ;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: OPEN_SPACE_CARPET.centerX + dx * cos - dz * sin,
    z: OPEN_SPACE_CARPET.centerZ + dx * sin + dz * cos,
  };
}
