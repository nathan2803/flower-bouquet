/**
 * Gift links that are out in the world.
 *
 * The links below were made by the site and are frozen here:
 *  - current links (version 2) must keep opening the same gift;
 *  - retired links (version 1 `?b=`, `?g=` and `?to=…`, taken down on
 *    28 Nov 2026) must keep showing "no longer available".
 * If one of these tests fails, a change has altered links people already
 * have: change the code back, or retire links on purpose (PACK_VERSION).
 *
 * Things that quietly change current links without touching share.ts:
 *  - DEFAULT_PALETTE, and the default heading and sign-off: links only store
 *    what differs from them, so changing a default changes those gifts.
 *  - Reordering flower types, containers, arrangements or palette keys.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_PALETTE, PRESETS, defaultBouquetProps } from '../src/bouquet/config';
import type { BouquetProps } from '../src/bouquet/types';
import { PACK_VERSION, packGift, readLink, readPastedLink, unpackGift } from '../src/share';

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

// ---- current links (version 2, made 28 Nov 2026) ----

const SIMPLE_B =
  'AgAAAAZBbWVsaWEEVGhlb0RIYXBweSBiaXJ0aGRheSEgVGhhbmsgeW91IGZvciBtYWtpbmcgb3JkaW5hcnkgZGF5cyBmZWVsIGxpa2Ugc3ByaW5nLgYBYwCePgFnAGJCXwGDAMRaAYMAQlYBhwAFZlUAIwkC3FQ';

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
  'Ak8AgfP2-l5_uARab8OrClNhbSAmIEFsZXgiRsO8ciBkaWNoIOKcvyDigJQgaGFwcHkgMzB0aCEg8J-SkBdmb3IgbXkgZmF2b3VyaXRlIHBlcnNvbgxhbGwgbXkgbG92ZSwDAV_9ASwqSgMHAs70ffEMAgMAWjIAwwjytjIKPA';

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

// ---- retired links (taken down 28 Nov 2026) ----

const RETIRED_V1 =
  'AQAAAAZBbWVsaWEEVGhlb0RIYXBweSBiaXJ0aGRheSEgVGhhbmsgeW91IGZvciBtYWtpbmcgb3JkaW5hcnkgZGF5cyBmZWVsIGxpa2Ugc3ByaW5nLgYBYwCePgFnAGJCXwGDAMRaAYMAQlYBhwAFZlUAIwkC3FQ';

/** The older JSON format. */
const RETIRED_G =
  'eyJ0byI6Ilpvw6siLCJmcm9tIjoiU2FtICYgQWxleCIsIm1zZyI6IkbDvHIgZGljaCDinL8g4oCUIGhhcHB5IDMwdGghIPCfkpAiLCJoIjoiZm9yIG15IGZhdm91cml0ZSBwZXJzb24iLCJzIjoiYWxsIG15IGxvdmUsIiwiYyI6InZhc2UiLCJhIjoiY2FzY2FkZSIsInAiOnsiYmFja2dyb3VuZCI6IiNGM0Y2RkEiLCJyaWJib24iOiIjNUU3RkI4In0sImYiOlt7InR5cGUiOiJhbmVtb25lIiwiY29sb3IiOiJyb3NlIiwiY2VudGVyQ29sb3IiOiIjMkMyQTRBIiwic3RlbUNvbG9yIjoic2FnZSIsInBldGFscyI6NywibGVhdmVzIjoyLCJ4IjotMC41LCJ5IjotMC4xMiwic2NhbGUiOjEuMjUsInRpbHQiOi0xNSwiZGVsYXkiOjEyfSx7InR5cGUiOiJiZXJyaWVzIiwieCI6MC45LCJ5IjowLjV9LHsidHlwZSI6InN1bmZsb3dlciIsImNvbG9yIjoiI0YyQjYzMiIsIngiOjAuMSwieSI6MC42fV19';

describe('current links open the same gift', () => {
  it('reads a simple link', () => {
    expect(tidy(unpackGift(SIMPLE_B))).toEqual(tidy(SIMPLE));
  });

  it('reads a link that uses every field', () => {
    expect(tidy(unpackGift(EVERYTHING_B))).toEqual(tidy(EVERYTHING));
  });

  it('routes them from the address bar and from pasted text', () => {
    expect(PACK_VERSION).toBe(2);
    const read = readLink(`?b=${SIMPLE_B}&frame=400`);
    expect(read.kind).toBe('gift');
    expect(read.kind === 'gift' && tidy(read.gift)).toEqual(tidy(SIMPLE));
    expect(readPastedLink(`https://nathan2803.github.io/flower-bouquet/?b=${EVERYTHING_B}`).kind).toBe('gift');
    expect(readLink('').kind).toBe('maker');
  });
});

describe('retired links stay taken down', () => {
  it.each([
    ['a version 1 link', `?b=${RETIRED_V1}`],
    ['a ?g= link', `?g=${RETIRED_G}`],
    ['a ?to=…&preset= link', '?to=Sam&from=Alex&msg=Happy%20birthday!&preset=lilyVase'],
    ['a ?preset= link', '?preset=classic'],
  ])('%s', (_name, search) => {
    expect(readLink(search).kind).toBe('retired');
    expect(readPastedLink(`https://nathan2803.github.io/flower-bouquet/${search}`).kind).toBe('retired');
  });

  it('cannot be read as a gift any more', () => {
    expect(unpackGift(RETIRED_V1)).toBeNull();
  });
});

describe('new links', () => {
  it('are made the same way as before', () => {
    // Not required for links to open, but a change here means new links
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
    expect(EVERYTHING_B.length).toBeLessThan(RETIRED_G.length / 2);
  });
});

describe('links from anyone are read safely', () => {
  it('calls garbage a broken link without throwing', () => {
    for (const code of ['', 'not a link!', 'zzzz', 'AgAAAA']) {
      expect(unpackGift(code)).toBeNull();
      if (code) expect(readLink(`?b=${encodeURIComponent(code)}`).kind).toBe('broken');
    }
    expect(readPastedLink('hello there').kind).toBe('maker');
  });

  it('clamps what it reads', () => {
    const wild = b64(
      packGift({
        ...EVERYTHING,
        recipientName: 'x'.repeat(500),
        flowers: Array.from({ length: 80 }, () => ({ type: 'rose' as const, scale: 99, x: 50, tilt: 400 })),
      }),
    );
    const g = unpackGift(wild)!;
    expect(g.recipientName.length).toBe(40);
    expect(g.flowers!.length).toBe(24);
    expect(g.flowers![0]).toMatchObject({ scale: 2.5, x: 1.2, tilt: 90 });
  });
});
