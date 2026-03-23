import * as THREE from 'three';
export function createStationProps(scene, positions) {
  const mat = (color, intensity = 1.5) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity });
  const transMat = (color, opacity = 0.3) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.0, transparent: true, opacity, side: THREE.DoubleSide });

  // Station 0 - Architect: floating blueprints
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1), transMat(0x00ffff));
    m.position.set(positions[0].x + Math.cos(angle) * 2, 2 + i * 0.5, positions[0].z + Math.sin(angle) * 2);
    m.rotation.y = angle; scene.add(m);
  }
  // Station 1 - Broker: stall
  const p1 = positions[1];
  for (const dx of [-1.5, 1.5]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8), mat(0xffaa00)); post.position.set(p1.x + dx, 1.25, p1.z); scene.add(post); }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.1), mat(0xffaa00)); bar.position.set(p1.x, 2.5, p1.z); scene.add(bar);
  // Station 2 - Warden: gate pillars + barrier
  const p2 = positions[2];
  for (const dx of [-2, 2]) { const pil = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 0.4), mat(0xff0044, 2.0)); pil.position.set(p2.x + dx, 2, p2.z); scene.add(pil); }
  const barrier = new THREE.Mesh(new THREE.PlaneGeometry(4, 3.5), transMat(0xff0044, 0.15)); barrier.position.set(p2.x, 2, p2.z); scene.add(barrier);
  // Station 3 - Navigator: portal ring
  const ring3 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.1, 12, 32), mat(0x4488ff, 2.5)); ring3.position.set(positions[3].x, 2, positions[3].z); ring3.rotation.x = Math.PI / 6; scene.add(ring3);
  // Station 4 - Syndicate Boss: platform + throne
  const p4 = positions[4];
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.2, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x111122, emissive: 0xaa00ff, emissiveIntensity: 0.5 }));
  platform.position.set(p4.x, 0.15, p4.z); scene.add(platform);
  const throne = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 0.2), mat(0xaa00ff, 1.0)); throne.position.set(p4.x, 1.5, p4.z - 1.8); scene.add(throne);
  // Station 5 - Oracle: crystal + ring
  const p5 = positions[5];
  const crystal = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), new THREE.MeshStandardMaterial({ color: 0x00ffaa, emissive: 0x00ffaa, emissiveIntensity: 2.0, transparent: true, opacity: 0.5, metalness: 0.9, roughness: 0.1 }));
  crystal.position.set(p5.x, 1.5, p5.z); scene.add(crystal);
  const ring5 = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.03, 8, 32), mat(0x00ffaa, 1.5)); ring5.position.set(p5.x, 1.5, p5.z); ring5.rotation.x = Math.PI / 3; scene.add(ring5);
}
