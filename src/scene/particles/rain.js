import * as THREE from 'three';

const MAX_RAIN = 5000;

export function createRain(scene) {
  const positions = new Float32Array(MAX_RAIN * 3);
  const velocities = new Float32Array(MAX_RAIN);
  for (let i = 0; i < MAX_RAIN; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = Math.random() * 40;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    velocities[i] = 15 + Math.random() * 10;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const rain = new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0x8888cc, size: 0.08, transparent: true, opacity: 0.4,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(rain);

  function update(dt) {
    const arr = geometry.attributes.position.array;
    for (let i = 0; i < MAX_RAIN; i++) {
      arr[i * 3 + 1] -= velocities[i] * dt;
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3 + 1] = 30 + Math.random() * 10;
        arr[i * 3] = (Math.random() - 0.5) * 80;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 80;
      }
    }
    geometry.attributes.position.needsUpdate = true;
  }
  return { update };
}
