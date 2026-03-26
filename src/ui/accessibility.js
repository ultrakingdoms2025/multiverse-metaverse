import { state } from '../state/gameState.js';

export function createAccessibilityPanel() {
  // Inject dynamic scaling styles for modals and portal popups
  const scaleStyle = document.createElement('style');
  scaleStyle.textContent = [
    ':root { --font-scale: 1; }',
    '#modal-layer { font-size: calc(16px * var(--font-scale)); }',
    '#modal-layer .modal-npc-name { font-size: calc(1.6rem * var(--font-scale)); }',
    '#modal-layer .modal-quote { font-size: calc(1.05rem * var(--font-scale)); }',
    '#modal-layer .modal-features li { font-size: calc(1rem * var(--font-scale)); }',
    '[data-portal-modal] { font-size: calc(14px * var(--font-scale)); }',
    '[data-portal-modal] h2 { font-size: calc(20px * var(--font-scale)) !important; }',
    '[data-portal-modal] p { font-size: calc(14px * var(--font-scale)) !important; }',
    '#end-logo { --font-scale: var(--font-scale, 1); }',
  ].join('\n');
  document.head.appendChild(scaleStyle);

  const tab = document.createElement('div');
  tab.style.cssText = 'position:fixed;left:0;bottom:12px;z-index:100;cursor:pointer;background:rgba(0,10,20,0.85);border:1px solid rgba(0,255,255,0.3);border-left:none;border-radius:0 8px 8px 0;padding:8px 6px;color:#00ffff;font-size:18px;backdrop-filter:blur(8px);transition:opacity 0.3s;';
  tab.textContent = '\u267F';
  tab.title = 'Accessibility';
  document.body.appendChild(tab);

  const panel = document.createElement('div');
  panel.style.cssText = 'display:none;position:fixed;left:12px;bottom:50px;z-index:100;width:260px;background:rgba(0,10,20,0.95);border:1px solid rgba(0,255,255,0.3);border-radius:12px;padding:20px;font-family:monospace;color:#ccc;font-size:12px;backdrop-filter:blur(12px);box-shadow:0 0 30px rgba(0,255,255,0.1);';
  document.body.appendChild(panel);

  const title = document.createElement('div');
  title.textContent = 'Accessibility';
  title.style.cssText = 'color:#00ffff;font-size:15px;margin-bottom:14px;text-shadow:0 0 8px #00ffff;border-bottom:1px solid rgba(0,255,255,0.2);padding-bottom:8px;';
  panel.appendChild(title);

  let open = false;
  let currentFontScale = 1;
  let currentColorMode = 'normal';
  const fontChangeCallbacks = [];

  // Prevent clicks on panel from closing modals/backdrops
  panel.addEventListener('click', (e) => {
    e.stopPropagation();
    // If click was directly on the panel background (not a child button/control), close it
    if (e.target === panel) {
      open = false;
      panel.style.display = 'none';
    }
  });
  panel.addEventListener('mousedown', (e) => e.stopPropagation());
  tab.addEventListener('mousedown', (e) => e.stopPropagation());

  tab.addEventListener('click', (e) => {
    e.stopPropagation();
    open = !open;
    panel.style.display = open ? 'block' : 'none';
  });

  // --- Font Size ---
  const fontSection = document.createElement('div');
  fontSection.style.marginBottom = '14px';
  const fontLabel = document.createElement('div');
  fontLabel.textContent = 'Font Size';
  fontLabel.style.cssText = 'color:#888;font-size:10px;letter-spacing:1px;margin-bottom:6px;';
  fontSection.appendChild(fontLabel);

  const fontBtns = document.createElement('div');
  fontBtns.style.cssText = 'display:flex;gap:6px;';

  const fontSizes = [
    { label: 'A-', scale: 0.85 },
    { label: 'A', scale: 1.0 },
    { label: 'A+', scale: 1.15 },
    { label: 'A++', scale: 1.3 },
  ];

  fontSizes.forEach(fs => {
    const btn = document.createElement('button');
    btn.textContent = fs.label;
    btn.style.cssText = 'flex:1;padding:6px 0;background:rgba(0,20,40,0.7);border:1px solid rgba(0,255,255,0.3);border-radius:6px;color:#ccc;font-family:monospace;font-size:11px;cursor:pointer;transition:all 0.2s;';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentFontScale = fs.scale;
      state.fontScale = fs.scale;
      document.documentElement.style.fontSize = (16 * fs.scale) + 'px';
      document.documentElement.style.setProperty('--font-scale', fs.scale);
      fontChangeCallbacks.forEach(cb => cb(fs.scale));
      fontBtns.querySelectorAll('button').forEach(b => {
        b.style.borderColor = 'rgba(0,255,255,0.3)';
        b.style.color = '#ccc';
      });
      btn.style.borderColor = '#00ffff';
      btn.style.color = '#00ffff';
    });
    if (fs.scale === 1.0) {
      btn.style.borderColor = '#00ffff';
      btn.style.color = '#00ffff';
    }
    fontBtns.appendChild(btn);
  });
  fontSection.appendChild(fontBtns);
  panel.appendChild(fontSection);

  // --- Color Mode ---
  const colorSection = document.createElement('div');
  colorSection.style.marginBottom = '14px';
  const colorLabel = document.createElement('div');
  colorLabel.textContent = 'Color Mode';
  colorLabel.style.cssText = 'color:#888;font-size:10px;letter-spacing:1px;margin-bottom:6px;';
  colorSection.appendChild(colorLabel);

  const colorModes = [
    { label: 'Normal', mode: 'normal', filter: 'none' },
    { label: 'Protanopia', mode: 'protanopia', filter: 'url(#protanopia)' },
    { label: 'Deuteranopia', mode: 'deuteranopia', filter: 'url(#deuteranopia)' },
    { label: 'Tritanopia', mode: 'tritanopia', filter: 'url(#tritanopia)' },
    { label: 'Grayscale', mode: 'grayscale', filter: 'grayscale(1)' },
    { label: 'High Contrast', mode: 'highcontrast', filter: 'contrast(1.5) brightness(1.1)' },
  ];

  const colorGrid = document.createElement('div');
  colorGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px;';

  colorModes.forEach(cm => {
    const btn = document.createElement('button');
    btn.textContent = cm.label;
    btn.style.cssText = 'padding:6px 4px;background:rgba(0,20,40,0.7);border:1px solid rgba(0,255,255,0.3);border-radius:6px;color:#ccc;font-family:monospace;font-size:10px;cursor:pointer;transition:all 0.2s;';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentColorMode = cm.mode;
      document.documentElement.style.filter = cm.filter;
      colorGrid.querySelectorAll('button').forEach(b => {
        b.style.borderColor = 'rgba(0,255,255,0.3)';
        b.style.color = '#ccc';
      });
      btn.style.borderColor = '#00ffff';
      btn.style.color = '#00ffff';
    });
    if (cm.mode === 'normal') {
      btn.style.borderColor = '#00ffff';
      btn.style.color = '#00ffff';
    }
    colorGrid.appendChild(btn);
  });
  colorSection.appendChild(colorGrid);
  panel.appendChild(colorSection);

  // --- Reduce Motion ---
  const motionSection = document.createElement('div');
  motionSection.style.marginBottom = '14px';
  const motionLabel = document.createElement('div');
  motionLabel.textContent = 'Motion';
  motionLabel.style.cssText = 'color:#888;font-size:10px;letter-spacing:1px;margin-bottom:6px;';
  motionSection.appendChild(motionLabel);

  let reducedMotion = false;
  const motionBtn = document.createElement('button');
  motionBtn.textContent = 'Reduce Motion: OFF';
  motionBtn.style.cssText = 'width:100%;padding:6px;background:rgba(0,20,40,0.7);border:1px solid rgba(0,255,255,0.3);border-radius:6px;color:#ccc;font-family:monospace;font-size:10px;cursor:pointer;transition:all 0.2s;';
  motionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    reducedMotion = !reducedMotion;
    state.reducedMotion = reducedMotion;
    motionBtn.textContent = 'Reduce Motion: ' + (reducedMotion ? 'ON' : 'OFF');
    motionBtn.style.borderColor = reducedMotion ? '#00ffff' : 'rgba(0,255,255,0.3)';
    motionBtn.style.color = reducedMotion ? '#00ffff' : '#ccc';
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
  });
  motionSection.appendChild(motionBtn);
  panel.appendChild(motionSection);

  // --- Reset ---
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset All';
  resetBtn.style.cssText = 'width:100%;padding:8px;background:rgba(0,20,40,0.7);border:1px solid rgba(255,100,100,0.4);border-radius:6px;color:#ff6666;font-family:monospace;font-size:11px;cursor:pointer;transition:all 0.2s;';
  resetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentFontScale = 1;
    currentColorMode = 'normal';
    reducedMotion = false;
    state.reducedMotion = false;
    state.fontScale = 1.0;
    document.documentElement.style.fontSize = '';
    document.documentElement.style.setProperty('--font-scale', 1);
    fontChangeCallbacks.forEach(cb => cb(1));
    document.documentElement.style.filter = 'none';
    document.documentElement.classList.remove('reduce-motion');
    motionBtn.textContent = 'Reduce Motion: OFF';
    motionBtn.style.borderColor = 'rgba(0,255,255,0.3)';
    motionBtn.style.color = '#ccc';
    fontBtns.querySelectorAll('button').forEach((b, i) => {
      b.style.borderColor = i === 1 ? '#00ffff' : 'rgba(0,255,255,0.3)';
      b.style.color = i === 1 ? '#00ffff' : '#ccc';
    });
    colorGrid.querySelectorAll('button').forEach((b, i) => {
      b.style.borderColor = i === 0 ? '#00ffff' : 'rgba(0,255,255,0.3)';
      b.style.color = i === 0 ? '#00ffff' : '#ccc';
    });
  });
  panel.appendChild(resetBtn);

  // SVG filters for color blindness simulation
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;');
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

  const filters = [
    { id: 'protanopia', values: '0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0' },
    { id: 'deuteranopia', values: '0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0' },
    { id: 'tritanopia', values: '0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0' },
  ];

  filters.forEach(f => {
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', f.id);
    const matrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
    matrix.setAttribute('type', 'matrix');
    matrix.setAttribute('values', f.values);
    filter.appendChild(matrix);
    defs.appendChild(filter);
  });

  svg.appendChild(defs);
  document.body.appendChild(svg);

  return { onFontChange: (cb) => fontChangeCallbacks.push(cb) };
}
