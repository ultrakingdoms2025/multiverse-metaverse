import * as THREE from 'three';
import { state, STATION_T_VALUES, TRANSITION_DURATION } from '../state/gameState.js';
function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
export function createCameraRail(camera, spline, npcPositions) {
  let currentT = STATION_T_VALUES[0], startT = currentT, endT = currentT, progress = 1.0;
  const lookTarget = new THREE.Vector3();
  function goToStation(i) {
    if (state.isTransitioning || state.modalOpen) return;
    if (i < 0 || i >= STATION_T_VALUES.length) return;
    state.targetStation = i; state.isTransitioning = true;
    startT = currentT; endT = STATION_T_VALUES[i]; progress = 0;
  }
  function nextStation() { if (state.currentStation < STATION_T_VALUES.length - 1) goToStation(state.currentStation + 1); }
  function prevStation() { if (state.currentStation > 0) goToStation(state.currentStation - 1); }
  function update(dt) {
    if (state.isTransitioning) {
      progress += dt / TRANSITION_DURATION;
      if (progress >= 1.0) { progress = 1.0; state.isTransitioning = false; state.currentStation = state.targetStation; state.visitedStations.add(state.currentStation); }
      currentT = startT + (endT - startT) * easeInOutCubic(Math.min(progress, 1.0));
    }
    camera.position.copy(spline.getPointAt(currentT));
    const tangent = spline.getTangentAt(currentT);
    lookTarget.copy(camera.position).add(tangent.multiplyScalar(5));
    if (state.activeNpcIndex >= 0 && npcPositions[state.activeNpcIndex]) { lookTarget.lerp(npcPositions[state.activeNpcIndex], 0.6); }
    camera.lookAt(lookTarget);
    camera.rotation.y += state.mouse.x * 0.087;
    camera.rotation.x += state.mouse.y * 0.05;
  }
  function getCurrentT() { return currentT; }
  return { goToStation, nextStation, prevStation, update, getCurrentT };
}
