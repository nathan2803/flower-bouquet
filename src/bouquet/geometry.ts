/**
 * Pure drawing helpers. The whole bouquet is drawn on a fixed
 * 1080 × 1920 SVG canvas, so these numbers are in that coordinate space.
 */

/** Where every stem gathers: the ribbon tie. Sway rotates around this point. */
export const CX = 540;
export const TIE_Y = 1250;
export const STEM_BASE_Y = 1520;

/** One SVG path. Everything in the bouquet is made of these. */
export type Shape = {
  d: string;
  /** fill */
  f?: string;
  /** stroke */
  s?: string;
  /** stroke width */
  sw?: number;
  /** opacity */
  o?: number;
  /** transform */
  t?: string;
  /** stroke-dasharray / dashoffset, for paths that draw on */
  da?: number | string;
  dof?: number;
};

export type Pt = [number, number];
export type Cubic = [Pt, Pt, Pt, Pt];

// ---------- numbers ----------
export const n = (v: number) => Math.round(v * 100) / 100;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Non-negative scale, rounded. */
export const sc = (v: number) => n(Math.max(0, v));
/** Opacity that reaches 1 early in a spring, so things don't look ghostly while growing. */
export const vis = (v: number) => n(clamp01(v * 2.5));
export const rad = (deg: number) => (deg * Math.PI) / 180;
/** Deterministic pseudo-random number in [0, 1) from two integers. */
export const rnd = (a: number, b: number) => {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- colour ----------
const rgb = (c: string): [number, number, number] => {
  let h = String(c || '#000000').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const v = parseInt(h.slice(0, 6), 16) || 0;
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
export const mix = (a: string, b: string, t: number) => {
  const A = rgb(a);
  const B = rgb(b);
  return (
    '#' +
    A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')
  );
};
export const light = (c: string, t: number) => mix(c, '#ffffff', t);
export const dark = (c: string, t: number) => mix(c, '#2e2a27', t);

// ---------- paths ----------
export const circ = (cx: number, cy: number, r: number) =>
  `M${n(cx - r)},${n(cy)}a${n(r)},${n(r)} 0 1,0 ${n(2 * r)},0a${n(r)},${n(r)} 0 1,0 ${n(-2 * r)},0Z`;

export const ell = (rx: number, ry: number) =>
  `M${n(-rx)},0a${n(rx)},${n(ry)} 0 1,0 ${n(2 * rx)},0a${n(rx)},${n(ry)} 0 1,0 ${n(-2 * rx)},0Z`;

export const roundRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 ${-r},${r}` +
  `h${-(w - 2 * r)}a${r},${r} 0 0 1 ${-r},${-r}v${-(h - 2 * r)}a${r},${r} 0 0 1 ${r},${-r}Z`;

// ---------- cubic béziers (stems) ----------
export const bez = (c: Cubic, t: number): Pt => {
  const u = 1 - t;
  const at = (i: 0 | 1) =>
    u * u * u * c[0][i] + 3 * u * u * t * c[1][i] + 3 * u * t * t * c[2][i] + t * t * t * c[3][i];
  return [at(0), at(1)];
};

/** Tangent direction in degrees (SVG convention: 0 = right, -90 = up). */
export const bezAngle = (c: Cubic, t: number) => {
  const u = 1 - t;
  const d = (i: 0 | 1) =>
    3 * u * u * (c[1][i] - c[0][i]) + 6 * u * t * (c[2][i] - c[1][i]) + 3 * t * t * (c[3][i] - c[2][i]);
  return (Math.atan2(d(1), d(0)) * 180) / Math.PI;
};

export const bezLength = (c: Cubic) => {
  let L = 0;
  let p = c[0];
  for (let i = 1; i <= 20; i++) {
    const q = bez(c, i / 20);
    L += Math.hypot(q[0] - p[0], q[1] - p[1]);
    p = q;
  }
  return L;
};

export const bezPath = (c: Cubic) =>
  `M${n(c[0][0])},${n(c[0][1])}C${n(c[1][0])},${n(c[1][1])} ${n(c[2][0])},${n(c[2][1])} ${n(c[3][0])},${n(c[3][1])}`;

/** Prefix a transform onto every shape (outer transform first). */
export const withTransform = (shapes: Shape[], outer: string): Shape[] =>
  shapes.map((sh) => ({ ...sh, t: sh.t ? `${outer} ${sh.t}` : outer }));
