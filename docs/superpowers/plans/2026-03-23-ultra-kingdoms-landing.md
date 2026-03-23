# Ultra Kingdoms Landing Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page immersive 3D cyberpunk marketing landing page for Ultra Kingdoms where players navigate a rail camera through a neon noir city, interact with 6 holographic NPCs, and reach a final CTA moment.

**Architecture:** Vite project with Three.js for the 3D scene (procedural geometry, no external models), HTML/CSS overlays for HUD/modals/CTAs, and a CatmullRom spline rail camera system. Desktop-only 3D experience with static mobile/no-WebGL fallback.

**Tech Stack:** Vite, Three.js (r168+), vanilla JS (ES modules), CSS3 animations

**Spec:** `docs/superpowers/specs/2026-03-23-ultra-kingdoms-landing-design.md`

**Note on innerHTML usage:** All innerHTML in this project uses hardcoded string literals from our own NPC data — no user-generated content is rendered. This is safe from XSS as there is no untrusted input. If a CMS or user input is added later, switch to DOMPurify or safe DOM construction.

---

## File Structure

```
src/
├── main.js                  # Entry point — detection, init routing
├── scene/
│   ├── createScene.js       # Three.js scene, camera, renderer, fog, lighting
│   ├── postProcessing.js    # EffectComposer, bloom, chromatic aberration
│   ├── buildings.js         # Procedural building geometry + window shaders
│   ├── ground.js            # Reflective ground plane + CubeCamera env map
│   ├── portals.js           # Portal arch geometry + animated energy shader
│   ├── neonSigns.js         # Neon sign planes + emissive materials
│   ├── billboards.js        # Holographic billboard planes
│   └── particles/
│       ├── rain.js          # Rain streak particle system (5000 max)
│       └── splash.js        # Ground splash sprites (200 max, CanvasTexture)
├── rail/
│   ├── splinePath.js        # CatmullRom spline definition (~20 control points)
│   ├── cameraRail.js        # Camera movement along spline, easing, parallax
│   └── stations.js          # 6 station definitions (t values, NPC refs, trigger zones)
├── npcs/
│   ├── npcData.js           # NPC configs: names, colors, positions, modal content
│   ├── hologramShader.js    # Custom ShaderMaterial (scanlines, flicker, glow)
│   ├── npcMesh.js           # Humanoid silhouette geometry builder
│   ├── npcManager.js        # Proximity detection, activation, orbit particles
│   └── stationProps.js      # Per-NPC environmental props (blueprints, arena, etc.)
├── ui/
│   ├── hud.js               # HUD setup: title, progress dots, nav arrows, audio
│   ├── modal.js             # Modal open/close, glitch animation, content render
│   ├── finalCta.js          # Final CTA overlay (Oracle trigger, letter reveal)
│   ├── loading.js           # Loading screen + progress bar + fade transition
│   ├── interactionPrompt.js # "Press E" prompt, 3D-to-screen projection
│   └── fallback.js          # Mobile/no-WebGL static fallback page
├── audio/
│   └── audioManager.js      # Lazy-load audio on toggle, play/pause
├── controls/
│   └── inputHandler.js      # Keyboard (A/D/arrows/E/Esc) + mouse + click
├── state/
│   └── gameState.js         # Current station, visited set, modal open, CTA triggered
└── styles/
    ├── main.css             # Global styles, viewport reset, font
    ├── hud.css              # HUD positioning, glitch animation
    ├── modal.css            # Modal slide-in, glitch keyframes, glass bg
    ├── loading.css          # Loading screen, progress bar
    ├── fallback.css         # Mobile/no-WebGL fallback styles
    └── final-cta.css        # Final CTA overlay, letter reveal animation
index.html                   # Single HTML shell with overlay divs
vite.config.js               # Vite config
package.json                 # Dependencies
```

---

## Chunk 1: Project Scaffold and Core Scene

### Task 1: Initialize Vite Project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/styles/main.css`

- [ ] **Step 1: Initialize npm project**

```bash
cd ~/source/repos/multiverse-metaverse
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install three
npm install -D vite
```

- [ ] **Step 3: Create vite.config.js**

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
```

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ultra Kingdoms — Enter the Multiverse</title>
  <link rel="stylesheet" href="/src/styles/main.css" />
</head>
<body>
  <div id="canvas-container"></div>
  <div id="loading-screen"></div>
  <div id="hud-layer"></div>
  <div id="interaction-prompt"></div>
  <div id="modal-backdrop"></div>
  <div id="modal-layer"></div>
  <div id="final-cta-overlay"></div>
  <div id="fallback-page"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create src/styles/main.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');

*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
  font-family: 'Rajdhani', sans-serif;
  color: #fff;
  cursor: default;
}

#canvas-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

#canvas-container canvas {
  display: block;
  width: 100%;
  height: 100%;
}

#loading-screen {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #000;
}

#hud-layer {
  position: fixed;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

#hud-layer > * {
  pointer-events: auto;
}

#interaction-prompt {
  position: fixed;
  z-index: 15;
  pointer-events: none;
}

#modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.4);
  display: none;
}

#modal-layer {
  position: fixed;
  top: 0;
  right: 0;
  width: 40%;
  height: 100%;
  z-index: 25;
  display: none;
  overflow-y: auto;
}

#final-cta-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: none;
}

#fallback-page {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: none;
}
```

- [ ] **Step 6: Create src/main.js stub**

```js
import './styles/main.css';

function init() {
  console.log('Ultra Kingdoms initializing...');
}

init();
```

- [ ] **Step 7: Add npm scripts to package.json**

Add to the `"scripts"` section:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 8: Verify dev server starts**

Run: `npm run dev`
Expected: Vite dev server starts, page loads with black screen and console log.

- [ ] **Step 9: Commit**

```bash
git add package.json vite.config.js index.html src/main.js src/styles/main.css
git commit -m "feat: scaffold Vite project with HTML shell and base styles"
```

---

### Task 2: Game State Module

**Files:**
- Create: `src/state/gameState.js`

- [ ] **Step 1: Create gameState.js**

```js
export const state = {
  currentStation: 0,
  targetStation: 0,
  isTransitioning: false,
  visitedStations: new Set(),
  modalOpen: false,
  modalNpcIndex: -1,
  activeNpcIndex: -1,
  finalCtaTriggered: false,
  finalCtaShown: false,
  audioPlaying: false,
  audioLoaded: false,
  sceneReady: false,
  bloomStrength: 1.5,
  bloomRadius: 0.4,
  bloomThreshold: 0.8,
  mouse: { x: 0, y: 0 },
};

export const BLOOM_STATES = {
  exploring: { bloomStrength: 1.5, bloomRadius: 0.4, bloomThreshold: 0.8 },
  modal:     { bloomStrength: 2.0, bloomRadius: 0.4, bloomThreshold: 0.8 },
  finalCta:  { bloomStrength: 2.5, bloomRadius: 0.6, bloomThreshold: 0.6 },
};

export const STATION_T_VALUES = [0.0, 0.18, 0.36, 0.54, 0.72, 0.9];
export const TRIGGER_ZONE = 0.04;
export const STATION_COUNT = 6;
export const TRANSITION_DURATION = 3.0;
```

- [ ] **Step 2: Commit**

```bash
git add src/state/gameState.js
git commit -m "feat: add game state module with station and bloom constants"
```

---

### Task 3: Core Three.js Scene

**Files:**
- Create: `src/scene/createScene.js`

- [ ] **Step 1: Create createScene.js**

```js
import * as THREE from 'three';

export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a1a);
  scene.fog = new THREE.FogExp2(0x0a0020, 0.015);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 1.7, 0);

  const ambient = new THREE.AmbientLight(0x000011, 0.02);
  scene.add(ambient);

  const clock = new THREE.Clock();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, scene, camera, clock };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scene/createScene.js
git commit -m "feat: add core Three.js scene with renderer, camera, fog, lighting"
```

---

### Task 4: Post-Processing Pipeline

**Files:**
- Create: `src/scene/postProcessing.js`

- [ ] **Step 1: Create postProcessing.js**

```js
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import * as THREE from 'three';
import { state } from '../state/gameState.js';

const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    uOffset: { value: 0.002 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uOffset;
    varying vec2 vUv;
    void main() {
      vec2 dir = vUv - vec2(0.5);
      float dist = length(dir);
      float offset = uOffset * dist;
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
```

- [ ] **Step 2: Commit**

```bash
git add src/scene/postProcessing.js
git commit -m "feat: add post-processing with bloom and chromatic aberration"
```

---

### Task 5: Procedural Buildings

**Files:**
- Create: `src/scene/buildings.js`

- [ ] **Step 1: Create buildings.js**

```js
import * as THREE from 'three';

const windowVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const windowFrag = `
  uniform vec3 uColor;
  uniform vec3 uEmissiveColor;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 grid = fract(vUv * vec2(6.0, 12.0));
    float window = step(0.15, grid.x) * step(grid.x, 0.85) *
                   step(0.1, grid.y) * step(grid.y, 0.9);
    vec2 id = floor(vUv * vec2(6.0, 12.0));
    float rand = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
    float lit = step(0.4, rand);
    float flicker = step(0.95, fract(sin(dot(id + uTime * 0.1, vec2(45.23, 67.89))) * 12345.6789));
    float w = window * lit * (1.0 - flicker * 0.5);
    vec3 col = uColor * 0.05 + uEmissiveColor * w * 0.8;
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
    const depth = Math.random() * 60 - 5;
    const width = 3 + Math.random() * 6;
    const height = 8 + Math.random() * 35;
    const offsetX = side * (8 + Math.random() * 15);
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, width),
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(c.base) },
          uEmissiveColor: { value: c.emissive },
          uTime: timeUniform,
        },
        vertexShader: windowVert,
        fragmentShader: windowFrag,
      })
    );
    mesh.position.set(offsetX, height / 2, depth);
    scene.add(mesh);
  }

  return { update: (time) => { timeUniform.value = time; } };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scene/buildings.js
git commit -m "feat: add procedural buildings with emissive window grid shader"
```

---

### Task 6: Ground Plane with Reflections

**Files:**
- Create: `src/scene/ground.js`

- [ ] **Step 1: Create ground.js**

```js
import * as THREE from 'three';

export function createGround(scene, renderer) {
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.1, 500, cubeRenderTarget);
  cubeCamera.position.set(0, 0.1, 0);
  scene.add(cubeCamera);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({
      color: 0x050510,
      metalness: 0.9,
      roughness: 0.1,
      envMap: cubeRenderTarget.texture,
      envMapIntensity: 0.6,
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

  function initialCapture() {
    cubeCamera.update(renderer, scene);
  }

  return { ground, updateEnvMap, initialCapture };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scene/ground.js
git commit -m "feat: add reflective ground plane with CubeCamera env map"
```

---

### Task 7: Portal Arches

**Files:**
- Create: `src/scene/portals.js`

- [ ] **Step 1: Create portals.js**

```js
import * as THREE from 'three';

const portalFrag = `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float pulse = sin(uTime * 2.0 + vUv.y * 6.2831) * 0.5 + 0.5;
    float ring = smoothstep(0.3, 0.35, length(vUv - 0.5)) *
                 smoothstep(0.5, 0.45, length(vUv - 0.5));
    float energy = ring * (0.5 + pulse * 0.5);
    vec3 col = uColor * energy * 3.0;
    gl_FragColor = vec4(col, energy * 0.8);
  }
`;

const portalVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PORTAL_COLORS = [
  new THREE.Color(0x00ffff), new THREE.Color(0xffaa00),
  new THREE.Color(0xff0044), new THREE.Color(0x4488ff),
  new THREE.Color(0xaa00ff),
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
    torus.position.copy(pos);
    torus.position.y = 3.5;
    torus.lookAt(pos.clone().add(tangent));
    scene.add(torus);

    const fillMat = new THREE.ShaderMaterial({
      uniforms: { uTime: timeUniform, uColor: { value: PORTAL_COLORS[i] } },
      vertexShader: portalVert, fragmentShader: portalFrag,
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
    });
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), fillMat);
    fill.position.copy(torus.position);
    fill.quaternion.copy(torus.quaternion);
    scene.add(fill);

    const light = new THREE.PointLight(PORTAL_COLORS[i], 2.0, 15);
    light.position.copy(pos);
    light.position.y = 3.5;
    scene.add(light);

    portals.push({ torus, fill, light });
  });

  function update(time) { timeUniform.value = time; }
  function setSyncPulse(enabled) { /* Future: sync all portal pulse phases */ }

  return { portals, update, setSyncPulse };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scene/portals.js
git commit -m "feat: add portal arches with animated energy shader"
```

---

### Task 8: Neon Signs and Billboards

**Files:**
- Create: `src/scene/neonSigns.js`
- Create: `src/scene/billboards.js`

- [ ] **Step 1: Create neonSigns.js**

```js
import * as THREE from 'three';

const SIGNS = [
  { color: 0xff00ff, pos: [-6, 12, 5], rot: 0 },
  { color: 0x00ffff, pos: [10, 15, 15], rot: Math.PI },
  { color: 0x6600ff, pos: [-12, 10, 30], rot: 0 },
  { color: 0xff0066, pos: [8, 18, -3], rot: Math.PI },
  { color: 0x00ffaa, pos: [-9, 14, 45], rot: 0 },
];

export function createNeonSigns(scene) {
  SIGNS.forEach(cfg => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 1.5),
      new THREE.MeshStandardMaterial({
        color: cfg.color, emissive: cfg.color, emissiveIntensity: 3.0,
        transparent: true, opacity: 0.9,
      })
    );
    mesh.position.set(...cfg.pos);
    mesh.rotation.y = cfg.rot;
    scene.add(mesh);

    const light = new THREE.PointLight(cfg.color, 1.5, 12);
    light.position.set(cfg.pos[0], cfg.pos[1] - 2, cfg.pos[2]);
    scene.add(light);
  });
}
```

- [ ] **Step 2: Create billboards.js**

```js
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
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
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
    mesh.position.set(...cfg.pos);
    mesh.lookAt(0, cfg.pos[1], cfg.pos[2]);
    scene.add(mesh);
    boards.push(mat);
  });

  return { update: (time) => boards.forEach(m => { m.uniforms.uTime.value = time; }) };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/scene/neonSigns.js src/scene/billboards.js
git commit -m "feat: add neon signs and holographic billboards"
```

---

### Task 9: Rain and Splash Particles

**Files:**
- Create: `src/scene/particles/rain.js`
- Create: `src/scene/particles/splash.js`

- [ ] **Step 1: Create rain.js**

```js
import * as THREE from 'three';

const MAX_RAIN = 5000;

export function createRain(scene) {
  const positions = new Float32Array(MAX_RAIN * 3);
  const velocities = new Float32Array(MAX_RAIN);

  for (let i = 0; i < MAX_RAIN; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = Math.random() * 40;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    velocities[i] = 15 + Math.random() * 10;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const rain = new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0x8888cc, size: 0.08, transparent: true, opacity: 0.4,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(rain);

  function update(dt) {
    const arr = geometry.attributes.position.array;
    for (let i = 0; i < MAX_RAIN; i++) {
      arr[i * 3 + 1] -= velocities[i] * dt;
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3 + 1] = 30 + Math.random() * 10;
        arr[i * 3] = (Math.random() - 0.5) * 80;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 80;
      }
    }
    geometry.attributes.position.needsUpdate = true;
  }

  return { update };
}
```

- [ ] **Step 2: Create splash.js**

```js
import * as THREE from 'three';

const MAX_SPLASH = 200;

export function createSplash(scene) {
  // Procedural splash texture via CanvasTexture
  const canvas = document.createElement('canvas');
  canvas.width = 16; canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 16);
  const texture = new THREE.CanvasTexture(canvas);

  const positions = new Float32Array(MAX_SPLASH * 3);
  const lifetimes = new Float32Array(MAX_SPLASH);
  let idx = 0;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const splash = new THREE.Points(geometry, new THREE.PointsMaterial({
    map: texture, size: 0.3, transparent: true, opacity: 0.5,
    depthWrite: false, blending: THREE.AdditiveBlending, color: 0x6666aa,
  }));
  scene.add(splash);

  function update(dt) {
    for (let i = 0; i < MAX_SPLASH; i++) {
      if (lifetimes[i] > 0) {
        lifetimes[i] -= dt;
        if (lifetimes[i] <= 0) positions[i * 3 + 1] = -100;
      }
    }
    geometry.attributes.position.needsUpdate = true;
  }

  function spawnNearCamera(camPos) {
    for (let j = 0; j < 3; j++) {
      const i = idx++ % MAX_SPLASH;
      positions[i * 3] = camPos.x + (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = 0.05;
      positions[i * 3 + 2] = camPos.z + (Math.random() - 0.5) * 20;
      lifetimes[i] = 0.3;
    }
  }

  return { update, spawnNearCamera };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/scene/particles/rain.js src/scene/particles/splash.js
git commit -m "feat: add rain particles and ground splash with CanvasTexture"
```

---

## Chunk 2: Rail System and NPC System

### Task 10: Spline Path

**Files:**
- Create: `src/rail/splinePath.js`

- [ ] **Step 1: Create splinePath.js**

```js
import * as THREE from 'three';

const POINTS = [
  [0, 1.7, -5], [-2, 1.7, 2], [-1, 1.7, 8], [2, 1.7, 12],
  [4, 1.7, 16], [1, 1.7, 20], [-2, 1.7, 24], [-3, 1.7, 28],
  [0, 1.7, 32], [3, 1.7, 35], [4, 1.7, 38], [1, 1.7, 42],
  [-2, 1.7, 46], [-3, 1.7, 50], [0, 1.7, 53], [2, 1.7, 56],
  [3, 1.7, 58], [1, 1.7, 60],
].map(p => new THREE.Vector3(...p));

export function createSplinePath() {
  return new THREE.CatmullRomCurve3(POINTS, false, 'catmullrom', 0.5);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/rail/splinePath.js
git commit -m "feat: add CatmullRom spline path definition"
```

---

### Task 11: Stations and Camera Rail

**Files:**
- Create: `src/rail/stations.js`
- Create: `src/rail/cameraRail.js`

- [ ] **Step 1: Create stations.js**

```js
import { STATION_T_VALUES, TRIGGER_ZONE } from '../state/gameState.js';

export const stations = STATION_T_VALUES.map((t, i) => ({
  index: i, t,
  triggerMin: t - TRIGGER_ZONE,
  triggerMax: t + TRIGGER_ZONE,
}));

export function getActiveStation(currentT) {
  for (const s of stations) {
    if (currentT >= s.triggerMin && currentT <= s.triggerMax) return s.index;
  }
  return -1;
}
```

- [ ] **Step 2: Create cameraRail.js**

```js
import * as THREE from 'three';
import { state, STATION_T_VALUES, TRANSITION_DURATION } from '../state/gameState.js';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function createCameraRail(camera, spline, npcPositions) {
  let currentT = STATION_T_VALUES[0];
  let startT = currentT, endT = currentT, progress = 1.0;
  const lookTarget = new THREE.Vector3();

  function goToStation(i) {
    if (state.isTransitioning || state.modalOpen) return;
    if (i < 0 || i >= STATION_T_VALUES.length) return;
    state.targetStation = i;
    state.isTransitioning = true;
    startT = currentT;
    endT = STATION_T_VALUES[i];
    progress = 0;
  }

  function nextStation() { if (state.currentStation < STATION_T_VALUES.length - 1) goToStation(state.currentStation + 1); }
  function prevStation() { if (state.currentStation > 0) goToStation(state.currentStation - 1); }

  function update(dt) {
    if (state.isTransitioning) {
      progress += dt / TRANSITION_DURATION;
      if (progress >= 1.0) {
        progress = 1.0;
        state.isTransitioning = false;
        state.currentStation = state.targetStation;
        state.visitedStations.add(state.currentStation);
      }
      currentT = startT + (endT - startT) * easeInOutCubic(Math.min(progress, 1.0));
    }

    camera.position.copy(spline.getPointAt(currentT));

    const tangent = spline.getTangentAt(currentT);
    lookTarget.copy(camera.position).add(tangent.multiplyScalar(5));

    if (state.activeNpcIndex >= 0 && npcPositions[state.activeNpcIndex]) {
      lookTarget.lerp(npcPositions[state.activeNpcIndex], 0.6);
    }

    camera.lookAt(lookTarget);
    camera.rotation.y += state.mouse.x * 0.087;
    camera.rotation.x += state.mouse.y * 0.05;
  }

  function getCurrentT() { return currentT; }

  return { goToStation, nextStation, prevStation, update, getCurrentT };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/rail/stations.js src/rail/cameraRail.js
git commit -m "feat: add camera rail with station transitions and parallax"
```

---

### Task 12: NPC Data and Hologram Shader

**Files:**
- Create: `src/npcs/npcData.js`
- Create: `src/npcs/hologramShader.js`

- [ ] **Step 1: Create npcData.js**

```js
import * as THREE from 'three';

export const NPC_DATA = [
  {
    name: 'The Architect', color: new THREE.Color(0x00ffff), hexColor: '#00ffff',
    stationIndex: 0, visualType: 'blueprint',
    quote: '\u201CI designed the bridges between worlds. Each realm is a living dimension \u2014 its own physics, its own rules, its own dangers. The Nexus binds them together, and from it, infinite paths diverge.\u201D',
    features: [
      'Procedurally generated realms with unique biomes and physics rules',
      'Persistent world state \u2014 your actions reshape the multiverse',
      'Discover hidden rifts connecting secret dimensions',
    ],
  },
  {
    name: 'The Broker', color: new THREE.Color(0xffaa00), hexColor: '#ffaa00',
    stationIndex: 1, visualType: 'ticker',
    quote: '\u201CEverything has a price in the Nexus. Rare alloys from the Ember Wastes, data crystals from the Neon Spires \u2014 I move it all. Smart traders build empires.\u201D',
    features: [
      'Cross-realm trading economy driven by supply and demand',
      'Craft legendary gear from materials found across dimensions',
      'Player-run marketplaces and auction houses',
    ],
  },
  {
    name: 'The Warden', color: new THREE.Color(0xff0044), hexColor: '#ff0044',
    stationIndex: 2, visualType: 'combat',
    quote: '\u201CThe arenas don\u2019t care where you\u2019re from. Step through the gate and prove yourself. Solo duels, faction wars, realm sieges \u2014 there\u2019s always someone who needs to be put down.\u201D',
    features: [
      'Skill-based combat with deep ability customization',
      'PvP arenas, ranked ladders, and seasonal tournaments',
      'Large-scale realm siege warfare (50v50)',
    ],
  },
  {
    name: 'The Navigator', color: new THREE.Color(0x4488ff), hexColor: '#4488ff',
    stationIndex: 3, visualType: 'portal',
    quote: '\u201CMost people see walls between dimensions. I see doors. The Riftwalker\u2019s gift lets us slip between worlds \u2014 each one stranger and more beautiful than the last.\u201D',
    features: [
      'Seamless realm transitions through dimensional portals',
      'Open-world exploration with verticality and hidden areas',
      'Dynamic events that alter the landscape in real-time',
    ],
  },
  {
    name: 'The Syndicate Boss', color: new THREE.Color(0xaa00ff), hexColor: '#aa00ff',
    stationIndex: 4, visualType: 'faction',
    quote: '\u201CPower isn\u2019t taken alone. My syndicate controls three realms and counting. We protect our own, crush our enemies, and split the profits.\u201D',
    features: [
      'Create or join factions with territory control',
      'Guild halls, shared resources, and faction progression',
      'Political alliances and betrayals shape the multiverse',
    ],
  },
  {
    name: 'The Oracle', color: new THREE.Color(0x00ffaa), hexColor: '#00ffaa',
    stationIndex: 5, visualType: 'timeline',
    quote: '\u201CI see the threads of what\u2019s coming. New realms forming in the void. The multiverse is expanding, and you can be there from the beginning.\u201D',
    features: [
      'Early access beta launching soon',
      'Regular content drops: new realms, abilities, and events',
      'Community-driven development \u2014 your feedback shapes the game',
    ],
  },
];
```

- [ ] **Step 2: Create hologramShader.js**

```js
import * as THREE from 'three';

export function createHologramMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: color.clone() },
      uEmissiveMultiplier: { value: 1.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform float uTime, uEmissiveMultiplier;
      uniform vec3 uColor;
      varying vec2 vUv;
      float rand(vec2 s) { return fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        float scan = sin(vUv.y * 80.0 + uTime * 2.0) * 0.5 + 0.5;
        scan = smoothstep(0.3, 0.7, scan);
        float flicker = 1.0 - 0.15 * step(0.98, rand(vec2(floor(uTime * 15.0), 0.0)));
        float edge = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 0.5);
        float intensity = (0.4 + scan * 0.6) * flicker * edge;
        gl_FragColor = vec4(uColor * intensity * uEmissiveMultiplier, 0.7 * intensity * flicker);
      }
    `,
    transparent: true, side: THREE.DoubleSide,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/npcs/npcData.js src/npcs/hologramShader.js
git commit -m "feat: add NPC data and hologram shader material"
```

---

### Task 13: NPC Mesh Builder

**Files:**
- Create: `src/npcs/npcMesh.js`

- [ ] **Step 1: Create npcMesh.js**

```js
import * as THREE from 'three';
import { createHologramMaterial } from './hologramShader.js';

export function createNpcMesh(npcConfig) {
  const group = new THREE.Group();
  const material = createHologramMaterial(npcConfig.color);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), material);
  head.position.y = 1.75;
  group.add(head);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8), material);
  torso.position.y = 1.2;
  group.add(torso);

  const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 8), material);
  cloak.position.y = 0.6;
  group.add(cloak);

  // Invisible hit sphere for raycasting
  const hitSphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.0, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitSphere.position.y = 1.0;
  hitSphere.userData.npcIndex = npcConfig.stationIndex;
  group.add(hitSphere);

  return { group, material, hitSphere };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/npcs/npcMesh.js
git commit -m "feat: add NPC mesh builder with hit sphere for raycasting"
```

---

### Task 14: NPC Manager

**Files:**
- Create: `src/npcs/npcManager.js`

- [ ] **Step 1: Create npcManager.js**

```js
import * as THREE from 'three';
import { NPC_DATA } from './npcData.js';
import { createNpcMesh } from './npcMesh.js';
import { state, STATION_T_VALUES } from '../state/gameState.js';
import { getActiveStation } from '../rail/stations.js';

export function createNpcManager(scene, spline) {
  const npcs = [];
  const npcPositions = [];
  const hitSpheres = [];

  NPC_DATA.forEach((data, i) => {
    const t = STATION_T_VALUES[i];
    const pos = spline.getPointAt(t);
    const tangent = spline.getTangentAt(t);
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const npcPos = pos.clone().add(side.multiplyScalar(3));
    npcPos.y = 0;

    const { group, material, hitSphere } = createNpcMesh(data);
    group.position.copy(npcPos);
    scene.add(group);

    // Orbit particles
    const orbitCount = 10;
    const orbitPositions = new Float32Array(orbitCount * 3);
    const orbitGeo = new THREE.BufferGeometry();
    orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
    const orbitPts = new THREE.Points(orbitGeo, new THREE.PointsMaterial({
      color: data.color, size: 0.1, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    scene.add(orbitPts);

    npcPositions.push(npcPos.clone().setY(1.5));
    hitSpheres.push(hitSphere);
    npcs.push({ group, material, baseY: npcPos.y, orbitGeo, orbitCount, orbitCenter: npcPos.clone() });
  });

  function update(time, dt, currentT) {
    state.activeNpcIndex = getActiveStation(currentT);

    npcs.forEach((npc, i) => {
      npc.group.position.y = npc.baseY + Math.sin(time * (Math.PI * 2 / 3) + i) * 0.1;

      const target = (i === state.activeNpcIndex) ? 3.0 : 1.0;
      const cur = npc.material.uniforms.uEmissiveMultiplier.value;
      npc.material.uniforms.uEmissiveMultiplier.value += (target - cur) * Math.min(dt * 4, 1);
      npc.material.uniforms.uTime.value = time;

      // Face camera when active
      if (i === state.activeNpcIndex && !state.isTransitioning && state._cameraPosition) {
        const look = state._cameraPosition.clone();
        look.y = npc.group.position.y;
        const tmp = new THREE.Object3D();
        tmp.position.copy(npc.group.position);
        tmp.lookAt(look);
        npc.group.quaternion.slerp(tmp.quaternion, Math.min(dt * 6, 1));
      }

      // Update orbit particles
      const arr = npc.orbitGeo.attributes.position.array;
      for (let j = 0; j < npc.orbitCount; j++) {
        const angle = time * 1.5 + (j / npc.orbitCount) * Math.PI * 2;
        const r = 1.2 + Math.sin(time * 2 + j) * 0.3;
        arr[j * 3] = npc.orbitCenter.x + Math.cos(angle) * r;
        arr[j * 3 + 1] = 1.0 + Math.sin(time * 1.5 + j * 0.5) * 0.5;
        arr[j * 3 + 2] = npc.orbitCenter.z + Math.sin(angle) * r;
      }
      npc.orbitGeo.attributes.position.needsUpdate = true;
    });
  }

  return { npcs, npcPositions, hitSpheres, update };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/npcs/npcManager.js
git commit -m "feat: add NPC manager with proximity, activation, and orbit particles"
```

---

### Task 15: Station Props

**Files:**
- Create: `src/npcs/stationProps.js`

- [ ] **Step 1: Create stationProps.js**

```js
import * as THREE from 'three';

export function createStationProps(scene, positions) {
  const mat = (color, intensity = 1.5) => new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: intensity,
  });
  const transMat = (color, opacity = 0.3) => new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 1.0,
    transparent: true, opacity, side: THREE.DoubleSide,
  });

  // Station 0 - Architect: floating blueprint planes
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1), transMat(0x00ffff));
    m.position.set(positions[0].x + Math.cos(angle) * 2, 2 + i * 0.5, positions[0].z + Math.sin(angle) * 2);
    m.rotation.y = angle;
    scene.add(m);
  }

  // Station 1 - Broker: stall posts + bar
  const p1 = positions[1];
  for (const dx of [-1.5, 1.5]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8), mat(0xffaa00));
    post.position.set(p1.x + dx, 1.25, p1.z);
    scene.add(post);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.1), mat(0xffaa00));
  bar.position.set(p1.x, 2.5, p1.z);
  scene.add(bar);

  // Station 2 - Warden: gate pillars + barrier
  const p2 = positions[2];
  for (const dx of [-2, 2]) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 0.4), mat(0xff0044, 2.0));
    pil.position.set(p2.x + dx, 2, p2.z);
    scene.add(pil);
  }
  const barrier = new THREE.Mesh(new THREE.PlaneGeometry(4, 3.5), transMat(0xff0044, 0.15));
  barrier.position.set(p2.x, 2, p2.z);
  scene.add(barrier);

  // Station 3 - Navigator: portal ring
  const ring3 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.1, 12, 32), mat(0x4488ff, 2.5));
  ring3.position.set(positions[3].x, 2, positions[3].z);
  ring3.rotation.x = Math.PI / 6;
  scene.add(ring3);

  // Station 4 - Syndicate Boss: hex platform + throne back
  const p4 = positions[4];
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.2, 0.3, 6),
    new THREE.MeshStandardMaterial({ color: 0x111122, emissive: 0xaa00ff, emissiveIntensity: 0.5 }));
  platform.position.set(p4.x, 0.15, p4.z);
  scene.add(platform);
  const throne = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 0.2), mat(0xaa00ff, 1.0));
  throne.position.set(p4.x, 1.5, p4.z - 1.8);
  scene.add(throne);

  // Station 5 - Oracle: crystal sphere + data ring
  const p5 = positions[5];
  const crystal = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0x00ffaa, emissive: 0x00ffaa, emissiveIntensity: 2.0,
      transparent: true, opacity: 0.5, metalness: 0.9, roughness: 0.1,
    }));
  crystal.position.set(p5.x, 1.5, p5.z);
  scene.add(crystal);
  const ring5 = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.03, 8, 32), mat(0x00ffaa, 1.5));
  ring5.position.set(p5.x, 1.5, p5.z);
  ring5.rotation.x = Math.PI / 3;
  scene.add(ring5);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/npcs/stationProps.js
git commit -m "feat: add station props for each NPC encounter"
```

---

## Chunk 3: UI Layer

### Task 16: Input Handler

**Files:**
- Create: `src/controls/inputHandler.js`

- [ ] **Step 1: Create inputHandler.js**

```js
import { state } from '../state/gameState.js';

export function createInputHandler(callbacks) {
  function onKeyDown(e) {
    if (state.finalCtaShown) {
      if (e.key === 'Escape') callbacks.onDismissFinalCta?.();
      return;
    }
    if (state.modalOpen) {
      if (e.key === 'Escape') callbacks.onCloseModal();
      return;
    }
    switch (e.key) {
      case 'ArrowRight': case 'd': case 'D': callbacks.onNext(); break;
      case 'ArrowLeft': case 'a': case 'A': callbacks.onPrev(); break;
      case 'e': case 'E':
        if (state.activeNpcIndex >= 0) callbacks.onInteract(state.activeNpcIndex);
        break;
    }
  }

  function onMouseMove(e) {
    state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('mousemove', onMouseMove);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/controls/inputHandler.js
git commit -m "feat: add keyboard and mouse input handler"
```

---

### Task 17: Loading Screen

**Files:**
- Create: `src/ui/loading.js`
- Create: `src/styles/loading.css`

- [ ] **Step 1: Create loading.css**

```css
.loading-content { text-align: center; }

.loading-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 3rem; font-weight: 900; letter-spacing: 0.3em;
  color: #fff; text-shadow: 0 0 20px #ff00ff, 0 0 40px #ff00ff55;
  animation: glitchText 8s infinite;
}

.loading-bar-container {
  width: 300px; height: 4px; background: rgba(255,255,255,0.1);
  margin-top: 2rem; border-radius: 2px; overflow: hidden;
}

.loading-bar {
  height: 100%; width: 0%; border-radius: 2px;
  background: linear-gradient(90deg, #ff00ff, #00ffff);
  box-shadow: 0 0 10px #ff00ff, 0 0 20px #00ffff55;
  transition: width 0.3s ease;
}

#loading-screen.fade-out {
  opacity: 0; transition: opacity 0.8s ease; pointer-events: none;
}

@keyframes glitchText {
  0%, 90%, 100% { clip-path: inset(0); transform: translateX(0); }
  91% { clip-path: inset(20% 0 40% 0); transform: translateX(-5px); }
  92% { clip-path: inset(60% 0 10% 0); transform: translateX(5px); }
  93% { clip-path: inset(0); transform: translateX(0); }
  94% { clip-path: inset(40% 0 30% 0); transform: translateX(3px); }
  95% { clip-path: inset(0); transform: translateX(0); }
}
```

- [ ] **Step 2: Create loading.js**

```js
import '../styles/loading.css';

export function createLoadingScreen() {
  const el = document.getElementById('loading-screen');
  const content = document.createElement('div');
  content.className = 'loading-content';

  const title = document.createElement('div');
  title.className = 'loading-title';
  title.textContent = 'ULTRA KINGDOMS';

  const barContainer = document.createElement('div');
  barContainer.className = 'loading-bar-container';
  const bar = document.createElement('div');
  bar.className = 'loading-bar';
  barContainer.appendChild(bar);

  content.appendChild(title);
  content.appendChild(barContainer);
  el.appendChild(content);

  function setProgress(pct) { bar.style.width = Math.min(pct * 100, 100) + '%'; }

  function fadeOut() {
    return new Promise(resolve => {
      setTimeout(() => {
        el.classList.add('fade-out');
        setTimeout(() => { el.style.display = 'none'; resolve(); }, 800);
      }, 500);
    });
  }

  return { setProgress, fadeOut };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/loading.js src/styles/loading.css
git commit -m "feat: add loading screen with progress bar and fade"
```

---

### Task 18: HUD

**Files:**
- Create: `src/ui/hud.js`
- Create: `src/styles/hud.css`

- [ ] **Step 1: Create hud.css**

```css
.hud-title { position: absolute; top: 30px; left: 30px; }
.hud-title h1 {
  font-family: 'Orbitron', sans-serif; font-size: 1.8rem; font-weight: 900;
  letter-spacing: 0.2em; color: #fff;
  text-shadow: 0 0 15px #ff00ff, 0 0 30px #ff00ff44;
  animation: glitchText 8s infinite;
}
.hud-title .tagline { font-size: 0.9rem; color: rgba(255,255,255,0.6); letter-spacing: 0.15em; margin-top: 4px; }

.hud-audio { position: absolute; top: 30px; right: 30px; }
.hud-audio button {
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  color: #fff; padding: 8px 12px; border-radius: 4px; cursor: pointer;
  font-family: 'Rajdhani', sans-serif; font-size: 0.9rem; transition: background 0.2s;
}
.hud-audio button:hover { background: rgba(255,255,255,0.2); }

.hud-nav {
  position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 20px;
}
.hud-nav button {
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3);
  color: #fff; width: 44px; height: 44px; border-radius: 50%; cursor: pointer;
  font-size: 1.2rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.hud-nav button:hover:not(:disabled) { background: rgba(255,0,255,0.2); border-color: #ff00ff; }
.hud-nav button:disabled { opacity: 0.2; cursor: default; }
.hud-nav .nav-hint { font-size: 0.75rem; color: rgba(255,255,255,0.4); letter-spacing: 0.1em; }

.hud-progress { position: absolute; bottom: 30px; left: 30px; display: flex; gap: 10px; }
.hud-progress .dot {
  width: 10px; height: 10px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.4); background: transparent; transition: all 0.3s;
}
.hud-progress .dot.visited { background: #fff; border-color: #fff; }
.hud-progress .dot.current { animation: dotPulse 1.5s infinite; }

.hud-cta { position: absolute; bottom: 30px; right: 30px; }
.hud-cta a {
  display: inline-block; padding: 10px 24px;
  background: linear-gradient(135deg, rgba(255,0,255,0.3), rgba(0,255,255,0.3));
  border: 1px solid #ff00ff; color: #fff; text-decoration: none;
  font-family: 'Orbitron', sans-serif; font-size: 0.8rem; letter-spacing: 0.15em;
  border-radius: 4px; transition: all 0.3s; text-shadow: 0 0 10px #ff00ff;
}
.hud-cta a:hover { background: linear-gradient(135deg, rgba(255,0,255,0.5), rgba(0,255,255,0.5)); box-shadow: 0 0 20px rgba(255,0,255,0.3); }

@keyframes dotPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.4); } }
```

- [ ] **Step 2: Create hud.js**

```js
import '../styles/hud.css';
import { state, STATION_COUNT } from '../state/gameState.js';
import { NPC_DATA } from '../npcs/npcData.js';

export function createHud(callbacks) {
  const container = document.getElementById('hud-layer');

  // Build HUD with safe DOM methods
  const titleDiv = document.createElement('div');
  titleDiv.className = 'hud-title';
  const h1 = document.createElement('h1');
  h1.textContent = 'ULTRA KINGDOMS';
  const tagline = document.createElement('div');
  tagline.className = 'tagline';
  tagline.textContent = 'ENTER THE MULTIVERSE';
  titleDiv.appendChild(h1);
  titleDiv.appendChild(tagline);
  container.appendChild(titleDiv);

  const audioDiv = document.createElement('div');
  audioDiv.className = 'hud-audio';
  const audioBtn = document.createElement('button');
  audioBtn.textContent = '\u{1F50A} OFF';
  audioBtn.addEventListener('click', () => callbacks.onAudioToggle());
  audioDiv.appendChild(audioBtn);
  container.appendChild(audioDiv);

  const navDiv = document.createElement('div');
  navDiv.className = 'hud-nav';
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '\u25C0';
  prevBtn.disabled = true;
  prevBtn.addEventListener('click', () => callbacks.onPrev());
  const hint = document.createElement('span');
  hint.className = 'nav-hint';
  hint.textContent = 'Use Arrow Keys or A/D';
  const nextBtn = document.createElement('button');
  nextBtn.textContent = '\u25B6';
  nextBtn.addEventListener('click', () => callbacks.onNext());
  navDiv.appendChild(prevBtn);
  navDiv.appendChild(hint);
  navDiv.appendChild(nextBtn);
  container.appendChild(navDiv);

  const progressDiv = document.createElement('div');
  progressDiv.className = 'hud-progress';
  const dots = [];
  for (let i = 0; i < STATION_COUNT; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    progressDiv.appendChild(dot);
    dots.push(dot);
  }
  container.appendChild(progressDiv);

  const ctaDiv = document.createElement('div');
  ctaDiv.className = 'hud-cta';
  ctaDiv.id = 'hud-cta-btn';
  const ctaLink = document.createElement('a');
  ctaLink.href = '#';
  ctaLink.textContent = 'JOIN THE MULTIVERSE';
  ctaDiv.appendChild(ctaLink);
  container.appendChild(ctaDiv);

  function update() {
    prevBtn.disabled = state.currentStation <= 0 || state.isTransitioning;
    nextBtn.disabled = state.currentStation >= STATION_COUNT - 1 || state.isTransitioning;
    dots.forEach((dot, i) => {
      dot.classList.toggle('visited', state.visitedStations.has(i));
      dot.classList.toggle('current', i === state.currentStation);
      if (i === state.currentStation) {
        dot.style.borderColor = NPC_DATA[i].hexColor;
        dot.style.boxShadow = '0 0 8px ' + NPC_DATA[i].hexColor;
      } else {
        dot.style.boxShadow = 'none';
      }
    });
  }

  function setAudioState(playing) { audioBtn.textContent = playing ? '\u{1F50A} ON' : '\u{1F50A} OFF'; }
  function hideCta() { ctaDiv.style.display = 'none'; }
  function showCta() { ctaDiv.style.display = 'block'; }

  return { update, setAudioState, hideCta, showCta };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/hud.js src/styles/hud.css
git commit -m "feat: add HUD with title, progress, nav arrows, audio, CTA"
```

---

### Task 19: NPC Modal

**Files:**
- Create: `src/ui/modal.js`
- Create: `src/styles/modal.css`

- [ ] **Step 1: Create modal.css**

(Full CSS for modal styling — glitch animations, glass background, visual types for blueprint/ticker/combat/portal/faction/timeline. See spec for details.)

```css
#modal-layer {
  background: rgba(5, 5, 20, 0.92);
  padding: 40px 30px;
  font-family: 'Rajdhani', sans-serif;
}
#modal-layer.glitch-in { animation: modalGlitchIn 0.4s ease-out forwards; }
#modal-layer.glitch-out { animation: modalGlitchOut 0.3s ease-in forwards; }

.modal-close {
  position: absolute; top: 15px; right: 20px;
  background: none; border: none; color: rgba(255,255,255,0.6);
  font-size: 1.5rem; cursor: pointer;
}
.modal-close:hover { color: #fff; }

.modal-icon { width: 50px; height: 50px; border-radius: 50%; margin-bottom: 15px; }
.modal-npc-name {
  font-family: 'Orbitron', sans-serif; font-size: 1.6rem; font-weight: 700;
  letter-spacing: 0.1em; margin-bottom: 20px;
}
.modal-quote {
  font-style: italic; font-size: 1.05rem; line-height: 1.6;
  color: rgba(255,255,255,0.8); margin-bottom: 25px;
  padding-left: 15px; border-left: 2px solid currentColor;
}
.modal-features { list-style: none; padding: 0; margin-bottom: 30px; }
.modal-features li {
  padding: 8px 0 8px 20px; position: relative;
  font-size: 1rem; line-height: 1.4; color: rgba(255,255,255,0.9);
}
.modal-features li::before { content: '\25B8'; position: absolute; left: 0; }

.modal-visual { height: 120px; border-radius: 8px; overflow: hidden; position: relative; }

.visual-blueprint {
  background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,255,255,0.08) 19px, rgba(0,255,255,0.08) 20px),
    repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0,255,255,0.08) 19px, rgba(0,255,255,0.08) 20px);
}
.visual-blueprint::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(45deg, transparent 40%, rgba(0,255,255,0.1) 50%, transparent 60%);
  animation: blueprintSweep 3s linear infinite;
}

.visual-ticker {
  background: rgba(255,170,0,0.05); border: 1px solid rgba(255,170,0,0.2);
  display: flex; align-items: center; overflow: hidden;
}
.visual-ticker::after {
  content: '\u25C6 NEXIUM +12.4%  \u25C6 RIFT SHARDS -3.2%  \u25C6 VOID ESSENCE +8.7%  \u25C6 DATA CRYSTALS +15.1%  ';
  white-space: nowrap; color: rgba(255,170,0,0.6);
  font-family: 'Orbitron', monospace; font-size: 0.8rem;
  animation: tickerScroll 15s linear infinite;
}

.visual-combat {
  background: rgba(255,0,68,0.05); border: 1px solid rgba(255,0,68,0.2);
  display: flex; align-items: center; justify-content: center;
}
.visual-portal {
  background: rgba(68,136,255,0.05); border: 1px solid rgba(68,136,255,0.2);
  display: flex; align-items: center; justify-content: center;
}
.visual-portal::after {
  content: ''; width: 80px; height: 80px;
  border: 2px solid rgba(68,136,255,0.5); border-radius: 50%;
  animation: portalSpin 4s linear infinite;
  box-shadow: 0 0 20px rgba(68,136,255,0.3), inset 0 0 20px rgba(68,136,255,0.1);
}
.visual-faction {
  background: rgba(170,0,255,0.05); border: 1px solid rgba(170,0,255,0.2);
  display: flex; align-items: center; justify-content: center;
}
.visual-faction::after { content: '\u2B21'; font-size: 4rem; color: rgba(170,0,255,0.5); animation: factionPulse 2s ease-in-out infinite; }
.visual-timeline {
  background: rgba(0,255,170,0.05); border: 1px solid rgba(0,255,170,0.2);
  display: flex; align-items: center; padding: 0 20px;
}
.visual-timeline::after {
  content: ''; flex: 1; height: 2px;
  background: linear-gradient(90deg, rgba(0,255,170,0.8) 0%, rgba(0,255,170,0.8) 25%, rgba(0,255,170,0.3) 25%, rgba(0,255,170,0.3) 50%, rgba(0,255,170,0.1) 50%);
  box-shadow: 0 0 8px rgba(0,255,170,0.3);
}

@keyframes modalGlitchIn {
  0% { transform: translateX(100%) scaleX(0.8); opacity: 0; clip-path: inset(0 0 0 100%); }
  20% { transform: translateX(10px); opacity: 0.5; clip-path: inset(10% 0 20% 0); }
  40% { transform: translateX(-5px); opacity: 0.8; clip-path: inset(0 5% 0 0); }
  60% { transform: translateX(3px); opacity: 0.9; clip-path: inset(0); }
  100% { transform: translateX(0); opacity: 1; clip-path: inset(0); }
}
@keyframes modalGlitchOut {
  0% { transform: translateX(0); opacity: 1; clip-path: inset(0); }
  40% { transform: translateX(-5px); opacity: 0.8; clip-path: inset(20% 0 10% 0); }
  100% { transform: translateX(100%); opacity: 0; clip-path: inset(0 0 0 100%); }
}
@keyframes blueprintSweep { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes tickerScroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
@keyframes portalSpin { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }
@keyframes factionPulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0.8; } }
```

- [ ] **Step 2: Create modal.js**

```js
import '../styles/modal.css';
import { state, BLOOM_STATES } from '../state/gameState.js';
import { NPC_DATA } from '../npcs/npcData.js';

export function createModal(callbacks) {
  const layer = document.getElementById('modal-layer');
  const backdrop = document.getElementById('modal-backdrop');

  function open(npcIndex) {
    if (state.modalOpen) return;
    const npc = NPC_DATA[npcIndex];
    state.modalOpen = true;
    state.modalNpcIndex = npcIndex;
    Object.assign(state, BLOOM_STATES.modal);

    // Build modal content with safe DOM methods
    layer.textContent = '';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', close);
    layer.appendChild(closeBtn);

    const icon = document.createElement('div');
    icon.className = 'modal-icon';
    icon.style.background = npc.hexColor;
    icon.style.boxShadow = '0 0 15px ' + npc.hexColor;
    layer.appendChild(icon);

    const name = document.createElement('div');
    name.className = 'modal-npc-name';
    name.textContent = npc.name;
    name.style.color = npc.hexColor;
    name.style.textShadow = '0 0 10px ' + npc.hexColor;
    layer.appendChild(name);

    const quote = document.createElement('div');
    quote.className = 'modal-quote';
    quote.style.borderColor = npc.hexColor;
    quote.textContent = npc.quote;
    layer.appendChild(quote);

    const featureList = document.createElement('ul');
    featureList.className = 'modal-features';
    npc.features.forEach(f => {
      const li = document.createElement('li');
      li.textContent = f;
      featureList.appendChild(li);
    });
    layer.appendChild(featureList);

    const visual = document.createElement('div');
    visual.className = 'modal-visual visual-' + npc.visualType;
    layer.appendChild(visual);

    layer.style.display = 'block';
    layer.style.borderLeft = '1px solid ' + npc.hexColor;
    layer.style.boxShadow = '-5px 0 30px ' + npc.hexColor + '33';
    backdrop.style.display = 'block';

    layer.classList.remove('glitch-out');
    layer.classList.add('glitch-in');

    backdrop.addEventListener('click', close);
  }

  function close() {
    if (!state.modalOpen) return;
    layer.classList.remove('glitch-in');
    layer.classList.add('glitch-out');
    const closedIdx = state.modalNpcIndex;

    setTimeout(() => {
      layer.style.display = 'none';
      backdrop.style.display = 'none';
      layer.classList.remove('glitch-out');
      state.modalOpen = false;
      Object.assign(state, BLOOM_STATES.exploring);
      if (closedIdx === 5 && !state.finalCtaTriggered) {
        state.finalCtaTriggered = true;
        callbacks.onOracleFirstClose?.();
      }
      state.modalNpcIndex = -1;
      backdrop.removeEventListener('click', close);
    }, 300);
  }

  return { open, close };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/modal.js src/styles/modal.css
git commit -m "feat: add NPC modal with glitch animation and visual elements"
```

---

### Task 20: Interaction Prompt

**Files:**
- Create: `src/ui/interactionPrompt.js`

- [ ] **Step 1: Create interactionPrompt.js**

```js
import * as THREE from 'three';
import { state } from '../state/gameState.js';
import { NPC_DATA } from '../npcs/npcData.js';

export function createInteractionPrompt() {
  const el = document.getElementById('interaction-prompt');
  const inner = document.createElement('div');
  inner.style.cssText = 'background:rgba(0,0,0,0.7);padding:8px 16px;border-radius:4px;font-family:Rajdhani,sans-serif;font-size:0.85rem;letter-spacing:0.1em;white-space:nowrap;border:1px solid rgba(255,255,255,0.2);';
  inner.textContent = 'Click or press E to interact';
  el.appendChild(inner);
  el.style.display = 'none';
  const tempVec = new THREE.Vector3();

  function update(camera, npcPositions) {
    if (state.activeNpcIndex < 0 || state.modalOpen || state.isTransitioning) {
      el.style.display = 'none'; return;
    }
    const npcPos = npcPositions[state.activeNpcIndex];
    if (!npcPos) { el.style.display = 'none'; return; }

    tempVec.copy(npcPos); tempVec.y += 1.0;
    tempVec.project(camera);
    const x = Math.max(80, Math.min((tempVec.x * 0.5 + 0.5) * window.innerWidth, window.innerWidth - 80));
    const y = Math.max(30, Math.min((-tempVec.y * 0.5 + 0.5) * window.innerHeight, window.innerHeight - 30));

    el.style.display = 'block';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.transform = 'translate(-50%, -100%)';
    inner.style.borderColor = NPC_DATA[state.activeNpcIndex].hexColor;
  }

  return { update };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/interactionPrompt.js
git commit -m "feat: add interaction prompt with 3D-to-screen projection"
```

---

### Task 21: Final CTA Overlay

**Files:**
- Create: `src/ui/finalCta.js`
- Create: `src/styles/final-cta.css`

- [ ] **Step 1: Create final-cta.css**

```css
#final-cta-overlay {
  background: rgba(0,0,0,0.7); display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.8s ease;
}
#final-cta-overlay.visible { opacity: 1; }

.final-title {
  font-family: 'Orbitron', sans-serif; font-size: 4rem; font-weight: 900;
  letter-spacing: 0.3em; color: #fff;
  text-shadow: 0 0 30px #ff00ff, 0 0 60px #ff00ff55, 0 0 90px #00ffff33;
  margin-bottom: 10px; overflow: hidden;
}
.final-title span {
  display: inline-block; opacity: 0; transform: translateY(20px);
  animation: letterReveal 0.1s ease forwards;
}
.final-subtitle {
  font-family: 'Rajdhani', sans-serif; font-size: 1.3rem;
  color: rgba(255,255,255,0.6); letter-spacing: 0.2em; margin-bottom: 50px;
}
.final-cta-buttons { display: flex; gap: 20px; }
.final-cta-buttons a {
  display: block; padding: 20px 32px; background: rgba(10,10,30,0.8);
  border-radius: 8px; text-decoration: none; color: #fff;
  font-family: 'Orbitron', sans-serif; font-size: 0.85rem;
  letter-spacing: 0.1em; text-align: center; transition: all 0.3s; min-width: 200px;
}
.final-cta-buttons a:nth-child(1) { border: 1px solid #ff00ff; box-shadow: 0 0 15px rgba(255,0,255,0.2); }
.final-cta-buttons a:nth-child(1):hover { background: rgba(255,0,255,0.15); box-shadow: 0 0 30px rgba(255,0,255,0.4); }
.final-cta-buttons a:nth-child(2) { border: 1px solid #00ffff; box-shadow: 0 0 15px rgba(0,255,255,0.2); }
.final-cta-buttons a:nth-child(2):hover { background: rgba(0,255,255,0.15); box-shadow: 0 0 30px rgba(0,255,255,0.4); }
.final-cta-buttons a:nth-child(3) { border: 1px solid #00ffaa; box-shadow: 0 0 15px rgba(0,255,170,0.2); }
.final-cta-buttons a:nth-child(3):hover { background: rgba(0,255,170,0.15); box-shadow: 0 0 30px rgba(0,255,170,0.4); }

@keyframes letterReveal { to { opacity: 1; transform: translateY(0); } }
```

- [ ] **Step 2: Create finalCta.js**

```js
import '../styles/final-cta.css';
import { state, BLOOM_STATES } from '../state/gameState.js';

export function createFinalCta(callbacks) {
  const overlay = document.getElementById('final-cta-overlay');

  function show() {
    state.finalCtaShown = true;
    Object.assign(state, BLOOM_STATES.finalCta);
    callbacks.onShow?.();

    overlay.textContent = '';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'final-title';
    'ULTRA KINGDOMS'.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.style.animationDelay = (i * 0.08) + 's';
      span.textContent = char === ' ' ? '\u00A0' : char;
      titleDiv.appendChild(span);
    });
    overlay.appendChild(titleDiv);

    const subtitle = document.createElement('div');
    subtitle.className = 'final-subtitle';
    subtitle.textContent = 'THE MULTIVERSE AWAITS';
    overlay.appendChild(subtitle);

    const btns = document.createElement('div');
    btns.className = 'final-cta-buttons';
    ['WISHLIST ON STEAM', 'JOIN DISCORD', 'SIGN UP FOR BETA'].forEach(text => {
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = text;
      btns.appendChild(a);
    });
    overlay.appendChild(btns);

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('visible'));
    overlay.addEventListener('click', handleDismiss);
  }

  function handleDismiss(e) {
    if (e.target.closest('.final-cta-buttons a')) return;
    dismiss();
  }

  function dismiss() {
    overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.style.display = 'none';
      state.finalCtaShown = false;
      Object.assign(state, BLOOM_STATES.exploring);
      callbacks.onDismiss?.();
      overlay.removeEventListener('click', handleDismiss);
    }, 800);
  }

  return { show, dismiss };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/finalCta.js src/styles/final-cta.css
git commit -m "feat: add final CTA overlay with letter reveal"
```

---

### Task 22: Audio Manager

**Files:**
- Create: `src/audio/audioManager.js`

- [ ] **Step 1: Create audioManager.js**

```js
import { state } from '../state/gameState.js';

export function createAudioManager() {
  let ctx = null, source = null;

  function toggle() {
    if (!state.audioLoaded) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const gain = ctx.createGain();
        gain.gain.value = 0.1;
        gain.connect(ctx.destination);

        // Placeholder ambient drone (replace with real MP3 later)
        const osc = ctx.createOscillator();
        osc.type = 'sine'; osc.frequency.value = 80;
        osc.connect(gain); osc.start();
        source = osc;

        state.audioLoaded = true;
        state.audioPlaying = true;
      } catch (e) { console.warn('Audio failed:', e); }
      return;
    }

    if (state.audioPlaying) { ctx.suspend(); state.audioPlaying = false; }
    else { ctx.resume(); state.audioPlaying = true; }
  }

  return { toggle };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/audio/audioManager.js
git commit -m "feat: add lazy audio manager with placeholder drone"
```

---

### Task 23: Fallback Page

**Files:**
- Create: `src/ui/fallback.js`
- Create: `src/styles/fallback.css`

- [ ] **Step 1: Create fallback.css**

```css
#fallback-page {
  background: linear-gradient(135deg, #000, #0a0020, #000);
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 40px 20px; text-align: center;
}
.fallback-logo {
  font-family: 'Orbitron', sans-serif; font-size: 2.5rem; font-weight: 900;
  letter-spacing: 0.3em; color: #fff;
  text-shadow: 0 0 20px #ff00ff, 0 0 40px #ff00ff55; margin-bottom: 10px;
}
.fallback-tagline { color: rgba(255,255,255,0.6); font-size: 1.1rem; letter-spacing: 0.15em; margin-bottom: 40px; }
.fallback-features {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px; max-width: 800px; margin-bottom: 40px;
}
.fallback-card {
  padding: 20px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
}
.fallback-card h3 { font-family: 'Orbitron', sans-serif; font-size: 0.9rem; margin-bottom: 8px; }
.fallback-card p { font-size: 0.85rem; color: rgba(255,255,255,0.7); line-height: 1.4; }
.fallback-ctas { display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; }
.fallback-ctas a {
  padding: 12px 24px; border: 1px solid #ff00ff; border-radius: 4px;
  color: #fff; text-decoration: none; font-family: 'Orbitron', sans-serif;
  font-size: 0.8rem; letter-spacing: 0.1em; transition: background 0.3s;
}
.fallback-ctas a:hover { background: rgba(255,0,255,0.2); }
.fallback-note { margin-top: 30px; font-size: 0.8rem; color: rgba(255,255,255,0.4); }
```

- [ ] **Step 2: Create fallback.js**

```js
import '../styles/fallback.css';

const FEATURES = [
  { title: 'INFINITE REALMS', color: '#00ffff', desc: 'Explore procedurally generated dimensions, each with unique biomes and physics.' },
  { title: 'PLAYER ECONOMY', color: '#ffaa00', desc: 'Trade across realms, craft legendary gear, and build your merchant empire.' },
  { title: 'EPIC COMBAT', color: '#ff0044', desc: 'Skill-based PvP with deep customization. From duels to 50v50 realm sieges.' },
  { title: 'FACTION WARS', color: '#aa00ff', desc: 'Form syndicates, control territory, and shape the political landscape.' },
];

export function showFallback(reason) {
  const page = document.getElementById('fallback-page');
  page.style.display = 'flex';
  document.getElementById('canvas-container').style.display = 'none';
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('hud-layer').style.display = 'none';

  const logo = document.createElement('div');
  logo.className = 'fallback-logo';
  logo.textContent = 'ULTRA KINGDOMS';
  page.appendChild(logo);

  const tagline = document.createElement('div');
  tagline.className = 'fallback-tagline';
  tagline.textContent = 'ENTER THE MULTIVERSE';
  page.appendChild(tagline);

  const grid = document.createElement('div');
  grid.className = 'fallback-features';
  FEATURES.forEach(f => {
    const card = document.createElement('div');
    card.className = 'fallback-card';
    const h3 = document.createElement('h3');
    h3.textContent = f.title;
    h3.style.color = f.color;
    const p = document.createElement('p');
    p.textContent = f.desc;
    card.appendChild(h3);
    card.appendChild(p);
    grid.appendChild(card);
  });
  page.appendChild(grid);

  const ctas = document.createElement('div');
  ctas.className = 'fallback-ctas';
  ['WISHLIST ON STEAM', 'JOIN DISCORD', 'SIGN UP FOR BETA'].forEach(text => {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = text;
    ctas.appendChild(a);
  });
  page.appendChild(ctas);

  const note = document.createElement('div');
  note.className = 'fallback-note';
  note.textContent = reason === 'mobile'
    ? 'Visit on a desktop browser for the full 3D experience.'
    : 'Your browser does not support WebGL. Try Chrome, Firefox, or Edge.';
  page.appendChild(note);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/fallback.js src/styles/fallback.css
git commit -m "feat: add mobile/no-WebGL fallback page"
```

---

## Chunk 4: Main Integration

### Task 24: Wire Everything in main.js

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Rewrite main.js with full integration**

```js
import './styles/main.css';
import * as THREE from 'three';
import { createScene } from './scene/createScene.js';
import { createPostProcessing } from './scene/postProcessing.js';
import { createBuildings } from './scene/buildings.js';
import { createGround } from './scene/ground.js';
import { createPortals } from './scene/portals.js';
import { createNeonSigns } from './scene/neonSigns.js';
import { createBillboards } from './scene/billboards.js';
import { createRain } from './scene/particles/rain.js';
import { createSplash } from './scene/particles/splash.js';
import { createSplinePath } from './rail/splinePath.js';
import { createCameraRail } from './rail/cameraRail.js';
import { createNpcManager } from './npcs/npcManager.js';
import { createStationProps } from './npcs/stationProps.js';
import { NPC_DATA } from './npcs/npcData.js';
import { createInputHandler } from './controls/inputHandler.js';
import { createLoadingScreen } from './ui/loading.js';
import { createHud } from './ui/hud.js';
import { createModal } from './ui/modal.js';
import { createInteractionPrompt } from './ui/interactionPrompt.js';
import { createFinalCta } from './ui/finalCta.js';
import { createAudioManager } from './audio/audioManager.js';
import { showFallback } from './ui/fallback.js';
import { state } from './state/gameState.js';

function isMobile() {
  return window.innerWidth < 1024 || 'ontouchstart' in window;
}

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

function init() {
  if (isMobile()) { showFallback('mobile'); return; }
  if (!supportsWebGL()) { showFallback('webgl'); return; }

  const loading = createLoadingScreen();
  loading.setProgress(0);

  const container = document.getElementById('canvas-container');
  const { renderer, scene, camera, clock } = createScene(container);
  loading.setProgress(0.1);

  const postFx = createPostProcessing(renderer, scene, camera);
  loading.setProgress(0.15);

  const spline = createSplinePath();
  loading.setProgress(0.2);

  const buildings = createBuildings(scene);
  loading.setProgress(0.3);

  const ground = createGround(scene, renderer);
  loading.setProgress(0.4);

  const portals = createPortals(scene, spline);
  loading.setProgress(0.5);

  createNeonSigns(scene);
  const billboards = createBillboards(scene);
  loading.setProgress(0.6);

  const rain = createRain(scene);
  const splash = createSplash(scene);
  loading.setProgress(0.7);

  const npcManager = createNpcManager(scene, spline);
  createStationProps(scene, npcManager.npcPositions);
  loading.setProgress(0.8);

  const cameraRail = createCameraRail(camera, spline, npcManager.npcPositions);
  loading.setProgress(0.9);

  ground.initialCapture();
  state._npcHexColors = NPC_DATA.map(n => n.hexColor);

  const raycaster = new THREE.Raycaster();
  const clickMouse = new THREE.Vector2();

  const audio = createAudioManager();
  const prompt = createInteractionPrompt();
  const modal = createModal({ onOracleFirstClose: () => finalCta.show() });
  const finalCta = createFinalCta({
    onShow: () => { hud.hideCta(); portals.setSyncPulse(true); },
    onDismiss: () => { hud.showCta(); portals.setSyncPulse(false); },
  });
  const hud = createHud({
    onNext: () => cameraRail.nextStation(),
    onPrev: () => cameraRail.prevStation(),
    onAudioToggle: () => { audio.toggle(); hud.setAudioState(state.audioPlaying); },
  });

  createInputHandler({
    onNext: () => cameraRail.nextStation(),
    onPrev: () => cameraRail.prevStation(),
    onInteract: (i) => modal.open(i),
    onCloseModal: () => modal.close(),
    onDismissFinalCta: () => finalCta.dismiss(),
  });

  renderer.domElement.addEventListener('click', (e) => {
    if (state.modalOpen || state.finalCtaShown) return;
    clickMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    clickMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(clickMouse, camera);
    const hits = raycaster.intersectObjects(npcManager.hitSpheres, false);
    if (hits.length > 0) {
      const idx = hits[0].object.userData.npcIndex;
      if (idx !== undefined && state.activeNpcIndex === idx) modal.open(idx);
    }
  });

  window.addEventListener('resize', () => postFx.onResize());
  state.visitedStations.add(0);
  loading.setProgress(1.0);

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.getElapsedTime();

    cameraRail.update(dt);
    state._cameraPosition = camera.position.clone();
    npcManager.update(time, dt, cameraRail.getCurrentT());
    buildings.update(time);
    billboards.update(time);
    portals.update(time);
    rain.update(dt);
    splash.update(dt);
    splash.spawnNearCamera(camera.position);

    if (!state.isTransitioning && state._lastEnvStation !== state.currentStation) {
      ground.updateEnvMap(camera.position);
      state._lastEnvStation = state.currentStation;
    }

    prompt.update(camera, npcManager.npcPositions);
    hud.update();
    postFx.updateBloom(dt);
    postFx.composer.render();
  }

  animate();
  loading.fadeOut().then(() => { state.sceneReady = true; });
}

init();
```

- [ ] **Step 2: Run dev server and verify full experience**

Run: `npm run dev`
Expected: Full 3D scene with rain, buildings, portals, NPCs. Arrow keys navigate. Click/E interacts with NPCs. Modals slide in with glitch animation. Oracle triggers final CTA.

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "feat: integrate all systems in main.js — full experience working"
```

---

### Task 25: Gitignore and Build Verification

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore**

```
node_modules/
dist/
.superpowers/
*.log
```

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: `dist/` directory created with bundled assets.

- [ ] **Step 3: Preview production build**

Run: `npm run preview`
Expected: Production build works identically to dev.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore and verify production build"
```
