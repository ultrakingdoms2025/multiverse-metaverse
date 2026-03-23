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
