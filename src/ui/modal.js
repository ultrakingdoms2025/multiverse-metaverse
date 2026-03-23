import '../styles/modal.css';
import { state, BLOOM_STATES } from '../state/gameState.js';
import { NPC_DATA } from '../npcs/npcData.js';

export function createModal(callbacks) {
  const layer = document.getElementById('modal-layer');
  const backdrop = document.getElementById('modal-backdrop');

  function open(npcIndex) {
    if (state.modalOpen) return;
    const npc = NPC_DATA[npcIndex];
    state.modalOpen = true; state.modalNpcIndex = npcIndex;
    Object.assign(state, BLOOM_STATES.modal);

    layer.textContent = '';

    const closeBtn = document.createElement('button'); closeBtn.className = 'modal-close';
    closeBtn.textContent = '\u00D7'; closeBtn.addEventListener('click', close); layer.appendChild(closeBtn);

    const icon = document.createElement('div'); icon.className = 'modal-icon';
    icon.style.background = npc.hexColor; icon.style.boxShadow = '0 0 15px ' + npc.hexColor; layer.appendChild(icon);

    const name = document.createElement('div'); name.className = 'modal-npc-name';
    name.textContent = npc.name; name.style.color = npc.hexColor; name.style.textShadow = '0 0 10px ' + npc.hexColor; layer.appendChild(name);

    const quote = document.createElement('div'); quote.className = 'modal-quote';
    quote.style.borderColor = npc.hexColor; quote.textContent = npc.quote; layer.appendChild(quote);

    const featureList = document.createElement('ul'); featureList.className = 'modal-features';
    npc.features.forEach(f => { const li = document.createElement('li'); li.textContent = f; featureList.appendChild(li); });
    layer.appendChild(featureList);

    const visual = document.createElement('div'); visual.className = 'modal-visual visual-' + npc.visualType;
    layer.appendChild(visual);

    layer.style.display = 'block';
    layer.style.borderLeft = '1px solid ' + npc.hexColor;
    layer.style.boxShadow = '-5px 0 30px ' + npc.hexColor + '33';
    backdrop.style.display = 'block';
    layer.classList.remove('glitch-out'); layer.classList.add('glitch-in');
    backdrop.addEventListener('click', close);
  }

  function close() {
    if (!state.modalOpen) return;
    layer.classList.remove('glitch-in'); layer.classList.add('glitch-out');
    const closedIdx = state.modalNpcIndex;
    setTimeout(() => {
      layer.style.display = 'none'; backdrop.style.display = 'none';
      layer.classList.remove('glitch-out');
      state.modalOpen = false; Object.assign(state, BLOOM_STATES.exploring);
      if (closedIdx === 5 && !state.finalCtaTriggered) { state.finalCtaTriggered = true; callbacks.onOracleFirstClose?.(); }
      state.modalNpcIndex = -1; backdrop.removeEventListener('click', close);
    }, 300);
  }
  return { open, close };
}
