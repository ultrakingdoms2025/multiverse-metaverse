import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import * as THREE from 'three';
import { state } from '../state/gameState.js';

const ChromaticAberrationShader = {
  uniforms: { tDiffuse: { value: null }, uOffset: { value: 0.002 } },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uOffset; varying vec2 vUv;
    void main() {
      vec2 dir = vUv - vec2(0.5); float dist = length(dir); float offset = uOffset * dist;
      float r = texture2D(tDiffuse, vUv + dir * offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - dir * offset).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

export function createPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    state.bloomStrength, state.bloomRadius, state.bloomThreshold
  );
  composer.addPass(bloomPass);
  composer.addPass(new ShaderPass(ChromaticAberrationShader));

  function updateBloom(dt) {
    const speed = 2.0 * dt;
    bloomPass.strength += (state.bloomStrength - bloomPass.strength) * speed;
    bloomPass.radius += (state.bloomRadius - bloomPass.radius) * speed;
    bloomPass.threshold += (state.bloomThreshold - bloomPass.threshold) * speed;
  }

  function onResize() {
    composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.resolution.set(window.innerWidth, window.innerHeight);
  }

  return { composer, bloomPass, updateBloom, onResize };
}
