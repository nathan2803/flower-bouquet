import type { BouquetProps, FlowerSpec, FlowerType, Palette } from './types';

export const VIDEO = {
  fps: 30,
  width: 1080,
  height: 1920,
  durationInFrames: 360,
} as const;

export const DEFAULT_PALETTE: Palette = {
  background: '#FAF6F0',
  rose: '#E8A0A8',
  butter: '#F4D58D',
  sage: '#8FA893',
  kraft: '#D9B99B',
  ink: '#2E2A27',
  tissue: '#F5DCDD',
  ribbon: '#D98C96',
  cream: '#FFFBF3',
  wicker: '#C49A6C',
  glass: '#CFE3E0',
  box: '#E7C6C0',
};

/** 3 roses, 2 daisies, a ranunculus, a tulip, eucalyptus and baby's breath. */
export const DEFAULT_FLOWERS: FlowerSpec[] = [
  { type: 'eucalyptus', x: -0.98, y: 0.62 },
  { type: 'eucalyptus', x: 0.98, y: 0.66, scale: 0.95 },
  { type: 'babysBreath', x: -0.6, y: 0.9 },
  { type: 'babysBreath', x: 0.66, y: 0.86 },
  { type: 'babysBreath', x: 0.05, y: 1.02, scale: 0.85 },
  { type: 'tulip', color: 'butter', x: -0.36, y: 0.84 },
  { type: 'daisy', x: 0.6, y: 0.5 },
  { type: 'rose', color: 'rose', x: 0.28, y: 0.76 },
  { type: 'ranunculus', color: 'butter', x: -0.68, y: 0.4 },
  { type: 'rose', color: 'rose', x: -0.08, y: 0.48, scale: 1.18 },
  { type: 'daisy', x: -0.4, y: 0.16, scale: 0.85 },
  { type: 'rose', color: '#F2C4C4', x: 0.42, y: 0.2, scale: 0.95 },
];

export const defaultBouquetProps: BouquetProps = {
  recipientName: 'Amelia',
  message: 'Happy birthday! Thank you for making ordinary days feel like spring.',
  senderName: 'Theo',
  heading: 'a little something for',
  signoff: 'with love,',
  container: 'wrap',
  arrangement: 'dome',
  palette: DEFAULT_PALETTE,
  flowers: DEFAULT_FLOWERS,
};

export type PresetName =
  | 'classic'
  | 'blush'
  | 'sunday'
  | 'lavender'
  | 'sunflowerBasket'
  | 'lilyVase'
  | 'peonyBox'
  | 'wildflowerPosy';

type Preset = Pick<BouquetProps, 'palette' | 'flowers' | 'container' | 'arrangement'> & { title: string };

/**
 * Ready-made compositions. Spread one into your props:
 * `{ ...props, ...PRESETS.lilyVase }`, or use `?preset=lilyVase` in the link.
 */
export const PRESETS: Record<PresetName, Preset> = {
  classic: { title: 'Classic wrap', container: 'wrap', arrangement: 'dome', palette: DEFAULT_PALETTE, flowers: DEFAULT_FLOWERS },
  blush: {
    title: 'Blush garden',
    container: 'wrap',
    arrangement: 'dome',
    palette: { ...DEFAULT_PALETTE, rose: '#E3919E', tissue: '#F7DDE0', ribbon: '#C97884' },
    flowers: [
      { type: 'eucalyptus', x: -0.98, y: 0.6 },
      { type: 'eucalyptus', x: 0.98, y: 0.64 },
      { type: 'babysBreath', x: -0.55, y: 0.92 },
      { type: 'babysBreath', x: 0.6, y: 0.9 },
      { type: 'ranunculus', color: '#F4C6C9', x: -0.62, y: 0.5 },
      { type: 'rose', x: 0.05, y: 0.88, scale: 0.95 },
      { type: 'ranunculus', color: '#F7D9D2', x: 0.66, y: 0.42 },
      { type: 'rose', x: -0.22, y: 0.52, scale: 1.15 },
      { type: 'rose', color: '#F2C4C4', x: 0.34, y: 0.62 },
      { type: 'ranunculus', color: 'rose', x: -0.3, y: 0.18, scale: 0.95 },
      { type: 'rose', color: '#D97F8E', x: 0.35, y: 0.2 },
    ],
  },
  sunday: {
    title: 'Sunday market',
    container: 'wrap',
    arrangement: 'tall',
    palette: { ...DEFAULT_PALETTE, butter: '#F2C96B', tissue: '#FBEFD0', ribbon: '#8FA893' },
    flowers: [
      { type: 'lavender', x: -0.9, y: 0.8 },
      { type: 'lavender', x: 0.92, y: 0.76 },
      { type: 'eucalyptus', x: -0.98, y: 0.4 },
      { type: 'tulip', color: 'butter', x: -0.35, y: 0.95 },
      { type: 'tulip', color: '#F2A17E', x: 0.12, y: 1.02 },
      { type: 'tulip', color: 'butter', x: 0.5, y: 0.9 },
      { type: 'daisy', x: -0.62, y: 0.5 },
      { type: 'daisy', x: 0.66, y: 0.48 },
      { type: 'daisy', x: 0.05, y: 0.55, scale: 1.1 },
      { type: 'tulip', color: '#F2A17E', x: -0.3, y: 0.2 },
      { type: 'daisy', x: 0.38, y: 0.18 },
    ],
  },
  lavender: {
    title: 'Lavender hour',
    container: 'wrap',
    arrangement: 'dome',
    palette: { ...DEFAULT_PALETTE, rose: '#C9B3E3', tissue: '#ECE4F5', ribbon: '#9A88C4', kraft: '#D6BFA6' },
    flowers: [
      { type: 'lavender', x: -0.95, y: 0.7 },
      { type: 'lavender', x: -0.6, y: 0.98 },
      { type: 'lavender', x: 0.62, y: 0.98 },
      { type: 'lavender', x: 0.95, y: 0.72 },
      { type: 'babysBreath', x: 0.05, y: 1.05, scale: 0.9 },
      { type: 'ranunculus', color: 'rose', x: -0.5, y: 0.55 },
      { type: 'rose', color: '#F6E2D3', x: 0.1, y: 0.62, scale: 1.1 },
      { type: 'daisy', x: 0.62, y: 0.5 },
      { type: 'ranunculus', color: '#E8DDF2', x: -0.12, y: 0.2 },
      { type: 'rose', color: '#C9B3E3', x: 0.42, y: 0.2 },
    ],
  },
  sunflowerBasket: {
    title: 'Sunflower basket',
    container: 'basket',
    arrangement: 'cascade',
    palette: { ...DEFAULT_PALETTE, ribbon: '#8FA893', tissue: '#FBEFD0' },
    flowers: [
      { type: 'fern', x: -0.95, y: 0.5 },
      { type: 'fern', x: 0.95, y: 0.55 },
      { type: 'berries', x: -0.72, y: 0.85 },
      { type: 'berries', x: 0.74, y: 0.8 },
      { type: 'babysBreath', x: -0.2, y: 1.0, scale: 0.8 },
      { type: 'sunflower', x: -0.42, y: 0.6, scale: 1.05 },
      { type: 'sunflower', x: 0.4, y: 0.66 },
      { type: 'daisy', x: 0.05, y: 0.9 },
      { type: 'sunflower', x: -0.02, y: 0.3, scale: 1.15 },
      { type: 'daisy', x: -0.72, y: 0.22 },
      { type: 'daisy', x: 0.72, y: 0.18 },
      { type: 'daisy', x: 0.62, y: -0.16, scale: 0.85, tilt: 24 },
    ],
  },
  lilyVase: {
    title: 'Lily vase',
    container: 'vase',
    arrangement: 'tall',
    palette: { ...DEFAULT_PALETTE, ribbon: '#B9A3CF' },
    flowers: [
      { type: 'eucalyptus', x: -0.95, y: 0.58 },
      { type: 'eucalyptus', x: 0.95, y: 0.62 },
      { type: 'babysBreath', x: 0.15, y: 1.02 },
      { type: 'lily', x: -0.34, y: 0.86 },
      { type: 'lily', x: 0.4, y: 0.72, centerColor: '#F2B6A0' },
      { type: 'anemone', x: -0.68, y: 0.4 },
      { type: 'lily', x: -0.02, y: 0.4, scale: 1.05 },
      { type: 'anemone', x: 0.66, y: 0.28 },
      { type: 'anemone', x: -0.3, y: 0.08, scale: 0.85, color: '#F6E7EE' },
    ],
  },
  peonyBox: {
    title: 'Peony hatbox',
    container: 'box',
    arrangement: 'dome',
    palette: { ...DEFAULT_PALETTE, ribbon: '#B5717E', box: '#EBD2CC' },
    flowers: [
      { type: 'eucalyptus', x: -0.98, y: 0.5 },
      { type: 'eucalyptus', x: 0.98, y: 0.45 },
      { type: 'babysBreath', x: 0.7, y: 0.9 },
      { type: 'ranunculus', color: '#F7D9D2', x: -0.25, y: 0.92 },
      { type: 'carnation', color: '#E58A97', x: 0.38, y: 0.84 },
      { type: 'hydrangea', x: -0.6, y: 0.55 },
      { type: 'peony', x: 0.1, y: 0.55, scale: 1.1 },
      { type: 'rose', x: 0.62, y: 0.38 },
      { type: 'peony', color: '#F8DCD8', x: -0.4, y: 0.12 },
      { type: 'rose', color: '#F2C4C4', x: 0.45, y: 0.08, scale: 0.9 },
    ],
  },
  wildflowerPosy: {
    title: 'Wildflower posy',
    container: 'none',
    arrangement: 'posy',
    palette: { ...DEFAULT_PALETTE, ribbon: '#C9A66B' },
    flowers: [
      { type: 'fern', x: -0.95, y: 0.5 },
      { type: 'fern', x: 0.9, y: 0.4 },
      { type: 'lavender', x: -0.7, y: 0.95 },
      { type: 'lavender', x: 0.72, y: 1.0 },
      { type: 'forgetMeNot', x: -0.35, y: 1.05 },
      { type: 'forgetMeNot', x: 0.4, y: 0.85 },
      { type: 'cosmos', x: -0.42, y: 0.55 },
      { type: 'cosmos', color: '#F7EEF2', x: 0.32, y: 0.5 },
      { type: 'cosmos', x: 0.02, y: 0.92, scale: 0.9 },
      { type: 'daisy', x: -0.08, y: 0.18 },
      { type: 'anemone', x: 0.55, y: 0.08, scale: 0.85 },
    ],
  },
};

/** Names shown in the maker. */
export const FLOWER_LABELS: Record<FlowerType, string> = {
  rose: 'Rose',
  tulip: 'Tulip',
  daisy: 'Daisy',
  ranunculus: 'Ranunculus',
  lily: 'Lily',
  peony: 'Peony',
  sunflower: 'Sunflower',
  carnation: 'Carnation',
  cosmos: 'Cosmos',
  hydrangea: 'Hydrangea',
  anemone: 'Anemone',
  eucalyptus: 'Eucalyptus',
  babysBreath: 'Baby’s breath',
  lavender: 'Lavender',
  fern: 'Fern',
  forgetMeNot: 'Forget-me-not',
  berries: 'Berries',
};

/** Types whose centre colour and petal count can be changed (with the default count). */
export const CENTER_TYPES: FlowerType[] = ['daisy', 'sunflower', 'cosmos', 'anemone', 'lily', 'ranunculus'];
export const PETAL_DEFAULTS: Partial<Record<FlowerType, number>> = { daisy: 12, sunflower: 18, cosmos: 8, anemone: 6, lily: 6 };
