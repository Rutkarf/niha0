import { describe, expect, it } from 'vitest';
import { CEO_DOOR_OBSTACLE } from './navigation.types';
import { activeDoorObstacles, findPath } from './pathfinding';

describe('findPath', () => {
  it('returns waypoints from start to goal', () => {
    const path = findPath({ x: 4, z: 2 }, { x: -10, z: 0 }, []);
    expect(path.length).toBeGreaterThanOrEqual(2);
    expect(path[0]!.x).toBeCloseTo(4, 0);
    expect(path[path.length - 1]!.x).toBeCloseTo(-10, 0);
  });

  it('avoids walking through the closed CEO door band', () => {
    const obstacles = activeDoorObstacles(true, CEO_DOOR_OBSTACLE);
    const path = findPath({ x: 6, z: 0 }, { x: -11, z: 0 }, obstacles);
    expect(path.length).toBeGreaterThan(2);
    for (const p of path) {
      const inDoor =
        p.x >= CEO_DOOR_OBSTACLE.minX &&
        p.x <= CEO_DOOR_OBSTACLE.maxX &&
        p.z >= CEO_DOOR_OBSTACLE.minZ &&
        p.z <= CEO_DOOR_OBSTACLE.maxZ;
      expect(inDoor).toBe(false);
    }
  });
});
