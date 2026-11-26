/**
 * Stand-ins for the three Remotion helpers the pure bouquet code uses, so the
 * same scene can run outside Remotion (the Design canvas preview).
 * `spring` is the closed-form solution of the same damped spring.
 */
type Cfg = { mass?: number; damping?: number; stiffness?: number };
export type SpringConfig = Required<Cfg> & { overshootClamping: boolean };

export const spring = ({ frame, fps, config = {} }: { frame: number; fps: number; config?: Cfg }) => {
  const t = frame / fps;
  if (t <= 0) return 0;
  const m = config.mass ?? 1;
  const k = config.stiffness ?? 100;
  const c = config.damping ?? 10;
  const w0 = Math.sqrt(k / m);
  const z = c / (2 * Math.sqrt(k * m));
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  if (z === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const s = Math.sqrt(z * z - 1);
  const r1 = -w0 * (z - s);
  const r2 = -w0 * (z + s);
  return 1 + (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r1 - r2);
};

type Fn = (t: number) => number;
export const Easing = {
  cubic: ((t: number) => t * t * t) as Fn,
  out: (f: Fn): Fn => (t) => 1 - f(1 - t),
  inOut: (f: Fn): Fn => (t) => (t < 0.5 ? f(t * 2) / 2 : 1 - f((1 - t) * 2) / 2),
};

export const interpolate = (x: number, [a, b]: number[], [c, d]: number[], opts: { easing?: Fn } = {}) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return c + (d - c) * (opts.easing ? opts.easing(t) : t);
};
