import * as THREE from 'three';

const MAX_CHARS_PER_LINE = 28;
const BUBBLE_W = 512;
const BUBBLE_H = 256;

function wrapTwoLines(text: string): [string, string?] {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= MAX_CHARS_PER_LINE) return [clean];
  const words = clean.split(' ');
  let line1 = '';
  let line2 = '';
  for (const w of words) {
    if ((line1 + ' ' + w).trim().length <= MAX_CHARS_PER_LINE) {
      line1 = (line1 + ' ' + w).trim();
    } else if ((line2 + ' ' + w).trim().length <= MAX_CHARS_PER_LINE) {
      line2 = (line2 + ' ' + w).trim();
    } else {
      line2 = (line2 + ' ' + w).trim().slice(0, MAX_CHARS_PER_LINE - 1) + '…';
      break;
    }
  }
  return line2 ? [line1, line2] : [line1];
}

function drawBubbleCanvas(text: string, color: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = BUBBLE_W;
  canvas.height = BUBBLE_H;
  const ctx = canvas.getContext('2d')!;

  const lines = wrapTwoLines(text);
  const padX = 36;
  const padY = 28;
  const lineH = 42;
  const textH = lines.length * lineH;
  const boxW = BUBBLE_W - 48;
  const boxH = textH + padY * 2;
  const boxX = 24;
  const boxY = 20;
  const r = 28;

  // Soft shadow
  ctx.fillStyle = 'rgba(15, 23, 36, 0.16)';
  roundRect(ctx, boxX + 5, boxY + 7, boxW, boxH, r);
  ctx.fill();

  // Bubble body
  ctx.fillStyle = '#F8FAFC';
  roundRect(ctx, boxX, boxY, boxW, boxH, r);
  ctx.fill();

  // Accent border
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  roundRect(ctx, boxX, boxY, boxW, boxH, r);
  ctx.stroke();

  // Comic tail
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(boxX + 70, boxY + boxH - 2);
  ctx.lineTo(boxX + 50, boxY + boxH + 36);
  ctx.lineTo(boxX + 110, boxY + boxH - 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(boxX + 70, boxY + boxH);
  ctx.lineTo(boxX + 50, boxY + boxH + 36);
  ctx.lineTo(boxX + 110, boxY + boxH);
  ctx.stroke();

  // Text
  ctx.fillStyle = '#0F1724';
  ctx.font = '600 32px Outfit, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const startY = boxY + padY + lineH / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line ?? '', BUBBLE_W / 2, startY + i * lineH);
  });

  return canvas;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Comic speech bubble as a CanvasTexture sprite.
 * Max 2 lines of text. userData holds texture for dispose.
 */
export function createSpeechBubble(text: string, color: string): THREE.Sprite {
  const canvas = drawBubbleCanvas(text || '…', color);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    opacity: 0,
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.4, 1.2, 1);
  sprite.center.set(0.5, 0);
  sprite.userData['bubbleTexture'] = texture;
  sprite.userData['bubbleMat'] = mat;
  sprite.userData['type'] = 'speech-bubble';
  sprite.visible = false;
  return sprite;
}

export function fadeBubbleIn(sprite: THREE.Sprite, reducedMotion: boolean): void {
  sprite.visible = true;
  const mat = sprite.material as THREE.SpriteMaterial;
  if (reducedMotion) {
    mat.opacity = 1;
    return;
  }
  mat.opacity = 0;
  sprite.userData['fade'] = { dir: 1, speed: 4 };
}

export function fadeBubbleOut(sprite: THREE.Sprite, reducedMotion: boolean): void {
  const mat = sprite.material as THREE.SpriteMaterial;
  if (reducedMotion) {
    mat.opacity = 0;
    sprite.visible = false;
    return;
  }
  sprite.userData['fade'] = { dir: -1, speed: 5 };
}

/** Call each frame; hides sprite when fully faded out. */
export function tickBubbleFade(sprite: THREE.Sprite, dt: number): void {
  const fade = sprite.userData['fade'] as { dir: number; speed: number } | undefined;
  if (!fade) return;
  const mat = sprite.material as THREE.SpriteMaterial;
  mat.opacity = Math.max(0, Math.min(1, mat.opacity + fade.dir * fade.speed * dt));
  if (fade.dir > 0 && mat.opacity >= 1) {
    mat.opacity = 1;
    delete sprite.userData['fade'];
  } else if (fade.dir < 0 && mat.opacity <= 0) {
    mat.opacity = 0;
    sprite.visible = false;
    delete sprite.userData['fade'];
  }
}

export function setBubbleText(sprite: THREE.Sprite, text: string, color: string): void {
  const oldTex = sprite.userData['bubbleTexture'] as THREE.CanvasTexture | undefined;
  oldTex?.dispose();
  const canvas = drawBubbleCanvas(text || '…', color);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  const mat = sprite.material as THREE.SpriteMaterial;
  mat.map = texture;
  mat.needsUpdate = true;
  sprite.userData['bubbleTexture'] = texture;
}

export function disposeSpeechBubble(sprite: THREE.Sprite): void {
  const tex = sprite.userData['bubbleTexture'] as THREE.CanvasTexture | undefined;
  tex?.dispose();
  (sprite.material as THREE.SpriteMaterial)?.dispose();
}
