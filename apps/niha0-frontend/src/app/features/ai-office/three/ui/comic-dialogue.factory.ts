import * as THREE from 'three';
import { createSpeechBubble } from './speech-bubble.factory';

export interface ComicDialoguePair {
  agentBubble: THREE.Sprite;
  ceoBubble: THREE.Sprite;
}

/**
 * Agent + CEO comic dialogue sprites for approval moments.
 * Caller positions them in world space and manages fade/dispose.
 */
export function createComicDialoguePair(agentText: string, ceoText: string): ComicDialoguePair {
  const agentBubble = createSpeechBubble(agentText, '#36B8FF');
  agentBubble.userData['role'] = 'agent-dialogue';

  const ceoBubble = createSpeechBubble(ceoText, '#5EEAD4');
  ceoBubble.userData['role'] = 'ceo-dialogue';
  ceoBubble.scale.set(2.6, 1.3, 1);

  return { agentBubble, ceoBubble };
}
