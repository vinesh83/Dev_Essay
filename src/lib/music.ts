// Focus music, composed live in the browser with the Web Audio API. Nothing is
// downloaded and nothing is licensed: every note is generated here, from soft
// chord pads, bell plucks, rain, and gentle lo-fi drums. It never repeats
// exactly, which keeps it easy to tune out while working.

export type StationId = "meadow" | "rain" | "lofi" | "deep";

export const STATIONS: { id: StationId; name: string; icon: string; desc: string }[] = [
  { id: "meadow", name: "Calm Meadow", icon: "🌿", desc: "Warm pads and soft bells" },
  { id: "rain", name: "Rainy Library", icon: "🌧️", desc: "Gentle rain and slow keys" },
  { id: "lofi", name: "Lo-fi Study", icon: "🎧", desc: "Chill beats and mellow chords" },
  { id: "deep", name: "Deep Focus", icon: "🌌", desc: "Slow space drones, no beat" },
];

type Prefs = { on: boolean; station: StationId; vol: number };
const KEY = "dwq-music";

function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "");
    if (p && typeof p.vol === "number") return { on: !!p.on, station: p.station ?? "meadow", vol: p.vol };
  } catch {
    /* first run */
  }
  return { on: false, station: "meadow", vol: 0.5 };
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Chord progressions as MIDI notes. Each chord lasts one bar.
const PROG: Record<StationId, { bpm: number; chords: number[][]; scale: number[] }> = {
  meadow: { bpm: 66, chords: [[50, 57, 61, 66], [47, 54, 57, 62], [43, 50, 54, 59], [45, 52, 57, 61]], scale: [62, 64, 66, 69, 71, 74, 76, 78, 81] },
  rain: { bpm: 58, chords: [[45, 52, 55, 60, 64], [41, 48, 52, 57, 64], [48, 55, 59, 64], [43, 50, 55, 59, 64]], scale: [64, 67, 69, 72, 74, 76, 79] },
  lofi: { bpm: 78, chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], scale: [60, 62, 64, 67, 69, 72, 74] },
  deep: { bpm: 50, chords: [[38, 45, 52, 57], [36, 43, 50, 55], [41, 48, 53, 60], [38, 45, 50, 57]], scale: [57, 60, 62, 64, 67, 69] },
};

class Engine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  dry!: GainNode;
  wet!: GainNode;
  timer = 0;
  nextBeat = 0;
  beat = 0;
  station: StationId = "meadow";
  rainSrc: AudioBufferSourceNode | null = null;
  crackle: AudioBufferSourceNode | null = null;
  noise!: AudioBuffer;

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = (this.ctx = new Ctx());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 7000;
    this.master.connect(tone).connect(comp).connect(ctx.destination);
    this.dry = ctx.createGain();
    this.dry.connect(this.master);
    // Reverb from a generated impulse response.
    const verb = ctx.createConvolver();
    const len = ctx.sampleRate * 3.2;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    verb.buffer = ir;
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.55;
    this.wet.connect(verb).connect(this.master);
    // Shared noise buffer (brownish) for rain, crackle, and drums.
    const n = ctx.sampleRate * 4;
    this.noise = ctx.createBuffer(1, n, ctx.sampleRate);
    const nd = this.noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.04 * w) / 1.04;
      nd[i] = last * 3 + w * 0.15;
    }
  }

  out(node: AudioNode, wet = 0.5) {
    const d = this.ctx!.createGain();
    d.gain.value = 1 - wet * 0.5;
    const w = this.ctx!.createGain();
    w.gain.value = wet;
    node.connect(d).connect(this.dry);
    node.connect(w).connect(this.wet);
  }

  pad(notes: number[], t: number, dur: number, level: number, bright: number) {
    const ctx = this.ctx!;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(bright * 0.6, t);
    f.frequency.linearRampToValueAtTime(bright, t + dur * 0.5);
    f.frequency.linearRampToValueAtTime(bright * 0.6, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + Math.min(2.2, dur * 0.35));
    g.gain.setValueAtTime(level, t + dur - 0.2);
    g.gain.linearRampToValueAtTime(0, t + dur + 2.5);
    f.connect(g);
    this.out(g, 0.7);
    for (const n of notes) {
      for (const det of [-7, 0, 7]) {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = midi(n);
        o.detune.value = det + (Math.random() - 0.5) * 4;
        o.connect(f);
        o.start(t);
        o.stop(t + dur + 2.6);
      }
    }
  }

  bell(n: number, t: number, level: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    this.out(g, 0.6);
    for (const [mult, amp] of [[1, 1], [2, 0.3], [3.01, 0.12]]) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = midi(n) * mult;
      const a = ctx.createGain();
      a.gain.value = amp;
      o.connect(a).connect(g);
      o.start(t);
      o.stop(t + 2.5);
    }
  }

  keys(notes: number[], t: number, level: number) {
    // Soft electric piano: sine plus a little bell, with tremolo.
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + 0.02);
    g.gain.exponentialRampToValueAtTime(level * 0.3, t + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
    const trem = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoAmt = ctx.createGain();
    lfo.frequency.value = 4.5;
    lfoAmt.gain.value = 0.18;
    lfo.connect(lfoAmt).connect(trem.gain);
    trem.gain.value = 0.82;
    g.connect(trem);
    this.out(trem, 0.45);
    lfo.start(t);
    lfo.stop(t + 3.6);
    notes.forEach((n, i) => {
      const at = t + i * 0.025; // a gentle strum
      for (const [mult, amp] of [[1, 1], [2, 0.18], [4, 0.04]]) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = midi(n) * mult;
        const a = ctx.createGain();
        a.gain.value = amp / notes.length;
        o.connect(a).connect(g);
        o.start(at);
        o.stop(t + 3.6);
      }
    });
  }

  drum(kind: "kick" | "snare" | "hat", t: number, level: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    if (kind === "kick") {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
      g.gain.setValueAtTime(level, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.42);
      this.out(g, 0.05);
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = kind === "snare" ? "bandpass" : "highpass";
    f.frequency.value = kind === "snare" ? 1600 : 6500;
    const len = kind === "snare" ? 0.22 : 0.05;
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(f).connect(g);
    src.start(t, Math.random() * 3);
    src.stop(t + len + 0.02);
    this.out(g, kind === "snare" ? 0.35 : 0.1);
  }

  loopNoise(kind: "rain" | "crackle") {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    if (kind === "rain") {
      f.type = "bandpass";
      f.frequency.value = 2400;
      f.Q.value = 0.4;
      g.gain.value = 0.22;
    } else {
      f.type = "highpass";
      f.frequency.value = 3500;
      g.gain.value = 0.035;
    }
    src.connect(f).connect(g);
    this.out(g, 0.2);
    src.start();
    return src;
  }

  schedule = () => {
    const ctx = this.ctx!;
    const p = PROG[this.station];
    const spb = 60 / p.bpm; // seconds per beat
    while (this.nextBeat < ctx.currentTime + 0.4) {
      const t = this.nextBeat;
      const b = this.beat;
      const bar = Math.floor(b / 4);
      const chord = p.chords[bar % p.chords.length];
      const r = Math.random;
      if (this.station === "meadow") {
        if (b % 4 === 0) this.pad(chord, t, spb * 4, 0.05, 1400);
        for (const half of [0, 0.5]) if (r() < 0.32) this.bell(p.scale[Math.floor(r() * p.scale.length)], t + half * spb, 0.07);
      } else if (this.station === "rain") {
        if (b % 4 === 0) {
          this.pad(chord.map((n) => n - 12).slice(0, 2), t, spb * 4, 0.035, 600);
          this.keys(chord, t, 0.12);
        }
        if (b % 4 === 2 && r() < 0.6) this.bell(p.scale[Math.floor(r() * p.scale.length)] + 12, t, 0.035);
      } else if (this.station === "lofi") {
        if (b % 4 === 0) this.keys(chord, t, 0.13);
        if (b % 4 === 2 && r() < 0.5) this.keys(chord.slice(1), t + spb * 0.5, 0.07);
        const swing = spb * 0.08;
        if (b % 4 === 0 || (b % 4 === 2 && r() < 0.35)) this.drum("kick", t, 0.5);
        if (b % 4 === 3 && r() < 0.25) this.drum("kick", t + spb * 0.5 + swing, 0.35);
        if (b % 2 === 1) this.drum("snare", t, 0.22);
        this.drum("hat", t, 0.05);
        this.drum("hat", t + spb * 0.5 + swing, 0.035);
        if (r() < 0.12) this.bell(p.scale[Math.floor(r() * p.scale.length)] + 12, t, 0.03);
      } else {
        if (b % 8 === 0) this.pad(chord, t, spb * 8, 0.05, 700);
        if (b % 4 === 0 && r() < 0.5) this.bell(p.scale[Math.floor(r() * p.scale.length)], t, 0.045);
      }
      this.nextBeat += spb;
      this.beat++;
    }
  };

  play(station: StationId, vol: number) {
    this.init();
    const ctx = this.ctx!;
    void ctx.resume();
    this.stopSounds();
    this.station = station;
    this.beat = 0;
    this.nextBeat = ctx.currentTime + 0.1;
    if (station === "rain") this.rainSrc = this.loopNoise("rain");
    if (station === "lofi") this.crackle = this.loopNoise("crackle");
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(vol * 0.9, ctx.currentTime, 0.8);
    this.timer = window.setInterval(this.schedule, 100);
    this.schedule();
  }

  stopSounds() {
    clearInterval(this.timer);
    this.timer = 0;
    this.rainSrc?.stop();
    this.crackle?.stop();
    this.rainSrc = this.crackle = null;
  }

  stop() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    this.stopSounds();
    setTimeout(() => {
      if (!this.timer) void ctx.suspend();
    }, 2500);
  }

  volume(v: number) {
    if (this.ctx && this.timer) this.master.gain.setTargetAtTime(v * 0.9, this.ctx.currentTime, 0.2);
  }
}

const engine = new Engine();
let prefs = loadPrefs();
const listeners = new Set<() => void>();
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* private mode */
  }
  listeners.forEach((l) => l());
};

export const music = {
  get: () => prefs,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },
  toggle() {
    prefs = { ...prefs, on: !prefs.on };
    if (prefs.on) engine.play(prefs.station, prefs.vol);
    else engine.stop();
    save();
  },
  setStation(id: StationId) {
    prefs = { ...prefs, station: id, on: true };
    engine.play(id, prefs.vol);
    save();
  },
  setVolume(v: number) {
    prefs = { ...prefs, vol: v };
    engine.volume(v);
    save();
  },
  /** Browsers block sound until a tap, so resume a saved "on" at the first tap. */
  resumeOnGesture() {
    if (!prefs.on) return;
    const go = () => {
      window.removeEventListener("pointerdown", go);
      window.removeEventListener("keydown", go);
      if (prefs.on) engine.play(prefs.station, prefs.vol);
    };
    window.addEventListener("pointerdown", go);
    window.addEventListener("keydown", go);
  },
};
