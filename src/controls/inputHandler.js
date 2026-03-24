import { state } from '../state/gameState.js';

export function createInputHandler(callbacks) {
  // --- Keyboard ---
  function onKeyDown(e) {
    if (state.finalCtaShown) { if (e.key === 'Escape') callbacks.onDismissFinalCta?.(); return; }
    if (state.modalOpen) { if (e.key === 'Escape') callbacks.onCloseModal(); return; }
    switch (e.key) {
      case 'ArrowRight': case 'd': case 'D': callbacks.onNext(); break;
      case 'ArrowLeft': case 'a': case 'A': callbacks.onPrev(); break;
      case 'e': case 'E': if (state.activeNpcIndex >= 0) callbacks.onInteract(state.activeNpcIndex); break;
    }
  }

  // --- Mouse ---
  function onMouseMove(e) {
    state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  function onWheel(e) {
    if (state.modalOpen || state.finalCtaShown) return;
    if (e.deltaY > 0) callbacks.onPrev();
    else if (e.deltaY < 0) callbacks.onNext();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('wheel', onWheel, { passive: true });

  // --- Touch Controls ---
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let touchMoved = false;
  let isDragging = false;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = Date.now();
    touchMoved = false;
    isDragging = false;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      touchMoved = true;
      isDragging = true;
    }

    if (isDragging) {
      // Touch drag controls camera look (like mouse parallax)
      state.mouse.x = (t.clientX / window.innerWidth) * 2 - 1;
      state.mouse.y = -(t.clientY / window.innerHeight) * 2 + 1;
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (state.modalOpen || state.finalCtaShown) return;
    const dt = Date.now() - touchStartTime;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (!touchMoved && dt < 300) {
      // Quick tap — treat as click (handled by click event on canvas)
      return;
    }

    if (touchMoved && dt < 500) {
      // Swipe detection
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > 50 && absDx > absDy) {
        // Horizontal swipe — navigate stations
        if (dx > 0) callbacks.onPrev();
        else callbacks.onNext();
      }
    }

    // Reset camera look to center after drag
    if (isDragging) {
      state.mouse.x = 0;
      state.mouse.y = 0;
      isDragging = false;
    }
  }, { passive: true });

  // --- Gyroscope Camera ---
  let gyroEnabled = false;
  let gyroBaseAlpha = null;
  let gyroBaseBeta = null;

  function enableGyroscope() {
    if (gyroEnabled) return;

    const handler = (e) => {
      if (e.alpha === null || e.beta === null) return;

      // Set baseline on first reading
      if (gyroBaseAlpha === null) {
        gyroBaseAlpha = e.alpha;
        gyroBaseBeta = e.beta;
      }

      // Calculate offset from baseline
      let deltaAlpha = e.alpha - gyroBaseAlpha;
      let deltaBeta = e.beta - gyroBaseBeta;

      // Wrap alpha around 360
      if (deltaAlpha > 180) deltaAlpha -= 360;
      if (deltaAlpha < -180) deltaAlpha += 360;

      // Clamp to reasonable range and normalize to -1..1
      const yaw = Math.max(-1, Math.min(1, deltaAlpha / 30));
      const pitch = Math.max(-1, Math.min(1, deltaBeta / 20));

      // Only apply gyro when not touch-dragging
      if (!isDragging) {
        state.mouse.x = -yaw;
        state.mouse.y = pitch;
      }
    };

    // iOS 13+ requires permission
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handler);
            gyroEnabled = true;
          }
        })
        .catch(console.warn);
    } else if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handler);
      gyroEnabled = true;
    }
  }

  // Reset gyro baseline on tap
  window.addEventListener('touchstart', () => {
    if (gyroEnabled) {
      gyroBaseAlpha = null;
      gyroBaseBeta = null;
    }
  }, { passive: true });

  // Auto-enable gyroscope on mobile
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    // Try to enable immediately, or on first interaction
    enableGyroscope();
    window.addEventListener('touchstart', enableGyroscope, { once: true, passive: true });
  }
}
