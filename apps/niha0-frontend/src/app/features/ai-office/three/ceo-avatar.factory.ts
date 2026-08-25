import * as THREE from 'three';
import type { CeoStatus } from '../../../core/approval/ceo-approval.models';
import type { ScenePalette } from './types';

function mat(
  hex: string,
  opts: { roughness?: number; metalness?: number; emissive?: string; emissiveIntensity?: number } = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.08,
    emissive: opts.emissive ?? hex,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}

/** Low-poly CEO seated on the throne — suit, shirt, tie; matches agent avatar style. */
export function createCeoAvatar(palette: ScenePalette): THREE.Group {
  const root = new THREE.Group();
  root.name = 'ceo-avatar';

  const suitMat = mat('#1A2740', { roughness: 0.48, metalness: 0.12 });
  const shirtMat = mat('#EEF3F9', { roughness: 0.65 });
  const tieMat = mat(palette.ceo, { emissive: palette.ceo, emissiveIntensity: 0.15, roughness: 0.4 });
  const skinMat = mat('#E8B896', { roughness: 0.72 });
  const darkMat = mat('#152033', { roughness: 0.62 });
  const hairMat = mat('#2A1810', { roughness: 0.8 });

  // Seated body — shorter capsule, tilted back slightly
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.32, 6, 12), suitMat);
  body.position.set(0, 0.82, 0.05);
  body.rotation.x = -0.12;
  body.castShadow = true;
  root.add(body);

  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.12), shirtMat);
  shirt.position.set(0, 0.95, 0.14);
  shirt.rotation.x = -0.12;
  root.add(shirt);

  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.04), tieMat);
  tie.position.set(0, 0.9, 0.2);
  tie.rotation.x = -0.12;
  root.add(tie);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 16), skinMat);
  head.position.set(0, 1.22, 0.02);
  head.castShadow = true;
  root.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hair.position.set(0, 1.28, -0.02);
  root.add(hair);

  const eyeMat = mat('#152033');
  const eyeGeo = new THREE.SphereGeometry(0.028, 8, 6);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.06, 1.24, 0.16);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.06, 1.24, 0.16);
  root.add(leftEye, rightEye);

  const armGeo = new THREE.CapsuleGeometry(0.05, 0.2, 4, 8);
  const leftArm = new THREE.Mesh(armGeo, suitMat);
  leftArm.position.set(-0.32, 0.78, 0.12);
  leftArm.rotation.set(-0.5, 0, 0.35);
  const rightArm = new THREE.Mesh(armGeo, suitMat);
  rightArm.position.set(0.32, 0.72, 0.2);
  rightArm.rotation.set(-0.85, 0, -0.2);
  root.add(leftArm, rightArm);

  const legGeo = new THREE.CapsuleGeometry(0.065, 0.14, 4, 8);
  const leftLeg = new THREE.Mesh(legGeo, darkMat);
  leftLeg.position.set(-0.12, 0.42, 0.22);
  leftLeg.rotation.x = 1.1;
  const rightLeg = new THREE.Mesh(legGeo, darkMat);
  rightLeg.position.set(0.12, 0.42, 0.22);
  rightLeg.rotation.x = 1.1;
  root.add(leftLeg, rightLeg);

  const statusLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 10),
    mat(palette.plant, { emissive: palette.plant, emissiveIntensity: 0.6 }),
  );
  statusLight.position.set(0.35, 1.35, 0);
  statusLight.name = 'ceo-status-light';
  root.add(statusLight);

  root.rotation.y = -Math.PI / 2;
  root.position.set(-1.55, 0.12, 0);

  root.userData['parts'] = { head, body, leftArm, rightArm, statusLight, tie };
  root.userData['type'] = 'ceo-avatar';
  root.userData['ceoStatus'] = 'available' satisfies CeoStatus;

  return root;
}

export function updateCeoAvatarVisuals(
  avatar: THREE.Group,
  status: CeoStatus,
  palette: ScenePalette,
  t: number,
  reducedMotion: boolean,
): void {
  const parts = avatar.userData['parts'] as {
    head?: THREE.Mesh;
    body?: THREE.Mesh;
    leftArm?: THREE.Mesh;
    rightArm?: THREE.Mesh;
    statusLight?: THREE.Mesh;
    tie?: THREE.Mesh;
  };

  if (!reducedMotion) {
    const breath = Math.sin(t * 1.8) * 0.015;
    if (parts.head) parts.head.position.y = 1.22 + breath;
    if (parts.body) parts.body.scale.y = 1 + breath * 0.3;
  }

  const light = parts.statusLight;
  const tie = parts.tie;
  if (!light?.material || !(light.material instanceof THREE.MeshStandardMaterial)) return;

  const tieMat = tie?.material instanceof THREE.MeshStandardMaterial ? tie.material : null;

  switch (status) {
    case 'reviewing':
      if (!reducedMotion && parts.head) {
        parts.head.rotation.x = Math.sin(t * 2.5) * 0.08 - 0.05;
        parts.head.rotation.y = Math.sin(t * 1.2) * 0.06;
      }
      if (!reducedMotion && parts.rightArm) {
        parts.rightArm.rotation.x = -0.85 + Math.sin(t * 3) * 0.05;
      }
      light.material.color.set(palette.accent);
      light.material.emissive.set(palette.accent);
      light.material.emissiveIntensity = 0.75 + Math.sin(t * 4) * 0.15;
      tieMat?.emissive.set(palette.accent);
      tieMat && (tieMat.emissiveIntensity = 0.35);
      break;
    case 'approved':
      light.material.color.set('#34D399');
      light.material.emissive.set('#34D399');
      light.material.emissiveIntensity = 0.9;
      tieMat?.emissive.set('#34D399');
      tieMat && (tieMat.emissiveIntensity = 0.4);
      break;
    case 'rejected':
      light.material.color.set('#F87171');
      light.material.emissive.set('#F87171');
      light.material.emissiveIntensity = 0.85;
      tieMat?.emissive.set('#F87171');
      tieMat && (tieMat.emissiveIntensity = 0.35);
      break;
    case 'away':
      light.material.color.set('#64748B');
      light.material.emissive.set('#64748B');
      light.material.emissiveIntensity = 0.25;
      if (parts.head) parts.head.rotation.x = 0.15;
      break;
    default:
      if (parts.head && !reducedMotion) {
        parts.head.rotation.x = Math.sin(t * 0.9) * 0.03;
        parts.head.rotation.y = Math.sin(t * 0.7 + 1) * 0.04;
      }
      light.material.color.set(palette.plant);
      light.material.emissive.set(palette.plant);
      light.material.emissiveIntensity = 0.45 + Math.sin(t * 2) * 0.08;
      tieMat?.emissive.set(palette.ceo);
      tieMat && (tieMat.emissiveIntensity = 0.15);
      break;
  }

  avatar.userData['ceoStatus'] = status;
}
