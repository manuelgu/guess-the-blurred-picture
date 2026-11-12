// Tiny Web Audio synth: no sound files needed.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  return ctx;
}

export function unlockAudio(): Promise<boolean> {
  const a = audio();
  if (!a) return Promise.resolve(false);
  return a.resume().then(() => a.state === "running").catch(() => false);
}

export function audioReady(): boolean {
  return ctx?.state === "running";
}

function tone(
  freq: number,
  start: number,
  dur: number,
  { type = "sine" as OscillatorType, gain = 0.25, slideTo = 0 } = {},
) {
  const a = audio();
  if (!a || a.state !== "running") return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  buzz() {
    tone(140, 0, 0.45, { type: "sawtooth", gain: 0.22 });
    tone(147, 0, 0.45, { type: "square", gain: 0.1 });
  },
  tick() {
    tone(1200, 0, 0.05, { type: "square", gain: 0.06 });
  },
  correct() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3, { type: "triangle", gain: 0.22 }));
  },
  wrong() {
    tone(220, 0, 0.25, { type: "sawtooth", gain: 0.18 });
    tone(165, 0.22, 0.45, { type: "sawtooth", gain: 0.18 });
  },
  reveal() {
    tone(300, 0, 0.6, { type: "sine", gain: 0.15, slideTo: 900 });
  },
  start() {
    tone(660, 0, 0.12, { type: "triangle", gain: 0.18 });
  },
  go() {
    tone(990, 0, 0.3, { type: "triangle", gain: 0.22 });
  },
  join() {
    tone(880, 0, 0.08, { type: "sine", gain: 0.12 });
    tone(1320, 0.07, 0.12, { type: "sine", gain: 0.12 });
  },
  fanfare() {
    [392, 523, 659, 784, 659, 784].forEach((f, i) =>
      tone(f, i * 0.14, i === 5 ? 0.8 : 0.2, { type: "triangle", gain: 0.2 }),
    );
  },
};
