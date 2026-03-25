import { state } from '../state/gameState.js';

export function createStatsPanel() {
  const tab = document.createElement('div');
  tab.style.cssText = 'position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:15;cursor:pointer;background:rgba(0,10,20,0.85);border:1px solid rgba(0,255,255,0.3);border-right:none;border-radius:8px 0 0 8px;padding:10px 6px;writing-mode:vertical-rl;text-orientation:mixed;color:#00ffff;font-family:monospace;font-size:13px;letter-spacing:2px;backdrop-filter:blur(8px);transition:opacity 0.3s;';
  tab.textContent = 'Statistics';
  document.body.appendChild(tab);

  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;right:-280px;top:50%;transform:translateY(-50%);z-index:15;width:260px;background:rgba(0,10,20,0.9);border:1px solid rgba(0,255,255,0.3);border-right:none;border-radius:12px 0 0 12px;padding:20px;font-family:monospace;color:#ccc;font-size:13px;backdrop-filter:blur(10px);transition:right 0.3s ease;box-shadow:-5px 0 30px rgba(0,255,255,0.1);';
  document.body.appendChild(panel);

  const title = document.createElement('div');
  title.textContent = 'Statistics';
  title.style.cssText = 'color:#00ffff;font-size:16px;margin-bottom:16px;text-shadow:0 0 8px #00ffff;border-bottom:1px solid rgba(0,255,255,0.2);padding-bottom:8px;';
  panel.appendChild(title);

  const content = document.createElement('div');
  content.style.cssText = 'line-height:2;';
  panel.appendChild(content);

  let open = false;

  function toggle() {
    open = !open;
    panel.style.right = open ? '0' : '-280px';
    tab.style.opacity = open ? '0' : '1';
    tab.style.pointerEvents = open ? 'none' : 'auto';
    if (open) updateContent();
  }

  tab.addEventListener('click', toggle);
  panel.style.cursor = 'pointer';
  panel.addEventListener('click', toggle);

  function createRow(label, value, color) {
    const row = document.createElement('div');
    const labelSpan = document.createTextNode(label + ': ');
    const valueSpan = document.createElement('span');
    valueSpan.style.color = color || '#00ffff';
    valueSpan.textContent = value;
    row.appendChild(labelSpan);
    row.appendChild(valueSpan);
    return row;
  }

  function createSection(label) {
    const div = document.createElement('div');
    div.style.cssText = 'color:#888;font-size:11px;margin-bottom:8px;margin-top:12px;';
    div.textContent = label;
    return div;
  }

  const playersOnline = Math.floor(Math.random() * 401) + 100;

  function updateContent() {
    content.textContent = '';

    content.appendChild(createSection('SYSTEM'));
    content.appendChild(createRow('Version', '1.0.0'));

    content.appendChild(createSection('MULTIVERSE'));
    content.appendChild(createRow('Worlds online', '22'));
    content.appendChild(createRow('Players online', String(playersOnline)));
  }

  return { toggle, updateContent };
}
