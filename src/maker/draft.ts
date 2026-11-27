/**
 * The bouquet being made, and keeping it on this device between visits.
 * Nothing leaves the browser: it's stored in localStorage only.
 */
import { DEFAULT_PALETTE, PRESETS, defaultBouquetProps, type PresetName } from '../bouquet/config';
import type { Arrangement, BouquetProps, ContainerType, Palette } from '../bouquet/types';
import { MAX_FLOWERS, MAX_MESSAGE, cleanFlower } from '../share';

export type Draft = Required<
  Pick<BouquetProps, 'recipientName' | 'senderName' | 'message' | 'heading' | 'signoff' | 'container' | 'arrangement' | 'flowers'>
> & {
  palette: Palette;
  preset: PresetName | null;
};

const KEY = 'bouquet:draft:v1';
const CONTAINERS: ContainerType[] = ['wrap', 'basket', 'vase', 'box', 'none'];
const ARRANGEMENTS: Arrangement[] = ['dome', 'tall', 'wide', 'cascade', 'posy'];
const HEX = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;

export const saveDraft = (d: Draft) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage full or blocked (private browsing): just don't save */
  }
};

export const clearDraft = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
};

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

/** The saved draft, checked field by field; null if there isn't a usable one. */
export const loadDraft = (): Draft | null => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Record<string, unknown> | null;
    if (!raw || typeof raw !== 'object') return null;
    const flowers = (Array.isArray(raw.flowers) ? raw.flowers : []).slice(0, MAX_FLOWERS).map(cleanFlower).filter((f) => f !== null);
    if (!flowers.length) return null;
    const palette = { ...DEFAULT_PALETTE };
    const p = raw.palette as Record<string, unknown> | undefined;
    for (const k of Object.keys(DEFAULT_PALETTE) as (keyof Palette)[]) {
      const v = p?.[k];
      if (typeof v === 'string' && HEX.test(v)) palette[k] = v;
    }
    return {
      recipientName: text(raw.recipientName, 40),
      senderName: text(raw.senderName, 40),
      message: text(raw.message, MAX_MESSAGE),
      heading: typeof raw.heading === 'string' ? raw.heading.slice(0, 60) : defaultBouquetProps.heading ?? '',
      signoff: text(raw.signoff, 30),
      container: CONTAINERS.includes(raw.container as ContainerType) ? (raw.container as ContainerType) : 'wrap',
      arrangement: ARRANGEMENTS.includes(raw.arrangement as Arrangement) ? (raw.arrangement as Arrangement) : 'dome',
      palette,
      flowers,
      preset: typeof raw.preset === 'string' && raw.preset in PRESETS ? (raw.preset as PresetName) : null,
    };
  } catch {
    return null;
  }
};

/** A gift someone already sent, back as an editable draft. */
export const draftFromGift = (g: BouquetProps): Draft => ({
  recipientName: g.recipientName,
  senderName: g.senderName,
  message: g.message,
  heading: g.heading ?? defaultBouquetProps.heading ?? '',
  signoff: g.signoff && g.signoff !== defaultBouquetProps.signoff ? g.signoff : '',
  container: g.container ?? 'wrap',
  arrangement: g.arrangement ?? 'dome',
  palette: { ...DEFAULT_PALETTE, ...g.palette },
  flowers: (g.flowers ?? []).map((f) => ({ ...f })),
  preset: null,
});
