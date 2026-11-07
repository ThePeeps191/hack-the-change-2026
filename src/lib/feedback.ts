"use client";
// Sound and haptics. Sounds are synthesised with WebAudio (no files), quiet by
// design, and silenced by the mute switch or reduced motion. Haptics use the
// Vibration API where it exists (Android); iOS Safari ignores it gracefully.

const KEY = "amble:sound";
let ctx: AudioContext | null = null;

export function soundOn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSound(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
}

function audio() {
  if (!soundOn()) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}

// A detent click, like the Apple Clock picker: a very short filtered noise tick.
export function tick(strength = 1) {
  buzz(4);
  const a = audio();
  if (!a) return;
  const len = Math.floor(a.sampleRate * 0.012);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
  const src = a.createBufferSource();
  src.buffer = buf;
  const bp = a.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 3400;
  bp.Q.value = 1.4;
  const g = a.createGain();
  g.gain.value = 0.22 * strength;
  src.connect(bp).connect(g).connect(a.destination);
  src.start();
}

function tone(freq: number, at: number, dur: number, vol: number) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  const t = a.currentTime + at;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

// Two soft notes rising: a match, a verified proof.
export function chime() {
  buzz([18, 40, 18]);
  tone(660, 0, 0.5, 0.08);
  tone(990, 0.09, 0.7, 0.06);
}

// A low, soft knock: a gentle "not quite".
export function knock() {
  buzz(24);
  tone(220, 0, 0.18, 0.08);
}

// Coins landing: three quick bright taps.
export function coins() {
  buzz([6, 30, 6, 30, 6]);
  [0, 0.06, 0.12].forEach((at, i) => tone(1320 + i * 180, at, 0.12, 0.04));
}
