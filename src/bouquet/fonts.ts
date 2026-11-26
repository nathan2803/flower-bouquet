import { loadFont as loadCaveat } from '@remotion/google-fonts/Caveat';
import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';

// Remotion waits for these before rendering a frame, so the MP4 never shows
// fallback fonts. In the browser they swap in as soon as they arrive.
const serif = loadFraunces('normal', { weights: ['400', '500'], subsets: ['latin'] });
loadFraunces('italic', { weights: ['400'], subsets: ['latin'] });
const hand = loadCaveat('normal', { weights: ['500', '600'], subsets: ['latin'] });

export const FONTS = {
  /** Editorial serif for the heading. */
  serif: `${serif.fontFamily}, Georgia, 'Times New Roman', serif`,
  /** Handwriting for the note card. */
  hand: `${hand.fontFamily}, 'Segoe Script', 'Bradley Hand', cursive`,
};
