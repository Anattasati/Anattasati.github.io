/* ==========================================================================
   App - Main application initialization
   ========================================================================== */

(function() {
  'use strict';

  function init() {
    // Wave and Presence are self-initializing
    // This file handles any additional coordination
    
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Handle escape key to go back
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const readingClose = document.getElementById('reading-close');
        if (readingClose) {
          readingClose.click();
        }
      }
    });
    
    // Handle reading close button when Barba is not available
    setupReadingClose();
  }
  
  function setupReadingClose() {
    const closeBtn = document.getElementById('reading-close');
    if (closeBtn && typeof barba === 'undefined') {
      closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (document.referrer && document.referrer.includes(window.location.hostname)) {
          history.back();
        } else {
          window.location.href = '/';
        }
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
