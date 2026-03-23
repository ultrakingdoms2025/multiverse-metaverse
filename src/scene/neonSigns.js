import * as THREE from 'three';

const SIGNS = [
  { color: 0xff00ff, pos: [-6, 12, 5], rot: 0 },
  { color: 0x00ffff, pos: [10, 15, 15], rot: Math.PI },
  { color: 0x6600ff, pos: [-12, 10, 30], rot: 0 },
  { color: 0xff0066, pos: [8, 18, -3], rot: Math.PI },
  { color: 0x00ffaa, pos: [-9, 14, 45], rot: 0 },
];

export function createNeonSigns(scene) {
  SIGNS.forEach(cfg => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 1.5),
      new THREE.MeshStandardMaterial({
        color: cfg.color, emissive: cfg.color, emissiveIntensity: 3.0,
        transparent: true, opacity: 0.9,
      })
    );
    mesh.position.set(...cfg.pos); mesh.rotation.y = cfg.rot;
    scene.add(mesh);
    const light = new THREE.PointLight(cfg.color, 1.5, 12);
    light.position.set(cfg.pos[0], cfg.pos[1] - 2, cfg.pos[2]);
    scene.add(light);
  });
}
