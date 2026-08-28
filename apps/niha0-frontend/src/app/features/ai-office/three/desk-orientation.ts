import * as THREE from 'three';

/** Rotation Y pour un avatar (regard +Z local vers la cible). */
export function orientAvatarToward(
  obj: THREE.Object3D,
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
): void {
  obj.rotation.x = 0;
  obj.rotation.z = 0;
  obj.rotation.y = Math.atan2(toX - fromX, toZ - fromZ);
}

/**
 * Rotation Y pour un bureau : écran (local -Z) et utilisateur face à la cible.
 * La chaise est côté +Z local ; l'avatar enfant doit avoir rotation.y = Math.PI.
 */
export function orientDeskToward(
  obj: THREE.Object3D,
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
): void {
  obj.rotation.x = 0;
  obj.rotation.z = 0;
  obj.rotation.y = Math.atan2(toX - fromX, toZ - fromZ) + Math.PI;
}

/** Position standard de l'avatar assis sur la chaise (+Z local du bureau). */
export const DESK_CHAIR_SEAT = { x: 0, y: 0.45, z: 0.72 } as const;

/** Rotation avatar enfant d'un bureau orienté (regarde l'écran / la cible). */
export const DESK_AVATAR_SEATED_Y = Math.PI;

/** Vérifie que le forward bureau (-Z local) pointe vers la cible (tolérance rad). */
export function deskForwardPointsToward(
  obj: THREE.Object3D,
  worldX: number,
  worldZ: number,
  targetX: number,
  targetZ: number,
  toleranceRad = 0.2,
): boolean {
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(obj.getWorldQuaternion(new THREE.Quaternion()));
  const dx = targetX - worldX;
  const dz = targetZ - worldZ;
  const len = Math.hypot(dx, dz) || 1;
  const dot = forward.x * (dx / len) + forward.z * (dz / len);
  return dot >= Math.cos(toleranceRad);
}
