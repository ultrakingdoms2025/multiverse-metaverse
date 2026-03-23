import * as THREE from 'three';

const CONFIGS = [
  { color: 0xff00ff, pos: [14, 8, 10], size: [5, 8] },
  { color: 0x00ffff, pos: [-15, 10, 25], size: [6, 4] },
  { color: 0x6600ff, pos: [12, 6, 40], size: [4, 6] },
];

export function createBillboards(scene) {
  const boards = [];
  CONFIGS.forEach(cfg => {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(cfg.color) } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
        void main() {
          float scan = sin(vUv.y * 40.0 + uTime * 3.0) * 0.5 + 0.5;
          float flicker = 0.8 + 0.2 * sin(uTime * 10.0);
          gl_FragColor = vec4(uColor * (0.3 + scan * 0.7) * flicker * 2.0, 0.7);
        }
      `,
      transparent: true, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...cfg.size), mat);
    mesh.position.set(...cfg.pos); mesh.lookAt(0, cfg.pos[1], cfg.pos[2]);
    scene.add(mesh); boards.push(mat);
  });
  return { update: (time) => boards.forEach(m => { m.uniforms.uTime.value = time; }) };
}
