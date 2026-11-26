/**
 * Flat, sticker-style flowers for the middle of the QR code. The bouquet's
 * own flowers have shading and fine petals that turn to mush at this size;
 * these are drawn simply, in the flower's colours, inside a 100 × 100 box.
 */
import { mix, type Shape } from '../bouquet/geometry';
import type { HeadType } from '../bouquet/types';

type Tones = { petal: string; light: string; lighter: string; line: string; center: string };

/** A petal from the centre outwards, pointing up; round or pointed tip. */
const petal = (len: number, w: number, pointed = false, from = 0) =>
  pointed
    ? `M0,${-from}C${w},${-from - len * 0.35} ${w * 0.55},${-from - len * 0.82} 0,${-from - len}C${-w * 0.55},${-from - len * 0.82} ${-w},${-from - len * 0.35} 0,${-from}Z`
    : `M0,${-from}C${w},${-from - len * 0.2} ${w},${-from - len} 0,${-from - len}C${-w},${-from - len} ${-w},${-from - len * 0.2} 0,${-from}Z`;

const ring = (n: number, d: string, f: string, offset = 0, extra: Partial<Shape> = {}): Shape[] =>
  Array.from({ length: n }, (_, i) => ({ d, f, t: `translate(50 50) rotate(${offset + (360 / n) * i})`, ...extra }));

const disc = (cx: number, cy: number, r: number, f: string, extra: Partial<Shape> = {}): Shape => ({
  d: `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`,
  f,
  ...extra,
});

/** A circle with a wavy or zigzag edge. */
const frill = (r: number, depth: number, n: number, f: string, sharp = false): Shape => {
  let d = '';
  for (let i = 0; i <= n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const rr = i % 2 ? r - depth : r;
    const x = 50 + Math.cos(a) * rr;
    const y = 50 + Math.sin(a) * rr;
    if (i === 0) d += `M${x.toFixed(2)},${y.toFixed(2)}`;
    else if (sharp) d += `L${x.toFixed(2)},${y.toFixed(2)}`;
    else {
      const am = (Math.PI * (i - 0.5)) / n - Math.PI / 2;
      const rc = i % 2 ? r + depth * 0.2 : r - depth * 1.2;
      d += `Q${(50 + Math.cos(am) * rc).toFixed(2)},${(50 + Math.sin(am) * rc).toFixed(2)} ${x.toFixed(2)},${y.toFixed(2)}`;
    }
  }
  return { d: d + 'Z', f };
};

const dots = (n: number, r: number, size: number, f: string, offset = 0): Shape[] =>
  Array.from({ length: n }, (_, i) => {
    const a = ((offset + (360 / n) * i) * Math.PI) / 180;
    return disc(50 + Math.cos(a) * r, 50 + Math.sin(a) * r, size, f);
  });

const DRAW: Record<HeadType, (t: Tones) => Shape[]> = {
  daisy: (t) => [...ring(14, petal(44, 6.5), t.petal), ...ring(14, petal(30, 3), t.light, 0, { o: 0.9 }), disc(50, 50, 12, t.center), ...dots(7, 6, 1.6, t.lighter, 10)],
  cosmos: (t) => [...ring(8, petal(44, 15), t.petal, 22), ...ring(8, petal(26, 5), t.light, 22), disc(50, 50, 9, t.center), ...dots(6, 4.5, 1.4, t.lighter)],
  anemone: (t) => [...ring(6, petal(42, 21), t.petal), ...ring(6, petal(26, 10), t.light), disc(50, 50, 12, t.center), ...dots(12, 15.5, 1.8, t.center)],
  sunflower: (t) => [...ring(16, petal(46, 8, true), t.light, 11), ...ring(16, petal(44, 8, true), t.petal), disc(50, 50, 17, t.center), ...dots(10, 10, 2, t.lighter), ...dots(5, 4.5, 1.8, t.lighter, 36)],
  lily: (t) => [
    ...ring(6, petal(46, 13, true), t.petal, 30),
    ...ring(6, petal(30, 2.2, true, 4), t.light, 30),
    ...Array.from({ length: 6 }, (_, i): Shape => ({ d: 'M0,0L0,-17', s: t.line, sw: 1.6, t: `translate(50 50) rotate(${i * 60})` })),
    ...dots(6, 17, 2.6, t.center, -90),
  ],
  tulip: (t) => [
    { d: 'M50,12C66,22 74,40 72,58C70,76 60,86 50,86C40,86 30,76 28,58C26,40 34,22 50,12Z', f: t.light },
    { d: 'M24,34C38,36 50,48 52,64C54,78 46,88 40,88C30,88 22,78 21,62C20,52 21,42 24,34Z', f: t.petal },
    { d: 'M76,34C62,36 50,48 48,64C46,78 54,88 60,88C70,88 78,78 79,62C80,52 79,42 76,34Z', f: t.petal },
    { d: 'M36,52C38,64 42,74 47,80', s: t.lighter, sw: 2, o: 0.9 },
  ],
  rose: (t) => [
    ...ring(5, petal(42, 22), t.petal, 18),
    disc(50, 50, 27, t.light),
    { d: 'M50,50m-4,-1c0,-6 9,-6 9,1c0,8 -14,9 -15,-1c-1,-11 18,-14 21,-2c3,12 -10,20 -21,15', f: 'none', s: t.line, sw: 2.6 },
    { d: 'M30,58C34,70 46,76 58,72', f: 'none', s: t.line, sw: 2.2, o: 0.8 },
  ],
  peony: (t) => [
    ...ring(9, petal(44, 17), t.petal, 10),
    ...ring(7, petal(31, 14), t.light, 0),
    ...ring(5, petal(18, 9), t.lighter, 36),
    disc(50, 50, 5, t.light),
  ],
  ranunculus: (t) => [
    ...ring(10, petal(43, 14), t.petal),
    ...ring(9, petal(32, 12), t.light, 18),
    ...ring(7, petal(21, 9), t.petal, 8),
    ...ring(5, petal(11, 6), t.light, 30),
    disc(50, 50, 3.5, t.center),
  ],
  carnation: (t) => [frill(45, 7, 18, t.petal), frill(33, 6, 14, t.light), frill(20, 5, 10, t.petal), frill(9, 3, 6, t.lighter)],
  hydrangea: (t) => {
    const at: [number, number][] = [[50, 50], [50, 24], [72, 37], [72, 63], [50, 76], [28, 63], [28, 37]];
    return at.flatMap(([x, y], k) => [
      ...[0, 90, 180, 270].map((a): Shape => ({ d: petal(11, 7), f: k % 2 ? t.light : t.petal, t: `translate(${x} ${y}) rotate(${a + 45})` })),
      disc(x, y, 2.4, t.lighter),
    ]);
  },
};

/** Default flower centres when the bouquet doesn't set one. */
const CENTRE: Partial<Record<HeadType, string>> = {
  daisy: '#F2C14E',
  cosmos: '#F2C14E',
  sunflower: '#9A6A3A',
  anemone: '#4A4560',
  lily: '#C8743A',
  ranunculus: '#9DBF8E',
};

export const stickerFlower = (type: HeadType, color: string, deep: string, center?: string): Shape[] =>
  DRAW[type]({
    petal: color,
    light: mix(color, '#ffffff', 0.38),
    lighter: mix(color, '#ffffff', 0.7),
    line: mix(color, deep, 0.4),
    center: center ?? CENTRE[type] ?? mix(color, '#ffffff', 0.5),
  });
