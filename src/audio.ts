// Tiny procedural audio engine — no asset files. Everything is synthesised with
// the Web Audio API so the game ships as pure code. One shared AudioContext,
// three gain buses (master / sfx / music), a localStorage-backed mute toggle,
// and a slow pentatonic "đàn tranh"-flavoured ambient loop.

const MUTE_KEY = "vo-sinh-lang-tre-muted";

type ToneOpts = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  attack?: number;
  release?: number;
  gain?: number;
  slideTo?: number;
  when?: number;
  bus?: GainNode;
};

class AudioEngine {
  private ctx?: AudioContext;
  private master?: GainNode;
  private sfxBus?: GainNode;
  private musicBus?: GainNode;
  private noiseBuffer?: AudioBuffer;
  private muted = false;
  private musicTimer?: number;
  private nextNoteTime = 0;
  private musicStep = 0;
  private started = false;

  // Pentatonic scale (C D E G A) across two octaves — calm, East-Asian feel.
  private readonly scale = [
    261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99,
  ];

  constructor() {
    this.muted = (() => {
      try {
        return window.localStorage.getItem(MUTE_KEY) === "1";
      } catch {
        return false;
      }
    })();
  }

  // Must be called from a user gesture (keydown / pointerdown) or browsers keep
  // the context suspended. Safe to call repeatedly.
  unlock() {
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMuted(value: boolean) {
    this.muted = value;
    try {
      window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(value ? 0 : 0.9, this.ctx.currentTime, 0.05);
    }
  }

  private ensure(): AudioContext {
    if (this.ctx) return this.ctx;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.9;
    master.connect(ctx.destination);
    const sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.9;
    sfxBus.connect(master);
    const musicBus = ctx.createGain();
    musicBus.gain.value = 0.32;
    musicBus.connect(master);

    // Shared white-noise buffer for thuds / splashes / footsteps.
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    this.ctx = ctx;
    this.master = master;
    this.sfxBus = sfxBus;
    this.musicBus = musicBus;
    this.noiseBuffer = buffer;
    return ctx;
  }

  private tone(opts: ToneOpts) {
    const ctx = this.ensure();
    const bus = opts.bus ?? this.sfxBus!;
    const t0 = opts.when ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + opts.dur);
    const env = ctx.createGain();
    const peak = opts.gain ?? 0.3;
    const attack = opts.attack ?? 0.006;
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    osc.connect(env).connect(bus);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.02);
  }

  private noise(opts: {
    dur: number;
    gain?: number;
    filter?: number;
    type?: BiquadFilterType;
    q?: number;
    when?: number;
  }) {
    const ctx = this.ensure();
    const t0 = opts.when ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer!;
    const filter = ctx.createBiquadFilter();
    filter.type = opts.type ?? "lowpass";
    filter.frequency.setValueAtTime(opts.filter ?? 1200, t0);
    filter.Q.value = opts.q ?? 0.8;
    const env = ctx.createGain();
    const peak = opts.gain ?? 0.3;
    env.gain.setValueAtTime(peak, t0);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    src.connect(filter).connect(env).connect(this.sfxBus!);
    src.start(t0);
    src.stop(t0 + opts.dur + 0.02);
  }

  // ---- SFX ----------------------------------------------------------------

  swing() {
    this.noise({ dur: 0.16, gain: 0.18, filter: 1700, type: "bandpass", q: 1.2 });
  }

  hit(combo = 0) {
    const base = 150 + Math.min(combo, 8) * 18;
    this.noise({ dur: 0.12, gain: 0.32, filter: 900 });
    this.tone({ freq: base, slideTo: base * 0.6, dur: 0.12, type: "square", gain: 0.16 });
  }

  defeat() {
    this.noise({ dur: 0.22, gain: 0.34, filter: 700 });
    this.tone({ freq: 196, slideTo: 110, dur: 0.26, type: "triangle", gain: 0.22 });
    this.tone({ freq: 392, slideTo: 220, dur: 0.2, type: "sine", gain: 0.14 });
  }

  collect() {
    const t = this.ctx ? this.ctx.currentTime : 0;
    this.tone({ freq: 659.25, dur: 0.1, type: "triangle", gain: 0.18, when: t });
    this.tone({ freq: 987.77, dur: 0.14, type: "triangle", gain: 0.16, when: t + 0.06 });
  }

  levelUp() {
    const ctx = this.ensure();
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.tone({ freq: f, dur: 0.3, type: "triangle", gain: 0.2, when: t + i * 0.09 });
    });
  }

  gate() {
    const ctx = this.ensure();
    const t = ctx.currentTime;
    [392.0, 523.25, 659.25].forEach((f, i) => {
      this.tone({ freq: f, dur: 0.6, type: "sine", gain: 0.18, when: t + i * 0.12 });
    });
    this.noise({ dur: 0.5, gain: 0.12, filter: 400, when: t });
  }

  splash() {
    this.noise({ dur: 0.3, gain: 0.22, filter: 2200, type: "highpass", q: 0.6 });
  }

  step() {
    this.noise({ dur: 0.06, gain: 0.05, filter: 500 });
  }

  blip() {
    this.tone({ freq: 520, dur: 0.05, type: "square", gain: 0.08 });
  }

  ui() {
    this.tone({ freq: 660, dur: 0.07, type: "triangle", gain: 0.12 });
  }

  // ---- Ambient music ------------------------------------------------------

  startMusic() {
    if (this.started) return;
    this.ensure();
    this.started = true;
    this.nextNoteTime = this.ctx!.currentTime + 0.2;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 220);
  }

  stopMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = undefined;
    this.started = false;
  }

  private scheduleMusic() {
    const ctx = this.ctx;
    if (!ctx) return;
    const beat = 0.62; // seconds per step — slow, meditative
    while (this.nextNoteTime < ctx.currentTime + 0.4) {
      const t = this.nextNoteTime;
      // Melody: mostly notes, sometimes a rest, occasional octave leap.
      const r = Math.random();
      if (r > 0.22) {
        const idx = Math.floor(Math.random() * this.scale.length);
        const freq = this.scale[idx];
        this.tone({
          freq,
          dur: 1.1,
          type: "triangle",
          gain: 0.12,
          attack: 0.02,
          when: t,
          bus: this.musicBus,
        });
        // gentle shimmer a fifth up, quieter
        if (Math.random() > 0.6) {
          this.tone({
            freq: freq * 1.5,
            dur: 0.9,
            type: "sine",
            gain: 0.05,
            when: t + 0.04,
            bus: this.musicBus,
          });
        }
      }
      // Soft bass drone every 4 steps for grounding.
      if (this.musicStep % 4 === 0) {
        this.tone({
          freq: 130.81,
          dur: 2.4,
          type: "sine",
          gain: 0.09,
          attack: 0.08,
          when: t,
          bus: this.musicBus,
        });
      }
      this.musicStep++;
      this.nextNoteTime += beat;
    }
  }
}

export const audio = new AudioEngine();
