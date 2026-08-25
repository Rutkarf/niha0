import type { ScenePalette, SceneTheme } from './types';
import { AGENT_ACCENTS, accentForAgentCode as accentForCode } from '../../../core/navigation/agent-accents';

const SOLARPUNK: ScenePalette = {
  bg: '#B8D9C8',
  floor: '#BFA67A',
  wall: '#D8EBE2',
  wood: '#BFA67A',
  accent: '#D4A017',
  ceo: '#178F5E',
  sky: '#9FD4E8',
  plant: '#178F5E',
  neon: '#2EAD6A',
  glass: '#A8D4C4',
  gold: '#D4A017',
  text: '#123328',
  digital: '#0F8A8A',
  magenta: '#178F5E',
};

const CYBERPUNK: ScenePalette = {
  bg: '#0F1724',
  floor: '#1A2740',
  wall: '#1B2A42',
  wood: '#243552',
  accent: '#3EC4FF',
  ceo: '#5EEAD4',
  sky: '#152033',
  plant: '#34D399',
  neon: '#3EC4FF',
  glass: '#1B2A42',
  gold: '#F5D76E',
  text: '#EEF3F9',
  digital: '#5EEAD4',
  magenta: '#67E8F9',
};

/** Muted professional palette (Task 8 / 20 — Corporate). */
const CORPORATE: ScenePalette = {
  bg: '#E8EEF4',
  floor: '#C5CED8',
  wall: '#DDE4EC',
  wood: '#8B7355',
  accent: '#2563EB',
  ceo: '#1E40AF',
  sky: '#BFDBFE',
  plant: '#059669',
  neon: '#3B82F6',
  glass: '#94A3B8',
  gold: '#C9A227',
  text: '#0F172A',
  digital: '#0284C7',
  magenta: '#6366F1',
};

export function getPalette(theme: SceneTheme): ScenePalette {
  if (theme === 'CYBERPUNK') return { ...CYBERPUNK };
  if (theme === 'CORPORATE') return { ...CORPORATE };
  return { ...SOLARPUNK };
}

export { AGENT_ACCENTS, accentForCode };
