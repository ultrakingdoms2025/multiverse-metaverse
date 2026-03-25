import * as THREE from 'three';
import { state } from '../state/gameState.js';

const groundVert = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const groundFrag = `
  uniform sampler2D uVideo;
  uniform float uTime;
  uniform float uReflectivity;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    // Video UV - flip both axes for correct orientation on ground plane
    vec2 uv = vec2(1.0 - vUv.x, 1.0 - vUv.y);

    // Sample video directly - no blur for clarity
    vec3 video = texture2D(uVideo, uv).rgb;

    // Darken to floor level
    video *= 0.24;

    // Subtle reflection sheen
    float reflection = uReflectivity * 0.03;

    // Subtle animated ripple
    float ripple = sin(vWorldPos.x * 0.8 + uTime * 0.3) * sin(vWorldPos.z * 0.4 + uTime * 0.2) * 0.015;

    vec3 finalColor = video + vec3(reflection + ripple);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function createVideoElement() {
  const video = document.createElement('video');
  video.src = '/overlay.mp4';
  video.crossOrigin = 'anonymous';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.play().catch(() => {
    const playOnce = () => { video.play(); window.removeEventListener('click', playOnce); };
    window.addEventListener('click', playOnce);
  });
  return video;
}

export function createGround(scene, renderer) {
  const video = createVideoElement();

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.colorSpace = THREE.SRGBColorSpace;

  // Env map for reflections
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
    generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.1, 500, cubeRenderTarget);
  cubeCamera.position.set(0, 0.1, 0);
  scene.add(cubeCamera);

  const groundMat = new THREE.ShaderMaterial({
    uniforms: {
      uVideo: { value: videoTexture },
      uTime: { value: 0 },
      uReflectivity: { value: 0.6 },
    },
    vertexShader: groundVert,
    fragmentShader: groundFrag,
  });

  // Road-shaped rectangle: 20 units wide (x), 90 units long (z)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 90),
    groundMat
  );
  ground.rotation.x = -Math.PI / 2;
  // Center the road along the camera path (z goes from -5 to 75, center ~35)
  ground.position.set(0, -0.01, 35);
  scene.add(ground);

  function updateEnvMap(cameraPosition) {
    cubeCamera.position.set(cameraPosition.x, 0.1, cameraPosition.z);
    ground.visible = false;
    cubeCamera.update(renderer, scene);
    ground.visible = true;
  }

  function initialCapture() { cubeCamera.update(renderer, scene); }

  function update(time) {
    if (state.reducedMotion) {
      groundMat.uniforms.uTime.value = 0;
      groundMat.uniforms.uVideo.value = null;
    } else {
      groundMat.uniforms.uTime.value = time;
      groundMat.uniforms.uVideo.value = videoTexture;
    }
  }

  return { ground, updateEnvMap, initialCapture, update };
}
