import * as THREE from 'three';
import { state, STATION_T_VALUES, TRANSITION_DURATION } from '../state/gameState.js';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function createCameraRail(camera, spline, npcPositions) {
  let currentT = STATION_T_VALUES[0];
  let startT = currentT;
  let endT = currentT;
  let progress = 1.0;
  const lookTarget = new THREE.Vector3();
  const tempTangent = new THREE.Vector3();

  function goToStation(i) {
    if (state.isTransitioning || state.modalOpen) return;
    if (i < 0 || i >= STATION_T_VALUES.length) return;
    state.targetStation = i;
    state.isTransitioning = true;
    startT = currentT;
    endT = STATION_T_VALUES[i];
    progress = 0;
  }

  function nextStation() {
    if (state.currentStation < STATION_T_VALUES.length - 1) goToStation(state.currentStation + 1);
  }

  function prevStation() {
    if (state.currentStation > 0) goToStation(state.currentStation - 1);
  }

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

    // Position camera on spline
    camera.position.copy(spline.getPointAt(currentT));

    // Get tangent (clone to avoid mutation)
    tempTangent.copy(spline.getTangentAt(currentT));

    // Look target: forward along the spline
    lookTarget.copy(camera.position).addScaledVector(tempTangent, 10);

    // Blend toward NPC when in proximity range
    if (state.activeNpcIndex >= 0 && npcPositions[state.activeNpcIndex]) {
      lookTarget.lerp(npcPositions[state.activeNpcIndex], 0.4);
    }

    // Apply lookAt
    camera.lookAt(lookTarget);

    // Apply mouse parallax via small quaternion rotation (avoids gimbal lock)
    const parallaxX = state.mouse.x * 0.05; // yaw
    const parallaxY = state.mouse.y * 0.03; // pitch
    camera.rotateY(-parallaxX);
    camera.rotateX(parallaxY);
  }

  function getCurrentT() {
    return currentT;
  }

  return { goToStation, nextStation, prevStation, update, getCurrentT };
}
