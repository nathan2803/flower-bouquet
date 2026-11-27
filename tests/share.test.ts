/**
 * Gift links people have already sent must keep opening the same gift.
 *
 * The links below were made by the site and are frozen here. If one of these
 * tests fails, a change has broken links that are out in the world: change
 * the code back, or add a new link version and keep reading the old one.
 *
 * Things that quietly break links without touching share.ts:
 *  - DEFAULT_PALETTE, and the default heading and sign-off: links only store
 *    what differs from them, so changing a default changes old gifts.
 *  - Reordering flower types, containers, arrangements or palette keys.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_PALETTE, PRESETS, defaultBouquetProps } from '../src/bouquet/config';
import type { BouquetProps } from '../src/bouquet/types';
import { decodeGift, encodeGift, giftFromSimpleParams, giftFromUrl, packGift, unpackGift } from '../src/share';

const b64 = (u: Uint8Array) => Buffer.from(u).toString('base64url');

/** Drops unset fields and ignores hex case, so comparisons are about meaning. */
const tidy = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(tidy);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v)
        .filter(([, x]) => x !== undefined)
        .map(([k, x]) => [k, tidy(x)]),
    );
  }
  return typeof v === 'string' && /^#[0-9a-f]{3,6}$/i.test(v) ? v.toLowerCase() : v;
};

// ---- frozen links (v1 `?b=`, made 28 Nov 2026) ----

const SIMPLE_B =
  'AQAAAAZBbWVsaWEEVGhlb0RIYXBweSBiaXJ0aGRheSEgVGhhbmsgeW91IGZvciBtYWtpbmcgb3JkaW5hcnkgZGF5cyBmZWVsIGxpa2Ugc3ByaW5nLgYBYwCePgFnAGJCXwGDAMRaAYMAQlYBhwAFZlUAIwkC3FQ';

const SIMPLE: BouquetProps = {
  ...defaultBouquetProps,
  recipientName: 'Amelia',
  senderName: 'Theo',
  message: 'Happy birthday! Thank you for making ordinary days feel like spring.',
  heading: 'a little something for',
  signoff: 'with love,',
  container: 'wrap',
  arrangement: 'dome',
  palette: DEFAULT_PALETTE,
  flowers: [
    { type: 'eucalyptus', x: -0.98, y: 0.62 },
    { type: 'eucalyptus', x: 0.98, y: 0.66, scale: 0.95 },
    { type: 'babysBreath', x: -0.6, y: 0.9 },
    { type: 'babysBreath', x: 0.66, y: 0.86 },
    { type: 'babysBreath', x: 0.05, y: 1.02, scale: 0.85 },
    { type: 'tulip', color: 'butter', x: -0.36, y: 0.84 },
  ],
};

const EVERYTHING_B =
  'AU8AgfP2-l5_uARab8OrClNhbSAmIEFsZXgiRsO8ciBkaWNoIOKcvyDigJQgaGFwcHkgMzB0aCEg8J-SkBdmb3IgbXkgZmF2b3VyaXRlIHBlcnNvbgxhbGwgbXkgbG92ZSwDAV_9ASwqSgMHAs70ffEMAgMAWjIAwwjytjIKPA';

/** Every field a link can carry: unicode text, custom lines, palette, all flower options. */
const EVERYTHING: BouquetProps = {
  ...defaultBouquetProps,
  recipientName: 'Zoë',
  senderName: 'Sam & Alex',
  message: 'Für dich ✿ — happy 30th! 💐',
  heading: 'for my favourite person',
  signoff: 'all my love,',
  container: 'vase',
  arrangement: 'cascade',
  palette: { ...DEFAULT_PALETTE, ribbon: '#5E7FB8', background: '#F3F6FA' },
  flowers: [
    { type: 'anemone', color: 'rose', centerColor: '#2C2A4A', stemColor: 'sage', petals: 7, leaves: 2, x: -0.5, y: -0.12, scale: 1.25, tilt: -15, delay: 12 },
    { type: 'berries', x: 0.9, y: 0.5 },
    { type: 'sunflower', color: '#F2B632', x: 0.1, y: 0.6 },
  ],
};

/** The same gift in the older JSON format (`?g=`), sent before November 2026. */
const EVERYTHING_G =
  'eyJ0byI6Ilpvw6siLCJmcm9tIjoiU2FtICYgQWxleCIsIm1zZyI6IkbDvHIgZGljaCDinL8g4oCUIGhhcHB5IDMwdGghIPCfkpAiLCJoIjoiZm9yIG15IGZhdm91cml0ZSBwZXJzb24iLCJzIjoiYWxsIG15IGxvdmUsIiwiYyI6InZhc2UiLCJhIjoiY2FzY2FkZSIsInAiOnsiYmFja2dyb3VuZCI6IiNGM0Y2RkEiLCJyaWJib24iOiIjNUU3RkI4In0sImYiOlt7InR5cGUiOiJhbmVtb25lIiwiY29sb3IiOiJyb3NlIiwiY2VudGVyQ29sb3IiOiIjMkMyQTRBIiwic3RlbUNvbG9yIjoic2FnZSIsInBldGFscyI6NywibGVhdmVzIjoyLCJ4IjotMC41LCJ5IjotMC4xMiwic2NhbGUiOjEuMjUsInRpbHQiOi0xNSwiZGVsYXkiOjEyfSx7InR5cGUiOiJiZXJyaWVzIiwieCI6MC45LCJ5IjowLjV9LHsidHlwZSI6InN1bmZsb3dlciIsImNvbG9yIjoiI0YyQjYzMiIsIngiOjAuMSwieSI6MC42fV19';

describe('links already sent still open the same gift', () => {
  it('reads a simple ?b= link', () => {
    expect(tidy(unpackGift(SIMPLE_B))).toEqual(tidy(SIMPLE));
  });

  it('reads a ?b= link that uses every field', () => {
    expect(tidy(unpackGift(EVERYTHING_B))).toEqual(tidy(EVERYTHING));
  });

  it('reads an old ?g= link', () => {
    expect(tidy(decodeGift(EVERYTHING_G))).toEqual(tidy(EVERYTHING));
  });

  it('reads the simple ?to=&preset= form', () => {
    const g = giftFromSimpleParams(new URLSearchParams('to=Sam&from=Alex&msg=Happy%20birthday!&preset=lilyVase'));
    expect(g.recipientName).toBe('Sam');
    expect(g.senderName).toBe('Alex');
    expect(g.message).toBe('Happy birthday!');
    expect(g.container).toBe('vase');
    expect(g.arrangement).toBe('tall');
  });

  it('routes each link form from the address bar', () => {
    expect(tidy(giftFromUrl(`?b=${SIMPLE_B}`))).toEqual(tidy(SIMPLE));
    expect(tidy(giftFromUrl(`?g=${EVERYTHING_G}`))).toEqual(tidy(EVERYTHING));
    expect(giftFromUrl('?to=Sam')?.recipientName).toBe('Sam');
    expect(giftFromUrl('')).toBeNull();
  });
});

describe('new links', () => {
  it('are made the same way as before', () => {
    // Not required for old links to open, but a change here means new links
    // look different; make sure that's on purpose.
    expect(b64(packGift(SIMPLE))).toBe(SIMPLE_B);
    expect(b64(packGift(EVERYTHING))).toBe(EVERYTHING_B);
  });

  it('round-trip every ready-made bouquet', () => {
    for (const [name, { title: _title, ...preset }] of Object.entries(PRESETS)) {
      const gift: BouquetProps = { ...defaultBouquetProps, ...preset, recipientName: 'Amelia', senderName: 'Theo' };
      expect(tidy(unpackGift(b64(packGift(gift)))), name).toEqual(tidy(gift));
    }
  });

  it('stay far shorter than the old JSON links', () => {
    expect(b64(packGift(EVERYTHING)).length).toBeLessThan(EVERYTHING_G.length / 2);
  });
});

describe('links from anyone are read safely', () => {
  it('rejects garbage without throwing', () => {
    expect(unpackGift('')).toBeNull();
    expect(unpackGift('not a link!')).toBeNull();
    expect(unpackGift('AQAAAA')).toBeNull(); // cut off part-way
    expect(decodeGift('%%%')).toBeNull();
  });

  it('opens a default bouquet for an unreadable link instead of the maker', () => {
    expect(giftFromUrl('?b=zzzz')?.recipientName).toBe(defaultBouquetProps.recipientName);
  });

  it('clamps what it reads', () => {
    const wild = encodeGift({
      ...EVERYTHING,
      recipientName: 'x'.repeat(500),
      flowers: Array.from({ length: 80 }, () => ({ type: 'rose' as const, scale: 99, x: 50, tilt: 400 })),
    });
    const g = decodeGift(wild)!;
    expect(g.recipientName.length).toBe(40);
    expect(g.flowers!.length).toBe(24);
    expect(g.flowers![0]).toMatchObject({ scale: 2.5, x: 1.2, tilt: 90 });
  });
});
