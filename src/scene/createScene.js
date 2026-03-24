import * as THREE from 'three';

export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0020);
  scene.fog = new THREE.FogExp2(0x0a0020, 0.008);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 1.7, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambient);

  // Street-level lights for visibility
  const streetColors = [0xff00ff, 0x00ffff, 0x6600ff, 0xff0066, 0x00ffaa];
  for (let i = 0; i < 12; i++) {
    const light = new THREE.PointLight(
      streetColors[i % streetColors.length], 0.5, 25
    );
    light.position.set(
      (i % 2 === 0 ? -4 : 4),
      3,
      i * 5 - 5
    );
    scene.add(light);
  }

  const clock = new THREE.Clock();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, scene, camera, clock };
}
