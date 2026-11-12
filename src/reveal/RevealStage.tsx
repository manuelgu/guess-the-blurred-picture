import { useEffect, useRef, useState } from "react";
import type { RevealMode } from "../../shared/types";
import { renderReveal } from "./render";

const imageCache = new Map<string, Promise<HTMLImageElement>>();
/** Keep only a few decoded images alive; a long game would otherwise hold every picture in memory. */
const IMAGE_CACHE_SIZE = 6;

export function loadImage(url: string): Promise<HTMLImageElement> {
  let p = imageCache.get(url);
  if (p) {
    // Refresh recency.
    imageCache.delete(url);
    imageCache.set(url, p);
  } else {
    while (imageCache.size >= IMAGE_CACHE_SIZE) imageCache.delete(imageCache.keys().next().value!);
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => {
        imageCache.delete(url);
        reject(new Error(`Could not load ${url}`));
      };
      img.src = url;
    });
    imageCache.set(url, p);
  }
  return p;
}

interface Props {
  imageUrl: string;
  mode: RevealMode;
  seed: number;
  durationMs: number;
  /** Returns the current reveal time in ms (may be negative during the countdown). */
  getElapsed: () => number;
  cover?: string;
  className?: string;
}

/** Canvas that renders a picture at the reveal progress returned by getElapsed(). */
export function RevealStage({ imageUrl, mode, seed, durationMs, getElapsed, cover = "#0d0b16", className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const elapsedRef = useRef(getElapsed);
  elapsedRef.current = getElapsed;

  useEffect(() => {
    let cancelled = false;
    setImg(null);
    loadImage(imageUrl)
      .then((i) => !cancelled && setImg(i))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let lastKey = "";
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const elapsed = Math.max(0, Math.min(elapsedRef.current(), durationMs));
      const p = elapsed / durationMs;
      // Skip redraws when nothing changed (frozen / fully revealed).
      const key = `${w}x${h}:${p.toFixed(4)}`;
      if (key !== lastKey) {
        lastKey = key;
        renderReveal(mode, { ctx, img, w, h, p, t: elapsed / 1000, seed, cover });
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [img, mode, seed, durationMs, cover]);

  return <canvas ref={canvasRef} className={`reveal-canvas ${className ?? ""}`} />;
}

/** Elapsed reveal time from a server snapshot, extrapolated locally. */
// `now` can be older than `receivedAt` when a paused clock (useNow) resumes; never run behind the snapshot.
export function extrapolate(elapsedMs: number, running: boolean, receivedAt: number, now = performance.now()) {
  return running ? elapsedMs + Math.max(0, now - receivedAt) : elapsedMs;
}

/** ms left for the answering player, extrapolated from the snapshot (null when nobody is answering). */
export function answerRemaining(answerRemainingMs: number | null, receivedAt: number, now = performance.now()) {
  return answerRemainingMs !== null ? answerRemainingMs - Math.max(0, now - receivedAt) : null;
}
