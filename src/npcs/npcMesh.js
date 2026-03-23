import * as THREE from 'three';
import { createHologramMaterial } from './hologramShader.js';
export function createNpcMesh(npcConfig) {
  const group = new THREE.Group();
  const material = createHologramMaterial(npcConfig.color);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), material);
  head.position.y = 1.75; group.add(head);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8), material);
  torso.position.y = 1.2; group.add(torso);
  const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 8), material);
  cloak.position.y = 0.6; group.add(cloak);
  const hitSphere = new THREE.Mesh(new THREE.SphereGeometry(2.0, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hitSphere.position.y = 1.0; hitSphere.userData.npcIndex = npcConfig.stationIndex;
  group.add(hitSphere);
  return { group, material, hitSphere };
}
