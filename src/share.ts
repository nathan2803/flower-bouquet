/**
 * A whole bouquet fits in its own link: the design is stored as JSON in the
 * `?g=` parameter (base64url), so a gift needs no server or database. Links
 * come from anyone, so everything read back is checked and clamped.
 */
import { DEFAULT_PALETTE, PRESETS, defaultBouquetProps, type PresetName } from './bouquet/config';
import { FLOWER_TYPES } from './bouquet/flowers';
import type { Arrangement, BouquetProps, ContainerType, FlowerSpec, FlowerType, Palette } from './bouquet/types';

const CONTAINERS: ContainerType[] = ['wrap', 'basket', 'vase', 'box', 'none'];
const ARRANGEMENTS: Arrangement[] = ['dome', 'tall', 'wide', 'cascade', 'posy'];
const PALETTE_KEYS = Object.keys(DEFAULT_PALETTE) as (keyof Palette)[];
export const MAX_FLOWERS = 24;
export const MAX_MESSAGE = 140;

const toBase64Url = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (code: string) => {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

const round = (v: number | undefined) => (typeof v === 'number' ? Math.round(v * 100) / 100 : undefined);

/** Encodes only what differs from the defaults, so links stay short. */
export const encodeGift = (p: BouquetProps) => {
  const palette: Partial<Palette> = {};
  for (const k of PALETTE_KEYS) {
    const v = p.palette?.[k];
    if (v && v.toLowerCase() !== DEFAULT_PALETTE[k].toLowerCase()) palette[k] = v;
  }
  const data = {
    to: p.recipientName,
    from: p.senderName,
    msg: p.message,
    h: p.heading !== defaultBouquetProps.heading ? p.heading : undefined,
    s: p.signoff !== defaultBouquetProps.signoff ? p.signoff : undefined,
    c: p.container,
    a: p.arrangement,
    p: Object.keys(palette).length ? palette : undefined,
    f: (p.flowers ?? []).map((f) => ({ ...f, x: round(f.x), y: round(f.y), scale: round(f.scale), tilt: round(f.tilt) })),
  };
  return toBase64Url(JSON.stringify(data));
};

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined);
const num = (v: unknown, lo: number, hi: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : undefined;
const HEX = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;
const color = (v: unknown) => (typeof v === 'string' && (HEX.test(v) || (PALETTE_KEYS as string[]).includes(v)) ? v : undefined);
const oneOf = <T extends string>(v: unknown, options: readonly T[]) => (options.includes(v as T) ? (v as T) : undefined);

const cleanFlower = (raw: unknown): FlowerSpec | null => {
  if (!raw || typeof raw !== 'object') return null;
  const f = raw as Record<string, unknown>;
  const type = oneOf(f.type, Object.keys(FLOWER_TYPES) as FlowerType[]);
  if (!type) return null;
  return {
    type,
    color: color(f.color),
    centerColor: color(f.centerColor),
    stemColor: color(f.stemColor),
    petals: num(f.petals, 3, 30),
    leaves: num(f.leaves, 0, 3),
    x: num(f.x, -1.2, 1.2),
    y: num(f.y, -0.5, 1.2),
    scale: num(f.scale, 0.3, 2.5),
    tilt: num(f.tilt, -90, 90),
    delay: num(f.delay, 0, 90),
  };
};

/** Reads `?g=…`. Returns null if the link has no design or it can't be read. */
export const decodeGift = (code: string): BouquetProps | null => {
  try {
    const d = JSON.parse(fromBase64Url(code)) as Record<string, unknown>;
    const palette = { ...DEFAULT_PALETTE };
    if (d.p && typeof d.p === 'object') {
      for (const k of PALETTE_KEYS) {
        const v = (d.p as Record<string, unknown>)[k];
        if (typeof v === 'string' && HEX.test(v)) palette[k] = v;
      }
    }
    const flowers = Array.isArray(d.f) ? d.f.slice(0, MAX_FLOWERS).map(cleanFlower).filter((f): f is FlowerSpec => f !== null) : [];
    return {
      ...defaultBouquetProps,
      recipientName: str(d.to, 40) || defaultBouquetProps.recipientName,
      senderName: str(d.from, 40) || defaultBouquetProps.senderName,
      message: str(d.msg, MAX_MESSAGE) ?? defaultBouquetProps.message,
      heading: str(d.h, 60) ?? defaultBouquetProps.heading,
      signoff: str(d.s, 30) ?? defaultBouquetProps.signoff,
      container: oneOf(d.c, CONTAINERS) ?? 'wrap',
      arrangement: oneOf(d.a, ARRANGEMENTS) ?? 'dome',
      palette,
      flowers: flowers.length ? flowers : defaultBouquetProps.flowers,
    };
  } catch {
    return null;
  }
};

/** Older simple links: `?to=Sam&from=Alex&msg=…&preset=lilyVase`. */
export const giftFromSimpleParams = (q: URLSearchParams): BouquetProps => {
  const name = q.get('preset') as PresetName | null;
  const preset = name && PRESETS[name] ? (({ title: _t, ...rest }) => rest)(PRESETS[name]) : {};
  return {
    ...defaultBouquetProps,
    ...preset,
    recipientName: q.get('to')?.slice(0, 40) || defaultBouquetProps.recipientName,
    senderName: q.get('from')?.slice(0, 40) || defaultBouquetProps.senderName,
    message: q.get('msg')?.slice(0, MAX_MESSAGE) || defaultBouquetProps.message,
    heading: q.get('heading')?.slice(0, 60) || defaultBouquetProps.heading,
  };
};

/** The gift a link points at, or null when it's the plain site (show the maker). */
export const giftFromUrl = (search: string): BouquetProps | null => {
  const q = new URLSearchParams(search);
  const code = q.get('g');
  if (code) return decodeGift(code) ?? { ...defaultBouquetProps };
  if (['to', 'from', 'msg', 'preset', 'frame'].some((k) => q.has(k))) return giftFromSimpleParams(q);
  return null;
};

export const giftLink = (p: BouquetProps) => {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?g=${encodeGift(p)}`;
};
