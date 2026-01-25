/* ==========================================================================
   Page Transitions - Seamless navigation with Barba.js
   ========================================================================== */

(function() {
  'use strict';

  // Wait for Barba and GSAP to load
  if (typeof barba === 'undefined' || typeof gsap === 'undefined') {
    console.warn('Barba.js or GSAP not loaded, transitions disabled');
    return;
  }

  // Transition durations
  const VOID_TRANSITION_DURATION = 0.8;      // Between void pages
  const READING_ENTER_DURATION = 2.5;        // Entering reading mode (slow, meditative)
  const READING_LEAVE_DURATION = 1.0;        // Leaving reading mode

  // Initialize Barba.js
  function init() {
    barba.init({
      // Prevent transitions on same page
      prevent: ({ el }) => el.classList && el.classList.contains('no-barba'),
      
      transitions: [
        // Void to Void transition (navigating between sections)
        {
          name: 'void-to-void',
          from: { namespace: ['void'] },
          to: { namespace: ['void'] },
          
          leave(data) {
            const nav = data.current.container.querySelector('.void-nav');
            const home = data.current.container.querySelector('.void-home');
            
            return gsap.timeline()
              .to(nav, {
                opacity: 0,
                duration: VOID_TRANSITION_DURATION / 2,
                ease: 'power2.inOut'
              })
              .to(home, {
                opacity: 0,
                duration: VOID_TRANSITION_DURATION / 2,
                ease: 'power2.inOut'
              }, '<');
          },
          
          enter(data) {
            const nav = data.next.container.querySelector('.void-nav');
            const home = data.next.container.querySelector('.void-home');
            
            // Reset nav visibility state
            nav.classList.add('visible');
            if (home) home.classList.add('visible');
            
            gsap.set(nav, { opacity: 0 });
            if (home) gsap.set(home, { opacity: 0 });
            
            return gsap.timeline()
              .to(nav, {
                opacity: 1,
                duration: VOID_TRANSITION_DURATION,
                ease: 'power2.inOut'
              })
              .to(home, {
                opacity: 0.2,
                duration: VOID_TRANSITION_DURATION,
                ease: 'power2.inOut'
              }, '<');
          }
        },
        
        // Void to Reading transition (entering a post)
        {
          name: 'void-to-reading',
          from: { namespace: ['void'] },
          to: { namespace: ['reading'] },
          
          leave(data) {
            const nav = data.current.container.querySelector('.void-nav');
            const home = data.current.container.querySelector('.void-home');
            const waveLayer = document.getElementById('wave-layer');
            
            return gsap.timeline()
              .to(nav, {
                opacity: 0,
                duration: READING_ENTER_DURATION * 0.3,
                ease: 'power2.inOut'
              })
              .to(home, {
                opacity: 0,
                duration: READING_ENTER_DURATION * 0.3,
                ease: 'power2.inOut'
              }, '<')
              .to(waveLayer, {
                opacity: 0,
                duration: READING_ENTER_DURATION * 0.4,
                ease: 'power2.inOut'
              }, '-=0.2');
          },
          
          enter(data) {
            const reading = data.next.container.querySelector('.reading');
            const content = data.next.container.querySelector('.reading-content');
            const close = data.next.container.querySelector('.reading-close');
            
            // Remove CSS animation class, we'll handle it with GSAP
            reading.style.animation = 'none';
            
            gsap.set(reading, { opacity: 0 });
            gsap.set(content, { opacity: 0, y: 20 });
            gsap.set(close, { opacity: 0 });
            
            return gsap.timeline()
              .to(reading, {
                opacity: 1,
                duration: READING_ENTER_DURATION * 0.3,
                ease: 'power2.out'
              })
              .to(content, {
                opacity: 1,
                y: 0,
                duration: READING_ENTER_DURATION * 0.6,
                ease: 'power2.out'
              }, '-=0.3')
              .to(close, {
                opacity: 0.2,
                duration: READING_ENTER_DURATION * 0.3,
                ease: 'power2.out'
              }, '-=0.4');
          }
        },
        
        // Reading to Void transition (leaving a post)
        {
          name: 'reading-to-void',
          from: { namespace: ['reading'] },
          to: { namespace: ['void'] },
          
          leave(data) {
            const reading = data.current.container.querySelector('.reading');
            const waveLayer = document.getElementById('wave-layer');
            
            return gsap.timeline()
              .to(reading, {
                opacity: 0,
                duration: READING_LEAVE_DURATION * 0.5,
                ease: 'power2.inOut'
              })
              .to(waveLayer, {
                opacity: 1,
                duration: READING_LEAVE_DURATION * 0.5,
                ease: 'power2.inOut'
              }, '-=0.2');
          },
          
          enter(data) {
            const nav = data.next.container.querySelector('.void-nav');
            const home = data.next.container.querySelector('.void-home');
            
            // Set visible immediately (skip presence detection since we're returning)
            nav.classList.add('visible');
            if (home) home.classList.add('visible');
            
            gsap.set(nav, { opacity: 0 });
            if (home) gsap.set(home, { opacity: 0 });
            
            return gsap.timeline()
              .to(nav, {
                opacity: 1,
                duration: READING_LEAVE_DURATION * 0.6,
                ease: 'power2.out'
              })
              .to(home, {
                opacity: 0.2,
                duration: READING_LEAVE_DURATION * 0.6,
                ease: 'power2.out'
              }, '<');
          }
        },
        
        // Default fallback transition
        {
          name: 'default',
          leave(data) {
            return gsap.to(data.current.container, {
              opacity: 0,
              duration: 0.5,
              ease: 'power2.inOut'
            });
          },
          enter(data) {
            return gsap.from(data.next.container, {
              opacity: 0,
              duration: 0.5,
              ease: 'power2.inOut'
            });
          }
        }
      ],
      
      // Views for re-initializing scripts on page change
      views: [
        {
          namespace: 'void',
          afterEnter() {
            // Re-initialize presence detection for new nav
            if (window.Presence) {
              window.Presence.init();
            }
          }
        },
        {
          namespace: 'reading',
          afterEnter() {
            // Scroll to top when entering reading mode
            window.scrollTo(0, 0);
          }
        }
      ]
    });

    // Handle back button for reading close
    barba.hooks.before((data) => {
      // Add ripple effect at click position for void-word clicks
      const trigger = data.trigger;
      if (trigger && trigger.classList && trigger.classList.contains('void-word')) {
        if (window.Wave) {
          const rect = trigger.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          window.Wave.addRipple(x, y);
        }
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
