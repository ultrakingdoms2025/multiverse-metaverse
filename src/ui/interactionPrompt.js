import * as THREE from 'three';
import { state } from '../state/gameState.js';
import { NPC_DATA } from '../npcs/npcData.js';

export function createInteractionPrompt() {
  const el = document.getElementById('interaction-prompt');
  const inner = document.createElement('div');
  inner.style.cssText = 'background:rgba(0,0,0,0.7);padding:8px 16px;border-radius:4px;font-family:Rajdhani,sans-serif;font-size:0.85rem;letter-spacing:0.1em;white-space:nowrap;border:1px solid rgba(255,255,255,0.2);';
  inner.textContent = 'Click or press E to interact';
  el.appendChild(inner); el.style.display = 'none';
  const tempVec = new THREE.Vector3();

  function update(camera, npcPositions) {
    if (state.activeNpcIndex < 0 || state.modalOpen || state.isTransitioning) { el.style.display = 'none'; return; }
    const npcPos = npcPositions[state.activeNpcIndex];
    if (!npcPos) { el.style.display = 'none'; return; }
    tempVec.copy(npcPos); tempVec.y += 1.0; tempVec.project(camera);
    const x = Math.max(80, Math.min((tempVec.x * 0.5 + 0.5) * window.innerWidth, window.innerWidth - 80));
    const y = Math.max(30, Math.min((-tempVec.y * 0.5 + 0.5) * window.innerHeight, window.innerHeight - 30));
    el.style.display = 'block'; el.style.left = x + 'px'; el.style.top = y + 'px';
    el.style.transform = 'translate(-50%, -100%)';
    inner.style.borderColor = NPC_DATA[state.activeNpcIndex].hexColor;
  }
  return { update };
}
