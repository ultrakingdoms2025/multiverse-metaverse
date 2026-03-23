import '../styles/loading.css';
export function createLoadingScreen() {
  const el = document.getElementById('loading-screen');
  const content = document.createElement('div'); content.className = 'loading-content';
  const title = document.createElement('div'); title.className = 'loading-title'; title.textContent = 'ULTRA KINGDOMS';
  const barContainer = document.createElement('div'); barContainer.className = 'loading-bar-container';
  const bar = document.createElement('div'); bar.className = 'loading-bar';
  barContainer.appendChild(bar); content.appendChild(title); content.appendChild(barContainer); el.appendChild(content);
  function setProgress(pct) { bar.style.width = Math.min(pct * 100, 100) + '%'; }
  function fadeOut() {
    return new Promise(resolve => {
      setTimeout(() => { el.classList.add('fade-out'); setTimeout(() => { el.style.display = 'none'; resolve(); }, 800); }, 500);
    });
  }
  return { setProgress, fadeOut };
}
