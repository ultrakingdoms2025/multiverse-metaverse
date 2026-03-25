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
// import { createInteractionPrompt } from './ui/interactionPrompt.js';
import { createFinalCta } from './ui/finalCta.js';
import { createAudioManager } from './audio/audioManager.js';
import { showFallback } from './ui/fallback.js';
import { state, STATION_COUNT } from './state/gameState.js';
import { createStatsPanel } from './ui/statsPanel.js';
import { createMinimap } from './ui/minimap.js';
import { createSocialPanel } from './ui/socialPanel.js';
import { createAccessibilityPanel } from './ui/accessibility.js';

function isMobile() {
  // Only check viewport width — 'ontouchstart' is true on touch-enabled Windows desktops
  const isSmallScreen = window.innerWidth < 1024;
  const isActualMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isSmallScreen || isActualMobile;
}

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

function init() {
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

  const buildings = createBuildings(scene, spline);
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

  // Floor logo at the start of the road
  const logoTexture = new THREE.TextureLoader().load('/uklogo.png');
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  const logoMat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: logoTexture } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D uTex; varying vec2 vUv;
      void main() {
        vec4 c = texture2D(uTex, vUv);
        if (c.a < 0.1) discard;
        // White to gray — keeps the original logo but avoids glare
        float brightness = (c.r + c.g + c.b) / 3.0;
        vec3 col = brightness > 0.7 ? vec3(0.55) : c.rgb;
        gl_FragColor = vec4(col, c.a);
      }
    `,
    transparent: true, depthWrite: false,
  });
  const baseLogoWidth = 7;
  const baseLogoHeight = 2;
  const baseAspect = 16 / 9;
  function getLogoScale() {
    const aspect = window.innerWidth / window.innerHeight;
    return aspect / baseAspect;
  }
  const floorLogo = new THREE.Mesh(new THREE.PlaneGeometry(baseLogoWidth, baseLogoHeight), logoMat);
  floorLogo.rotation.x = -Math.PI / 2;
  floorLogo.rotation.z = Math.PI;
  // Rotate 35 degrees left from the camera approach
  floorLogo.rotation.z -= THREE.MathUtils.degToRad(19.48);
  floorLogo.position.set(-1.5, 0.01, 0);
  const s = getLogoScale();
  floorLogo.scale.set(s, s, s);
  scene.add(floorLogo);

  const raycaster = new THREE.Raycaster();
  raycaster.far = 200;
  const clickMouse = new THREE.Vector2();

  const audio = createAudioManager();
  const statsPanel = createStatsPanel();
  const minimap = createMinimap(spline, (i) => cameraRail.goToStation(i));
  const socialPanel = createSocialPanel();
  const a11y = createAccessibilityPanel();
  // const prompt = createInteractionPrompt();
  const modal = createModal({ onOracleFirstClose: () => finalCta.show() });
  const finalCta = createFinalCta({
    onShow: () => { hud.hideCta(); portals.setSyncPulse(true); },
    onDismiss: () => { hud.showCta(); portals.setSyncPulse(false); },
  });
  const hud = createHud({
    onNext: () => cameraRail.nextStation(),
    onPrev: () => cameraRail.prevStation(),
    onGoTo: (i) => cameraRail.goToStation(i),
    onAudioToggle: () => { audio.toggle(); hud.setAudioState(state.audioPlaying); },
    onVolumeChange: (v) => { audio.setVolume(v); },
  });

  createInputHandler({
    onNext: () => cameraRail.nextStation(),
    onPrev: () => cameraRail.prevStation(),
    onInteract: (i) => modal.open(i),
    onCloseModal: () => modal.close(),
    onDismissFinalCta: () => finalCta.dismiss(),
  });

  // Portal video modals — one per portal for independent customization
  const portalNames = ['The Architect\'s Realm', 'The Broker\'s Market', 'The Warden\'s Fortress', 'The Navigator\'s Voyage', 'The Syndicate\'s Underworld', 'The Oracle\'s Vision'];
  const portalDescs = [
    'You peer through the shimmering portal and glimpse the Architect\u2019s domain\u2026 a world of infinite blueprints. A Multiverse known as Ultra Kingdoms',
    'Beyond the golden shimmer lies the Broker\u2019s endless platforms and marketplaces\u2026 where anything has a price, and everyone can profit.',
    'Through the crimson veil you see the Warden\u2019s iron fortress\u2026 where order is absolute. Child protections, AI safety controls are just the beginning',
    'The blue gateway reveals the Navigator\u2019s star charts\u2026 mapping paths through the multiverse.',
    'Purple shadows swirl revealing the Syndicate\u2019s hidden network\u2026 power flows in the darkness.',
    'Emerald light pulses as the Oracle\u2019s visions unfold\u2026 the future is taking shape.',
  ];
  const portalHexColors = ['#00ffff', '#ffaa00', '#ff0044', '#4488ff', '#aa00ff', '#00ffaa'];
  const portalVideoSources = ['/overlay.mp4', '/broker.mp4', '/warden.mp4', '/overlay.mp4', '/overlay.mp4', '/overlay.mp4'];

  const portalModals = [];
  const portalVids = [];

  // Shared backdrop
  const portalBackdrop = document.createElement('div');
  portalBackdrop.style.cssText = 'display:none;position:fixed;inset:0;z-index:19;background:rgba(0,0,0,0.5);';
  document.body.appendChild(portalBackdrop);

  function closePortalModal() {
    portalModals.forEach(m => m.style.display = 'none');
    portalBackdrop.style.display = 'none';
    state.modalOpen = false;
  }
  portalBackdrop.addEventListener('click', closePortalModal);

  for (let pi = 0; pi < portalNames.length; pi++) {
    const color = portalHexColors[pi];
    const pm = document.createElement('div');
    pm.setAttribute('data-portal-modal', '');
    pm.style.cssText = `display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:20;background:rgba(0,10,20,0.85);border:1px solid ${color};border-radius:12px;padding:24px;max-width:500px;width:90%;box-shadow:0 0 40px ${color}44,inset 0 0 20px ${color}0d;backdrop-filter:blur(10px);`;
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '\u00D7';
    closeBtn.style.cssText = `position:absolute;top:8px;right:12px;background:none;border:none;color:${color};font-size:24px;cursor:pointer;`;
    closeBtn.addEventListener('click', closePortalModal);
    pm.appendChild(closeBtn);
    const title = document.createElement('h2');
    title.textContent = portalNames[pi];
    title.style.cssText = `margin:0 0 12px;color:${color};font-family:monospace;font-size:20px;text-shadow:0 0 10px ${color};`;
    pm.appendChild(title);
    const desc = document.createElement('p');
    desc.textContent = portalDescs[pi];
    desc.style.cssText = 'margin:0 0 16px;color:#ccc;font-family:monospace;font-size:14px;line-height:1.6;';
    pm.appendChild(desc);
    const vid = document.createElement('video');
    vid.src = portalVideoSources[pi];
    vid.autoplay = true; vid.loop = true; vid.muted = true; vid.playsInline = true;
    vid.style.cssText = `width:100%;border-radius:8px;border:1px solid ${color}55;`;
    pm.appendChild(vid);
    document.body.appendChild(pm);
    portalModals.push(pm);
    portalVids.push(vid);
  }

  function openPortalModal(index) {
    if (index < 0 || index >= portalModals.length) return;
    state.modalOpen = true;
    portalModals[index].style.display = 'block';
    portalBackdrop.style.display = 'block';
    portalVids[index].play();
  }

  renderer.domElement.addEventListener('click', (e) => {
    if (state.modalOpen || state.finalCtaShown) return;
    clickMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    clickMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(clickMouse, camera);

    // Check portal video fills first
    const portalHits = raycaster.intersectObjects(portals.clickableFills, false);
    if (portalHits.length > 0 && portalHits[0].object.userData.portalVideo) {
      openPortalModal(portalHits[0].object.userData.portalIndex);
      return;
    }

    // Then check NPCs
    const hits = raycaster.intersectObjects(npcManager.hitSpheres, false);
    if (hits.length > 0) {
      const idx = hits[0].object.userData.npcIndex;
      if (idx !== undefined && idx !== 6) modal.open(idx);
    }
  });

  // End-of-road logo overlay
  const endLogo = document.createElement('div');
  endLogo.id = 'end-logo';
  endLogo.style.cssText = 'position:fixed;inset:0;z-index:12;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity 0.8s ease;background:#000;';
  const endLogoImg = document.createElement('img');
  endLogoImg.src = '/uklogo.png';
  endLogoImg.style.cssText = 'max-width:50%;max-height:40%;filter:drop-shadow(0 0 30px rgba(255,170,0,0.6)) drop-shadow(0 0 60px rgba(255,170,0,0.3));border-radius:8px;';
  endLogo.appendChild(endLogoImg);
  document.body.appendChild(endLogo);

  window.addEventListener('resize', () => {
    postFx.onResize();
    const ls = getLogoScale();
    floorLogo.scale.set(ls, ls, ls);
  });
  state.visitedStations.add(0);
  loading.setProgress(1.0);

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.getElapsedTime();

    cameraRail.update(dt);
    state._cameraPosition = camera.position.clone();

    // Hover detection for NPCs and portals
    if (!state.modalOpen) {
      const hoverMouse = new THREE.Vector2(state.mouse.x, state.mouse.y);
      raycaster.setFromCamera(hoverMouse, camera);

      // Check portals
      const portalHoverHits = raycaster.intersectObjects(portals.clickableFills, false);
      if (portalHoverHits.length > 0 && portalHoverHits[0].object.userData.portalVideo) {
        portals.setHovered(portalHoverHits[0].object.userData.portalIndex);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        portals.setHovered(-1);
      }

      // Check NPCs
      const hoverHits = raycaster.intersectObjects(npcManager.hitSpheres, false);
      if (hoverHits.length > 0) {
        const idx = hoverHits[0].object.userData.npcIndex;
        npcManager.setHovered(idx);
        renderer.domElement.style.cursor = 'pointer';
      } else if (!(portalHoverHits.length > 0)) {
        npcManager.setHovered(-1);
        renderer.domElement.style.cursor = 'default';
      } else {
        npcManager.setHovered(-1);
      }
    }

    npcManager.update(time, dt, cameraRail.getCurrentT());
    buildings.update(time);
    billboards.update(time);
    portals.update(time);
    rain.update(dt);
    splash.update(dt);
    splash.spawnNearCamera(camera.position);

    ground.update(time);
    if (!state.isTransitioning && state._lastEnvStation !== state.currentStation) {
      ground.updateEnvMap(camera.position);
      state._lastEnvStation = state.currentStation;
    }

    minimap.update(cameraRail.getCurrentT());

    // Show logo at last station
    const atEnd = state.currentStation === STATION_COUNT - 1 && !state.isTransitioning;
    endLogo.style.opacity = atEnd ? '1' : '0';

    hud.update();
    postFx.updateBloom(dt);
    postFx.composer.render();
  }

  animate();
  loading.fadeOut().then(() => { state.sceneReady = true; });
}

init();
