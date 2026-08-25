import * as THREE from 'three';
import {
  CAMERA_ROOM_PADDING,
  ROOM_STATIC_BOUNDS,
  computeRoomBounds,
  fitCameraToRoom,
  framingCameraPosition,
  resolveFramingFov,
} from './camera-framing';

describe('camera-framing', () => {
  it('fits the static room with padding and soft orbit limits', () => {
    const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 100);
    const framing = fitCameraToRoom(camera, ROOM_STATIC_BOUNDS.clone(), CAMERA_ROOM_PADDING);

    expect(framing.orbitRadius).toBeGreaterThanOrEqual(22);
    expect(framing.minOrbitRadius).toBeLessThan(framing.orbitRadius);
    expect(framing.maxOrbitRadius).toBeGreaterThan(framing.orbitRadius);
    expect(framing.minPolarAngle).toBeGreaterThan(0);
    expect(framing.maxPolarAngle).toBeLessThan(Math.PI / 2);

    const pos = framingCameraPosition(framing);
    expect(pos.y).toBeCloseTo(framing.orbitHeight, 5);
  });

  it('widens FOV on narrow aspect ratios', () => {
    const wide = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 100);
    const narrow = new THREE.PerspectiveCamera(46, 0.7, 0.1, 100);
    expect(resolveFramingFov(narrow)).toBeGreaterThan(resolveFramingFov(wide));
  });

  it('computeRoomBounds falls back to static bounds on empty scene', () => {
    const scene = new THREE.Scene();
    const box = computeRoomBounds(scene);
    expect(box.min.x).toBeCloseTo(ROOM_STATIC_BOUNDS.min.x, 5);
    expect(box.max.x).toBeCloseTo(ROOM_STATIC_BOUNDS.max.x, 5);
  });
});
