import * as THREE from 'three';

export function createGround(scene, renderer) {
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
    generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.1, 500, cubeRenderTarget);
  cubeCamera.position.set(0, 0.1, 0);
  scene.add(cubeCamera);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({
      color: 0x050510, metalness: 0.9, roughness: 0.1,
      envMap: cubeRenderTarget.texture, envMapIntensity: 0.6,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  function updateEnvMap(cameraPosition) {
    cubeCamera.position.set(cameraPosition.x, 0.1, cameraPosition.z);
    ground.visible = false;
    cubeCamera.update(renderer, scene);
    ground.visible = true;
  }
  function initialCapture() { cubeCamera.update(renderer, scene); }
  return { ground, updateEnvMap, initialCapture };
}
