import '../styles/final-cta.css';
import { state, BLOOM_STATES } from '../state/gameState.js';

export function createFinalCta(callbacks) {
  const overlay = document.getElementById('final-cta-overlay');

  function show() {
    state.finalCtaShown = true; Object.assign(state, BLOOM_STATES.finalCta); callbacks.onShow?.();
    overlay.textContent = '';
    const titleDiv = document.createElement('div'); titleDiv.className = 'final-title';
    'ULTRA KINGDOMS'.split('').forEach((char, i) => {
      const span = document.createElement('span'); span.style.animationDelay = (i * 0.08) + 's';
      span.textContent = char === ' ' ? '\u00A0' : char; titleDiv.appendChild(span);
    });
    overlay.appendChild(titleDiv);
    const subtitle = document.createElement('div'); subtitle.className = 'final-subtitle'; subtitle.textContent = 'THE MULTIVERSE AWAITS'; overlay.appendChild(subtitle);
    const btns = document.createElement('div'); btns.className = 'final-cta-buttons';
    ['WISHLIST ON STEAM', 'JOIN DISCORD', 'SIGN UP FOR BETA'].forEach(text => {
      const a = document.createElement('a'); a.href = '#'; a.textContent = text; btns.appendChild(a);
    });
    overlay.appendChild(btns);
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('visible'));
    overlay.addEventListener('click', handleDismiss);
  }

  function handleDismiss(e) { if (e.target.closest('.final-cta-buttons a')) return; dismiss(); }

  function dismiss() {
    overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.style.display = 'none'; state.finalCtaShown = false;
      Object.assign(state, BLOOM_STATES.exploring); callbacks.onDismiss?.();
      overlay.removeEventListener('click', handleDismiss);
    }, 800);
  }
  return { show, dismiss };
}
