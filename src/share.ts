/**
 * A whole bouquet fits in its own link, so a gift needs no server or database.
 *
 * New links use `?b=`: the design packed into a few hundred bytes (see
 * `packGift`), then base64url. Older `?g=` links (base64url JSON) still open.
 * Links come from anyone, so everything read back is checked and clamped.
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

export const cleanFlower = (raw: unknown): FlowerSpec | null => {
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
  const packed = q.get('b');
  if (packed) return unpackGift(packed) ?? { ...defaultBouquetProps };
  const code = q.get('g');
  if (code) return decodeGift(code) ?? { ...defaultBouquetProps };
  if (['to', 'from', 'msg', 'preset', 'frame'].some((k) => q.has(k))) return giftFromSimpleParams(q);
  return null;
};

// ---------- packed links (`?b=`) ----------
//
// Layout (version 1):
//   u8 version · u8 container<<5 | arrangement<<2 | hasHeading<<1 | hasSignoff
//   u16 changed-palette mask, then 3 bytes per changed colour
//   strings (varint length + UTF-8): to, from, message, [heading], [signoff]
//   u8 flower count, then per flower a 24-bit header — type (5 bits), which
//   fields follow (10 bits), which colours are palette names (3 bits) — and
//   the fields: colours as RGB or a palette index, x/y/tilt as int8 hundredths
//   (tilt in degrees), scale as u8 hundredths, petals/leaves/delay as u8.
//
// These lists only ever grow at the end: reordering them breaks old links.
const PACK_VERSION = 1;
const PACK_TYPES: FlowerType[] = [
  'rose', 'tulip', 'daisy', 'ranunculus', 'lily', 'peony', 'sunflower', 'carnation', 'cosmos', 'hydrangea', 'anemone',
  'eucalyptus', 'babysBreath', 'lavender', 'fern', 'forgetMeNot', 'berries',
];
const PACK_PALETTE: (keyof Palette)[] = [
  'background', 'rose', 'butter', 'sage', 'kraft', 'ink', 'tissue', 'ribbon', 'cream', 'wicker', 'glass', 'box',
];
const FIELDS = ['color', 'centerColor', 'stemColor', 'petals', 'leaves', 'x', 'y', 'scale', 'tilt', 'delay'] as const;
const COLOR_FIELDS = ['color', 'centerColor', 'stemColor'] as const;

const hexBytes = (hex: string) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.replace(/./g, '$&$&') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const bytesHex = (b: number[]) => '#' + b.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
const int8 = (v: number) => (Math.max(-128, Math.min(127, Math.round(v))) + 256) % 256;
const sint8 = (b: number) => (b > 127 ? b - 256 : b);

/** Packs a design into bytes. Only what differs from the defaults is stored. */
export const packGift = (p: BouquetProps): Uint8Array => {
  const out: number[] = [];
  const text = (s: string) => {
    const b = new TextEncoder().encode(s);
    if (b.length > 127) out.push(0x80 | (b.length & 0x7f), b.length >> 7);
    else out.push(b.length);
    out.push(...b);
  };
  const heading = p.heading !== defaultBouquetProps.heading ? p.heading ?? '' : null;
  const signoff = p.signoff !== defaultBouquetProps.signoff ? p.signoff ?? '' : null;
  out.push(PACK_VERSION);
  out.push(
    (Math.max(0, CONTAINERS.indexOf(p.container ?? 'wrap')) << 5) |
      (Math.max(0, ARRANGEMENTS.indexOf(p.arrangement ?? 'dome')) << 2) |
      (heading !== null ? 2 : 0) |
      (signoff !== null ? 1 : 0),
  );
  let mask = 0;
  const colours: number[] = [];
  PACK_PALETTE.forEach((k, i) => {
    const v = p.palette?.[k];
    if (v && HEX.test(v) && v.toLowerCase() !== DEFAULT_PALETTE[k].toLowerCase()) {
      mask |= 1 << i;
      colours.push(...hexBytes(v));
    }
  });
  out.push(mask >> 8, mask & 0xff, ...colours);
  text(p.recipientName.slice(0, 40));
  text(p.senderName.slice(0, 40));
  text(p.message.slice(0, MAX_MESSAGE));
  if (heading !== null) text(heading.slice(0, 60));
  if (signoff !== null) text(signoff.slice(0, 30));

  const flowers = (p.flowers ?? []).filter((f) => PACK_TYPES.includes(f.type)).slice(0, MAX_FLOWERS);
  out.push(flowers.length);
  for (const f of flowers) {
    let has = 0;
    let refs = 0;
    const body: number[] = [];
    FIELDS.forEach((k, i) => {
      const v = f[k];
      if (v === undefined || v === null) return;
      if (typeof v === 'string') {
        const ref = PACK_PALETTE.indexOf(v as keyof Palette);
        if (ref >= 0) {
          refs |= 1 << COLOR_FIELDS.indexOf(k as (typeof COLOR_FIELDS)[number]);
          body.push(ref);
        } else if (HEX.test(v)) body.push(...hexBytes(v));
        else return;
      } else if (k === 'x' || k === 'y') body.push(int8(v * 100));
      else if (k === 'tilt') body.push(int8(v));
      else if (k === 'scale') body.push(Math.max(0, Math.min(255, Math.round(v * 100))));
      else body.push(Math.max(0, Math.min(255, Math.round(v))));
      has |= 1 << i;
    });
    const header = (PACK_TYPES.indexOf(f.type) << 13) | (has << 3) | refs;
    out.push(header >> 16, (header >> 8) & 0xff, header & 0xff, ...body);
  }
  return Uint8Array.from(out);
};

const bytesToBase64Url = (bytes: Uint8Array) => {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlToBytes = (code: string) => {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

/** Reads `?b=…`. Returns null if it isn't a design this version can read. */
export const unpackGift = (code: string): BouquetProps | null => {
  try {
    const b = base64UrlToBytes(code);
    let i = 0;
    const u8 = () => {
      if (i >= b.length) throw new Error('short');
      return b[i++];
    };
    const text = (max: number) => {
      let len = u8();
      if (len & 0x80) len = (len & 0x7f) | (u8() << 7);
      if (i + len > b.length) throw new Error('short');
      const s = new TextDecoder().decode(b.subarray(i, i + len));
      i += len;
      return s.slice(0, max);
    };
    if (u8() !== PACK_VERSION) return null;
    const flags = u8();
    const mask = (u8() << 8) | u8();
    const palette = { ...DEFAULT_PALETTE };
    PACK_PALETTE.forEach((k, j) => {
      if (mask & (1 << j)) palette[k] = bytesHex([u8(), u8(), u8()]);
    });
    const recipientName = text(40);
    const senderName = text(40);
    const message = text(MAX_MESSAGE);
    const heading = flags & 2 ? text(60) : defaultBouquetProps.heading;
    const signoff = flags & 1 ? text(30) : defaultBouquetProps.signoff;
    const count = Math.min(MAX_FLOWERS, u8());
    const raw: Record<string, unknown>[] = [];
    for (let n = 0; n < count; n++) {
      const header = (u8() << 16) | (u8() << 8) | u8();
      const type = PACK_TYPES[header >> 13];
      const has = (header >> 3) & 0x3ff;
      const refs = header & 7;
      const f: Record<string, unknown> = { type };
      FIELDS.forEach((k, j) => {
        if (!(has & (1 << j))) return;
        const c = COLOR_FIELDS.indexOf(k as (typeof COLOR_FIELDS)[number]);
        if (c >= 0) f[k] = refs & (1 << c) ? PACK_PALETTE[u8()] : bytesHex([u8(), u8(), u8()]);
        else if (k === 'x' || k === 'y') f[k] = sint8(u8()) / 100;
        else if (k === 'tilt') f[k] = sint8(u8());
        else if (k === 'scale') f[k] = u8() / 100;
        else f[k] = u8();
      });
      raw.push(f);
    }
    const flowers = raw.map(cleanFlower).filter((f): f is FlowerSpec => f !== null);
    return {
      ...defaultBouquetProps,
      recipientName: recipientName || defaultBouquetProps.recipientName,
      senderName: senderName || defaultBouquetProps.senderName,
      message: message || defaultBouquetProps.message,
      heading,
      signoff,
      container: CONTAINERS[flags >> 5] ?? 'wrap',
      arrangement: ARRANGEMENTS[(flags >> 2) & 7] ?? 'dome',
      palette,
      flowers: flowers.length ? flowers : defaultBouquetProps.flowers,
    };
  } catch {
    return null;
  }
};

/**
 * Reads a pasted gift link strictly: the design it holds, or null if the
 * text isn't a gift link this site can read (no falling back to defaults).
 */
export const readGiftLink = (text: string): BouquetProps | null => {
  let q: URLSearchParams;
  try {
    q = new URL(text.trim(), window.location.href).searchParams;
  } catch {
    return null;
  }
  const packed = q.get('b');
  if (packed) return unpackGift(packed);
  const code = q.get('g');
  if (code) return decodeGift(code);
  if (['to', 'from', 'msg', 'preset'].some((k) => q.has(k))) return giftFromSimpleParams(q);
  return null;
};

export const giftLink = (p: BouquetProps) => {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?b=${bytesToBase64Url(packGift(p))}`;
};
