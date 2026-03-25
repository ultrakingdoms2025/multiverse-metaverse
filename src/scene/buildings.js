import * as THREE from 'three';
import { NPC_DATA } from '../npcs/npcData.js';
import { STATION_T_VALUES } from '../state/gameState.js';

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
    vec3 col = uColor * 0.12 + uEmissiveColor * w * 0.4;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const COLORS = [
  { base: 0x0e1018, emissive: new THREE.Color(0x88ccdd) },
  { base: 0x0e1018, emissive: new THREE.Color(0xcc99bb) },
  { base: 0x0e1018, emissive: new THREE.Color(0x9988cc) },
  { base: 0x0e1018, emissive: new THREE.Color(0xddaa88) },
  { base: 0x0e1018, emissive: new THREE.Color(0x88aacc) },
  { base: 0x0e1018, emissive: new THREE.Color(0x99ccaa) },
];

// How similar are two colors (0 = identical, higher = more different)
function colorDistance(a, b) {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) +
    Math.pow(a.g - b.g, 2) +
    Math.pow(a.b - b.b, 2)
  );
}

export function createBuildings(scene, spline) {
  const timeUniform = { value: 0 };

  // Pre-compute NPC world positions and colors
  const npcZones = NPC_DATA.map((npc, i) => {
    const t = Math.min(STATION_T_VALUES[i] + 0.04, 1.0);
    const pos = spline.getPointAt(t);
    return { z: pos.z, color: npc.color };
  });

  for (let i = 0; i < 80; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const depth = Math.random() * 70 - 10;
    const width = 3 + Math.random() * 5;
    const height = 8 + Math.random() * 35;
    const offsetX = side * (9 + Math.random() * 10);

    // Find the nearest NPC to this building
    let nearestNpc = null;
    let nearestDist = Infinity;
    npcZones.forEach(npc => {
      const d = Math.abs(depth - npc.z);
      if (d < nearestDist) { nearestDist = d; nearestNpc = npc; }
    });

    // Pick a color that doesn't clash with nearest NPC (within 12 units)
    let c;
    if (nearestNpc && nearestDist < 12) {
      // Filter out colors too similar to the NPC
      const safe = COLORS.filter(col => colorDistance(col.emissive, nearestNpc.color) > 0.5);
      c = safe.length > 0
        ? safe[Math.floor(Math.random() * safe.length)]
        : COLORS[Math.floor(Math.random() * COLORS.length)];
    } else {
      c = COLORS[Math.floor(Math.random() * COLORS.length)];
    }

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
