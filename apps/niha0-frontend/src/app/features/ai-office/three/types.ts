export type SceneTheme = 'SOLARPUNK' | 'CYBERPUNK' | 'CORPORATE';

export interface ScenePalette {
  bg: string;
  floor: string;
  wall: string;
  wood: string;
  accent: string;
  ceo: string;
  sky: string;
  plant: string;
  neon: string;
  glass: string;
  gold: string;
  text: string;
  digital: string;
  magenta: string;
}

export interface AgentDeskConfig {
  id: string;
  code: string;
  name: string;
  status: string;
  pendingTitle?: string;
  bubbleText?: string;
  dialogueText?: string;
}

export type AvatarState = 'SEATED' | 'WALKING_TO_CEO' | 'WAITING_AT_CEO' | 'RETURNING';
