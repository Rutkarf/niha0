import * as THREE from 'three';
import type { CompanyBranding } from '../../../core/workspace/professional.models';
import type { ScenePalette } from './types';

function mat(
  hex: string,
  opts: {
    roughness?: number;
    metalness?: number;
    emissive?: string;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
  } = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: opts.roughness ?? 0.5,
    metalness: opts.metalness ?? 0.15,
    emissive: opts.emissive ?? hex,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}

function truncateLabel(text: string, max = 18): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function createTextCanvas(text: string, color: string, bg: string | null, w = 512, h = 160): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.clearRect(0, 0, w, h);
  }
  ctx.fillStyle = color;
  ctx.font = '700 64px Syne, Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(truncateLabel(text, 22), w / 2, h / 2);
  return canvas;
}

function createInitialsCanvas(name: string, accent: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0F1724';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, 224, 224);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = (parts[0]?.[0] ?? 'N') + (parts[1]?.[0] ?? parts[0]?.[1] ?? 'I');
  ctx.fillStyle = accent;
  ctx.font = '800 96px Syne, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials.toUpperCase(), 128, 128);
  return canvas;
}

/**
 * Company logo plaque on the wall behind the CEO desk (local CEO group space).
 */
export function createCompanyLogoPlaque(
  branding: CompanyBranding,
  companyName: string,
  logoUrl: string | null,
  palette: ScenePalette,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'company-logo-plaque';

  const mode = branding.logoDisplayMode;
  const scale = Math.max(0.6, Math.min(1.6, branding.logoScale || 1));
  const brightness = branding.logoBrightness ?? 0.55;
  const pos = branding.logoPosition;

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.35 * scale, 1.55 * scale),
    mat(palette.wall, {
      metalness: 0.4,
      roughness: 0.35,
      emissive: branding.accentColor,
      emissiveIntensity: mode === 'neon' || mode === 'hologram' ? brightness * 0.35 : 0.08,
    }),
  );
  group.add(plate);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = mode === 'led' ? '#041018' : '#0B1220';
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const screenMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: mode === 'hologram' ? 0.82 : 1,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.35 * scale, 1.15 * scale), screenMat);
  screen.position.x = 0.05;
  group.add(screen);

  const applyTexture = (source: HTMLCanvasElement | HTMLImageElement) => {
    const tex = new THREE.CanvasTexture(
      source instanceof HTMLCanvasElement ? source : (() => {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 512;
        const cctx = c.getContext('2d')!;
        cctx.fillStyle = '#0B1220';
        cctx.fillRect(0, 0, 512, 512);
        const img = source as HTMLImageElement;
        const ratio = Math.min(480 / img.width, 480 / img.height);
        const dw = img.width * ratio;
        const dh = img.height * ratio;
        cctx.drawImage(img, (512 - dw) / 2, (512 - dh) / 2, dw, dh);
        return c;
      })(),
    );
    tex.colorSpace = THREE.SRGBColorSpace;
    screenMat.map = tex;
    screenMat.needsUpdate = true;
  };

  if (logoUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => applyTexture(img);
    img.onerror = () => applyTexture(createInitialsCanvas(companyName || 'NIHAO', branding.accentColor));
    img.src = logoUrl;
  } else {
    applyTexture(createInitialsCanvas(companyName || 'NIHAO', branding.accentColor));
  }

  if (mode === 'neon' || mode === 'hologram') {
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.85 * scale, 0.98 * scale, 48),
      new THREE.MeshBasicMaterial({
        color: branding.accentColor,
        transparent: true,
        opacity: 0.35 * brightness,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    halo.rotation.y = Math.PI / 2;
    halo.position.x = 0.06;
    group.add(halo);
  }

  group.position.set(pos.x, pos.y, pos.z);
  group.rotation.y = Math.PI / 2;
  return group;
}

/**
 * Company name carpet in front of the CEO office (world space relative to CEO group).
 */
export function createCompanyCarpet(
  branding: CompanyBranding,
  companyName: string,
  palette: ScenePalette,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'company-carpet';

  const style = branding.carpetStyle || 'futuristic';
  const scale = Math.max(0.7, Math.min(1.5, branding.carpetScale || 1));
  const color = branding.carpetColor || branding.primaryColor || palette.floor;
  const text = truncateLabel(branding.carpetText || companyName || 'Entreprise', 20);
  const opacity = Math.max(0.35, Math.min(1, branding.carpetOpacity ?? 0.92));

  let geo: THREE.BufferGeometry;
  if (style === 'circular') {
    geo = new THREE.CircleGeometry(1.55 * scale, 48);
  } else {
    geo = new THREE.PlaneGeometry(3.4 * scale, 2.1 * scale);
  }

  const canvas = createTextCanvas(text, branding.accentColor || palette.neon, color, 1024, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const carpetMat = new THREE.MeshStandardMaterial({
    map: tex,
    color: '#ffffff',
    roughness: style === 'holographic' ? 0.25 : 0.9,
    metalness: style === 'holographic' ? 0.35 : 0.05,
    transparent: true,
    opacity,
    emissive: branding.accentColor,
    emissiveIntensity: style === 'futuristic' || style === 'holographic' ? 0.18 : 0.05,
  });

  const mesh = new THREE.Mesh(geo, carpetMat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  group.add(mesh);

  if (style === 'futuristic' || style === 'premium' || style === 'holographic' || style === 'circular') {
    const rimMat = new THREE.MeshBasicMaterial({
      color: branding.accentColor,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const rim =
      style === 'circular'
        ? new THREE.Mesh(new THREE.RingGeometry(1.55 * scale, 1.68 * scale, 48), rimMat)
        : new THREE.Mesh(new THREE.PlaneGeometry(3.55 * scale, 2.25 * scale), rimMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.005;
    group.add(rim);
  }

  const pos = branding.carpetPosition;
  group.position.set(pos.x, pos.y, pos.z);
  group.rotation.y = branding.carpetRotationY || 0;
  return group;
}
