// Little reward sounds, made with the Web Audio API (no files). Short,
// soft, and pitched up as a combo grows, so a streak of correct keys
// "climbs". Parents or Dev can switch them off in the music menu.

const KEY = "dwq-sfx";
let on = (() => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
})();
const subs = new Set<() => void>();
let ctx: AudioContext | null = null;
let out: GainNode | null = null;

function ac() {
  if (!on) return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    out = ctx.createGain();
    out.gain.value = 0.22;
    out.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = "sine", vol = 1) {
  const c = ac();
  if (!c || !out) return;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const note = (n: number) => 523.25 * Math.pow(2, n / 12);

export const sfx = {
  get: () => on,
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => void subs.delete(fn);
  },
  toggle() {
    on = !on;
    try {
      localStorage.setItem(KEY, on ? "on" : "off");
    } catch {
      /* ignore */
    }
    subs.forEach((f) => f());
  },
  /** A soft tick for each correct key; climbs a scale as the combo grows. */
  key(combo: number) {
    const step = PENTA[Math.min(PENTA.length - 1, Math.floor(combo / 5))];
    tone(note(step), 0, 0.07, "triangle", 0.35);
  },
  miss() {
    tone(150, 0, 0.12, "sine", 0.5);
  },
  coin() {
    tone(note(12), 0, 0.08, "square", 0.25);
    tone(note(19), 0.07, 0.16, "square", 0.25);
  },
  right() {
    tone(note(4), 0, 0.12, "triangle", 0.6);
    tone(note(7), 0.08, 0.12, "triangle", 0.6);
    tone(note(12), 0.16, 0.25, "triangle", 0.6);
  },
  combo(level: number) {
    [0, 4, 7, 12].forEach((n, i) => tone(note(n + level * 2), i * 0.06, 0.2, "triangle", 0.5));
  },
  fanfare() {
    [0, 4, 7, 12, 7, 12, 16].forEach((n, i) => tone(note(n), i * 0.09, 0.3, "triangle", 0.55));
  },
  wrong() {
    tone(220, 0, 0.15, "sine", 0.4);
    tone(196, 0.12, 0.2, "sine", 0.4);
  },
};
