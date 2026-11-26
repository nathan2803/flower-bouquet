/**
 * The flower library. Each type is one entry in FLOWER_TYPES: either a
 * `head` (drawn in front, blooms petal by petal) or a `filler` (drawn along
 * the stem, behind the heads). To add your own type, add it to HeadType or
 * FillerType in types.ts and give it an entry here.
 */
import { CONTAINERS } from './containers';
import {
  CX,
  bez, bezAngle, bezLength, bezPath, circ, clamp01, dark, ell, light, mix, n, rad, rnd, sc, vis,
  withTransform, type Cubic, type Shape,
} from './geometry';
import { SPRINGS, T, gustBend, wave, type Clock } from './timing';
import type { Arrangement, ContainerType, FlowerSpec, FlowerType, Palette } from './types';

/** Bloom progress for a petal that opens `delay` frames after its flower starts. */
type Bloom = (delay: number) => number;
type HeadOptions = { center?: string; petals?: number };
type Head = (color: string, bloom: Bloom, pal: Palette, o: HeadOptions) => Shape[];
type Filler = (el: LaidOutFlower, ck: Clock, pal: Palette) => Shape[];

type FlowerDef = {
  /** Palette key or hex used when a spec gives no colour. */
  color: string;
  /** Base size multiplier. */
  scale: number;
  /** Default number of leaves on a head flower's stem. */
  leaves?: number;
  /** Leaf size multiplier (sunflowers have big leaves, carnations narrow ones). */
  leafSize?: [number, number];
  head?: Head;
  filler?: Filler;
  /** Faces along its stem (tulip) instead of facing the viewer. */
  followStem?: boolean;
};

const LEAF = 'M0,0C14,-16 44,-18 66,0C44,18 14,16 0,0Z';
const LEAF_RIB = 'M5,0C24,-2 44,-2 62,0';

const ringPetals = (
  out: Shape[], d: string, count: number, fill: string, stroke: string, bloom: Bloom,
  { delay = 0, step = 1.2, rot = 0, size = 1, unfurl = 0 } = {},
) => {
  for (let k = 0; k < count; k++) {
    const v = bloom(delay + k * step);
    const a = (k * 360) / count + rot - (1 - Math.min(1, v)) * unfurl;
    out.push({ d, f: fill, s: stroke, sw: 1.3, o: vis(v), t: `rotate(${n(a)}) scale(${sc(size * v)})` });
  }
};

// ---------- heads (drawn around 0,0 at roughly 90px radius) ----------

const ROSE_PETAL = 'M0,0C-52,-12 -60,-78 -20,-92C-8,-97 8,-97 20,-92C60,-78 52,-12 0,0Z';
const SEPAL = 'M0,0C-12,-24 -10,-70 0,-104C10,-70 12,-24 0,0Z';

const rose: Head = (C, bloom, pal) => {
  const out: Shape[] = [];
  ringPetals(out, SEPAL, 5, dark(pal.sage, 0.15), 'none', bloom, { step: 1.5, rot: 18 });
  // Outer → inner so inner rings sit on top; inner rings open first.
  ringPetals(out, ROSE_PETAL, 6, light(C, 0.16), dark(C, 0.3), bloom, { delay: 16, step: 2, rot: 10, unfurl: 28 });
  ringPetals(out, ROSE_PETAL, 5, C, dark(C, 0.3), bloom, { delay: 9, step: 2, rot: 46, size: 0.74, unfurl: 28 });
  ringPetals(out, ROSE_PETAL, 4, dark(C, 0.1), dark(C, 0.3), bloom, { delay: 3, step: 2, rot: 20, size: 0.5, unfurl: 28 });
  const bud = `scale(${sc(bloom(0))})`;
  out.push({ d: circ(0, 0, 24), f: dark(C, 0.16), t: bud });
  out.push({ d: 'M-2,-6C8,-10 12,2 4,8C-6,14 -16,2 -10,-10C-2,-22 18,-18 20,0', s: dark(C, 0.42), sw: 2.6, t: bud });
  out.push({ d: ell(30, 18), f: '#ffffff', o: n(0.16 * clamp01(bloom(0))), t: `translate(-22 -30) rotate(-30) ${bud}` });
  return out;
};

const tulip: Head = (C, bloom) => {
  const [v0, v1, v2, v3] = [bloom(0), bloom(4), bloom(7), bloom(11)];
  return [
    { d: 'M0,0C-34,-6 -44,-60 -30,-104C-22,-112 -10,-96 0,-108C10,-96 22,-112 30,-104C44,-60 34,-6 0,0Z', f: dark(C, 0.14), s: dark(C, 0.3), sw: 1.4, o: vis(v0), t: `scale(${n(0.85 + 0.15 * clamp01(v0))} ${sc(v0)})` },
    { d: 'M0,0C-40,-2 -52,-52 -36,-100C-20,-86 -6,-60 4,-30C6,-16 4,-6 0,0Z', f: C, s: dark(C, 0.28), sw: 1.4, o: vis(v1), t: `rotate(${n(-12 * v1)}) scale(1 ${sc(v1)})` },
    { d: 'M0,0C40,-2 52,-52 36,-100C20,-86 6,-60 -4,-30C-6,-16 -4,-6 0,0Z', f: light(C, 0.08), s: dark(C, 0.28), sw: 1.4, o: vis(v2), t: `rotate(${n(12 * v2)}) scale(1 ${sc(v2)})` },
    { d: 'M0,0C-28,-4 -36,-50 -20,-92C-12,-100 -4,-90 0,-96C4,-90 12,-100 20,-92C36,-50 28,-4 0,0Z', f: light(C, 0.16), s: dark(C, 0.24), sw: 1.4, o: vis(v3), t: `scale(1 ${sc(v3)})` },
    { d: 'M0,-6C-2,-40 0,-70 0,-86', s: dark(C, 0.2), sw: 1.6, o: n(0.55 * clamp01(v3)), t: `scale(1 ${sc(v3)})` },
  ];
};

const DAISY_PETAL = 'M0,-14C-10,-28 -11,-70 0,-84C11,-70 10,-28 0,-14Z';

const discCenter = (out: Shape[], cc: string, r: number, dots: number, bloom: Bloom) => {
  const t = `scale(${sc(bloom(0))})`;
  out.push({ d: circ(0, 0, r), f: cc, s: dark(cc, 0.25), sw: 1.4, t });
  for (let k = 0; k < dots; k++) {
    const a = rad((k * 360) / dots);
    out.push({ d: circ(Math.cos(a) * r * 0.56, Math.sin(a) * r * 0.56, r * 0.1), f: dark(cc, 0.4), t });
  }
  out.push({ d: circ(-r * 0.28, -r * 0.32, r * 0.24), f: light(cc, 0.55), o: 0.7, t });
};

const daisy: Head = (P, bloom, pal, o) => {
  const out: Shape[] = [];
  const count = o.petals ?? 12;
  const edge = mix(P, pal.ink, 0.22);
  ringPetals(out, DAISY_PETAL, count, dark(P, 0.07), edge, bloom, { delay: 3, step: 12 / count, rot: 180 / count, size: 0.86 });
  ringPetals(out, DAISY_PETAL, count, P, edge, bloom, { delay: 6, step: 14 / count, unfurl: 20 });
  discCenter(out, o.center ?? mix(pal.butter, '#E0A030', 0.35), 25, 10, bloom);
  return out;
};

const ranunculus: Head = (C, bloom, pal, o) => {
  const out: Shape[] = [];
  const rings: [number, number, string, number][] = [
    [84, 11, light(C, 0.24), 18],
    [68, 10, light(C, 0.1), 12],
    [52, 8, C, 6],
    [36, 7, dark(C, 0.1), 0],
  ];
  rings.forEach(([R, count, col, delay], ri) => {
    const d = `M0,0C${n(-0.44 * R)},-4 ${n(-0.52 * R)},${n(-0.86 * R)} 0,${-R}C${n(0.52 * R)},${n(-0.86 * R)} ${n(0.44 * R)},-4 0,0Z`;
    ringPetals(out, d, count, col, dark(C, 0.26), bloom, { delay, rot: ri * 17 });
  });
  out.push({ d: circ(0, 0, 12), f: o.center ?? mix(pal.sage, pal.butter, 0.45), s: dark(pal.sage, 0.2), sw: 1.4, t: `scale(${sc(bloom(0))})` });
  return out;
};

const LILY_PETAL = 'M0,0C-24,-14 -30,-72 0,-114C30,-72 24,-14 0,0Z';
const LILY_THROAT = 'M0,-6C-6,-30 -5,-60 0,-84C5,-60 6,-30 0,-6Z';

/** Six pointed petals (three behind, three in front) with a coloured throat, freckles and stamens. */
const lily: Head = (C, bloom, pal, o) => {
  const out: Shape[] = [];
  const throat = o.center ?? pal.rose;
  const count = o.petals ?? 6;
  for (let k = 0; k < count; k++) {
    const back = k % 2 === 0;
    const v = bloom((back ? 0 : 6) + k * 1.5);
    const a = (k * 360) / count + 30 - (1 - Math.min(1, v)) * 18;
    const t = `rotate(${n(a)}) scale(${sc((back ? 0.94 : 1) * v)})`;
    out.push({ d: LILY_PETAL, f: back ? dark(C, 0.06) : C, s: mix(C, pal.ink, 0.22), sw: 1.3, o: vis(v), t });
    out.push({ d: LILY_THROAT, f: throat, o: n(vis(v) * 0.7), t });
    for (let j = 0; j < 4; j++) {
      out.push({ d: circ(j % 2 ? 5 : -5, -28 - j * 10, 2), f: dark(throat, 0.35), o: n(vis(v) * 0.8), t });
    }
  }
  for (let k = 0; k < 6; k++) {
    const v = bloom(18 + k);
    const a = rad(k * 60 + 15 - 90);
    const ex = Math.cos(a) * 58;
    const ey = Math.sin(a) * 58;
    out.push({ d: `M0,0Q${n(ex * 0.5 + 6)},${n(ey * 0.5)} ${n(ex)},${n(ey)}`, s: light(pal.sage, 0.35), sw: 2, o: vis(v), t: `scale(${sc(v)})` });
    out.push({ d: ell(4, 8), f: '#9A4A2E', o: vis(v), t: `scale(${sc(v)}) translate(${n(ex)} ${n(ey)}) rotate(${k * 60 + 15})` });
  }
  return out;
};

const ruffle = (R: number) =>
  `M0,0C${n(-0.55 * R)},${n(-0.1 * R)} ${n(-0.62 * R)},${n(-0.75 * R)} ${n(-0.3 * R)},${n(-0.95 * R)}` +
  `Q${n(-0.15 * R)},${n(-1.06 * R)} 0,${n(-0.92 * R)}Q${n(0.15 * R)},${n(-1.06 * R)} ${n(0.3 * R)},${n(-0.95 * R)}` +
  `C${n(0.62 * R)},${n(-0.75 * R)} ${n(0.55 * R)},${n(-0.1 * R)} 0,0Z`;

/** Five rings of ruffled petals, deepening towards the centre. */
const peony: Head = (C, bloom) => {
  const out: Shape[] = [];
  const rings: [number, number, string, number][] = [
    [104, 9, light(C, 0.22), 24],
    [88, 8, light(C, 0.1), 18],
    [70, 7, C, 12],
    [52, 6, dark(C, 0.06), 6],
    [34, 5, dark(C, 0.12), 0],
  ];
  rings.forEach(([R, count, col, delay], ri) => {
    ringPetals(out, ruffle(R), count, col, dark(C, 0.22), bloom, { delay, step: 1.4, rot: ri * 23, unfurl: 20 });
  });
  out.push({ d: circ(0, 0, 13), f: dark(C, 0.16), t: `scale(${sc(bloom(0))})` });
  return out;
};

const SUN_PETAL = 'M0,-34C-12,-46 -13,-90 0,-106C13,-90 12,-46 0,-34Z';

/** Two layers of long petals around a big seeded disc. */
const sunflower: Head = (C, bloom, _pal, o) => {
  const out: Shape[] = [];
  const count = o.petals ?? 18;
  ringPetals(out, SUN_PETAL, count, dark(C, 0.12), dark(C, 0.3), bloom, { delay: 4, step: 10 / count, rot: 180 / count, size: 0.92 });
  ringPetals(out, SUN_PETAL, count, C, dark(C, 0.3), bloom, { delay: 8, step: 12 / count, unfurl: 14 });
  const cc = o.center ?? '#6B4423';
  const t = `scale(${sc(bloom(0))})`;
  out.push({ d: circ(0, 0, 42), f: cc, s: dark(cc, 0.3), sw: 1.5, t });
  out.push({ d: circ(0, 0, 30), f: dark(cc, 0.22), t });
  for (let i = 0; i < 44; i++) {
    const a = i * 2.39996;
    const r = 3.9 * Math.sqrt(i + 1);
    out.push({ d: circ(Math.cos(a) * r, Math.sin(a) * r, 2.1), f: light(cc, 0.3), t });
  }
  return out;
};

const frill = (R: number) => {
  let d = 'M0,0';
  for (let i = 0; i <= 10; i++) {
    const a = rad(-122 + (64 * i) / 10);
    const r = i % 2 ? R * 0.84 : R;
    d += `L${n(Math.cos(a) * r)},${n(Math.sin(a) * r)}`;
  }
  return `${d}Z`;
};

/** Three rings of frilled, saw-edged petals. */
const carnation: Head = (C, bloom) => {
  const out: Shape[] = [];
  const rings: [number, number, string, number][] = [
    [84, 9, light(C, 0.14), 14],
    [66, 8, C, 8],
    [46, 7, dark(C, 0.1), 2],
  ];
  rings.forEach(([R, count, col, delay], ri) => {
    ringPetals(out, frill(R), count, col, dark(C, 0.25), bloom, { delay, rot: ri * 15, unfurl: 16 });
  });
  return out;
};

const COSMOS_PETAL = 'M0,-12C-28,-30 -32,-80 -16,-90L-8,-82L0,-92L8,-82L16,-90C32,-80 28,-30 0,-12Z';

/** Broad petals with notched tips and a fine vein. */
const cosmos: Head = (C, bloom, pal, o) => {
  const out: Shape[] = [];
  const count = o.petals ?? 8;
  for (let k = 0; k < count; k++) {
    const v = bloom(4 + k * 1.6);
    const t = `rotate(${n((k * 360) / count - (1 - Math.min(1, v)) * 22)}) scale(${sc(v)})`;
    out.push({ d: COSMOS_PETAL, f: C, s: dark(C, 0.22), sw: 1.3, o: vis(v), t });
    out.push({ d: 'M0,-18L0,-74M-8,-30L-12,-66M8,-30L12,-66', s: dark(C, 0.14), sw: 1.2, o: n(vis(v) * 0.45), t });
  }
  discCenter(out, o.center ?? pal.butter, 17, 12, bloom);
  return out;
};

/** A dome of small four-petal florets in mixed shades. */
const hydrangea: Head = (C, bloom, pal) => {
  const out: Shape[] = [];
  const N = 26;
  out.push({ d: circ(0, 0, 80), f: dark(C, 0.28), o: n(0.55 * vis(bloom(0))), t: `scale(${sc(bloom(0))})` });
  const shades = [C, light(C, 0.18), mix(C, pal.rose, 0.25), dark(C, 0.06)];
  // Outermost first, so the centre of the dome sits on top.
  for (let i = N - 1; i >= 0; i--) {
    const a = i * 2.39996;
    const r = 74 * Math.sqrt((i + 0.5) / N);
    const v = bloom(2 + i * 0.9);
    const col = shades[i % 4];
    const at = `translate(${n(Math.cos(a) * r)} ${n(Math.sin(a) * r * 0.92)}) rotate(${i * 37}) scale(${sc(v * 0.95)})`;
    for (let p = 0; p < 4; p++) {
      out.push({ d: ell(8, 11.5), f: col, s: dark(col, 0.22), sw: 0.9, o: vis(v), t: `${at} rotate(${p * 90}) translate(0 -10)` });
    }
    out.push({ d: circ(0, 0, 2.6), f: dark(col, 0.35), o: vis(v), t: at });
  }
  return out;
};

const ANEMONE_PETAL = 'M0,-6C-44,-14 -50,-80 0,-86C50,-80 44,-14 0,-6Z';

/** Round petals around a dark, stamen-ringed centre. */
const anemone: Head = (C, bloom, pal, o) => {
  const out: Shape[] = [];
  const count = o.petals ?? 6;
  const edge = mix(C, pal.ink, 0.18);
  ringPetals(out, ANEMONE_PETAL, count, dark(C, 0.05), edge, bloom, { delay: 2, step: 1.5, rot: 180 / count, size: 0.9 });
  ringPetals(out, ANEMONE_PETAL, count, C, edge, bloom, { delay: 6, step: 1.5, unfurl: 18 });
  const cc = o.center ?? '#2C2A4A';
  const t = `scale(${sc(bloom(10))})`;
  for (let k = 0; k < 16; k++) {
    const a = rad(k * 22.5);
    out.push({ d: circ(Math.cos(a) * 28, Math.sin(a) * 28, 2.4), f: dark(cc, 0.1), t });
  }
  out.push({ d: circ(0, 0, 20), f: cc, t });
  out.push({ d: circ(-5, -6, 5), f: light(cc, 0.3), t });
  return out;
};

// ---------- fillers (drawn in world space along the stem) ----------

const eucalyptus: Filler = (e, ck) => {
  const out: Shape[] = [];
  const C = e.color;
  const cols = [C, light(C, 0.16), mix(C, '#9DB5B5', 0.4)];
  for (let j = 0; j < 9; j++) {
    const t = 0.34 + j * 0.08;
    const [px, py] = bez(e.curve, t);
    const a = bezAngle(e.curve, t);
    const side = j % 2 ? 1 : -1;
    const r = (26 - (12 * (t - 0.34)) / 0.64) * e.scale;
    const ox = Math.cos(rad(a + 90 * side)) * r * 0.95;
    const oy = Math.sin(rad(a + 90 * side)) * r * 0.95;
    const v = ck.spring(e.start + t * T.stemGrow * 0.9, SPRINGS.bloom);
    out.push({ d: ell(r, r * 0.86), f: cols[j % 3], s: dark(C, 0.18), sw: 1.2, o: vis(v), t: `translate(${n(px + ox)} ${n(py + oy)}) rotate(${n(a)}) scale(${sc(v)})` });
  }
  const [tx, ty] = bez(e.curve, 1);
  const vt = ck.spring(e.start + T.stemGrow, SPRINGS.bloom);
  out.push({ d: ell(11 * e.scale, 9 * e.scale), f: light(C, 0.1), s: dark(C, 0.18), sw: 1.2, o: vis(vt), t: `translate(${n(tx)} ${n(ty)}) scale(${sc(vt)})` });
  return out;
};

/** Short branches at the tip, each ending in a small cluster drawn by `bud`. */
const spray = (
  e: LaidOutFlower, ck: Clock, pal: Palette, branches: number, perBranch: number,
  bud: (x: number, y: number, v: number, b: number, d: number) => Shape[],
): Shape[] => {
  const out: Shape[] = [];
  const s = e.scale;
  const from = e.start + T.stemGrow * 0.85;
  for (let b = 0; b < branches; b++) {
    const spread = 120 / Math.max(1, branches - 1);
    const ang = rad(-90 + (b - (branches - 1) / 2) * spread + (rnd(e.index, b) - 0.5) * 14);
    const len = (44 + rnd(b, e.index) * 34) * s;
    const ex = Math.cos(ang) * len;
    const ey = Math.sin(ang) * len;
    const grow = ck.ramp(from + b * 1.5, from + b * 1.5 + 16, 'out');
    const L = len * 1.05;
    out.push({ d: `M0,0Q${n(ex * 0.3)},${n(ey * 0.6)} ${n(ex)},${n(ey)}`, s: e.stemColor ?? dark(pal.sage, 0.15), sw: 2.2, da: n(L), dof: n(L * (1 - grow)), t: `translate(${n(e.hx)} ${n(e.hy)})` });
    for (let d = 0; d < perBranch; d++) {
      const ox = ex + (rnd(b * 7 + d, e.index) - 0.5) * 26 * s;
      const oy = ey + (rnd(e.index * 3 + d, b) - 0.5) * 22 * s;
      const v = ck.spring(from + 10 + b * 2 + d * 1.5, SPRINGS.bloom);
      out.push(...bud(e.hx + ox, e.hy + oy, v, b, d));
    }
  }
  return out;
};

const babysBreath: Filler = (e, ck, pal) =>
  spray(e, ck, pal, 6, 5, (x, y, v, b, d) => [
    { d: circ(0, 0, (4.5 + rnd(d, b + e.index) * 2.6) * e.scale), f: e.color, s: mix(e.color, pal.ink, 0.18), sw: 1, o: vis(v), t: `translate(${n(x)} ${n(y)}) scale(${sc(v)})` },
  ]);

/** Tiny five-petal blue flowers with yellow eyes. */
const forgetMeNot: Filler = (e, ck, pal) =>
  spray(e, ck, pal, 6, 3, (x, y, v) => {
    const t = `translate(${n(x)} ${n(y)}) scale(${sc(v * e.scale)})`;
    const out: Shape[] = [];
    for (let p = 0; p < 5; p++) {
      const a = rad(p * 72 - 90);
      out.push({ d: circ(Math.cos(a) * 5.5, Math.sin(a) * 5.5, 4.6), f: e.color, s: dark(e.color, 0.25), sw: 0.8, o: vis(v), t });
    }
    out.push({ d: circ(0, 0, 2.4), f: pal.butter, o: vis(v), t });
    return out;
  });

/** Glossy berries (hypericum-style) with a dark tip. */
const berries: Filler = (e, ck, pal) =>
  spray(e, ck, pal, 5, 3, (x, y, v, b, d) => {
    const col = (b + d) % 3 ? e.color : dark(e.color, 0.15);
    const t = `translate(${n(x)} ${n(y)}) scale(${sc(v * e.scale)})`;
    return [
      { d: ell(8, 9.5), f: col, s: dark(col, 0.3), sw: 1, o: vis(v), t },
      { d: circ(-3, -3.5, 2.4), f: '#ffffff', o: n(vis(v) * 0.5), t },
      { d: circ(0, -9, 1.8), f: dark(col, 0.5), o: vis(v), t },
    ];
  });

const lavender: Filler = (e, ck) => {
  const out: Shape[] = [];
  const C = e.color;
  for (let j = 0; j < 14; j++) {
    const t = 0.58 + j * 0.03;
    const [px, py] = bez(e.curve, t);
    const a = bezAngle(e.curve, t);
    const side = j % 2 ? 1 : -1;
    const ox = Math.cos(rad(a + 90 * side)) * 6 * e.scale;
    const oy = Math.sin(rad(a + 90 * side)) * 6 * e.scale;
    const v = ck.spring(e.start + t * T.stemGrow * 0.9 + 4, SPRINGS.bloom);
    const size = (1 - ((t - 0.58) / 0.5) * 0.4) * e.scale;
    out.push({ d: ell(10, 6.5), f: j % 3 ? C : dark(C, 0.15), s: dark(C, 0.3), sw: 1, o: vis(v), t: `translate(${n(px + ox)} ${n(py + oy)}) rotate(${n(a + side * 35)}) scale(${sc(v * size)})` });
  }
  return out;
};

/** A frond: paired leaflets shrinking towards the tip. */
const fern: Filler = (e, ck) => {
  const out: Shape[] = [];
  const C = e.color;
  for (let j = 0; j < 16; j++) {
    const t = 0.4 + j * 0.0375;
    const [px, py] = bez(e.curve, t);
    const a = bezAngle(e.curve, t);
    const size = (1 - ((t - 0.4) / 0.6) * 0.7) * e.scale;
    const v = ck.spring(e.start + t * T.stemGrow * 0.9, SPRINGS.bloom);
    for (const side of [-1, 1]) {
      out.push({ d: LEAF, f: side > 0 ? C : dark(C, 0.08), s: dark(C, 0.2), sw: 1, o: vis(v), t: `translate(${n(px)} ${n(py)}) rotate(${n(a + side * 52)}) scale(${sc(v * size * 0.55)} ${sc(v * size * 0.42)})` });
    }
  }
  return out;
};

export const FLOWER_TYPES: Record<FlowerType, FlowerDef> = {
  rose: { color: 'rose', scale: 1, leaves: 2, head: rose },
  tulip: { color: 'butter', scale: 0.95, leaves: 2, leafSize: [1.1, 0.8], head: tulip, followStem: true },
  daisy: { color: '#FFFDF7', scale: 0.82, leaves: 1, head: daisy },
  ranunculus: { color: 'butter', scale: 0.9, leaves: 2, head: ranunculus },
  lily: { color: '#FBEFEA', scale: 1.15, leaves: 3, leafSize: [1.15, 0.75], head: lily },
  peony: { color: '#F4C2C9', scale: 0.95, leaves: 2, head: peony },
  sunflower: { color: '#F2B632', scale: 0.85, leaves: 2, leafSize: [1.4, 1.3], head: sunflower },
  carnation: { color: '#E26D7D', scale: 0.85, leaves: 2, leafSize: [1.1, 0.55], head: carnation },
  cosmos: { color: '#EBA1C4', scale: 0.85, leaves: 1, leafSize: [0.9, 0.6], head: cosmos },
  hydrangea: { color: '#A9B8E0', scale: 0.9, leaves: 2, leafSize: [1.3, 1.2], head: hydrangea },
  anemone: { color: '#FFFFFF', scale: 0.8, leaves: 1, head: anemone },
  eucalyptus: { color: 'sage', scale: 1, filler: eucalyptus },
  babysBreath: { color: '#FFFFFF', scale: 1, filler: babysBreath },
  lavender: { color: '#A99BD0', scale: 1, filler: lavender },
  fern: { color: '#6F8F6A', scale: 1, filler: fern },
  forgetMeNot: { color: '#8FB3E3', scale: 1, filler: forgetMeNot },
  berries: { color: '#C8574D', scale: 1, filler: berries },
};

export const FLOWER_TYPE_NAMES = Object.keys(FLOWER_TYPES) as FlowerType[];

// ---------- arrangement & layout ----------

/** How far the arrangement spreads (px either side) and how tall it stands. */
export const ARRANGEMENTS: Record<Arrangement, { spread: number; height: number; base: number }> = {
  dome: { spread: 340, height: 540, base: 1060 },
  tall: { spread: 250, height: 600, base: 1060 },
  wide: { spread: 430, height: 430, base: 1060 },
  cascade: { spread: 360, height: 520, base: 1060 },
  posy: { spread: 230, height: 420, base: 1020 },
};

export type LaidOutFlower = {
  index: number;
  type: FlowerType;
  def: FlowerDef;
  color: string;
  center?: string;
  petals?: number;
  leaves: number;
  stemColor?: string;
  scale: number;
  hx: number;
  hy: number;
  /** Below the container's rim: drawn in front of the container. */
  spills: boolean;
  curve: Cubic;
  tie: [number, number];
  /** Frame the stem starts growing. */
  start: number;
  /** Frame the head starts blooming. */
  bloom: number;
  phase: number;
  tilt: number | null;
};

const resolveColor = (c: string | undefined, pal: Palette) =>
  c === undefined ? undefined : c in pal ? pal[c as keyof Palette] : c;

/** Turns specs into positioned, timed stems. Sorted back (top) to front (bottom). */
export const layoutFlowers = (
  specs: FlowerSpec[],
  pal: Palette,
  container: ContainerType = 'wrap',
  arrangement: Arrangement = 'dome',
): LaidOutFlower[] => {
  const box = CONTAINERS[container] ?? CONTAINERS.wrap;
  const arr = ARRANGEMENTS[arrangement] ?? ARRANGEMENTS.dome;
  const [tx, ty] = box.tie;
  const N = specs.length;
  const stagger = Math.min(T.stemStagger, 66 / Math.max(1, N - 1));
  const heads = specs.filter((s) => FLOWER_TYPES[s.type]?.head).length;
  const bloomStagger = Math.min(T.bloomStagger, 74 / Math.max(1, heads - 1));
  let headIndex = 0;

  return specs
    .map((spec, i) => {
      const type: FlowerType = FLOWER_TYPES[spec.type] ? spec.type : 'rose';
      const def = FLOWER_TYPES[type];
      let { x, y } = spec;
      if (typeof x !== 'number' || typeof y !== 'number') {
        // Golden-angle spiral; fillers are pushed to the outside.
        const a = i * 2.39996;
        let r = Math.sqrt((i + 0.5) / N);
        if (!def.head) r = Math.max(r, 0.85);
        x = Math.cos(a) * r * 0.9;
        y = 0.52 + Math.sin(a) * r * 0.46;
        if (arrangement === 'cascade' && def.head && i % 4 === 3) {
          x = 0.45 + rnd(i, 3) * 0.4;
          y = -0.08 - rnd(i, 5) * 0.22;
        }
      }
      const hx = CX + x * arr.spread;
      const hy = arr.base - box.lift - y * (arr.height - box.lift);
      const dx = hx - tx;
      const curve: Cubic = [
        [tx + dx * 0.1, box.baseY],
        [tx + dx * 0.04, ty + 50],
        [tx + dx * 0.62, hy + (ty - hy) * 0.42],
        [hx, hy],
      ];
      const delay = spec.delay ?? 0;
      const start = T.stemsFrom + i * stagger + delay;
      const bloom = def.head ? Math.max(T.bloomFrom + headIndex * bloomStagger + delay, start + T.stemGrow - 6) : start;
      if (def.head) headIndex++;
      return {
        index: i, type, def,
        color: resolveColor(spec.color ?? def.color, pal) ?? '#ffffff',
        center: resolveColor(spec.centerColor, pal),
        petals: spec.petals,
        leaves: Math.max(0, Math.min(3, spec.leaves ?? def.leaves ?? 0)),
        stemColor: resolveColor(spec.stemColor, pal),
        scale: (spec.scale ?? 1) * def.scale,
        hx, hy, spills: y < 0, curve, tie: box.tie, start, bloom,
        phase: i * 1.7 + 0.3,
        tilt: typeof spec.tilt === 'number' ? spec.tilt : null,
      };
    })
    .sort((a, b) => a.hy - b.hy);
};

// ---------- per-flower drawing ----------

/** How strongly the ambient sway moves; lowered for reduced motion. */
export type Calm = { sway: number };

/** Wind: an ambient sway around the tie, plus any breezes sweeping left → right. */
export const swayAngle = (e: LaidOutFlower, ck: Clock, calm: Calm) => {
  const env = ck.ramp(T.sway[0], T.sway[1], 'inOut');
  const lag = ((e.hx - 200) / 680) * 8 + 2;
  return env * 1.8 * calm.sway * wave(ck.frame, 6, e.phase) + gustBend(ck, lag) * (e.def.head ? 0.9 : 1.15);
};

const swayTransform = (e: LaidOutFlower, ck: Clock, calm: Calm) =>
  `rotate(${n(swayAngle(e, ck, calm))} ${e.tie[0]} ${e.tie[1]})`;

export const stemShapes = (e: LaidOutFlower, ck: Clock, pal: Palette, calm: Calm): Shape[] => {
  const grow = ck.ramp(e.start, e.start + T.stemGrow, 'out');
  if (grow <= 0) return [];
  const out: Shape[] = [];
  const L = bezLength(e.curve);
  const stemColor = e.stemColor ?? (e.type === 'eucalyptus' ? mix(dark(pal.sage, 0.22), '#7A6A58', 0.35) : dark(pal.sage, 0.22));
  const width = e.def.head ? 6.5 : e.type === 'babysBreath' || e.type === 'forgetMeNot' ? 3.2 : 4.5;
  out.push({ d: bezPath(e.curve), s: stemColor, sw: width, da: n(L), dof: n(L * (1 - grow)) });

  const [lw, lh] = e.def.leafSize ?? [1, 1];
  for (let k = 0; k < e.leaves; k++) {
    const t = 0.5 + k * 0.16;
    const [px, py] = bez(e.curve, t);
    const side = (e.index + k) % 2 ? 1 : -1;
    const v = ck.spring(e.start + t * T.stemGrow * 0.7, SPRINGS.bloom);
    const s = v * 0.95 * e.scale;
    const tt = `translate(${n(px)} ${n(py)}) rotate(${n(bezAngle(e.curve, t) + side * 58)}) scale(${sc(s * lw)} ${sc(s * lh)})`;
    out.push({ d: LEAF, f: pal.sage, s: dark(pal.sage, 0.22), sw: 1.2, o: vis(v), t: tt });
    out.push({ d: LEAF_RIB, s: light(pal.sage, 0.35), sw: 1.4, o: n(0.75 * clamp01(v)), t: tt });
  }

  if (e.def.filler) out.push(...e.def.filler(e, ck, pal));
  return withTransform(out, swayTransform(e, ck, calm));
};

export const headShapes = (e: LaidOutFlower, ck: Clock, pal: Palette, calm: Calm): Shape[] => {
  if (!e.def.head || ck.frame < e.bloom) return [];
  const bloom: Bloom = (delay) => ck.spring(e.bloom + delay, SPRINGS.bloom);
  const env = ck.ramp(T.sway[0], T.sway[1], 'inOut');
  const tilt = e.tilt ?? (e.def.followStem ? bezAngle(e.curve, 1) + 90 : ((e.hx - CX) / 340) * 12);
  const lag = ((e.hx - 200) / 680) * 8 + 5;
  const wobble = env * 2.4 * calm.sway * wave(ck.frame, 9, e.phase * 1.3) + gustBend(ck, lag) * 0.7;
  const place = `translate(${n(e.hx)} ${n(e.hy)}) rotate(${n(tilt + wobble)}) scale(${n(e.scale)})`;
  const local = e.def.head(e.color, bloom, pal, { center: e.center, petals: e.petals });
  return withTransform(withTransform(local, place), swayTransform(e, ck, calm));
};
