import * as THREE from 'three';

const LABEL_W = 320;
const LABEL_H = 72;

function wrapLine(text: string, maxChars: number): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= maxChars) return clean;
  const words = clean.split(' ');
  let line = '';
  for (const w of words) {
    const next = (line + ' ' + w).trim();
    if (next.length <= maxChars) line = next;
    else break;
  }
  return line ? `${line}…` : `${clean.slice(0, maxChars - 1)}…`;
}

function drawCompactLabelCanvas(title: string, accentHex: string): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = LABEL_W;
  canvas.height = LABEL_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = 'rgba(248, 250, 252, 0.94)';
  roundRect(ctx, 4, 4, LABEL_W - 8, LABEL_H - 8, 10);
  ctx.fill();

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;
  roundRect(ctx, 4, 4, LABEL_W - 8, LABEL_H - 8, 10);
  ctx.stroke();

  ctx.fillStyle = '#0F1724';
  ctx.font = '600 22px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(wrapLine(title, 22), LABEL_W / 2, LABEL_H / 2);

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

export interface DeskLabelOptions {
  title: string;
  accentHex: string;
}

/**
 * Petite étiquette 3D — masquée par défaut, affichée au survol / sélection uniquement.
 * Taille proportionnelle à la distance (pas de billboard géant).
 */
export function createCompactDeskLabel(opts: DeskLabelOptions): THREE.Sprite | null {
  if (!opts.title?.trim()) return null;

  const canvas = drawCompactLabelCanvas(opts.title, opts.accentHex);
  if (!canvas) return null;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.name = 'desk-hover-label';
  sprite.position.set(0, 1.55, 0);
  sprite.scale.set(0.95, 0.24, 1);
  sprite.visible = false;
  sprite.userData['deskLabelTexture'] = texture;
  sprite.userData['label'] = opts.title;
  return sprite;
}

export function setDeskLabelVisible(sprite: THREE.Sprite | null | undefined, visible: boolean): void {
  if (sprite) sprite.visible = visible;
}
