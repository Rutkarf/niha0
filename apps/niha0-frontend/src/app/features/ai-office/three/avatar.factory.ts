import * as THREE from 'three';

function softMat(
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

function skinTone(seed: string): string {
  const tones = ['#F5C9A8', '#E8B896', '#D4A574', '#C68642', '#F2D0B0'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * 17) % tones.length;
  return tones[h];
}

/**
 * Rounded cartoon avatar with per-role accessories for all 11 agent codes.
 * userData.parts = { head, body } for bob / sway animation.
 */
export function createCartoonAvatar(code: string, accentHex: string): THREE.Group {
  const root = new THREE.Group();
  root.name = `avatar-${code}`;

  const skin = skinTone(code);
  const bodyMat = softMat(accentHex, { roughness: 0.5, metalness: 0.06 });
  const skinMat = softMat(skin, { roughness: 0.72 });
  const darkMat = softMat('#243552', { roughness: 0.62 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.38, 6, 12), bodyMat);
  body.position.y = 0.72;
  body.castShadow = true;
  root.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), skinMat);
  head.position.y = 1.18;
  head.castShadow = true;
  root.add(head);

  const eyeMat = softMat('#152033');
  const eyeGeo = new THREE.SphereGeometry(0.035, 10, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.07, 1.2, 0.16);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.07, 1.2, 0.16);
  root.add(leftEye, rightEye);

  const legGeo = new THREE.CapsuleGeometry(0.07, 0.18, 4, 8);
  const leftLeg = new THREE.Mesh(legGeo, darkMat);
  leftLeg.position.set(-0.1, 0.28, 0);
  const rightLeg = new THREE.Mesh(legGeo, darkMat);
  rightLeg.position.set(0.1, 0.28, 0);
  root.add(leftLeg, rightLeg);

  const armGeo = new THREE.CapsuleGeometry(0.055, 0.22, 4, 8);
  const leftArm = new THREE.Mesh(armGeo, bodyMat);
  leftArm.position.set(-0.3, 0.78, 0);
  leftArm.rotation.z = 0.25;
  const rightArm = new THREE.Mesh(armGeo, bodyMat);
  rightArm.position.set(0.3, 0.78, 0);
  rightArm.rotation.z = -0.25;
  root.add(leftArm, rightArm);

  addAccessory(root, code, accentHex);

  root.userData['parts'] = { head, body, leftArm, rightArm };
  root.userData['code'] = code;
  root.userData['type'] = 'avatar';

  return root;
}

function addAccessory(root: THREE.Group, code: string, accentHex: string): void {
  switch (code) {
    case 'MARKETING': {
      const scarf = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.045, 8, 20, Math.PI * 1.4),
        softMat('#E879F9', { emissive: '#E879F9', emissiveIntensity: 0.25 }),
      );
      scarf.position.set(0, 1.02, 0.05);
      scarf.rotation.x = Math.PI / 2.2;
      root.add(scarf);
      const tail = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.28, 0.04).translate(0, -0.1, 0),
        softMat('#D946EF', { emissive: '#D946EF', emissiveIntensity: 0.2 }),
      );
      tail.position.set(0.12, 0.9, 0.12);
      root.add(tail);
      break;
    }
    case 'VENTES': {
      const caseMat = softMat('#34D399', { emissive: '#34D399', emissiveIntensity: 0.2, metalness: 0.2 });
      const briefcase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.1), caseMat);
      briefcase.position.set(0.42, 0.55, 0.1);
      root.add(briefcase);
      const handle = new THREE.Mesh(
        new THREE.TorusGeometry(0.05, 0.015, 6, 12, Math.PI),
        softMat('#065F46'),
      );
      handle.position.set(0.42, 0.66, 0.1);
      handle.rotation.x = Math.PI;
      root.add(handle);
      break;
    }
    case 'CRM': {
      const badge = new THREE.Mesh(
        new THREE.CircleGeometry(0.06, 12),
        softMat('#38BDF8', { emissive: '#38BDF8', emissiveIntensity: 0.4 }),
      );
      badge.position.set(0.16, 0.9, 0.22);
      root.add(badge);
      break;
    }
    case 'SUPPORT': {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.025, 8, 24, Math.PI),
        softMat('#2DD4BF', { emissive: '#2DD4BF', emissiveIntensity: 0.3 }),
      );
      band.position.set(0, 1.22, 0);
      band.rotation.z = Math.PI / 2;
      band.rotation.y = Math.PI / 2;
      root.add(band);
      const micArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.18, 6),
        softMat('#0D9488'),
      );
      micArm.position.set(0.18, 1.1, 0.08);
      micArm.rotation.z = 0.6;
      root.add(micArm);
      const mic = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 10, 8),
        softMat('#2DD4BF', { emissive: '#2DD4BF', emissiveIntensity: 0.35 }),
      );
      mic.position.set(0.12, 1.02, 0.16);
      root.add(mic);
      break;
    }
    case 'ERP': {
      const glassMat = softMat('#818CF8', { metalness: 0.4, roughness: 0.3, emissive: '#818CF8', emissiveIntensity: 0.15 });
      const lensGeo = new THREE.TorusGeometry(0.055, 0.012, 8, 16);
      const leftLens = new THREE.Mesh(lensGeo, glassMat);
      leftLens.position.set(-0.07, 1.2, 0.18);
      const rightLens = new THREE.Mesh(lensGeo, glassMat);
      rightLens.position.set(0.07, 1.2, 0.18);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.015), glassMat);
      bridge.position.set(0, 1.2, 0.18);
      root.add(leftLens, rightLens, bridge);
      break;
    }
    case 'COMPTABILITE': {
      const tie = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.28, 6),
        softMat('#FBBF24', { metalness: 0.5, roughness: 0.35, emissive: '#FBBF24', emissiveIntensity: 0.3 }),
      );
      tie.position.set(0, 0.85, 0.2);
      tie.rotation.x = Math.PI;
      root.add(tie);
      const badge = new THREE.Mesh(
        new THREE.CircleGeometry(0.05, 12),
        softMat('#F59E0B', { emissive: '#F59E0B', emissiveIntensity: 0.4, metalness: 0.6 }),
      );
      badge.position.set(0.18, 0.9, 0.22);
      root.add(badge);
      break;
    }
    case 'RH': {
      const bow = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.03, 6, 12),
        softMat('#F87171', { emissive: '#F87171', emissiveIntensity: 0.3 }),
      );
      bow.position.set(0, 1.0, 0.18);
      bow.rotation.x = Math.PI / 2;
      root.add(bow);
      break;
    }
    case 'JURIDIQUE': {
      const robe = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 0.55, 10, 1, true),
        softMat('#1E293B', { roughness: 0.75, emissive: '#334155', emissiveIntensity: 0.08 }),
      );
      robe.position.set(0, 0.55, 0);
      root.add(robe);
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.16, 0.03, 6, 16),
        softMat('#F1F5F9', { emissive: '#94A3B8', emissiveIntensity: 0.12 }),
      );
      collar.position.set(0, 0.98, 0.02);
      collar.rotation.x = Math.PI / 2;
      root.add(collar);
      break;
    }
    case 'STOCK': {
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.2, 0.1, 12),
        softMat('#FB923C', { emissive: '#FB923C', emissiveIntensity: 0.25 }),
      );
      cap.position.set(0, 1.38, 0);
      root.add(cap);
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.03, 12),
        softMat('#EA580C', { emissive: '#EA580C', emissiveIntensity: 0.2 }),
      );
      brim.position.set(0, 1.33, 0.05);
      root.add(brim);
      break;
    }
    case 'ANALYTICS': {
      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.06, 0.08),
        softMat('#60A5FA', { emissive: '#60A5FA', emissiveIntensity: 0.45, metalness: 0.4 }),
      );
      visor.position.set(0, 1.22, 0.16);
      root.add(visor);
      break;
    }
    case 'STRATEGIE': {
      const crown = new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.16, 5),
        softMat('#F472B6', { emissive: '#F472B6', emissiveIntensity: 0.4 }),
      );
      crown.position.set(0, 1.42, 0);
      root.add(crown);
      break;
    }
    default: {
      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        softMat(accentHex, { emissive: accentHex, emissiveIntensity: 0.35 }),
      );
      pin.position.set(0.16, 0.88, 0.2);
      root.add(pin);
    }
  }
}
