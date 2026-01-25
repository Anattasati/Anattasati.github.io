/* ==========================================================================
   Wave Animation - Organic water wave with ripple interactions
   Persistent layer that survives page transitions
   ========================================================================== */

(function() {
  'use strict';

  // Configuration
  const config = {
    waveColor: 'rgba(0, 0, 0, 0.08)',
    waveLineWidth: 1.5,
    waveAmplitude: 20,         // Base wave height
    waveFrequency: 0.008,      // How tight the waves are
    waveSpeed: 0.0008,         // How fast waves move
    breathSpeed: 0.0003,       // Breathing rhythm speed
    breathAmplitude: 8,        // Additional breath amplitude
    rippleDuration: 3000,      // How long ripples last (ms)
    rippleMaxRadius: 150,      // Max ripple spread
    rippleStrength: 25,        // How much ripples affect the wave
  };

  let canvas, ctx;
  let width, height;
  let time = 0;
  let ripples = [];
  let animationId;
  let initialized = false;

  // Perlin noise implementation for organic movement
  const noise = {
    p: new Uint8Array(512),
    permutation: [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180],
    
    init() {
      for (let i = 0; i < 256; i++) {
        this.p[i] = this.permutation[i];
        this.p[256 + i] = this.permutation[i];
      }
    },
    
    fade(t) {
      return t * t * t * (t * (t * 6 - 15) + 10);
    },
    
    lerp(a, b, t) {
      return a + t * (b - a);
    },
    
    grad(hash, x) {
      return (hash & 1) === 0 ? x : -x;
    },
    
    noise1D(x) {
      const X = Math.floor(x) & 255;
      x -= Math.floor(x);
      const u = this.fade(x);
      return this.lerp(this.grad(this.p[X], x), this.grad(this.p[X + 1], x - 1), u);
    }
  };

  // Initialize noise
  noise.init();

  // Ripple class
  class Ripple {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.startTime = Date.now();
      this.duration = config.rippleDuration;
    }
    
    getInfluence(pointX, waveY) {
      const elapsed = Date.now() - this.startTime;
      const progress = elapsed / this.duration;
      
      if (progress >= 1) return { active: false, offset: 0 };
      
      const radius = progress * config.rippleMaxRadius;
      const distance = Math.abs(pointX - this.x);
      
      if (distance > radius + 50) return { active: true, offset: 0 };
      
      // Wave-like ripple effect
      const ripplePhase = (distance - radius) * 0.1;
      const amplitude = config.rippleStrength * (1 - progress) * Math.exp(-distance * 0.01);
      const offset = Math.sin(ripplePhase) * amplitude;
      
      return { active: true, offset };
    }
  }

  // Initialize canvas
  function init() {
    // Prevent double initialization
    if (initialized) return;
    
    canvas = document.getElementById('wave-canvas');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    resize();
    
    // Event listeners on document for clicks (wave layer has pointer-events: none)
    window.addEventListener('resize', resize);
    document.addEventListener('click', handleClick);
    document.addEventListener('touchstart', handleTouch, { passive: true });
    
    // Start animation
    initialized = true;
    animate();
  }

  // Resize handler
  function resize() {
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  // Click handler - create ripple
  function handleClick(e) {
    // Don't create ripples when clicking interactive elements (links, buttons)
    const target = e.target;
    if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
      // Still create ripple, but at the element's position
      const rect = (target.closest('a') || target.closest('button') || target).getBoundingClientRect();
      ripples.push(new Ripple(rect.left + rect.width / 2, rect.top + rect.height / 2));
      return;
    }
    
    ripples.push(new Ripple(e.clientX, e.clientY));
  }

  // Touch handler
  function handleTouch(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      ripples.push(new Ripple(touch.clientX, touch.clientY));
    }
  }

  // Calculate wave Y position at given X
  function getWaveY(x, t) {
    const baseY = height / 2;
    
    // Multiple noise layers for organic feel
    const noise1 = noise.noise1D(x * config.waveFrequency + t * 0.5) * config.waveAmplitude;
    const noise2 = noise.noise1D(x * config.waveFrequency * 2 + t * 0.3) * (config.waveAmplitude * 0.5);
    const noise3 = noise.noise1D(x * config.waveFrequency * 0.5 + t * 0.7) * (config.waveAmplitude * 0.3);
    
    // Breathing effect
    const breath = Math.sin(t * config.breathSpeed * 1000) * config.breathAmplitude;
    
    // Combine
    let y = baseY + noise1 + noise2 + noise3 + breath;
    
    // Add ripple effects
    ripples.forEach(ripple => {
      const influence = ripple.getInfluence(x, y);
      y += influence.offset;
    });
    
    return y;
  }

  // Draw the wave
  function drawWave() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.beginPath();
    ctx.strokeStyle = config.waveColor;
    ctx.lineWidth = config.waveLineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw wave line
    const step = 3; // Pixel step for smoothness
    let firstPoint = true;
    
    for (let x = 0; x <= width; x += step) {
      const y = getWaveY(x, time);
      
      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }

  // Clean up finished ripples
  function cleanupRipples() {
    const now = Date.now();
    ripples = ripples.filter(r => now - r.startTime < r.duration);
  }

  // Animation loop
  function animate() {
    time += config.waveSpeed * 16; // Approximate 60fps
    
    cleanupRipples();
    drawWave();
    
    animationId = requestAnimationFrame(animate);
  }

  // Public API
  window.Wave = {
    init,
    addRipple(x, y) {
      ripples.push(new Ripple(x, y));
    },
    destroy() {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', resize);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('touchstart', handleTouch);
      initialized = false;
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
