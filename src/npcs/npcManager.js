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
    nameSprite.position.y = 2.8;
    nameSprite.scale.set(3, 0.4, 1);
    group.add(nameSprite);

    npcPositions.push(npcPos.clone().setY(1.5));
    hitSpheres.push(hitSphere);
    npcs.push({ group, material, baseY: npcPos.y, orbitGeo, orbitCount, orbitCenter: npcPos.clone(), nameSprite, hovered: false, hoverGlow: 0 });
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
    });
  }

  function setHovered(index) {
    npcs.forEach((npc, i) => { npc.hovered = i === index; });
  }

  return { npcs, npcPositions, hitSpheres, update, setHovered };
}
