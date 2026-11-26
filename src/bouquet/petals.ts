/** Drifting and breeze-blown petals, as pure functions of the clock. */
import type { Calm } from './flowers';
import { dark, light, n, rnd, type Shape } from './geometry';
import { AMBIENT_PERIOD, GUST_FRAMES, T, wave, type Clock } from './timing';
import type { Palette } from './types';

const PETAL = 'M0,0C-14,-8 -16,-34 0,-42C16,-34 14,-8 0,0Z';
/** Petals fall through this many px per ambient period, then wrap to the top. */
const FALL = 2160;

const petalColors = (pal: Palette) => [
  pal.rose, light(pal.rose, 0.3), pal.butter, pal.tissue, pal.rose, '#FFFDF7', light(pal.butter, 0.2), dark(pal.rose, 0.08),
];

/**
 * Eight loose petals drifting down from frame 240. Every motion completes a
 * whole number of cycles per AMBIENT_PERIOD, so the drift loops forever
 * without a jump: a wrapping fall, a sideways sine, a spin and a cos()
 * "flip" on the x-scale so each petal flutters.
 */
export const driftingPetals = (ck: Clock, pal: Palette, calm: Calm): Shape[] => {
  const f = ck.frame;
  if (f < T.petals || calm.sway === 0) return [];
  const fade = ck.ramp(T.petals, T.petals + 32, 'out');
  const t = f - T.petals;
  return petalColors(pal).map((c, i) => {
    const y = -120 + ((((140 + ((i * 331) % 1250) + 120 + (t * FALL) / AMBIENT_PERIOD) % FALL) + FALL) % FALL);
    const x = 110 + ((i * 379) % 860) + 46 * wave(f, 5, i * 1.3);
    const spin = i * 50 + ((i % 2 ? 2 : -2) * 360 * f) / AMBIENT_PERIOD;
    const flip = Math.cos((2 * Math.PI * 7 * f) / AMBIENT_PERIOD + i);
    return { d: PETAL, f: c, s: dark(c, 0.2), sw: 1, o: n(fade * 0.9), t: `translate(${n(x)} ${n(y)}) rotate(${n(spin)}) scale(${n(flip * 0.95)} 0.95)` };
  });
};

/** Each breeze tears a handful of petals off the bouquet and carries them off to the right. */
export const gustPetals = (ck: Clock, pal: Palette): Shape[] => {
  const out: Shape[] = [];
  const colors = petalColors(pal);
  ck.gusts.forEach((g, gi) => {
    const t = ck.frame - g;
    if (t <= 0 || t > GUST_FRAMES) return;
    for (let j = 0; j < 10; j++) {
      const r1 = rnd(gi * 13 + j, 7);
      const r2 = rnd(j, gi * 5 + 3);
      const lt = t - j * 2.5;
      if (lt <= 0) continue;
      const x = 220 + j * 64 + lt * (8 + r1 * 7);
      const y = 640 + r2 * 360 - lt * (1.6 + r2) + lt * lt * 0.012;
      const o = Math.min(1, lt / 6) * Math.max(0, 1 - Math.max(0, lt - 70) / 50);
      if (o <= 0 || x > 1180) continue;
      const c = colors[(j + gi) % colors.length];
      out.push({
        d: PETAL, f: c, s: dark(c, 0.2), sw: 1, o: n(o * 0.95),
        t: `translate(${n(x)} ${n(y)}) rotate(${n(j * 40 + lt * (6 + r1 * 6))}) scale(${n(Math.cos(lt / 5 + j) * 1.25)} 1.25)`,
      });
    }
  });
  return out;
};

