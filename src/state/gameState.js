export const state = {
  currentStation: 0, targetStation: 0, isTransitioning: false,
  visitedStations: new Set(), modalOpen: false, modalNpcIndex: -1,
  activeNpcIndex: -1, finalCtaTriggered: false, finalCtaShown: false,
  audioPlaying: false, audioLoaded: false, sceneReady: false,
  bloomStrength: 0.6, bloomRadius: 0.3, bloomThreshold: 0.7,
  mouse: { x: 0, y: 0 },
};

export const BLOOM_STATES = {
  exploring: { bloomStrength: 0.6, bloomRadius: 0.3, bloomThreshold: 0.7 },
  modal:     { bloomStrength: 0.8, bloomRadius: 0.3, bloomThreshold: 0.6 },
  finalCta:  { bloomStrength: 1.0, bloomRadius: 0.4, bloomThreshold: 0.6 },
};

export const STATION_T_VALUES = [0.0, 0.15, 0.32, 0.48, 0.62, 0.76, 0.95];
export const TRIGGER_ZONE = 0.04;
export const STATION_COUNT = 7;
export const TRANSITION_DURATION = 3.0;
