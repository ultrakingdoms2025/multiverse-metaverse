import { state } from '../state/gameState.js';

const BASE = import.meta.env.BASE_URL;

export function createAudioManager() {
  const audio = new Audio(`${BASE}theme.mp3`);
  audio.loop = true;
  audio.volume = 0.5;

  function toggle() {
    if (!state.audioLoaded) {
      audio.play().then(() => {
        state.audioLoaded = true;
        state.audioPlaying = true;
      }).catch(e => console.warn('Audio failed:', e));
      return;
    }
    if (state.audioPlaying) {
      audio.pause();
      state.audioPlaying = false;
    } else {
      audio.play();
      state.audioPlaying = true;
    }
  }

  function setVolume(v) {
    audio.volume = Math.max(0, Math.min(1, v));
  }

  function getVolume() {
    return audio.volume;
  }

  return { toggle, setVolume, getVolume };
}
