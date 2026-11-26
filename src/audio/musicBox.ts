/**
 * A soft music-box waltz made with the Web Audio API, so the site needs no
 * audio file. Browsers only allow sound after a user gesture, so call
 * `start()` from a click handler (the "Tap to open" button).
 *
 * To use your own track instead, put an mp3 in /public and set
 * VITE_AUDIO_SRC=./your-song.mp3 in a .env file (see App.tsx).
 */

// [MIDI note, beats]. An original tune on the C-major pentatonic scale, in 3/4.
const MELODY: [number, number][] = [
  [76, 1], [79, 1], [84, 1], [81, 2], [79, 1],
  [76, 1], [74, 1], [72, 1], [74, 3],
  [76, 1], [79, 1], [81, 1], [84, 2], [81, 1],
  [79, 1], [76, 1], [74, 1], [72, 3],
];
// One low note at the start of each 3-beat bar.
const BASS = [48, 45, 41, 43, 48, 45, 43, 48];

const BEAT = 0.42; // seconds (about 143 bpm, felt as a slow one-in-a-bar waltz)
const VOLUME = 0.16;

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export class MusicBox {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private nextTime = 0;
  private index = 0;
  private beatInLoop = 0;
  private muted = false;

  /** Starts the audio (call from a click). `melody: false` only enables the breeze whoosh. */
  start(melody = true) {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 3200;
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(lowpass).connect(this.ctx.destination);
    }
    void this.ctx.resume();
    this.fadeTo(this.muted ? 0 : VOLUME, 0.6);
    if (melody && this.timer === null) {
      this.nextTime = this.ctx.currentTime + 0.15;
      this.timer = window.setInterval(this.schedule, 60);
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx) this.fadeTo(muted ? 0 : VOLUME, 0.25);
  }

  /** Pause/resume with the page (no sound while the tab is hidden). */
  suspend() {
    void this.ctx?.suspend();
  }

  resume() {
    void this.ctx?.resume();
  }

  /** A soft breath of wind: band-passed noise that sweeps up and fades. */
  whoosh() {
    if (!this.ctx || !this.master || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const dur = 1.4;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 7;
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 16807) % 2147483647;
      data[i] = (seed / 2147483647) * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.8;
    band.frequency.setValueAtTime(380, now);
    band.frequency.exponentialRampToValueAtTime(1500, now + 0.45);
    band.frequency.exponentialRampToValueAtTime(320, now + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(1.6, now + 0.25);
    env.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(band).connect(env).connect(this.master);
    src.start(now);
    src.stop(now + dur);
  }

  stop() {
    this.fadeTo(0, 0.4);
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  private fadeTo(value: number, seconds: number) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(value, now + seconds);
  }

  // Look-ahead scheduler: queue notes slightly ahead of the audio clock.
  private schedule = () => {
    if (!this.ctx) return;
    while (this.nextTime < this.ctx.currentTime + 0.3) {
      const [note, beats] = MELODY[this.index];
      if (this.beatInLoop % 3 === 0) {
        const bar = Math.floor(this.beatInLoop / 3) % BASS.length;
        this.pluck(freq(BASS[bar]), this.nextTime, 2.4, 0.35);
      }
      this.pluck(freq(note), this.nextTime, 1.6, 0.5);
      this.nextTime += beats * BEAT;
      this.beatInLoop += beats;
      this.index = (this.index + 1) % MELODY.length;
      if (this.index === 0) this.beatInLoop = 0;
    }
  };

  /** A tine: a sine with a quiet octave partial and a fast attack, long decay. */
  private pluck(hz: number, at: number, decay: number, level: number) {
    if (!this.ctx || !this.master) return;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(level, at + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0008, at + decay);
    env.connect(this.master);
    for (const [mult, amp] of [[1, 1], [2, 0.18], [3.01, 0.06]] as const) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = hz * mult;
      g.gain.value = amp;
      osc.connect(g).connect(env);
      osc.start(at);
      osc.stop(at + decay + 0.05);
    }
  }
}
