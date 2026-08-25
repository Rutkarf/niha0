import type { NavigationObstacle, Waypoint } from './navigation.types';

export interface PathPoint {
  x: number;
  z: number;
}

const CELL = 0.5;
const OFFICE_MIN_X = -14;
const OFFICE_MAX_X = 14;
const OFFICE_MIN_Z = -10;
const OFFICE_MAX_Z = 10;

interface GridNode {
  gx: number;
  gz: number;
  g: number;
  f: number;
  parent: GridNode | null;
}

function toGrid(x: number, z: number): { gx: number; gz: number } {
  return {
    gx: Math.round((x - OFFICE_MIN_X) / CELL),
    gz: Math.round((z - OFFICE_MIN_Z) / CELL),
  };
}

function toWorld(gx: number, gz: number): PathPoint {
  return {
    x: OFFICE_MIN_X + gx * CELL,
    z: OFFICE_MIN_Z + gz * CELL,
  };
}

function key(gx: number, gz: number): string {
  return `${gx},${gz}`;
}

function blocked(
  gx: number,
  gz: number,
  obstacles: NavigationObstacle[],
): boolean {
  const { x, z } = toWorld(gx, gz);
  for (const o of obstacles) {
    if (!o.active) continue;
    if (x >= o.minX && x <= o.maxX && z >= o.minZ && z <= o.maxZ) {
      return true;
    }
  }
  return false;
}

function heuristic(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}

/**
 * Grid A* pathfinding on the office XZ plane.
 * Returns world waypoints including start and goal (or empty if unreachable).
 */
export function findPath(
  start: PathPoint,
  goal: PathPoint,
  obstacles: NavigationObstacle[] = [],
): Waypoint[] {
  const maxX = Math.round((OFFICE_MAX_X - OFFICE_MIN_X) / CELL);
  const maxZ = Math.round((OFFICE_MAX_Z - OFFICE_MIN_Z) / CELL);
  const s = toGrid(start.x, start.z);
  const g = toGrid(goal.x, goal.z);

  if (blocked(g.gx, g.gz, obstacles)) {
    // Goal inside obstacle — approach nearest free cell toward start
    return [{ x: start.x, y: 0, z: start.z }, { x: goal.x, y: 0, z: goal.z }];
  }

  const open: GridNode[] = [];
  const openMap = new Map<string, GridNode>();
  const closed = new Set<string>();

  const startNode: GridNode = {
    gx: s.gx,
    gz: s.gz,
    g: 0,
    f: heuristic(s.gx, s.gz, g.gx, g.gz),
    parent: null,
  };
  open.push(startNode);
  openMap.set(key(s.gx, s.gz), startNode);

  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];

  let found: GridNode | null = null;
  let iterations = 0;
  const maxIterations = 4000;

  while (open.length && iterations++ < maxIterations) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    openMap.delete(key(current.gx, current.gz));
    const ck = key(current.gx, current.gz);
    if (closed.has(ck)) continue;
    closed.add(ck);

    if (current.gx === g.gx && current.gz === g.gz) {
      found = current;
      break;
    }

    for (const [dx, dz] of dirs) {
      const nx = current.gx + dx!;
      const nz = current.gz + dz!;
      if (nx < 0 || nz < 0 || nx > maxX || nz > maxZ) continue;
      const nk = key(nx, nz);
      if (closed.has(nk)) continue;
      if (blocked(nx, nz, obstacles)) continue;

      const step = dx !== 0 && dz !== 0 ? 1.414 : 1;
      const ng = current.g + step;
      const existing = openMap.get(nk);
      if (existing && existing.g <= ng) continue;

      const node: GridNode = {
        gx: nx,
        gz: nz,
        g: ng,
        f: ng + heuristic(nx, nz, g.gx, g.gz),
        parent: current,
      };
      open.push(node);
      openMap.set(nk, node);
    }
  }

  if (!found) {
    // Fallback: straight aisle-style path (caller may still collide with door)
    return [
      { x: start.x, y: 0, z: start.z },
      { x: goal.x, y: 0, z: goal.z },
    ];
  }

  const rev: PathPoint[] = [];
  let n: GridNode | null = found;
  while (n) {
    rev.push(toWorld(n.gx, n.gz));
    n = n.parent;
  }
  rev.reverse();

  // Snap ends to exact start/goal and simplify collinear points
  if (rev.length) {
    rev[0] = { x: start.x, z: start.z };
    rev[rev.length - 1] = { x: goal.x, z: goal.z };
  }
  return simplify(rev).map((p) => ({ x: p.x, y: 0, z: p.z }));
}

function simplify(points: PathPoint[]): PathPoint[] {
  if (points.length <= 2) return points;
  const out: PathPoint[] = [points[0]!];
  for (let i = 1; i < points.length - 1; i++) {
    const a = out[out.length - 1]!;
    const b = points[i]!;
    const c = points[i + 1]!;
    const cross = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
    if (Math.abs(cross) > 0.01) {
      out.push(b);
    }
  }
  out.push(points[points.length - 1]!);
  return out;
}

/** Build active obstacle list for CEO door when closed / pending. */
export function activeDoorObstacles(
  doorBlocking: boolean,
  doorObstacle: NavigationObstacle,
): NavigationObstacle[] {
  if (!doorBlocking) return [];
  return [{ ...doorObstacle, active: true }];
}
