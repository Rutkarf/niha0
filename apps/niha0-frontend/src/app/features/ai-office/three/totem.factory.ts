import * as THREE from 'three';
import type { TotemDef, TotemKind } from './layout';

function glowMat(hex: string, opacity = 0.62): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: hex,
    emissive: hex,
    emissiveIntensity: 0.45,
    roughness: 0.4,
    metalness: 0.12,
    transparent: true,
    opacity,
    depthWrite: false,
  });
}

/**
 * Stylized ethereal totem (opacity ~0.6, glow). Waypoints live on userData.
 */
export function createTotemAnimal(def: TotemDef): THREE.Group {
  const root = new THREE.Group();
  root.name = `totem-${def.kind}`;
  root.userData['type'] = 'totem';
  root.userData['totemKind'] = def.kind;
  root.userData['label'] = def.label;
  root.userData['waypoints'] = def.waypoints.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  root.userData['speed'] = def.speed;
  root.userData['seg'] = 0;
  root.userData['segT'] = 0;
  root.position.copy((root.userData['waypoints'] as THREE.Vector3[])[0]!);
  root.renderOrder = 2;

  const body = buildSilhouette(def.kind, def.color);
  body.name = 'totem-body';
  root.add(body);

  const trail = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 6),
    glowMat(def.color, 0.22),
  );
  trail.name = 'totem-trail';
  trail.userData['skipBounds'] = true;
  root.add(trail);

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 8, 6),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  hit.userData['type'] = 'totem';
  hit.userData['totemKind'] = def.kind;
  hit.userData['skipBounds'] = true;
  root.add(hit);

  return root;
}

function buildSilhouette(kind: TotemKind, color: string): THREE.Group {
  const g = new THREE.Group();
  const m = glowMat(color);
  switch (kind) {
    case 'eagle': {
      const torso = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 8), m);
      torso.rotation.x = Math.PI / 2;
      g.add(torso);
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.22), m);
      wingL.position.set(-0.28, 0.05, 0);
      wingL.name = 'wingL';
      const wingR = wingL.clone();
      wingR.position.x = 0.28;
      wingR.name = 'wingR';
      g.add(wingL, wingR);
      break;
    }
    case 'wolf':
    case 'fox':
    case 'tiger': {
      const scale = kind === 'tiger' ? 1.15 : kind === 'wolf' ? 1 : 0.82;
      g.scale.setScalar(scale);
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.32, 4, 8), m);
      torso.rotation.z = Math.PI / 2;
      torso.position.y = 0.22;
      g.add(torso);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), m);
      head.position.set(0.22, 0.28, 0);
      g.add(head);
      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 6), m);
      earL.position.set(0.18, 0.4, 0.05);
      const earR = earL.clone();
      earR.position.z = -0.05;
      g.add(earL, earR);
      const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.22, 3, 6), m);
      tail.position.set(-0.28, 0.28, 0);
      tail.rotation.z = 0.6;
      g.add(tail);
      break;
    }
    case 'owl': {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), m);
      body.position.y = 0.22;
      g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), m);
      head.position.y = 0.46;
      g.add(head);
      const eyeM = glowMat('#F8FAFC', 0.85);
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), eyeM);
      eyeL.position.set(-0.05, 0.48, 0.12);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.05;
      g.add(eyeL, eyeR);
      break;
    }
    case 'dragon': {
      for (let i = 0; i < 4; i++) {
        const seg = new THREE.Mesh(new THREE.SphereGeometry(0.14 - i * 0.02, 10, 8), m);
        seg.position.set(-i * 0.22, 0.08 * Math.sin(i), 0);
        seg.name = `seg-${i}`;
        g.add(seg);
      }
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.22), m);
      wingL.position.set(0.05, 0.12, 0.12);
      wingL.name = 'wingL';
      const wingR = wingL.clone();
      wingR.position.z = -0.12;
      wingR.name = 'wingR';
      g.add(wingL, wingR);
      break;
    }
    case 'butterfly': {
      const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), m);
      g.add(thorax);
      const wingL = new THREE.Mesh(new THREE.CircleGeometry(0.18, 10), m);
      wingL.position.set(-0.12, 0, 0);
      wingL.name = 'wingL';
      const wingR = wingL.clone();
      wingR.position.x = 0.12;
      wingR.name = 'wingR';
      g.add(wingL, wingR);
      break;
    }
  }
  return g;
}

export function tickTotem(
  root: THREE.Group,
  dt: number,
  t: number,
  reducedMotion: boolean,
): void {
  const waypoints = root.userData['waypoints'] as THREE.Vector3[];
  if (!waypoints?.length) return;

  if (reducedMotion) {
    root.position.copy(waypoints[0]!);
    return;
  }

  const speed = (root.userData['speed'] as number) ?? 1;
  let seg = (root.userData['seg'] as number) ?? 0;
  let segT = (root.userData['segT'] as number) ?? 0;
  const a = waypoints[seg]!;
  const b = waypoints[(seg + 1) % waypoints.length]!;
  const dist = Math.max(0.15, a.distanceTo(b));
  segT += (dt * speed) / dist;
  if (segT >= 1) {
    segT -= 1;
    seg = (seg + 1) % waypoints.length;
  }
  root.userData['seg'] = seg;
  root.userData['segT'] = segT;

  const from = waypoints[seg]!;
  const to = waypoints[(seg + 1) % waypoints.length]!;
  root.position.lerpVectors(from, to, segT);
  root.lookAt(to.x, root.position.y, to.z);

  const body = root.getObjectByName('totem-body');
  const wingL = root.getObjectByName('wingL');
  const wingR = root.getObjectByName('wingR');
  const kind = root.userData['totemKind'] as TotemKind;
  if (wingL && wingR) {
    const flap = Math.sin(t * (kind === 'butterfly' ? 14 : 8)) * (kind === 'butterfly' ? 0.7 : 0.35);
    wingL.rotation.z = flap;
    wingR.rotation.z = -flap;
  }
  if (kind === 'dragon' && body) {
    body.children.forEach((child, i) => {
      child.position.y = 0.08 * Math.sin(t * 3 + i);
    });
  }

  const trail = root.getObjectByName('totem-trail');
  if (trail) {
    trail.position.set(-0.35, 0.05, 0);
    const s = 0.8 + Math.sin(t * 5) * 0.15;
    trail.scale.setScalar(s);
  }
}
