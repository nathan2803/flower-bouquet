/**
 * The gift's QR code: which modules are dark, and colours taken from the
 * bouquet itself, checked so a phone camera can still read them.
 */
import qrcode from 'qrcode-generator';
import { headRadius } from '../bouquet/arrange';
import { FLOWER_TYPES, layoutFlowers, type LaidOutFlower } from '../bouquet/flowers';
import type { BouquetProps, HeadType } from '../bouquet/types';
import { DEFAULT_PALETTE } from '../bouquet/config';

// ---------- colour maths ----------
const rgb = (hex: string) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.replace(/./g, '$&$&') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
};
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const toHsl = (hex: string): [number, number, number] => {
  const [r, g, b] = rgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};
const fromHsl = (h: number, s: number, l: number) => {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
};
/**
 * Lightens a colour just enough that a camera reads it as "light". Used inside
 * the middle flower: a dark flower centre ringed by light petals and a dark
 * outline looks like a corner eye to the camera, and the code stops scanning.
 */
export const liftForScan = (c: string | undefined, min = 0.5) => {
  if (!c || !/^#[0-9a-f]{3,6}$/i.test(c)) return c;
  let x = c;
  for (let t = 0.05; luminance(x) < min && t <= 1; t += 0.05) x = fromHsl(...lighten(toHsl(c), t));
  return x;
};
const lighten = ([h, s, l]: [number, number, number], t: number): [number, number, number] => [h, s, l + (1 - l) * t];

/** Darkens a colour, keeping its hue, until it stands out from `bg` by `min`. */
const readable = (hex: string, bg: string, min: number) => {
  const [h, s, l0] = toHsl(hex);
  for (let l = l0; l > 0.05; l -= 0.01) {
    const c = fromHsl(h, s, l);
    if (contrast(c, bg) >= min) return c;
  }
  return fromHsl(h, s, 0.05);
};

// ---------- the bouquet's colours ----------
export type QrLook = {
  /** Page behind the code. */
  bg: string;
  /** Top of the dot gradient: the bouquet's main flower colour. */
  top: string;
  /** Bottom of the gradient and the corner rings: a deep shade of it. */
  deep: string;
  /** The flower in the middle: the bouquet's leading bloom. */
  hero: { type: HeadType; color: string; center?: string };
};

const isSoft = (hex: string) => {
  const [, s, l] = toHsl(hex);
  return s < 0.18 || l > 0.93;
};

/**
 * Picks the flower that says the most about this bouquet (the colour with the
 * most bloom area, then its biggest bloom) and builds the code's colours from it.
 */
export const qrLook = (gift: BouquetProps): QrLook => {
  const pal = { ...DEFAULT_PALETTE, ...gift.palette };
  const laid = layoutFlowers(gift.flowers ?? [], pal, gift.container, gift.arrangement);
  const heads = laid.filter((f) => FLOWER_TYPES[f.type]?.head);
  const area = (f: LaidOutFlower) => headRadius({ type: f.type, scale: f.scale }) ** 2;

  const byColour = new Map<string, number>();
  heads.forEach((f) => byColour.set(f.color.toLowerCase(), (byColour.get(f.color.toLowerCase()) ?? 0) + area(f)));
  const ranked = [...byColour.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const lead = ranked[0];
  const leadHeads = heads.filter((f) => f.color.toLowerCase() === lead).sort((a, b) => area(b) - area(a));

  const top = leadHeads[0];
  const hero = top ? { type: top.type as HeadType, color: top.color, center: top.center } : { type: 'daisy' as const, color: '#FFFDF7' };

  // White or barely-there blooms make a weak code: lean on the next colour, then the ribbon.
  const base = [lead, ...ranked.slice(1)].find((c) => c && !isSoft(c)) ?? (isSoft(pal.ribbon) ? '#D98C96' : pal.ribbon);
  const bg = luminance(pal.background) > 0.82 ? pal.background : '#FFFFFF';
  const [h, s] = toHsl(base);
  const sat = Math.max(0.35, Math.min(0.75, s));
  return {
    bg,
    top: readable(fromHsl(h, sat, toHsl(base)[2]), bg, 4),
    // Shift the hue a little (pink → plum, lilac → indigo, yellow → wine) for a richer fade.
    deep: readable(fromHsl((h + 310) % 360, Math.min(0.7, sat + 0.1), 0.3), bg, 7),
    hero,
  };
};

// ---------- the code ----------
export type QrMatrix = { size: number; dark: (r: number, c: number) => boolean };

/**
 * Level M keeps 15% of the code spare, enough for the flower in the middle
 * (about 4% of it). Higher levels sound safer but make the code denser, and
 * in testing dense dotted codes scanned worse than lighter ones.
 */
export const qrMatrix = (text: string): QrMatrix => {
  const qr = qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();
  return { size: qr.getModuleCount(), dark: (r, c) => qr.isDark(r, c) };
};
