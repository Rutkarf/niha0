import { CHIEF_PLATFORM, NIHAO_ROW_LAYOUTS } from './row-layout';

export { CHIEF_PLATFORM } from './row-layout';

/** Positions des 10 chefs sur la plateforme (fixe, fond du tapis). */
export const CHIEF_POSITIONS = NIHAO_ROW_LAYOUTS.map((row) => ({
  chiefId: row.chief.chiefId,
  rowId: row.rowId,
  role: row.role,
  chiefTitle: row.chiefTitle,
  title: row.chief.title,
  color: row.color,
  x: row.chief.x,
  y: row.chief.y,
  z: row.chief.z,
  rowCenterX: row.chief.x,
  rowCenterZ: row.agents.reduce((s, a) => s + a.z, 0) / row.agents.length,
}));
