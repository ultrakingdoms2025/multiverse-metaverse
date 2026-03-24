import * as THREE from 'three';

const windowVert = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const windowFrag = `
  uniform vec3 uColor; uniform vec3 uEmissiveColor; uniform float uTime; varying vec2 vUv;
  void main() {
    vec2 grid = fract(vUv * vec2(6.0, 12.0));
    float window = step(0.15, grid.x) * step(grid.x, 0.85) * step(0.1, grid.y) * step(grid.y, 0.9);
    vec2 id = floor(vUv * vec2(6.0, 12.0));
    float rand = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
    float lit = step(0.4, rand);
    float flicker = step(0.95, fract(sin(dot(id + uTime * 0.1, vec2(45.23, 67.89))) * 12345.6789));
    float w = window * lit * (1.0 - flicker * 0.5);
    vec3 col = uColor * 0.15 + uEmissiveColor * w * 0.8;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const COLORS = [
  { base: 0x111122, emissive: new THREE.Color(0x00ffff) },
  { base: 0x111122, emissive: new THREE.Color(0xff00ff) },
  { base: 0x111122, emissive: new THREE.Color(0x6600ff) },
  { base: 0x110011, emissive: new THREE.Color(0xff0066) },
  { base: 0x111122, emissive: new THREE.Color(0x4488ff) },
];

export function createBuildings(scene) {
  const timeUniform = { value: 0 };
  for (let i = 0; i < 80; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const depth = Math.random() * 70 - 10;
    const width = 3 + Math.random() * 5;
    const height = 8 + Math.random() * 35;
    const offsetX = side * (9 + Math.random() * 10);
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, width),
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(c.base) }, uEmissiveColor: { value: c.emissive }, uTime: timeUniform },
        vertexShader: windowVert, fragmentShader: windowFrag,
      })
    );
    mesh.position.set(offsetX, height / 2, depth);
    scene.add(mesh);
  }
  return { update: (time) => { timeUniform.value = time; } };
}
