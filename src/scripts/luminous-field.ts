type PageMode = "void" | "reading";

interface Point {
  x: number;
  y: number;
  nx: number;
  ny: number;
}

interface Ripple {
  x: number;
  y: number;
  startedAt: number;
  strength: number;
}

interface PointerState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  energy: number;
  initialized: boolean;
  lastInputAt: number;
}

const GLOBAL_CONTROLLER = "__anattasatiLuminousField";
const TAU = Math.PI * 2;
const MAX_DPR = 2;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const mix = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;

const smoothstep = (value: number) => value * value * (3 - 2 * value);

const isPageMode = (value: string | undefined): value is PageMode =>
  value === "void" || value === "reading";

const declaredMode = (source: Document, fallback: PageMode): PageMode => {
  const rootMode =
    source.documentElement.dataset.pageMode ?? source.documentElement.dataset.surface;
  if (isPageMode(rootMode)) return rootMode;

  const bodyMode = source.body?.dataset.pageMode ?? source.body?.dataset.surface;
  if (isPageMode(bodyMode)) return bodyMode;

  const content = source.querySelector<HTMLElement>(
    "main[data-page-mode], main[data-surface], [data-page-mode]:not(html):not(body):not([data-luminous-field])",
  );
  const contentMode = content?.dataset.pageMode ?? content?.dataset.surface;
  if (isPageMode(contentMode)) return contentMode;

  const fieldMode = source.querySelector<HTMLElement>("[data-luminous-field]")?.dataset.mode;
  return isPageMode(fieldMode) ? fieldMode : fallback;
};

class LuminousFieldController {
  private root!: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private context!: CanvasRenderingContext2D;
  private resizeObserver: ResizeObserver | null = null;
  private mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  private reducedMotion = this.mediaQuery.matches;
  private animationFrame = 0;
  private lastFrameAt = 0;
  private phase = 0;
  private width = 1;
  private height = 1;
  private dpr = 1;
  private mode: PageMode = "void";
  private modeMix = 0;
  private modeTarget = 0;
  private ripples: Ripple[] = [];
  private pointer: PointerState = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    energy: 0,
    initialized: false,
    lastInputAt: 0,
  };

  constructor(root: HTMLElement) {
    this.attachGlobalListeners();
    this.connect(root);
  }

  connect(root: HTMLElement) {
    const canvas = root.querySelector<HTMLCanvasElement>("[data-luminous-canvas]");
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const rootChanged = this.root !== root;
    this.root = root;
    this.canvas = canvas;
    this.context = context;

    if (rootChanged) {
      this.resizeObserver?.disconnect();
      if ("ResizeObserver" in window) {
        this.resizeObserver = new ResizeObserver(this.handleResize);
        this.resizeObserver.observe(root);
      }
    }

    this.syncMode(document, rootChanged);
    this.resize();
    this.resume();
  }

  private attachGlobalListeners() {
    window.addEventListener("resize", this.handleResize, { passive: true });
    window.addEventListener("pointermove", this.handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", this.handlePointerDown, { passive: true });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    document.addEventListener("astro:before-swap", this.handleBeforeSwap);
    document.addEventListener("astro:after-swap", this.handleAfterSwap);
    document.addEventListener("astro:page-load", this.handleAfterSwap);
    this.mediaQuery.addEventListener("change", this.handleMotionPreference);
  }

  private handleResize = () => {
    this.resize();
  };

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.pause();
    } else {
      this.lastFrameAt = performance.now();
      this.resume();
    }
  };

  private handleBeforeSwap = (event: Event) => {
    const nextDocument = (event as Event & { newDocument?: Document }).newDocument;
    if (nextDocument) this.syncMode(nextDocument);
  };

  private handleAfterSwap = () => {
    this.syncMode(document);
    this.resize();
    this.resume();
  };

  private handleMotionPreference = (event: MediaQueryListEvent) => {
    this.reducedMotion = event.matches;
    this.ripples = [];
    this.pointer.energy = 0;

    if (this.reducedMotion) {
      this.pause();
      this.modeMix = this.modeTarget;
      this.draw(performance.now());
    } else {
      this.lastFrameAt = performance.now();
      this.resume();
    }
  };

  private handlePointerMove = (event: PointerEvent) => {
    if (this.reducedMotion || !event.isPrimary || !this.root?.isConnected) return;

    const bounds = this.root.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const now = performance.now();

    if (!this.pointer.initialized) {
      this.pointer.x = x;
      this.pointer.y = y;
      this.pointer.targetX = x;
      this.pointer.targetY = y;
      this.pointer.initialized = true;
    }

    const distance = Math.hypot(x - this.pointer.targetX, y - this.pointer.targetY);
    const elapsed = Math.max(16, now - this.pointer.lastInputAt);
    const velocity = (distance / elapsed) * 1000;

    this.pointer.targetX = x;
    this.pointer.targetY = y;
    this.pointer.lastInputAt = now;
    this.pointer.energy = Math.max(
      this.pointer.energy,
      0.28 + Math.min(0.62, velocity / 1500),
    );
    this.resume();
  };

  private handlePointerDown = (event: PointerEvent) => {
    if (this.reducedMotion || !event.isPrimary || !this.root?.isConnected) return;

    const bounds = this.root.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.targetX = x;
    this.pointer.targetY = y;
    this.pointer.energy = 1;
    this.pointer.initialized = true;
    this.pointer.lastInputAt = performance.now();

    this.ripples.push({
      x,
      y,
      startedAt: this.pointer.lastInputAt,
      strength: event.pointerType === "touch" ? 1 : 0.72,
    });
    this.ripples = this.ripples.slice(-5);
    this.resume();
  };

  private syncMode(source: Document, immediate = false) {
    const nextMode = declaredMode(source, this.mode);
    this.mode = nextMode;
    this.modeTarget = nextMode === "reading" ? 1 : 0;
    if (immediate || this.reducedMotion) this.modeMix = this.modeTarget;
    if (this.root) this.root.dataset.mode = nextMode;

    if (this.reducedMotion) this.draw(performance.now());
  }

  private cssNumber(property: string, fallback: number) {
    const parsed = Number.parseFloat(getComputedStyle(this.root).getPropertyValue(property));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private resize() {
    if (!this.root?.isConnected || !this.canvas || !this.context) return;

    const bounds = this.root.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width || window.innerWidth));
    const height = Math.max(1, Math.round(bounds.height || window.innerHeight));
    const dpr = clamp(window.devicePixelRatio || 1, 1, MAX_DPR);

    if (width === this.width && height === this.height && dpr === this.dpr) return;

    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw(performance.now());
  }

  private resume() {
    if (
      this.animationFrame ||
      this.reducedMotion ||
      document.hidden ||
      !this.root?.isConnected
    ) {
      return;
    }

    this.lastFrameAt ||= performance.now();
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  private pause() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
  }

  private frame = (time: number) => {
    this.animationFrame = 0;
    if (document.hidden || this.reducedMotion || !this.root?.isConnected) return;

    const delta = clamp((time - this.lastFrameAt) / 1000, 0, 0.05);
    this.lastFrameAt = time;
    this.phase += delta;

    const modeEase = 1 - Math.exp(-delta * 4.8);
    this.modeMix = mix(this.modeMix, this.modeTarget, modeEase);

    const pointerEase = 1 - Math.exp(-delta * 8);
    this.pointer.x = mix(this.pointer.x, this.pointer.targetX, pointerEase);
    this.pointer.y = mix(this.pointer.y, this.pointer.targetY, pointerEase);
    this.pointer.energy *= Math.exp(-delta * 1.45);
    if (time - this.pointer.lastInputAt > 2600) {
      this.pointer.energy *= Math.exp(-delta * 2.4);
    }

    this.ripples = this.ripples.filter((ripple) => time - ripple.startedAt < 2400);
    this.draw(time);
    this.animationFrame = requestAnimationFrame(this.frame);
  };

  private basePoint(position: number, modeAmount: number, readingEdge: number) {
    const width = this.width;
    const height = this.height;
    const phase = this.reducedMotion ? 0 : this.phase;

    const voidX = position * width;
    const horizon = height * (height > width ? 0.61 : 0.575);
    const voidWave =
      Math.sin(position * TAU * 1.15 + phase * 0.42) * 2.4 +
      Math.sin(position * TAU * 3.6 - phase * 0.23) * 0.85;
    const voidY = horizon + voidWave;

    const readingWave =
      Math.sin(position * TAU * 1.35 + phase * 0.3) * 1.2 +
      Math.sin(position * TAU * 4.1 - phase * 0.17) * 0.35;
    const readingX = readingEdge + readingWave;
    const readingY = -20 + position * (height + 40);

    return {
      x: mix(voidX, readingX, modeAmount),
      y: mix(voidY, readingY, modeAmount),
    };
  }

  private createPoints(time: number) {
    const modeAmount = smoothstep(clamp(this.modeMix, 0, 1));
    const count = clamp(Math.ceil(Math.hypot(this.width, this.height) / 7), 96, 280);
    const columnWidth = Math.min(
      this.cssNumber("--luminous-reading-width", 680),
      Math.max(1, this.width - 48),
    );
    const gutter = this.cssNumber("--luminous-reading-gutter", 38);
    const readingEdge = Math.max(14, (this.width - columnWidth) / 2 - gutter);
    const bases = Array.from({ length: count }, (_, index) =>
      this.basePoint(index / (count - 1), modeAmount, readingEdge),
    );

    return bases.map<Point>((point, index) => {
      const previous = bases[Math.max(0, index - 1)];
      const next = bases[Math.min(count - 1, index + 1)];
      const tangentX = next.x - previous.x;
      const tangentY = next.y - previous.y;
      const tangentLength = Math.max(0.001, Math.hypot(tangentX, tangentY));
      const nx = -tangentY / tangentLength;
      const ny = tangentX / tangentLength;

      let displacement = 0;
      if (this.pointer.initialized && this.pointer.energy > 0.002) {
        const dx = this.pointer.x - point.x;
        const dy = this.pointer.y - point.y;
        const distanceSquared = dx * dx + dy * dy;
        const radius = mix(155, 118, modeAmount);
        const proximity = Math.exp(-distanceSquared / (radius * radius));
        const normalDistance = dx * nx + dy * ny;
        displacement +=
          clamp(normalDistance * 0.3, -26, 26) * proximity * this.pointer.energy;
      }

      for (const ripple of this.ripples) {
        const age = Math.max(0, (time - ripple.startedAt) / 1000);
        const distance = Math.hypot(point.x - ripple.x, point.y - ripple.y);
        const waveFront = age * 245;
        const envelope =
          Math.exp(-Math.abs(distance - waveFront) / 62) * Math.exp(-age * 1.05);
        displacement +=
          Math.sin((distance - waveFront) * 0.052) *
          envelope *
          18 *
          ripple.strength *
          (1 - modeAmount * 0.35);
      }

      return {
        x: point.x + nx * displacement,
        y: point.y + ny * displacement,
        nx,
        ny,
      };
    });
  }

  private stroke(
    points: Point[],
    normalOffset: number,
    color: string,
    width: number,
    blur = 0,
  ) {
    const context = this.context;
    context.beginPath();
    points.forEach((point, index) => {
      const x = point.x + point.nx * normalOffset;
      const y = point.y + point.ny * normalOffset;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.strokeStyle = color;
    context.lineWidth = width;
    context.shadowColor = color;
    context.shadowBlur = blur;
    context.stroke();
    context.shadowBlur = 0;
  }

  private draw(time: number) {
    if (!this.context || !this.canvas) return;

    const context = this.context;
    const points = this.createPoints(time);
    const reading = smoothstep(clamp(this.modeMix, 0, 1));

    context.clearRect(0, 0, this.width, this.height);
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.globalCompositeOperation = "source-over";

    this.stroke(
      points,
      -1.15,
      `rgba(139, 233, 208, ${mix(0.2, 0.105, reading)})`,
      mix(1.15, 0.85, reading),
      mix(11, 3, reading),
    );
    this.stroke(
      points,
      1.15,
      `rgba(170, 184, 255, ${mix(0.2, 0.09, reading)})`,
      mix(1.15, 0.8, reading),
      mix(11, 3, reading),
    );
    this.stroke(
      points,
      0,
      `rgba(${Math.round(mix(229, 41, reading))}, ${Math.round(
        mix(235, 48, reading),
      )}, ${Math.round(mix(232, 48, reading))}, ${mix(0.58, 0.2, reading)})`,
      mix(0.9, 0.72, reading),
      mix(4, 0, reading),
    );

    context.restore();
  }
}

type LuminousWindow = Window & {
  [GLOBAL_CONTROLLER]?: LuminousFieldController;
};

export const initializeLuminousField = () => {
  const root = document.querySelector<HTMLElement>("[data-luminous-field]");
  if (!root) return;

  const luminousWindow = window as LuminousWindow;
  if (luminousWindow[GLOBAL_CONTROLLER]) {
    luminousWindow[GLOBAL_CONTROLLER].connect(root);
    return;
  }

  luminousWindow[GLOBAL_CONTROLLER] = new LuminousFieldController(root);
};
