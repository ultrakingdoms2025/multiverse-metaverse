import * as THREE from 'three';

const portalFrag = `
  uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
  void main() {
    float pulse = sin(uTime * 2.0 + vUv.y * 6.2831) * 0.5 + 0.5;
    float ring = smoothstep(0.3, 0.35, length(vUv - 0.5)) * smoothstep(0.5, 0.45, length(vUv - 0.5));
    float energy = ring * (0.5 + pulse * 0.5);
    vec3 col = uColor * energy * 3.0;
    gl_FragColor = vec4(col, energy * 0.8);
  }
`;
const portalVert = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const PORTAL_COLORS = [
  new THREE.Color(0x00ffff), new THREE.Color(0xffaa00),
  new THREE.Color(0xff0044), new THREE.Color(0x4488ff), new THREE.Color(0xaa00ff),
];

export function createPortals(scene, spline) {
  const portals = [];
  const timeUniform = { value: 0 };
  const portalTValues = [0.09, 0.27, 0.45, 0.63, 0.81];

  portalTValues.forEach((t, i) => {
    const pos = spline.getPointAt(t);
    const tangent = spline.getTangentAt(t);
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(3.5, 0.15, 16, 48),
      new THREE.MeshStandardMaterial({
        color: PORTAL_COLORS[i], emissive: PORTAL_COLORS[i],
        emissiveIntensity: 2.0, metalness: 0.8, roughness: 0.2,
      })
    );
    torus.position.copy(pos); torus.position.y = 3.5;
    torus.lookAt(pos.clone().add(tangent));
    scene.add(torus);

    const fillMat = new THREE.ShaderMaterial({
      uniforms: { uTime: timeUniform, uColor: { value: PORTAL_COLORS[i] } },
      vertexShader: portalVert, fragmentShader: portalFrag,
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
    });
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), fillMat);
    fill.position.copy(torus.position); fill.quaternion.copy(torus.quaternion);
    scene.add(fill);

    const light = new THREE.PointLight(PORTAL_COLORS[i], 2.0, 15);
    light.position.copy(pos); light.position.y = 3.5;
    scene.add(light);
    portals.push({ torus, fill, light });
  });

  function update(time) { timeUniform.value = time; }
  function setSyncPulse(enabled) { /* Future: sync all portal pulse phases */ }
  return { portals, update, setSyncPulse };
}
