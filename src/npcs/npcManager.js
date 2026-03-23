import * as THREE from 'three';
import { NPC_DATA } from './npcData.js';
import { createNpcMesh } from './npcMesh.js';
import { state, STATION_T_VALUES } from '../state/gameState.js';
import { getActiveStation } from '../rail/stations.js';

export function createNpcManager(scene, spline) {
  const npcs = [], npcPositions = [], hitSpheres = [];
  NPC_DATA.forEach((data, i) => {
    const t = STATION_T_VALUES[i];
    const pos = spline.getPointAt(t);
    const tangent = spline.getTangentAt(t);
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
      if (i === state.activeNpcIndex && !state.isTransitioning && state._cameraPosition) {
        const look = state._cameraPosition.clone(); look.y = npc.group.position.y;
        const tmp = new THREE.Object3D(); tmp.position.copy(npc.group.position); tmp.lookAt(look);
        npc.group.quaternion.slerp(tmp.quaternion, Math.min(dt * 6, 1));
      }
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
