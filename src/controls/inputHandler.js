import { state } from '../state/gameState.js';
export function createInputHandler(callbacks) {
  function onKeyDown(e) {
    if (state.finalCtaShown) { if (e.key === 'Escape') callbacks.onDismissFinalCta?.(); return; }
    if (state.modalOpen) { if (e.key === 'Escape') callbacks.onCloseModal(); return; }
    switch (e.key) {
      case 'ArrowRight': case 'd': case 'D': callbacks.onNext(); break;
      case 'ArrowLeft': case 'a': case 'A': callbacks.onPrev(); break;
      case 'e': case 'E': if (state.activeNpcIndex >= 0) callbacks.onInteract(state.activeNpcIndex); break;
    }
  }
  function onMouseMove(e) {
    state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('mousemove', onMouseMove);
}
