import { Easing, interpolate, spring, type SpringConfig } from 'remotion';

/**
 * The choreography, in frames at 30 fps.
 *   0–45    paper fades in, wax seal + sparkles
 *   30–120  stems draw up, leaves spring out (staggered ~6 frames)
 *   90–190  flower heads bloom petal by petal
 *   160–230 container (wrap / basket / vase / box / ribbon) and bow
 *   210–300 note card slides out, text writes in
 *   240+    wind sway and drifting petals, looping seamlessly forever
 */
export const T = {
  paperFade: [0, 30],
  sealIn: 4,
  sealMove: [46, 84],
  sparkles: 10,
  heading: [50, 80],
  name: [60, 94],
  stemsFrom: 30,
  stemStagger: 6,
  stemGrow: 44,
  bloomFrom: 92,
  bloomStagger: 12,
  tissue: [158, 163],
  backKraft: 166,
  leftPanel: 174,
  rightPanel: 184,
  band: 198,
  knot: 204,
  loops: [207, 210],
  tails: 214,
  card: 212,
  cardTo: [234, 252],
  cardLines: 244,
  cardFrom: [268, 288],
  twine: [236, 258],
  sway: [190, 260],
  petals: 240,
} as const;

/** Length of the intro; everything has settled by here. */
export const INTRO_FRAMES = 360;

/**
 * Every ambient motion (sway, wobble, drifting petals) repeats exactly every
 * AMBIENT_PERIOD frames, so the bouquet can keep moving after the intro
 * without a visible jump.
 */
export const AMBIENT_PERIOD = 720;

/** A sine that completes `cycles` whole turns per ambient period. */
export const wave = (frame: number, cycles: number, phase = 0) =>
  Math.sin((2 * Math.PI * cycles * frame) / AMBIENT_PERIOD + phase);

type Cfg = Pick<SpringConfig, 'mass' | 'damping' | 'stiffness'>;

export const SPRINGS = {
  /** Petal pops: a little overshoot. */
  bloom: { mass: 0.6, damping: 9, stiffness: 120 },
  /** Paper and ribbon: settles quickly. */
  soft: { mass: 1, damping: 14, stiffness: 90 },
  /** Bow loops: a clear bounce. */
  bouncy: { mass: 0.7, damping: 8, stiffness: 110 },
  card: { mass: 1, damping: 15, stiffness: 70 },
  seal: { mass: 0.8, damping: 12, stiffness: 120 },
} satisfies Record<string, Cfg>;

export type Ease = 'out' | 'inOut';

/**
 * A tiny time API the pure geometry code reads from, so the same drawing
 * functions work for any frame. Everything is derived from the frame number
 * and the list of gust frames: no randomness, no wall-clock time.
 */
export type Clock = {
  frame: number;
  /** Frames at which a breeze was blown. */
  gusts: number[];
  /** Spring progress for something that starts at frame `at`. 0 before it starts. */
  spring: (at: number, cfg: Cfg) => number;
  /** 0→1 between frames `from` and `to`, clamped. */
  ramp: (from: number, to: number, ease?: Ease) => number;
};

const EASINGS = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
};

export const makeClock = (frame: number, fps: number, gusts: number[] = []): Clock => ({
  frame,
  gusts,
  spring: (at, cfg) => (frame <= at ? 0 : spring({ frame: frame - at, fps, config: cfg })),
  ramp: (from, to, ease) =>
    interpolate(frame, [from, to], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease ? EASINGS[ease] : undefined,
    }),
});

/** How long one gust takes to die away. */
export const GUST_FRAMES = 200;

/**
 * Bend in degrees caused by every gust so far: a push to the right, then a
 * damped swing back and forth. `lag` delays it so the gust sweeps across
 * the bouquet from left to right.
 */
export const gustBend = (ck: Clock, lag = 0) => {
  let a = 0;
  for (const g of ck.gusts) {
    const t = ck.frame - g - lag;
    if (t <= 0 || t > GUST_FRAMES) continue;
    a += 20 * (1 - Math.exp(-t / 4)) * Math.exp(-t / 40) * Math.cos(t / 10);
  }
  return Math.max(-24, Math.min(24, a));
};
