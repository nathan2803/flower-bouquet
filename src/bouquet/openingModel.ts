/** The opening beat (wax seal, sparkles, heading) as a pure function of the clock. */
import { circ, clamp01, dark, lerp, light, n, rad, sc, type Shape } from './geometry';
import { SPRINGS, T, type Clock } from './timing';
import type { Palette } from './types';

const STAR = 'M0,-18C2,-5 5,-2 18,0C5,2 2,5 0,18C-2,5 -5,2 -18,0C-5,-2 -2,-5 0,-18Z';

/** A slightly wobbly wax disc. */
export const SEAL_PATH = (() => {
  let d = '';
  for (let k = 0; k <= 72; k++) {
    const a = (k / 72) * Math.PI * 2;
    const r = 72 + 3.5 * Math.sin(a * 9) + 2 * Math.sin(a * 5 + 1);
    d += `${k ? 'L' : 'M'}${n(Math.cos(a) * r)},${n(Math.sin(a) * r)}`;
  }
  return `${d}Z`;
})();

export const SEAL_RING = circ(0, 0, 52);

/**
 * Frames 0–95: a wax seal with the recipient's initial lands in the middle
 * with sparkles, then floats up under the heading as the name fades in.
 */
export const openingModel = (ck: Clock, pal: Palette) => {
  const f = ck.frame;
  const v = ck.spring(T.sealIn, SPRINGS.seal);
  const move = ck.ramp(T.sealMove[0], T.sealMove[1], 'inOut');
  const shrink = lerp(1, 0.38, move);
  const x = 540;
  const y = lerp(900, 372, move);
  const wax = dark(pal.rose, 0.32);

  const sparkles: Shape[] = [];
  for (let k = 0; k < 8; k++) {
    const z = Math.sin(Math.PI * clamp01((f - T.sparkles - k * 2.5) / 28));
    if (z <= 0.001) continue;
    const a = rad(k * 45 + 20);
    const R = (128 + (k % 2) * 28) * shrink;
    sparkles.push({
      d: STAR,
      f: light(pal.butter, 0.1),
      s: dark(pal.butter, 0.25),
      sw: 1,
      t: `translate(${n(x + Math.cos(a) * R)} ${n(y + Math.sin(a) * R)}) rotate(${n(f * 2 + k * 20)}) scale(${n(z * (k % 2 ? 0.8 : 1.1))})`,
    });
  }

  const o1 = ck.ramp(T.heading[0], T.heading[1], 'out');
  const o2 = ck.ramp(T.name[0], T.name[1], 'out');
  return {
    seal: {
      t: `translate(${x} ${n(y)}) scale(${sc(Math.max(0, v) * shrink)})`,
      o: n(clamp01(v * 2)),
      wax,
      emboss: light(wax, 0.42),
    },
    sparkles,
    heading: { o: n(o1), y: n(176 + (1 - o1) * 18) },
    name: { o: n(o2), y: n(300 + (1 - o2) * 22) },
  };
};
