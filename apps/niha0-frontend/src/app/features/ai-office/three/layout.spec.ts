import { describe, expect, it } from 'vitest';
import { CEO_DOOR_OBSTACLE } from './navigation.types';
import { CEO_POS, DESK_BY_CODE, STAIRS_OBSTACLE, TOTEM_ANIMALS } from './layout';
import { activeDoorObstacles, findPath } from './pathfinding';
import { createLedPair, setLedMode } from './led.factory';
import { createTotemAnimal } from './totem.factory';
import { DATA_LIBRARIES } from '../../../core/workspace/workspace-catalog';

describe('AI Office spatial v2', () => {
  it('keeps CEO and data libraries at their original anchors', () => {
    expect(CEO_POS.x).toBe(-10);
    expect(CEO_POS.z).toBe(0);
    expect(DATA_LIBRARIES[0]!.position3D[0]).toBe(-12.6);
    expect(DATA_LIBRARIES[0]!.position3D[2]).toBe(-7.1);
  });

  it('keeps all 11 existing desks in a 7+4 layout', () => {
    const codes = Object.keys(DESK_BY_CODE);
    expect(codes).toHaveLength(11);
    const zs = Object.values(DESK_BY_CODE).map(([, z]) => z);
    const front = zs.filter((z) => z > 2).length;
    const back = zs.filter((z) => z < 2).length;
    expect(front).toBe(7);
    expect(back).toBe(4);
  });

  it('defines 7 totem animals', () => {
    expect(TOTEM_ANIMALS).toHaveLength(7);
    const kinds = TOTEM_ANIMALS.map((a) => a.kind);
    expect(kinds).toEqual(['eagle', 'wolf', 'fox', 'tiger', 'owl', 'dragon', 'butterfly']);
  });

  it('blocks walking assistants from the invisible stair footprint', () => {
    const obstacles = activeDoorObstacles(false, CEO_DOOR_OBSTACLE, [STAIRS_OBSTACLE]);
    const path = findPath({ x: 13, z: 3.6 }, { x: -10, z: 0 }, obstacles);
    expect(path.length).toBeGreaterThan(1);
    for (const p of path) {
      const inStairs =
        p.x >= STAIRS_OBSTACLE.minX &&
        p.x <= STAIRS_OBSTACLE.maxX &&
        p.z >= STAIRS_OBSTACLE.minZ &&
        p.z <= STAIRS_OBSTACLE.maxZ;
      expect(inStairs).toBe(false);
    }
  });

  it('creates LED pairs and totem groups', () => {
    const leds = createLedPair('test');
    expect(leds.userData['type']).toBe('leds');
    setLedMode(leds, 'green');
    expect(leds.userData['mode']).toBe('green');

    const eagle = createTotemAnimal(TOTEM_ANIMALS[0]!);
    expect(eagle.userData['type']).toBe('totem');
    expect(eagle.userData['totemKind']).toBe('eagle');
  });
});
