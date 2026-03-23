import { state } from '../state/gameState.js';
export function createAudioManager() {
  let ctx = null;
  function toggle() {
    if (!state.audioLoaded) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const gain = ctx.createGain(); gain.gain.value = 0.1; gain.connect(ctx.destination);
        const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 80;
        osc.connect(gain); osc.start();
        state.audioLoaded = true; state.audioPlaying = true;
      } catch (e) { console.warn('Audio failed:', e); }
      return;
    }
    if (state.audioPlaying) { ctx.suspend(); state.audioPlaying = false; }
    else { ctx.resume(); state.audioPlaying = true; }
  }
  return { toggle };
}
