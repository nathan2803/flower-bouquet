/**
 * The gifts you've sent from this browser: a list kept in localStorage,
 * added to whenever a gift's link leaves the maker (copied, shared, QR code,
 * image, opened). Nothing is uploaded, and it can't see whether a gift was
 * opened: there's no server to tell it.
 */
import type { BouquetProps, HeadType } from '../bouquet/types';
import { giftCode, giftLink } from '../share';
import { qrLook } from './qr';

export type SentHow = 'link' | 'share' | 'qr' | 'image' | 'opened';

export type SentGift = {
  /** The `?b=` code; one entry per distinct gift. */
  code: string;
  link: string;
  to: string;
  from: string;
  message: string;
  flowers: number;
  /** For the little picture in the list. */
  hero: { type: HeadType; color: string };
  firstAt: number;
  lastAt: number;
  how: SentHow[];
};

const KEY = 'bouquet:sent:v1';
const MAX = 100;
const HOW: SentHow[] = ['link', 'share', 'qr', 'image', 'opened'];

export const loadSent = (): SentGift[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (s): s is SentGift =>
          s && typeof s.code === 'string' && typeof s.link === 'string' && typeof s.to === 'string' && typeof s.lastAt === 'number',
      )
      .map((s) => ({ ...s, how: Array.isArray(s.how) ? s.how.filter((h: SentHow) => HOW.includes(h)) : [] }))
      .slice(0, MAX);
  } catch {
    return [];
  }
};

const store = (list: SentGift[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* storage full or blocked */
  }
};

/** Adds a gift (or bumps it to the top if it's already there). Returns the new list. */
export const recordSent = (gift: BouquetProps, how: SentHow): SentGift[] => {
  const code = giftCode(gift);
  const now = Date.now();
  const list = loadSent();
  const old = list.find((s) => s.code === code);
  const { hero } = qrLook(gift);
  const entry: SentGift = {
    code,
    link: giftLink(gift),
    to: gift.recipientName,
    from: gift.senderName,
    message: gift.message,
    flowers: gift.flowers?.length ?? 0,
    hero: { type: hero.type, color: hero.color },
    firstAt: old?.firstAt ?? now,
    lastAt: now,
    how: [...new Set([...(old?.how ?? []), how])],
  };
  const next = [entry, ...list.filter((s) => s.code !== code)];
  store(next);
  return next;
};

export const removeSent = (code: string): SentGift[] => {
  const next = loadSent().filter((s) => s.code !== code);
  store(next);
  return next;
};

export const restoreSent = (list: SentGift[]) => store(list);
