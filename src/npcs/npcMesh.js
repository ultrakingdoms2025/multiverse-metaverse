import * as THREE from 'three';
import { createHologramMaterial } from './hologramShader.js';
export function createNpcMesh(npcConfig) {
  const group = new THREE.Group();
  const material = createHologramMaterial(npcConfig.color);

  // --- Gorilla body ---

  // Chest/torso — large barrel shape
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.8), material);
  chest.scale.set(1, 1.1, 0.9);
  chest.position.y = 1.1;
  group.add(chest);

  // Belly — slightly smaller sphere below chest
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), material);
  belly.position.y = 0.7;
  group.add(belly);

  // Head — smaller, sits forward on the shoulders
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), material);
  head.scale.set(1, 0.9, 1);
  head.position.set(0, 1.55, 0.1);
  group.add(head);

  // Brow ridge
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.12), material);
  brow.position.set(0, 1.6, 0.25);
  group.add(brow);

  // Muzzle/jaw
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), material);
  muzzle.scale.set(1.2, 0.8, 1.3);
  muzzle.position.set(0, 1.45, 0.25);
  group.add(muzzle);

  // Left shoulder
  const lShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), material);
  lShoulder.position.set(-0.55, 1.35, 0);
  group.add(lShoulder);

  // Right shoulder
  const rShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), material);
  rShoulder.position.set(0.55, 1.35, 0);
  group.add(rShoulder);

  // Left upper arm
  const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.5, 8), material);
  lUpperArm.position.set(-0.6, 1.0, 0.05);
  lUpperArm.rotation.z = 0.3;
  group.add(lUpperArm);

  // Right upper arm
  const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.5, 8), material);
  rUpperArm.position.set(0.6, 1.0, 0.05);
  rUpperArm.rotation.z = -0.3;
  group.add(rUpperArm);

  // Left forearm — reaching toward ground
  const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.55, 8), material);
  lForearm.position.set(-0.7, 0.55, 0.1);
  lForearm.rotation.z = 0.15;
  group.add(lForearm);

  // Right forearm
  const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.55, 8), material);
  rForearm.position.set(0.7, 0.55, 0.1);
  rForearm.rotation.z = -0.15;
  group.add(rForearm);

  // Left knuckle/fist
  const lFist = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), material);
  lFist.position.set(-0.72, 0.25, 0.12);
  group.add(lFist);

  // Right knuckle/fist
  const rFist = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), material);
  rFist.position.set(0.72, 0.25, 0.12);
  group.add(rFist);

  // Left leg — shorter, gorillas have short legs
  const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.4, 8), material);
  lLeg.position.set(-0.2, 0.35, -0.05);
  group.add(lLeg);

  // Right leg
  const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.4, 8), material);
  rLeg.position.set(0.2, 0.35, -0.05);
  group.add(rLeg);

  // Left foot
  const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.22), material);
  lFoot.position.set(-0.2, 0.12, 0.03);
  group.add(lFoot);

  // Right foot
  const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.22), material);
  rFoot.position.set(0.2, 0.12, 0.03);
  group.add(rFoot);
  const hitSphere = new THREE.Mesh(new THREE.SphereGeometry(2.0, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hitSphere.position.y = 0.9; hitSphere.userData.npcIndex = npcConfig.stationIndex;
  group.add(hitSphere);

  // "Click Me" label above NPC (skip for last station — no modal needed)
  if (npcConfig.stationIndex !== 6) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(200, 200, 200, 0.6)';
    ctx.fillText('Click Me', 128, 38);
    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.5, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.y = 2.0;
    sprite.scale.set(1.5, 0.4, 1);
    group.add(sprite);
  }

  return { group, material, hitSphere };
}
