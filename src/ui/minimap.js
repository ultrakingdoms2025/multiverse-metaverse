import { state, STATION_T_VALUES, STATION_COUNT } from '../state/gameState.js';
import { NPC_DATA } from '../npcs/npcData.js';

export function createMinimap(spline, onGoToStation) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:14;';
  document.body.appendChild(container);

  const canvas = document.createElement('canvas');
  const width = 260;
  const height = 120;
  canvas.width = width * 2;
  canvas.height = height * 2;
  canvas.style.cssText = `width:${width}px;height:${height}px;border-radius:8px;background:rgba(0,10,20,0.6);border:1px solid rgba(0,255,255,0.2);backdrop-filter:blur(4px);cursor:pointer;`;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  // Pre-compute path points
  const pathPoints = [];
  for (let t = 0; t <= 1; t += 0.005) {
    const p = spline.getPointAt(t);
    pathPoints.push({ x: p.x, z: p.z, t });
  }

  // Find bounds
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  pathPoints.forEach(p => {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
  });
  const padX = (maxX - minX) * 0.1 + 2;
  const padZ = (maxZ - minZ) * 0.1 + 2;
  minX -= padX; maxX += padX; minZ -= padZ; maxZ += padZ;

  // Pre-compute station screen positions for click detection
  const stationScreenPos = [];
  for (let i = 0; i < STATION_COUNT; i++) {
    const t = STATION_T_VALUES[i];
    const p = spline.getPointAt(Math.min(t, 1));
    stationScreenPos.push(toScreen(p.x, p.z));
  }

  function toScreen(x, z) {
    return {
      x: ((x - minX) / (maxX - minX)) * (width - 20) + 10,
      y: ((z - minZ) / (maxZ - minZ)) * (height - 10) + 5,
    };
  }

  // Click handling — find nearest station
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (width / rect.width);
    const my = (e.clientY - rect.top) * (height / rect.height);

    let closest = -1;
    let closestDist = 20; // max click distance in px
    stationScreenPos.forEach((s, i) => {
      const d = Math.sqrt((mx - s.x) ** 2 + (my - s.y) ** 2);
      if (d < closestDist) { closestDist = d; closest = i; }
    });
    if (closest >= 0 && onGoToStation) onGoToStation(closest);
  });

  function update(currentT) {
    ctx.clearRect(0, 0, width, height);

    // Draw road path
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 3;
    pathPoints.forEach((p, i) => {
      const s = toScreen(p.x, p.z);
      if (i === 0) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    });
    ctx.stroke();

    // Draw colored path segments between stations
    for (let i = 0; i < STATION_COUNT - 1; i++) {
      if (!state.visitedStations.has(i)) continue;
      const color = NPC_DATA[i] ? NPC_DATA[i].hexColor : '#ffffff';
      ctx.beginPath();
      ctx.strokeStyle = color + '66';
      ctx.lineWidth = 2;
      const startT = STATION_T_VALUES[i];
      const endT = STATION_T_VALUES[i + 1];
      let first = true;
      pathPoints.forEach(p => {
        if (p.t >= startT && p.t <= endT) {
          const s = toScreen(p.x, p.z);
          if (first) { ctx.moveTo(s.x, s.y); first = false; }
          else ctx.lineTo(s.x, s.y);
        }
      });
      ctx.stroke();
    }

    // Draw station dots with NPC colors
    for (let i = 0; i < STATION_COUNT; i++) {
      const s = stationScreenPos[i];
      const color = NPC_DATA[i] ? NPC_DATA[i].hexColor : '#ffffff';
      const isCurrent = state.currentStation === i;
      const isVisited = state.visitedStations.has(i);

      // Outer ring for current station
      if (isCurrent) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Station dot
      ctx.beginPath();
      ctx.arc(s.x, s.y, isCurrent ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isVisited || isCurrent ? color : 'rgba(255,255,255,0.25)';
      ctx.fill();
    }

    // Player position marker
    const clamped = Math.min(Math.max(currentT, 0), 1);
    const playerPos = spline.getPointAt(clamped);
    const ps = toScreen(playerPos.x, playerPos.z);
    ctx.beginPath();
    ctx.arc(ps.x, ps.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  return { update };
}
