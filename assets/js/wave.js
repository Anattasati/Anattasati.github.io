/* ==========================================================================
   Wave Animation - Organic water wave with ripple interactions
   Persistent layer that survives page transitions
   
   Physics: Ripples are modeled as damped harmonic oscillations that 
   propagate outward. When released, the wave springs back past equilibrium
   creating equal and opposite motion.
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
    // Ripple settings (damped harmonic oscillation)
    rippleDuration: 10000,     // How long ripples last (ms)
    rippleSpeed: 0.12,         // How fast ripples propagate outward (px/ms)
    rippleStrength: 30,        // Base ripple amplitude
    rippleFrequency: 0.012,    // Oscillation frequency of the ripple
    rippleDamping: 0.0008,     // How fast oscillations decay
    rippleSpread: 0.004,       // Gaussian spread of ripple influence
    // Drag interaction settings
    dragFalloffRate: 0.006,    // Gaussian falloff for smooth infinite curve
    dragStrength: 0.5,         // How much the wave bends toward cursor (0-1)
    dragRippleMultiplier: 1.5, // Stronger ripples from drag release
    // Release spring-back animation
    springFrequency: 0.008,    // Oscillation speed of spring-back
    springDamping: 0.03,       // How fast spring-back decays
  };

  let canvas, ctx;
  let width, height;
  let time = 0;
  let ripples = [];
  let animationId;
  let initialized = false;

  // Drag state
  let isDragging = false;
  let dragStart = null;
  let dragCurrent = null;
  let dragStartTime = null;
  
  // Release spring-back state
  let springPoints = [];  // Array of spring-back animations

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

  // Ripple class - damped harmonic oscillation propagating outward
  class Ripple {
    constructor(x, initialDisplacement, strength = 1) {
      this.x = x;                              // Center point of ripple
      this.initialDisplacement = initialDisplacement;  // How far from equilibrium at start
      this.startTime = Date.now();
      this.duration = config.rippleDuration;
      this.strength = strength;
    }
    
    getInfluence(pointX) {
      const elapsed = Date.now() - this.startTime;
      const progress = elapsed / this.duration;
      
      if (progress >= 1) return { active: false, offset: 0 };
      
      const distance = Math.abs(pointX - this.x);
      
      // Ripple wavefront expands outward
      const wavefront = elapsed * config.rippleSpeed;
      
      // How far behind the wavefront is this point?
      // Negative = wavefront hasn't reached yet, Positive = wavefront passed
      const behindWavefront = wavefront - distance;
      
      // Only affect points the wavefront has reached
      if (behindWavefront < 0) {
        return { active: true, offset: 0 };
      }
      
      // Damped harmonic oscillation
      // y(t) = A * e^(-γt) * cos(ωt)
      // where t is the time since wavefront passed this point
      const localTime = behindWavefront / config.rippleSpeed; // Convert back to time
      
      // Damping envelope (exponential decay)
      const damping = Math.exp(-localTime * config.rippleDamping);
      
      // Oscillation (cosine starts at 1, then goes negative - equal and opposite)
      const oscillation = Math.cos(localTime * config.rippleFrequency);
      
      // Spatial decay (further from origin = weaker)
      const spatialDecay = Math.exp(-distance * config.rippleSpread);
      
      // Combine: initial displacement * damping * oscillation * spatial decay
      const amplitude = this.initialDisplacement * this.strength * damping * spatialDecay;
      const offset = oscillation * amplitude;
      
      return { active: true, offset };
    }
  }
  
  // Spring point - for the release spring-back animation at the drag point
  class SpringPoint {
    constructor(x, displacement) {
      this.x = x;
      this.displacement = displacement;  // Initial displacement from equilibrium
      this.startTime = Date.now();
      this.duration = 5000;  // 5 seconds of spring animation
    }
    
    getInfluence(pointX) {
      const elapsed = Date.now() - this.startTime;
      
      if (elapsed > this.duration) return { active: false, offset: 0 };
      
      const distance = Math.abs(pointX - this.x);
      
      // Gaussian spatial influence (smooth curve, no cusps)
      const spatialInfluence = Math.exp(-Math.pow(distance * config.dragFalloffRate, 2));
      
      // Damped harmonic motion - oscillates back and forth, decaying
      // y(t) = A * e^(-γt) * cos(ωt)
      const damping = Math.exp(-elapsed * config.springDamping);
      const oscillation = Math.cos(elapsed * config.springFrequency);
      
      const offset = this.displacement * damping * oscillation * spatialInfluence;
      
      return { active: true, offset };
    }
  }

  // Initialize canvas
  function init() {
    if (initialized) return;
    
    canvas = document.getElementById('wave-canvas');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    resize();
    
    window.addEventListener('resize', resize);
    
    // Mouse events
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
    
    // Touch events
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
    
    initialized = true;
    animate();
  }

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

  function isInteractiveElement(target) {
    return target.tagName === 'A' || 
           target.tagName === 'BUTTON' || 
           target.closest('a') || 
           target.closest('button');
  }

  // Mouse handlers
  function handleMouseDown(e) {
    if (isInteractiveElement(e.target)) return;
    
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    dragCurrent = { x: e.clientX, y: e.clientY };
    dragStartTime = Date.now();
  }

  function handleMouseMove(e) {
    if (!isDragging) return;
    dragCurrent = { x: e.clientX, y: e.clientY };
  }

  function handleMouseUp(e) {
    if (!isDragging) return;
    
    // Calculate the displacement from equilibrium
    const equilibriumY = height / 2;
    const displacement = dragCurrent.y - equilibriumY;
    
    // Calculate drag distance for ripple strength
    const dragDistance = Math.sqrt(
      Math.pow(dragCurrent.x - dragStart.x, 2) + 
      Math.pow(dragCurrent.y - dragStart.y, 2)
    );
    
    const strength = Math.min(
      config.dragRippleMultiplier * (1 + dragDistance / 100),
      3
    );
    
    // Create spring-back animation at release point
    springPoints.push(new SpringPoint(dragCurrent.x, displacement * config.dragStrength));
    
    // Create outward-propagating ripple
    ripples.push(new Ripple(dragCurrent.x, displacement * 0.3, strength));
    
    isDragging = false;
    dragStart = null;
    dragCurrent = null;
    dragStartTime = null;
  }

  // Touch handlers
  function handleTouchStart(e) {
    if (isInteractiveElement(e.target)) return;
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      isDragging = true;
      dragStart = { x: touch.clientX, y: touch.clientY };
      dragCurrent = { x: touch.clientX, y: touch.clientY };
      dragStartTime = Date.now();
    }
  }

  function handleTouchMove(e) {
    if (!isDragging) return;
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      dragCurrent = { x: touch.clientX, y: touch.clientY };
    }
  }

  function handleTouchEnd(e) {
    if (!isDragging) return;
    
    const equilibriumY = height / 2;
    const displacement = dragCurrent.y - equilibriumY;
    
    const dragDistance = Math.sqrt(
      Math.pow(dragCurrent.x - dragStart.x, 2) + 
      Math.pow(dragCurrent.y - dragStart.y, 2)
    );
    
    const strength = Math.min(
      config.dragRippleMultiplier * (1 + dragDistance / 100),
      3
    );
    
    springPoints.push(new SpringPoint(dragCurrent.x, displacement * config.dragStrength));
    ripples.push(new Ripple(dragCurrent.x, displacement * 0.3, strength));
    
    isDragging = false;
    dragStart = null;
    dragCurrent = null;
    dragStartTime = null;
  }

  // Calculate active drag influence (while mouse is down)
  function getDragInfluence(x, baseY) {
    if (!isDragging || !dragCurrent) return 0;
    
    const distance = Math.abs(x - dragCurrent.x);
    
    // Gaussian falloff - smooth curve extending infinitely
    const falloff = Math.exp(-Math.pow(distance * config.dragFalloffRate, 2));
    
    // Pull toward cursor Y position
    const pull = (dragCurrent.y - baseY) * falloff * config.dragStrength;
    
    return pull;
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
    
    // Combine base wave
    let y = baseY + noise1 + noise2 + noise3 + breath;
    
    // Add active drag influence
    y += getDragInfluence(x, y);
    
    // Add spring-back animations (damped harmonic oscillation at release points)
    springPoints.forEach(spring => {
      const influence = spring.getInfluence(x);
      y += influence.offset;
    });
    
    // Add propagating ripples
    ripples.forEach(ripple => {
      const influence = ripple.getInfluence(x);
      y += influence.offset;
    });
    
    return y;
  }

  function drawWave() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.beginPath();
    ctx.strokeStyle = config.waveColor;
    ctx.lineWidth = config.waveLineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const step = 3;
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

  function cleanup() {
    const now = Date.now();
    ripples = ripples.filter(r => now - r.startTime < r.duration);
    springPoints = springPoints.filter(s => now - s.startTime < s.duration);
  }

  function animate() {
    time += config.waveSpeed * 16;
    
    cleanup();
    drawWave();
    
    animationId = requestAnimationFrame(animate);
  }

  // Public API
  window.Wave = {
    init,
    addRipple(x, y, strength = 1) {
      const equilibriumY = height / 2;
      const displacement = y - equilibriumY;
      ripples.push(new Ripple(x, displacement * 0.5, strength));
    },
    destroy() {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      initialized = false;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
