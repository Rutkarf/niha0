/** Navigation model — grid A* pathfinding + door obstacles. */

export type DoorAccessState = 'closed' | 'open' | 'request-pending' | 'reviewing';

export interface Waypoint {
  x: number;
  y: number;
  z: number;
}

export interface AgentRoute {
  waypoints: Waypoint[];
  /** When false, agent waits at last waypoint instead of crossing a closed door. */
  allowDoorCrossing: boolean;
}

export interface NavigationObstacle {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  active: boolean;
}

/** CEO glass door band — blocks east-west crossing when closed. */
export const CEO_DOOR_OBSTACLE: NavigationObstacle = {
  id: 'ceo-door',
  minX: -8.8,
  maxX: -7.2,
  minZ: -1.2,
  maxZ: 1.2,
  active: true,
};

export function doorObstacleActive(doorState: DoorAccessState): boolean {
  return doorState === 'closed' || doorState === 'request-pending';
}

export function segmentCrossesObstacle(
  from: { x: number; z: number },
  to: { x: number; z: number },
  obstacle: NavigationObstacle,
): boolean {
  if (!obstacle.active) return false;
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + (to.x - from.x) * t;
    const z = from.z + (to.z - from.z) * t;
    if (x >= obstacle.minX && x <= obstacle.maxX && z >= obstacle.minZ && z <= obstacle.maxZ) {
      return true;
    }
  }
  return false;
}
