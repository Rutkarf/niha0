import * as THREE from 'three';

/** Visual status buckets for agent floor rings / markers (Tasks 12, 29). */
export type AgentVisualStatus =
  | 'available'
  | 'busy'
  | 'waiting'
  | 'validation'
  | 'idle';

export function resolveAgentVisualStatus(status: string): AgentVisualStatus {
  const s = status.toUpperCase();
  if (s === 'WAITING_APPROVAL' || s === 'PENDING_APPROVAL') return 'validation';
  if (s === 'THINKING' || s === 'PREPARING' || s === 'EXECUTING' || s === 'BUSY') return 'busy';
  if (s === 'AVAILABLE' || s === 'ONLINE' || s === 'READY') return 'available';
  if (s === 'IDLE' || s === 'OFFLINE') return 'idle';
  if (s.includes('WAIT')) return 'waiting';
  return 'available';
}

/** Status tint overlaid on accent (hex). */
export const STATUS_TINT: Record<AgentVisualStatus, string> = {
  available: '#34D399',
  busy: '#FBBF24',
  waiting: '#60A5FA',
  validation: '#F87171',
  idle: '#94A3B8',
};

export function statusLabelFr(status: AgentVisualStatus): string {
  switch (status) {
    case 'available':
      return 'Disponible';
    case 'busy':
      return 'En activité';
    case 'waiting':
      return 'En attente';
    case 'validation':
      return 'Validation CEO';
    case 'idle':
      return 'Inactif';
  }
}

/** Blend accent with status tint for ring readability. */
export function blendHex(a: string, b: string, t = 0.45): string {
  const pa = new THREE.Color(a);
  const pb = new THREE.Color(b);
  return `#${pa.lerp(pb, t).getHexString()}`;
}
