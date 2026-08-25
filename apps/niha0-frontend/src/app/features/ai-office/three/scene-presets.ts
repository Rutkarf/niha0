import { signal } from '@angular/core';
import type { SceneTheme } from './types';
import type { ScenePalette } from './types';

/** UI-facing scene presets (Task 20) — maps to SceneTheme + optional palette override. */
export type SceneVisualPreset = 'solar' | 'night' | 'cyberpunk' | 'corporate';

function readStoredPreset(): SceneVisualPreset {
  const v = localStorage.getItem('niha0_scene_preset');
  if (v === 'solar' || v === 'night' || v === 'cyberpunk' || v === 'corporate') return v;
  return 'night';
}

/** Reactive preset for page appearance effects (theme switcher writes via saveScenePreset). */
export const scenePresetSignal = signal<SceneVisualPreset>(readStoredPreset());

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

const CYBER_BOOST: ScenePalette = {
  bg: '#0A0E17',
  floor: '#121A2A',
  wall: '#152033',
  wood: '#1A2740',
  accent: '#FF2D95',
  ceo: '#00F0FF',
  sky: '#0D1524',
  plant: '#39FF14',
  neon: '#00F0FF',
  glass: '#1B2A42',
  gold: '#F5D76E',
  text: '#F8FAFC',
  digital: '#00F0FF',
  magenta: '#FF2D95',
};

export function presetToSceneTheme(preset: SceneVisualPreset): SceneTheme {
  if (preset === 'corporate') return 'CORPORATE';
  if (preset === 'solar') return 'SOLARPUNK';
  return 'CYBERPUNK';
}

export function applyPresetPalette(
  base: ScenePalette,
  preset: SceneVisualPreset,
): ScenePalette {
  if (preset === 'corporate') return { ...CORPORATE };
  if (preset === 'cyberpunk') return { ...CYBER_BOOST };
  return { ...base };
}

export function loadScenePreset(): SceneVisualPreset {
  return scenePresetSignal();
}

export function saveScenePreset(preset: SceneVisualPreset): void {
  localStorage.setItem('niha0_scene_preset', preset);
  scenePresetSignal.set(preset);
}

export function presetLabel(preset: SceneVisualPreset): string {
  switch (preset) {
    case 'solar':
      return 'Solar';
    case 'night':
      return 'Night';
    case 'cyberpunk':
      return 'Cyberpunk';
    case 'corporate':
      return 'Corporate';
  }
}
