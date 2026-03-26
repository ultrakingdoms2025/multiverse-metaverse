const BASE = import.meta.env.BASE_URL;
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
import { createStarfield } from './scene/starfield.js';
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

  const starfield = createStarfield(scene);
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
  const logoTexture = new THREE.TextureLoader().load(`${BASE}uklogo.png`);
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
    onAudioToggle: () => { audio.toggle((playing) => hud.setAudioState(playing)); hud.setAudioState(state.audioPlaying); },
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
  const portalVideoSources = [`${BASE}overlay.mp4`, `${BASE}broker.mp4`, `${BASE}warden.mp4`, `${BASE}navigator.mp4`, `${BASE}overlay.mp4`, `${BASE}overlay.mp4`];

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

  // End-of-road logo + poem overlay
  const endLogo = document.createElement('div');
  endLogo.id = 'end-logo';
  endLogo.style.cssText = 'position:fixed;inset:0;z-index:12;display:flex;flex-direction:column;align-items:center;pointer-events:none;opacity:0;transition:opacity 0.8s ease;background:#000;overflow:hidden;';

  const endLogoImg = document.createElement('img');
  endLogoImg.src = `${BASE}uklogo.png`;
  endLogoImg.style.cssText = 'max-width:50%;max-height:40%;filter:drop-shadow(0 0 30px rgba(255,170,0,0.6)) drop-shadow(0 0 60px rgba(255,170,0,0.3));border-radius:8px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transition:top 2s ease,max-width 1.5s ease,max-height 1.5s ease;';
  endLogo.appendChild(endLogoImg);

  const poemContainer = document.createElement('div');
  poemContainer.style.cssText = 'position:absolute;top:22%;left:50%;transform:translateX(-50%);width:80%;max-width:700px;max-height:72%;opacity:0;transition:opacity 1s ease;text-align:center;overflow-y:auto;scrollbar-width:none;pointer-events:auto;';
  poemContainer.addEventListener('wheel', (e) => { e.stopPropagation(); }, { passive: true });

  // Side icons flanking the poem
  const sideIconsData = [
    { icon: '\u{1F30C}', label: 'Multiverse', side: 'left' },
    { icon: '\u{1F517}', label: 'Interoperable', side: 'left' },
    { icon: '\u{1F3A8}', label: 'Creator\nEconomy', side: 'left' },
    { icon: '\u{1F4BB}', label: 'Cross\nPlatform', side: 'left' },
    { icon: '\u{1F4E6}', label: 'Asset\nPortability', side: 'left' },
    { icon: '\u{1F310}', label: 'Open\nPlatform', side: 'right' },
    { icon: '\u{1F3AE}', label: 'Ever\nExpanding\nGames', side: 'right' },
    { icon: '\u{1F3D7}', label: 'Land\nOwnership', side: 'right' },
    { icon: '\u{1F4B0}', label: 'Player-Driven\nEconomies', side: 'right' },
    { icon: '\u{1F504}', label: 'Web2 &\nWeb3', side: 'right' },
  ];

  const leftIcons = document.createElement('div');
  leftIcons.style.cssText = 'position:absolute;top:25%;left:50%;margin-left:-420px;display:flex;flex-direction:column;gap:28px;align-items:center;pointer-events:none;opacity:0;transition:opacity 1.5s ease;';

  const rightIcons = document.createElement('div');
  rightIcons.style.cssText = 'position:absolute;top:25%;left:50%;margin-left:390px;display:flex;flex-direction:column;gap:28px;align-items:center;pointer-events:none;opacity:0;transition:opacity 1.5s ease;';

  sideIconsData.forEach((item, idx) => {
    const container = item.side === 'left' ? leftIcons : rightIcons;
    const el = document.createElement('div');
    el.setAttribute('data-side-icon', '');
    el.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;opacity:0;transform:translateY(10px);transition:opacity 0.8s ease,transform 0.8s ease;';
    el.style.transitionDelay = (idx * 0.3 + 0.5) + 's';

    const iconEl = document.createElement('div');
    iconEl.className = 'side-icon-emoji';
    iconEl.textContent = item.icon;
    iconEl.style.cssText = 'font-size:32px;filter:drop-shadow(0 0 8px rgba(255,170,0,0.4));';
    el.appendChild(iconEl);

    const labelEl = document.createElement('div');
    labelEl.className = 'side-icon-label';
    labelEl.textContent = item.label;
    labelEl.style.cssText = 'font-size:10px;color:rgba(255,200,100,0.6);font-family:monospace;letter-spacing:1px;text-align:center;text-transform:uppercase;white-space:pre-line;line-height:1.3;';
    el.appendChild(labelEl);

    const line = document.createElement('div');
    line.style.cssText = 'width:1px;height:20px;background:rgba(255,200,100,0.15);';
    el.appendChild(line);

    container.appendChild(el);
  });

  endLogo.appendChild(leftIcons);
  endLogo.appendChild(rightIcons);

  // Scroll indicators — positioned just right of poem text
  const scrollIndicators = document.createElement('div');
  scrollIndicators.style.cssText = 'position:absolute;top:22%;left:50%;margin-left:300px;height:72%;display:flex;flex-direction:column;justify-content:space-between;align-items:center;pointer-events:none;opacity:0;transition:opacity 1s ease;';

  const upArrow = document.createElement('div');
  upArrow.style.cssText = 'color:rgba(255,200,100,0.4);font-size:20px;animation:scrollBounceUp 1.5s ease-in-out infinite;';
  upArrow.textContent = '\u25B2';

  const scrollLine = document.createElement('div');
  scrollLine.style.cssText = 'flex:1;width:1px;background:linear-gradient(to bottom,rgba(255,200,100,0.3),rgba(255,200,100,0.1),rgba(255,200,100,0.3));margin:8px 0;';

  const scrollLabel = document.createElement('div');
  scrollLabel.style.cssText = 'color:rgba(255,200,100,0.3);font-size:9px;font-family:monospace;letter-spacing:2px;writing-mode:vertical-rl;text-orientation:mixed;';
  scrollLabel.textContent = 'SCROLL';

  const downArrow = document.createElement('div');
  downArrow.style.cssText = 'color:rgba(255,200,100,0.4);font-size:20px;animation:scrollBounceDown 1.5s ease-in-out infinite;';
  downArrow.textContent = '\u25BC';

  scrollIndicators.appendChild(upArrow);
  scrollIndicators.appendChild(scrollLine);
  scrollIndicators.appendChild(scrollLabel);
  scrollIndicators.appendChild(downArrow);
  endLogo.appendChild(scrollIndicators);

  // Add bounce animations
  const bounceStyle = document.createElement('style');
  bounceStyle.textContent = '@keyframes scrollBounceUp{0%,100%{transform:translateY(0);opacity:0.4;}50%{transform:translateY(-5px);opacity:0.8;}}@keyframes scrollBounceDown{0%,100%{transform:translateY(0);opacity:0.4;}50%{transform:translateY(5px);opacity:0.8;}}';
  document.head.appendChild(bounceStyle);

  // Scale end screen elements when accessibility font size changes
  a11y.onFontChange((scale) => {
    poemText.style.fontSize = (18 * scale) + 'px';
    endLogo.querySelectorAll('[data-side-icon]').forEach(el => {
      el.querySelector('.side-icon-emoji').style.fontSize = (32 * scale) + 'px';
      el.querySelector('.side-icon-label').style.fontSize = (10 * scale) + 'px';
    });
  });
  const poemText = document.createElement('div');
  poemText.style.cssText = 'font-family:Georgia,\"Times New Roman\",serif;font-size:18px;color:rgba(255,200,100,0.9);line-height:2;letter-spacing:0.5px;text-shadow:0 0 15px rgba(255,170,0,0.3);white-space:pre-wrap;';
  poemContainer.appendChild(poemText);
  endLogo.appendChild(poemContainer);

  document.body.appendChild(endLogo);

  const poemLines = [
    'UltraKingdoms: Rise of the Infinite Realms',
    '',
    'Step into the portal where universes collide,',
    'UltraKingdoms awakens \u2014 the Multiverse Metaverse wide!',
    'A boundless expanse where realities entwine,',
    'Creator-owned kingdoms, every world truly thine.',
    '',
    'Here everyone wins in this player-driven dream,',
    'Open economies flow like a limitless stream.',
    'Trade, build, and thrive \u2014 true ownership is key,',
    'Your assets, your glory, forever set free.',
    '',
    'Interoperable worlds, avatars, and gear,',
    'Carry your inventory from realm to realm without fear.',
    'Jump between kingdoms, seamless and grand,',
    'Your progress follows across the digital land.',
    '',
    'Every game genre explodes in delight \u2014',
    'RPG quests, FPS battles that ignite,',
    'MMO alliances in epic-scale war,',
    'Fantasy realms, medieval castles, and more.',
    '',
    'Fantasy sports, live sports events so bold,',
    'Adventures and missions in stories untold.',
    'Every game style finds its perfect home,',
    'Low poly charm or high poly throne,',
    'Stunning 3D vistas or virtual worlds anew,',
    'All rendered with power, all waiting for you.',
    '',
    'Cross every platform, no borders in sight \u2014',
    'Xbox and PS5 shining so bright,',
    'PC and Mac, Android, iOS too,',
    'Steam and beyond \u2014 the choice belongs to you.',
    '',
    'From towering spires to mystical shores,',
    'Creators and players unlock infinite doors.',
    'UltraKingdoms unites us, the future unfurled,',
    'A metaverse multiverse \u2014 for the dreamers of the world!',
    '',
    'Forge your legend, claim your crown today,',
    'In UltraKingdoms, the multiverse is here to stay.',
  ];

  let endSequenceStarted = false;
  let poemTypingActive = false;

  function startEndSequence() {
    if (endSequenceStarted) return;
    endSequenceStarted = true;

    // Phase 1: Logo rises to top
    setTimeout(() => {
      endLogoImg.style.top = '8%';
      endLogoImg.style.maxWidth = '30%';
      endLogoImg.style.maxHeight = '15%';
    }, 1500);

    // Phase 2: Poem starts typing
    setTimeout(() => {
      poemContainer.style.opacity = '1';
      scrollIndicators.style.opacity = '1';
      leftIcons.style.opacity = '1';
      rightIcons.style.opacity = '1';
      // Trigger staggered icon animations
      leftIcons.querySelectorAll('div > div').forEach(el => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
      rightIcons.querySelectorAll('div > div').forEach(el => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
      poemTypingActive = true;
      typePoem();
    }, 3500);
  }

  function typePoem() {
    let lineIdx = 0;
    let charIdx = 0;
    let currentText = '';

    function typeNext() {
      if (!poemTypingActive) return;
      if (lineIdx >= poemLines.length) return;

      const line = poemLines[lineIdx];

      if (line === '') {
        currentText += '\n\n';
        poemText.textContent = currentText;
        lineIdx++;
        setTimeout(typeNext, 400);
        return;
      }

      if (charIdx < line.length) {
        currentText += line[charIdx];
        poemText.textContent = currentText;
        charIdx++;
        // Title line types slower
        const speed = lineIdx === 0 ? 45 : 22;
        setTimeout(typeNext, speed);
      } else {
        currentText += '\n';
        poemText.textContent = currentText;
        lineIdx++;
        charIdx = 0;
        setTimeout(typeNext, 200);
      }

      // Auto-scroll poem container if content overflows
      poemContainer.scrollTop = poemContainer.scrollHeight;
    }

    typeNext();
  }

  function resetEndSequence() {
    endSequenceStarted = false;
    poemTypingActive = false;
    endLogoImg.style.top = '50%';
    endLogoImg.style.maxWidth = '50%';
    endLogoImg.style.maxHeight = '40%';
    poemContainer.style.opacity = '0';
    scrollIndicators.style.opacity = '0';
    leftIcons.style.opacity = '0';
    rightIcons.style.opacity = '0';
    leftIcons.querySelectorAll('div > div').forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; });
    rightIcons.querySelectorAll('div > div').forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; });
    poemText.textContent = '';
  }

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
    starfield.update(time);
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

    // Show logo + poem at last station, hide HUD
    const atEnd = state.currentStation === STATION_COUNT - 1 && !state.isTransitioning;
    endLogo.style.opacity = atEnd ? '1' : '0';
    endLogo.style.display = atEnd ? 'flex' : 'none';
    const hudLayer = document.getElementById('hud-layer');
    hudLayer.style.opacity = atEnd ? '0' : '1';
    hudLayer.style.visibility = atEnd ? 'hidden' : 'visible';
    if (atEnd) {
      startEndSequence();
    } else if (endSequenceStarted) {
      resetEndSequence();
    }

    hud.update();
    postFx.updateBloom(dt);
    postFx.composer.render();
  }

  animate();
  loading.fadeOut().then(() => { state.sceneReady = true; });
}

init();
