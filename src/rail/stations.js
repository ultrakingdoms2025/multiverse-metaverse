import { STATION_T_VALUES, TRIGGER_ZONE } from '../state/gameState.js';
export const stations = STATION_T_VALUES.map((t, i) => ({
  index: i, t, triggerMin: t - TRIGGER_ZONE, triggerMax: t + TRIGGER_ZONE,
}));
export function getActiveStation(currentT) {
  for (const s of stations) { if (currentT >= s.triggerMin && currentT <= s.triggerMax) return s.index; }
  return -1;
}
