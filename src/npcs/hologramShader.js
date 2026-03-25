import * as THREE from 'three';
export function createHologramMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: color.clone() }, uEmissiveMultiplier: { value: 1.0 } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime, uEmissiveMultiplier; uniform vec3 uColor; varying vec2 vUv;
      float rand(vec2 s) { return fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        float scan = sin(vUv.y * 80.0 + uTime * 2.0) * 0.5 + 0.5;
        scan = smoothstep(0.3, 0.7, scan);
        float flicker = 1.0 - 0.15 * step(0.98, rand(vec2(floor(uTime * 15.0), 0.0)));
        float edge = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 0.5);
        float intensity = (0.25 + scan * 0.35) * flicker * edge;
        gl_FragColor = vec4(uColor * intensity * uEmissiveMultiplier, 1.9 * intensity * flicker);
      }
    `,
    transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.NormalBlending,
  });
}
