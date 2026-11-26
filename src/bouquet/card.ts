/** The note card's motion and layout, as pure functions of the clock. */
import { circ, dark, ell, lerp, light, n, rad, type Shape } from './geometry';
import { SPRINGS, T, gustBend, type Clock } from './timing';
import type { Palette } from './types';

export type BowPoint = { x: number; y: number };

/**
 * Where the card is: it starts tucked under the bow and springs down with a
 * tilt, and rocks a little when a breeze passes.
 */
export const cardPose = (ck: Clock, bow: BowPoint) => {
  const v = ck.spring(T.card, SPRINGS.card);
  return {
    v,
    x: lerp(bow.x + 16, 540, v),
    y: lerp(bow.y + 60, 1590, v),
    rotate: lerp(10, -3.5, v) + gustBend(ck, 12) * 0.12,
    scale: lerp(0.5, 1, v),
  };
};

/** Greedy word wrap sized for Caveat on a 600px line; shrinks the type for long notes. */
export const wrapMessage = (message: string) => {
  const words = message.split(/\s+/).filter(Boolean);
  const lay = (max: number) => {
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (next.length > max && cur) {
        lines.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  let size = 50;
  let lines = lay(28);
  if (lines.length > 3) {
    size = 40;
    lines = lay(36);
  }
  return { size, lines: lines.slice(0, 4) };
};

/** A loop of twine from the ribbon knot to the hole in the card's corner. */
export const twineShapes = (ck: Clock, pal: Palette, bow: BowPoint): Shape[] => {
  const grow = ck.ramp(T.twine[0], T.twine[1], 'out');
  if (grow <= 0) return [];
  const p = cardPose(ck, bow);
  const a = rad(p.rotate);
  const [hx, hy] = [-318, -148];
  const wx = p.x + p.scale * (hx * Math.cos(a) - hy * Math.sin(a));
  const wy = p.y + p.scale * (hx * Math.sin(a) + hy * Math.cos(a));
  const L = Math.hypot(wx - bow.x, wy - bow.y) * 1.2;
  return [
    {
      d: `M${bow.x},${bow.y}Q${n((bow.x + wx) / 2 - 30)},${n(Math.max(bow.y, wy) + 50)} ${n(wx)},${n(wy)}`,
      s: dark(pal.kraft, 0.42),
      sw: 3,
      da: n(L),
      dof: n(L * (1 - grow)),
    },
  ];
};

/** A tiny pressed flower printed in the card's corner. */
export const doodle = (pal: Palette): Shape[] => [
  ...[0, 1, 2, 3, 4].map((k) => ({
    d: ell(9, 14),
    f: light(pal.rose, 0.1),
    s: dark(pal.rose, 0.2),
    sw: 1,
    t: `translate(282 -128) rotate(${k * 72}) translate(0 -13)`,
  })),
  { d: circ(282, -128, 6), f: pal.butter, s: dark(pal.butter, 0.3), sw: 1 },
  { d: 'M282,-110C284,-96 292,-86 302,-80', s: dark(pal.sage, 0.15), sw: 2 },
];

