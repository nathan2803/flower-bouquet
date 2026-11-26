/** Flowers with a head that blooms petal by petal. */
export type HeadType =
  | 'rose'
  | 'tulip'
  | 'daisy'
  | 'ranunculus'
  | 'lily'
  | 'peony'
  | 'sunflower'
  | 'carnation'
  | 'cosmos'
  | 'hydrangea'
  | 'anemone';

/** Greenery and sprays that grow along their stem. */
export type FillerType = 'eucalyptus' | 'babysBreath' | 'lavender' | 'fern' | 'forgetMeNot' | 'berries';

export type FlowerType = HeadType | FillerType;

/** What holds the flowers. */
export type ContainerType = 'wrap' | 'basket' | 'vase' | 'box' | 'none';

/** The overall shape the flowers make (used for spacing and auto-placement). */
export type Arrangement = 'dome' | 'tall' | 'wide' | 'cascade' | 'posy';

export type Palette = {
  /** Paper background. */
  background: string;
  /** Default rose colour; also tints the wax seal and card border. */
  rose: string;
  /** Default tulip / ranunculus colour and flower centres. */
  butter: string;
  /** Stems, leaves and eucalyptus. */
  sage: string;
  /** Kraft wrapping paper. */
  kraft: string;
  /** Text and outlines. */
  ink: string;
  /** Tissue paper behind the flowers. */
  tissue: string;
  /** Ribbon and bow. */
  ribbon: string;
  /** Note card stock. */
  cream: string;
  /** Basket weave. */
  wicker: string;
  /** Vase glass tint. */
  glass: string;
  /** Hatbox. */
  box: string;
};

export type PaletteKey = keyof Palette;

/**
 * One stem in the bouquet.
 *
 * Colours are a palette key (`'rose'`, `'butter'`, …) or any CSS hex colour.
 * `x` runs from -1 (far left) to 1 (far right); `y` from 0 (just above the
 * container) to 1 (top of the arrangement). A negative `y` lets a flower
 * spill over the front of the container. Leave both out and the flower is
 * placed automatically.
 */
export type FlowerSpec = {
  type: FlowerType;
  color?: string;
  /** Centre / throat colour (daisy, sunflower, cosmos, anemone, lily, ranunculus). */
  centerColor?: string;
  /** Petal count (daisy, sunflower, cosmos, anemone, lily). */
  petals?: number;
  /** Leaves on the stem, 0–3. Defaults per type. */
  leaves?: number;
  stemColor?: string;
  x?: number;
  y?: number;
  /** Size multiplier, 1 = default. */
  scale?: number;
  /** Head rotation in degrees. Defaults to leaning with the stem. */
  tilt?: number;
  /** Extra frames to wait before this stem starts growing. */
  delay?: number;
};

// `type` (not `interface`) so Remotion's Composition accepts it as props.
export type BouquetProps = {
  recipientName: string;
  message: string;
  senderName: string;
  /** Small italic line above the recipient's name. */
  heading?: string;
  /** Words before the sender's name on the card. */
  signoff?: string;
  container?: ContainerType;
  arrangement?: Arrangement;
  palette?: Partial<Palette>;
  flowers?: FlowerSpec[];
};
