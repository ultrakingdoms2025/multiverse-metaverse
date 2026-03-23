import '../styles/fallback.css';
const FEATURES = [
  { title: 'INFINITE REALMS', color: '#00ffff', desc: 'Explore procedurally generated dimensions, each with unique biomes and physics.' },
  { title: 'PLAYER ECONOMY', color: '#ffaa00', desc: 'Trade across realms, craft legendary gear, and build your merchant empire.' },
  { title: 'EPIC COMBAT', color: '#ff0044', desc: 'Skill-based PvP with deep customization. From duels to 50v50 realm sieges.' },
  { title: 'FACTION WARS', color: '#aa00ff', desc: 'Form syndicates, control territory, and shape the political landscape.' },
];
export function showFallback(reason) {
  const page = document.getElementById('fallback-page'); page.style.display = 'flex';
  document.getElementById('canvas-container').style.display = 'none';
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('hud-layer').style.display = 'none';

  const logo = document.createElement('div'); logo.className = 'fallback-logo'; logo.textContent = 'ULTRA KINGDOMS'; page.appendChild(logo);
  const tagline = document.createElement('div'); tagline.className = 'fallback-tagline'; tagline.textContent = 'ENTER THE MULTIVERSE'; page.appendChild(tagline);
  const grid = document.createElement('div'); grid.className = 'fallback-features';
  FEATURES.forEach(f => {
    const card = document.createElement('div'); card.className = 'fallback-card';
    const h3 = document.createElement('h3'); h3.textContent = f.title; h3.style.color = f.color;
    const p = document.createElement('p'); p.textContent = f.desc;
    card.appendChild(h3); card.appendChild(p); grid.appendChild(card);
  });
  page.appendChild(grid);
  const ctas = document.createElement('div'); ctas.className = 'fallback-ctas';
  ['WISHLIST ON STEAM', 'JOIN DISCORD', 'SIGN UP FOR BETA'].forEach(text => {
    const a = document.createElement('a'); a.href = '#'; a.textContent = text; ctas.appendChild(a);
  });
  page.appendChild(ctas);
  const note = document.createElement('div'); note.className = 'fallback-note';
  note.textContent = reason === 'mobile' ? 'Visit on a desktop browser for the full 3D experience.' : 'Your browser does not support WebGL. Try Chrome, Firefox, or Edge.';
  page.appendChild(note);
}
