import * as THREE from 'three';

const MAX_SPLASH = 200;

export function createSplash(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 16; canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 16, 16);
  const texture = new THREE.CanvasTexture(canvas);

  const positions = new Float32Array(MAX_SPLASH * 3);
  const lifetimes = new Float32Array(MAX_SPLASH);
  let idx = 0;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const splash = new THREE.Points(geometry, new THREE.PointsMaterial({
    map: texture, size: 0.3, transparent: true, opacity: 0.5,
    depthWrite: false, blending: THREE.AdditiveBlending, color: 0x6666aa,
  }));
  scene.add(splash);

  function update(dt) {
    for (let i = 0; i < MAX_SPLASH; i++) {
      if (lifetimes[i] > 0) { lifetimes[i] -= dt; if (lifetimes[i] <= 0) positions[i * 3 + 1] = -100; }
    }
    geometry.attributes.position.needsUpdate = true;
  }
  function spawnNearCamera(camPos) {
    for (let j = 0; j < 3; j++) {
      const i = idx++ % MAX_SPLASH;
      positions[i * 3] = camPos.x + (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = 0.05;
      positions[i * 3 + 2] = camPos.z + (Math.random() - 0.5) * 20;
      lifetimes[i] = 0.3;
    }
  }
  return { update, spawnNearCamera };
}
