import * as THREE from 'three';
import { NPC_DATA } from './npcData.js';
import { createNpcMesh } from './npcMesh.js';
import { state, STATION_T_VALUES } from '../state/gameState.js';
import { getActiveStation } from '../rail/stations.js';

export function createNpcManager(scene, spline) {
  const npcs = [], npcPositions = [], hitSpheres = [];
  NPC_DATA.forEach((data, i) => {
    const t = STATION_T_VALUES[i];
    // Place all NPCs slightly ahead so they're visible from the camera stop point
    const npcT = Math.min(t + 0.04, 1.0);
    const pos = spline.getPointAt(npcT);
    const tangent = spline.getTangentAt(npcT);
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const npcPos = pos.clone().add(side.multiplyScalar(3));
    npcPos.y = 0;
    const { group, material, hitSphere } = createNpcMesh(data);
    group.position.copy(npcPos); scene.add(group);
    const orbitCount = 10;
    const orbitPositions = new Float32Array(orbitCount * 3);
    const orbitGeo = new THREE.BufferGeometry();
    orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
    const orbitPts = new THREE.Points(orbitGeo, new THREE.PointsMaterial({
      color: data.color, size: 0.1, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    orbitPts.frustumCulled = false;
    scene.add(orbitPts);
    // Name label sprite (hidden by default, shown on hover)
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 512; nameCanvas.height = 64;
    const nameCtx = nameCanvas.getContext('2d');
    nameCtx.font = 'bold 28px monospace';
    nameCtx.textAlign = 'center';
    const hex = data.hexColor;
    nameCtx.fillStyle = hex;
    nameCtx.fillText(data.name, 256, 42);
    const nameTex = new THREE.CanvasTexture(nameCanvas);
    const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex, transparent: true, opacity: 0, depthWrite: false }));
    nameSprite.position.y = 2.2;
    nameSprite.scale.set(3, 0.4, 1);
    nameSprite.raycast = () => {}; // Don't intercept clicks
    group.add(nameSprite);

    // Speech bubble — shows quote when NPC is active station
    let speechSprite = null;
    if (data.quote && data.stationIndex !== 6) {
      const bubbleCanvas = document.createElement('canvas');
      bubbleCanvas.width = 512; bubbleCanvas.height = 128;
      const bCtx = bubbleCanvas.getContext('2d');

      // Background
      bCtx.fillStyle = 'rgba(0,10,20,0.85)';
      bCtx.beginPath();
      bCtx.rect(4, 4, 504, 110);
      bCtx.fill();

      // Border
      bCtx.strokeStyle = data.hexColor;
      bCtx.lineWidth = 2;
      bCtx.beginPath();
      bCtx.rect(4, 4, 504, 110);
      bCtx.stroke();

      // Text — wrap to fit
      bCtx.fillStyle = '#cccccc';
      bCtx.font = '14px monospace';
      const words = data.quote.split(' ');
      let line = '';
      let y = 28;
      const maxWidth = 480;
      const lineHeight = 18;
      for (const word of words) {
        const test = line + word + ' ';
        if (bCtx.measureText(test).width > maxWidth && line) {
          bCtx.fillText(line.trim(), 20, y);
          line = word + ' ';
          y += lineHeight;
          if (y > 100) break;
        } else {
          line = test;
        }
      }
      if (line && y <= 100) bCtx.fillText(line.trim(), 20, y);

      // Small triangle pointer at bottom
      bCtx.fillStyle = 'rgba(0,10,20,0.85)';
      bCtx.beginPath();
      bCtx.moveTo(246, 114); bCtx.lineTo(256, 126); bCtx.lineTo(266, 114);
      bCtx.fill();
      bCtx.strokeStyle = data.hexColor;
      bCtx.lineWidth = 2;
      bCtx.beginPath();
      bCtx.moveTo(246, 114); bCtx.lineTo(256, 126); bCtx.lineTo(266, 114);
      bCtx.stroke();

      const bubbleTex = new THREE.CanvasTexture(bubbleCanvas);
      speechSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true, opacity: 0, depthWrite: false }));
      speechSprite.position.y = 3.0;
      speechSprite.scale.set(4, 1, 1);
      speechSprite.raycast = () => {}; // Don't intercept clicks
      group.add(speechSprite);
    }

    npcPositions.push(npcPos.clone().setY(1.5));
    hitSpheres.push(hitSphere);
    npcs.push({ group, material, baseY: npcPos.y, orbitGeo, orbitCount, orbitCenter: npcPos.clone(), nameSprite, speechSprite, hovered: false, hoverGlow: 0 });
  });

  function update(time, dt, currentT) {
    state.activeNpcIndex = getActiveStation(currentT);
    npcs.forEach((npc, i) => {
      // Idle bob — smooth floating motion (skip if reduced motion)
      if (!state.reducedMotion) {
        const bobSpeed = 0.8 + i * 0.1;
        const bobAmount = 0.15 + Math.sin(time * 0.5 + i) * 0.05;
        npc.group.position.y = npc.baseY + Math.sin(time * bobSpeed + i * 1.2) * bobAmount;
      }

      // Idle rotation — slow spin when not facing camera
      const isActive = i === state.activeNpcIndex;
      const target = isActive ? 1.0 : 0.5;
      const cur = npc.material.uniforms.uEmissiveMultiplier.value;
      npc.material.uniforms.uEmissiveMultiplier.value += (target - cur) * Math.min(dt * 4, 1);
      npc.material.uniforms.uTime.value = time;

      if (isActive && !state.isTransitioning && state._cameraPosition) {
        // Face camera when active
        const look = state._cameraPosition.clone(); look.y = npc.group.position.y;
        const tmp = new THREE.Object3D(); tmp.position.copy(npc.group.position); tmp.lookAt(look);
        npc.group.quaternion.slerp(tmp.quaternion, Math.min(dt * 6, 1));
      } else if (!state.reducedMotion) {
        // Slow idle spin when inactive
        npc.group.rotation.y += dt * 0.4;
      }

      // Hologram flicker — brief emissive spikes (skip if reduced motion)
      if (!state.reducedMotion && Math.random() < 0.005) {
        npc.material.uniforms.uEmissiveMultiplier.value = 2.5;
      }

      // Orbit particles (skip if reduced motion)
      if (!state.reducedMotion) {
        const arr = npc.orbitGeo.attributes.position.array;
        for (let j = 0; j < npc.orbitCount; j++) {
          const angle = time * 1.5 + (j / npc.orbitCount) * Math.PI * 2;
          const r = 1.2 + Math.sin(time * 2 + j) * 0.3;
          arr[j * 3] = npc.orbitCenter.x + Math.cos(angle) * r;
          arr[j * 3 + 1] = 1.0 + Math.sin(time * 1.5 + j * 0.5) * 0.5;
          arr[j * 3 + 2] = npc.orbitCenter.z + Math.sin(angle) * r;
        }
        npc.orbitGeo.attributes.position.needsUpdate = true;
      }

      // Hover effect — fade name label and boost glow
      const targetHover = npc.hovered ? 1.0 : 0.0;
      npc.hoverGlow += (targetHover - npc.hoverGlow) * Math.min(dt * 8, 1);
      npc.nameSprite.material.opacity = npc.hoverGlow;
      if (npc.hovered) {
        npc.material.uniforms.uEmissiveMultiplier.value = Math.max(npc.material.uniforms.uEmissiveMultiplier.value, 1.5 + npc.hoverGlow * 0.5);
      }

      // Speech bubble — fade in when active and not transitioning, fade out otherwise
      if (npc.speechSprite) {
        const bubbleTarget = (isActive && !state.isTransitioning && !state.modalOpen) ? 0.9 : 0.0;
        const curBubble = npc.speechSprite.material.opacity;
        npc.speechSprite.material.opacity += (bubbleTarget - curBubble) * Math.min(dt * 3, 1);
      }
    });
  }

  function setHovered(index) {
    npcs.forEach((npc, i) => { npc.hovered = i === index; });
  }

  return { npcs, npcPositions, hitSpheres, update, setHovered };
}
