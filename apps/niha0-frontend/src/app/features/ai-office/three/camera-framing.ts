import * as THREE from 'three';

/** Extra margin around the room (~18–22%) so walls/desks breathe in frame. */
export const CAMERA_ROOM_PADDING = 1.2;

export const CAMERA_DEFAULT_FOV = 46;
/** Slightly wider FOV on narrow / portrait viewports. */
export const CAMERA_MOBILE_FOV = 52;
export const CAMERA_NEAR = 0.15;
export const CAMERA_FAR_MIN = 180;
export const CAMERA_INITIAL_YAW = 0.22;
/** Orbit height as a fraction of horizontal radius — elevated command-center view. */
export const CAMERA_HEIGHT_RATIO = 0.5;
/** Absolute floor for orbit distance (short rooms / mobile). */
export const CAMERA_MIN_ORBIT_FLOOR = 22;
/** Soft visual margin bias toward open-space (+x) so CEO + desks both read. */
export const CAMERA_LOOK_BIAS_X = 0.35;

export interface RoomCameraFraming {
  lookAt: THREE.Vector3;
  orbitRadius: number;
  orbitHeight: number;
  yaw: number;
  fov: number;
  near: number;
  far: number;
  /** Soft limits for focus / manual framing. */
  minOrbitRadius: number;
  maxOrbitRadius: number;
  /** Polar angle soft max for OrbitControls (radians). */
  maxPolarAngle: number;
  /** Polar angle soft min for OrbitControls (radians). */
  minPolarAngle: number;
}

/**
 * World-space bounds of the office floor + walls (source of truth for empty scene).
 * Matches office-builder floor (30×18) and wall placements (±15 x, ±9 z, h≈4.2).
 */
export const ROOM_STATIC_BOUNDS = new THREE.Box3(
  new THREE.Vector3(-15.2, 0, -9.2),
  new THREE.Vector3(15.2, 4.4, 9.2),
);

/**
 * Builds a bounding box from scene contents, falling back to static room bounds.
 * Skips lights, cameras, helpers, and invisible hit volumes.
 */
export function computeRoomBounds(scene: THREE.Scene): THREE.Box3 {
  const box = new THREE.Box3();
  let hasMesh = false;

  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (!obj.geometry) return;
    if (obj.name === 'ring-hit' || obj.userData['skipBounds'] === true) return;
    const mat = obj.material;
    if (mat && !Array.isArray(mat) && mat.opacity === 0 && mat.transparent) return;
    const local = new THREE.Box3().setFromObject(obj);
    if (local.isEmpty()) return;
    box.union(local);
    hasMesh = true;
  });

  if (!hasMesh || box.isEmpty()) {
    return ROOM_STATIC_BOUNDS.clone();
  }

  box.union(ROOM_STATIC_BOUNDS);
  return box;
}

/** Aspect-aware FOV: taller / narrower canvases need a wider lens. */
export function resolveFramingFov(camera: THREE.PerspectiveCamera): number {
  const aspect = Math.max(0.35, camera.aspect || 1);
  if (aspect < 0.85) return CAMERA_MOBILE_FOV;
  if (aspect < 1.1) return 48;
  return CAMERA_DEFAULT_FOV;
}

/**
 * Computes an elevated orbit framing so the whole room fits in view with padding.
 * Designed for OrbitControls (yaw / distance / polar) with room-fit helpers.
 */
export function fitCameraToRoom(
  camera: THREE.PerspectiveCamera,
  bounds: THREE.Box3,
  padding: number = CAMERA_ROOM_PADDING,
): RoomCameraFraming {
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bounds.getSize(size);
  bounds.getCenter(center);

  const fov = resolveFramingFov(camera);
  camera.fov = fov;

  // Aim slightly above the floor; bias toward open-space so both zones read.
  const lookAt = new THREE.Vector3(
    center.x + CAMERA_LOOK_BIAS_X,
    Math.min(1.2, Math.max(0.6, size.y * 0.22)),
    center.z,
  );

  const fovV = THREE.MathUtils.degToRad(fov);
  const aspect = Math.max(0.5, camera.aspect || 1);
  const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspect);

  const halfSpanX = size.x * 0.5;
  const halfSpanZ = size.z * 0.5;
  const halfSpanY = size.y * 0.5;

  const distFitX = halfSpanX / Math.tan(fovH / 2);
  const distFitZ = halfSpanZ / Math.tan(fovH / 2);
  const distFitY = halfSpanY / Math.tan(fovV / 2);

  const floorDiag = Math.hypot(size.x, size.z) * 0.5;
  const distFitDiag = floorDiag / Math.tan(Math.min(fovH, fovV) / 2);

  let orbitRadius = Math.max(distFitX, distFitZ, distFitY, distFitDiag) * padding;
  orbitRadius = Math.max(orbitRadius, CAMERA_MIN_ORBIT_FLOOR);

  // Extra vertical clearance so ceiling edge and desk tops stay inside frame.
  const orbitHeight = Math.max(
    orbitRadius * CAMERA_HEIGHT_RATIO,
    size.y * 1.65 + 3.8,
  );

  const far = Math.max(CAMERA_FAR_MIN, orbitRadius + size.length() + 48);

  return {
    lookAt,
    orbitRadius,
    orbitHeight,
    yaw: CAMERA_INITIAL_YAW,
    fov,
    near: CAMERA_NEAR,
    far,
    minOrbitRadius: Math.max(9, orbitRadius * 0.4),
    maxOrbitRadius: orbitRadius * 2.55,
    minPolarAngle: 0.16,
    maxPolarAngle: Math.PI * 0.455,
  };
}

/**
 * Applies framing to a PerspectiveCamera (projection only — orbit state is applied by the scene manager).
 */
export function applyFramingToCamera(camera: THREE.PerspectiveCamera, framing: RoomCameraFraming): void {
  camera.fov = framing.fov;
  camera.near = framing.near;
  camera.far = framing.far;
  camera.updateProjectionMatrix();
}

/**
 * Convenience: bounds → framing for the current camera aspect/fov.
 */
export function initializeRoomCamera(
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
  padding: number = CAMERA_ROOM_PADDING,
): RoomCameraFraming {
  const bounds = computeRoomBounds(scene);
  return fitCameraToRoom(camera, bounds, padding);
}

/** World position for OrbitControls target from framing. */
export function framingCameraPosition(framing: RoomCameraFraming): THREE.Vector3 {
  return new THREE.Vector3(
    Math.sin(framing.yaw) * framing.orbitRadius + framing.lookAt.x * 0.15,
    framing.orbitHeight,
    Math.cos(framing.yaw) * framing.orbitRadius + framing.lookAt.z * 0.15,
  );
}
