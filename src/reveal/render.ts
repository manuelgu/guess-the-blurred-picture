import type { RevealMode } from "../../shared/types";

/** Deterministic PRNG so every screen renders the same reveal for a seed. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Frame {
  ctx: CanvasRenderingContext2D;
  img: HTMLImageElement;
  /** Canvas size in device pixels. */
  w: number;
  h: number;
  /** Reveal progress 0..1 */
  p: number;
  /** Reveal time in seconds (drives motion that should freeze when the reveal freezes). */
  t: number;
  seed: number;
  cover: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function fit(imgW: number, imgH: number, w: number, h: number): Rect {
  const s = Math.min(w / imgW, h / imgH);
  const dw = imgW * s;
  const dh = imgH * s;
  return { x: (w - dw) / 2, y: (h - dh) / 2, w: dw, h: dh };
}

let scratch: HTMLCanvasElement | null = null;
function scratchCanvas(w: number, h: number) {
  scratch ??= document.createElement("canvas");
  if (scratch.width !== w || scratch.height !== h) {
    scratch.width = w;
    scratch.height = h;
  }
  return scratch;
}

const supportsCanvasFilter = (() => {
  try {
    const c = document.createElement("canvas").getContext("2d");
    return !!c && typeof c.filter === "string" && ((c.filter = "blur(2px)"), c.filter === "blur(2px)");
  } catch {
    return false;
  }
})();

function blur(f: Frame, r: Rect) {
  const { ctx, img, p } = f;
  const amount = 1 - p ** 1.6; // 1 → 0, stays heavy early
  if (amount < 0.003) {
    ctx.drawImage(img, r.x, r.y, r.w, r.h);
    return;
  }
  if (supportsCanvasFilter) {
    const radius = amount * r.w * 0.07;
    // Overdraw so the blurred edges don't fade to the background. Scale both axes by the same
    // factor so the overdraw doesn't stretch (distort) the picture.
    const grow = 1 + (radius * 4) / Math.min(r.w, r.h);
    const padX = (r.w * (grow - 1)) / 2;
    const padY = (r.h * (grow - 1)) / 2;
    // Big blurs are expensive: blur a downscaled copy (≤ ~6px radius there), then scale up.
    const scale = Math.min(1, Math.max(0.08, 6 / Math.max(radius, 0.01)));
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    if (scale >= 1) {
      ctx.filter = `blur(${radius.toFixed(1)}px)`;
      ctx.drawImage(img, r.x - padX, r.y - padY, r.w + padX * 2, r.h + padY * 2);
    } else {
      const sw = Math.max(2, Math.ceil((r.w + padX * 2) * scale));
      const sh = Math.max(2, Math.ceil((r.h + padY * 2) * scale));
      const sc = scratchCanvas(sw, sh);
      const sctx = sc.getContext("2d")!;
      sctx.clearRect(0, 0, sw, sh);
      sctx.filter = `blur(${(radius * scale).toFixed(2)}px)`;
      sctx.drawImage(img, 0, 0, sw, sh);
      sctx.filter = "none";
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(sc, 0, 0, sw, sh, r.x - padX, r.y - padY, r.w + padX * 2, r.h + padY * 2);
    }
    ctx.restore();
  } else {
    // Fallback: downscale + smooth upscale reads as blur.
    const scale = Math.max(0.008, 1 - amount) ** 2.2;
    const sw = Math.max(2, Math.round(r.w * scale));
    const sh = Math.max(2, Math.round(r.h * scale));
    const s = scratchCanvas(sw, sh);
    const sctx = s.getContext("2d")!;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(img, 0, 0, sw, sh);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(s, 0, 0, sw, sh, r.x, r.y, r.w, r.h);
  }
}

function pixelate(f: Frame, r: Rect) {
  const { ctx, img, p } = f;
  const startBlocks = 5;
  // Ease-in: stays coarse for a long time, then sharpens quickly at the end.
  const blocks = startBlocks * (r.w / startBlocks) ** (p ** 1.8);
  if (blocks >= r.w / 2 || p >= 0.995) {
    ctx.drawImage(img, r.x, r.y, r.w, r.h);
    return;
  }
  const sw = Math.max(1, Math.round(blocks));
  const sh = Math.max(1, Math.round((blocks * r.h) / r.w));
  const s = scratchCanvas(sw, sh);
  const sctx = s.getContext("2d")!;
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(img, 0, 0, sw, sh);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(s, 0, 0, sw, sh, r.x, r.y, r.w, r.h);
  ctx.imageSmoothingEnabled = true;
}

const tileOrderCache = new Map<string, number[]>();
function tiles(f: Frame, r: Rect) {
  const { ctx, img, p, seed } = f;
  const cols = r.w >= r.h ? 10 : Math.max(4, Math.round((10 * r.w) / r.h));
  const rows = r.w >= r.h ? Math.max(4, Math.round((10 * r.h) / r.w)) : 10;
  const n = cols * rows;
  const key = `${seed}:${n}`;
  let order = tileOrderCache.get(key);
  if (!order) {
    const rnd = mulberry32(seed);
    order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (tileOrderCache.size > 8) tileOrderCache.clear(); // one entry per round; don't grow forever
    tileOrderCache.set(key, order);
  }
  ctx.drawImage(img, r.x, r.y, r.w, r.h);
  const shown = p >= 1 ? n : Math.floor(p ** 1.4 * n);
  const tw = r.w / cols;
  const th = r.h / rows;
  const gap = Math.max(1, Math.round(Math.min(tw, th) * 0.04));
  ctx.fillStyle = f.cover;
  for (let k = shown; k < n; k++) {
    const idx = order[k];
    const cx = idx % cols;
    const cy = Math.floor(idx / cols);
    ctx.fillRect(r.x + cx * tw - 0.5, r.y + cy * th - 0.5, tw + 1, th + 1);
  }
  // Subtle grid lines over hidden tiles to make the board feel like tiles.
  if (shown < n) {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let k = shown; k < n; k++) {
      const idx = order[k];
      const cx = idx % cols;
      const cy = Math.floor(idx / cols);
      ctx.fillRect(r.x + cx * tw + gap, r.y + cy * th + gap, tw - gap * 2, th - gap * 2);
    }
  }
}

function zoom(f: Frame, r: Rect) {
  const { ctx, img, p, seed } = f;
  const rnd = mulberry32(seed ^ 0x9e3779b9);
  // Focal point somewhere in the middle area of the image.
  const fx = 0.3 + rnd() * 0.4;
  const fy = 0.25 + rnd() * 0.4;
  const maxZoom = 9;
  const z = maxZoom ** (1 - p ** 1.3);
  const sw = img.naturalWidth / z;
  const sh = img.naturalHeight / z;
  const sx = Math.min(Math.max(fx * img.naturalWidth - sw / 2, 0), img.naturalWidth - sw);
  const sy = Math.min(Math.max(fy * img.naturalHeight - sh / 2, 0), img.naturalHeight - sh);
  ctx.drawImage(img, sx, sy, sw, sh, r.x, r.y, r.w, r.h);
}

function spotlight(f: Frame, r: Rect) {
  const { ctx, img, p, t, seed } = f;
  ctx.drawImage(img, r.x, r.y, r.w, r.h);
  if (p >= 0.999) return;
  const rnd = mulberry32(seed ^ 0x51ed270b);
  const a = 0.35 + rnd() * 0.25;
  const b = 0.45 + rnd() * 0.25;
  const ph = rnd() * Math.PI * 2;
  // Wander less as it grows, drifting towards the centre.
  const wander = 0.36 * (1 - p);
  const cx = r.x + r.w * (0.5 + wander * Math.sin(t * a + ph));
  const cy = r.y + r.h * (0.5 + wander * Math.sin(t * b + ph * 1.7));
  const diag = Math.hypot(r.w, r.h);
  const radius = diag * (0.05 + 0.6 * p ** 2.2);
  const g = ctx.createRadialGradient(cx, cy, radius * 0.75, cx, cy, radius);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, f.cover);
  ctx.fillStyle = g;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

const RENDERERS: Record<RevealMode, (f: Frame, r: Rect) => void> = { blur, pixelate, tiles, zoom, spotlight };

export function renderReveal(mode: RevealMode, f: Frame) {
  const { ctx, img, w, h } = f;
  ctx.clearRect(0, 0, w, h);
  const r = fit(img.naturalWidth, img.naturalHeight, w, h);
  RENDERERS[mode](f, r);
}
