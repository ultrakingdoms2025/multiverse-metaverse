import '../styles/hud.css';
import { state, STATION_COUNT } from '../state/gameState.js';
import { NPC_DATA } from '../npcs/npcData.js';

export function createHud(callbacks) {
  const container = document.getElementById('hud-layer');

  const titleDiv = document.createElement('div'); titleDiv.className = 'hud-title';
  const h1 = document.createElement('h1'); h1.textContent = 'ULTRA KINGDOMS';
  const tagline = document.createElement('div'); tagline.className = 'tagline'; tagline.textContent = 'ENTER THE MULTIVERSE';
  titleDiv.appendChild(h1); titleDiv.appendChild(tagline); container.appendChild(titleDiv);

  const audioDiv = document.createElement('div'); audioDiv.className = 'hud-audio';
  const audioBtn = document.createElement('button'); audioBtn.textContent = '\u{1F50A} OFF';
  audioBtn.addEventListener('click', () => callbacks.onAudioToggle());
  audioDiv.appendChild(audioBtn); container.appendChild(audioDiv);

  const navDiv = document.createElement('div'); navDiv.className = 'hud-nav';
  const prevBtn = document.createElement('button'); prevBtn.textContent = '\u25C0'; prevBtn.disabled = true;
  prevBtn.addEventListener('click', () => callbacks.onPrev());
  const hint = document.createElement('span'); hint.className = 'nav-hint'; hint.textContent = 'Use Arrow Keys or A/D';
  const nextBtn = document.createElement('button'); nextBtn.textContent = '\u25B6';
  nextBtn.addEventListener('click', () => callbacks.onNext());
  navDiv.appendChild(prevBtn); navDiv.appendChild(hint); navDiv.appendChild(nextBtn);
  container.appendChild(navDiv);

  const progressDiv = document.createElement('div'); progressDiv.className = 'hud-progress';
  const dots = [];
  for (let i = 0; i < STATION_COUNT; i++) {
    const dot = document.createElement('div'); dot.className = 'dot';
    progressDiv.appendChild(dot); dots.push(dot);
  }
  container.appendChild(progressDiv);

  const ctaDiv = document.createElement('div'); ctaDiv.className = 'hud-cta'; ctaDiv.id = 'hud-cta-btn';
  const ctaLink = document.createElement('a'); ctaLink.href = '#'; ctaLink.textContent = 'JOIN THE MULTIVERSE';
  ctaDiv.appendChild(ctaLink); container.appendChild(ctaDiv);

  function update() {
    prevBtn.disabled = state.currentStation <= 0 || state.isTransitioning;
    nextBtn.disabled = state.currentStation >= STATION_COUNT - 1 || state.isTransitioning;
    dots.forEach((dot, i) => {
      dot.classList.toggle('visited', state.visitedStations.has(i));
      dot.classList.toggle('current', i === state.currentStation);
      if (i === state.currentStation) { dot.style.borderColor = NPC_DATA[i].hexColor; dot.style.boxShadow = '0 0 8px ' + NPC_DATA[i].hexColor; }
      else { dot.style.boxShadow = 'none'; }
    });
  }
  function setAudioState(playing) { audioBtn.textContent = playing ? '\u{1F50A} ON' : '\u{1F50A} OFF'; }
  function hideCta() { ctaDiv.style.display = 'none'; }
  function showCta() { ctaDiv.style.display = 'block'; }
  return { update, setAudioState, hideCta, showCta };
}
