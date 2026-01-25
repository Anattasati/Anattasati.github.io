/* ==========================================================================
   Presence Detection - Reveal content after stillness/time
   Re-initializes on page transitions
   ========================================================================== */

(function() {
  'use strict';

  // Configuration
  const config = {
    revealDelay: 3000,        // Time before elements start appearing (ms)
    stillnessThreshold: 1500, // How long mouse must be still (ms)
    mouseMoveSensitivity: 5,  // Pixels of movement to reset stillness
  };

  let lastMouseX = 0;
  let lastMouseY = 0;
  let revealTimer = null;
  let isRevealed = false;
  let mouseStillSince = Date.now();

  // Elements to reveal
  let navElement = null;
  let homeElement = null;

  function init() {
    // Clear any existing timers
    if (revealTimer) {
      clearTimeout(revealTimer);
    }
    
    // Reset state
    isRevealed = false;
    
    navElement = document.getElementById('void-nav');
    homeElement = document.getElementById('void-home');
    
    if (!navElement) return;

    // Remove visible class initially
    navElement.classList.remove('visible');
    if (homeElement) homeElement.classList.remove('visible');
    
    // Start reveal timer (always reveal after delay, regardless of movement)
    startRevealTimer();
  }

  function handleMouseMove(e) {
    const dx = Math.abs(e.clientX - lastMouseX);
    const dy = Math.abs(e.clientY - lastMouseY);
    
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    
    // If significant movement, reset stillness
    if (dx > config.mouseMoveSensitivity || dy > config.mouseMoveSensitivity) {
      mouseStillSince = Date.now();
    }
  }

  function handleTouch() {
    // On touch devices, reveal immediately on first touch
    reveal();
  }

  function startRevealTimer() {
    revealTimer = setTimeout(() => {
      reveal();
    }, config.revealDelay);
  }

  function reveal() {
    if (isRevealed) return;
    isRevealed = true;
    
    if (navElement) {
      navElement.classList.add('visible');
    }
    
    if (homeElement) {
      homeElement.classList.add('visible');
    }
  }

  function hide() {
    isRevealed = false;
    
    if (navElement) {
      navElement.classList.remove('visible');
    }
    
    if (homeElement) {
      homeElement.classList.remove('visible');
    }
  }

  // Set up global event listeners once
  function setupGlobalListeners() {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchstart', handleTouch, { passive: true });
  }

  // Public API
  window.Presence = {
    init,
    reveal,
    hide,
    isRevealed() {
      return isRevealed;
    }
  };

  // Set up global listeners once
  setupGlobalListeners();

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
