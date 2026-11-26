import React from 'react';
import { AbsoluteFill } from 'remotion';
import { dark } from './geometry';
import { useClock } from './Shapes';
import { T } from './timing';
import type { Palette } from './types';

export type SvgIds = { fibers: string; soft: string; grain: string; vignette: string };

/** Shared <defs>: kraft fibre pattern and a soft blur for the card shadow. */
export const PaperDefs: React.FC<{ ids: SvgIds; palette: Palette }> = ({ ids, palette }) => (
  <defs>
    <pattern id={ids.fibers} width={140} height={140} patternUnits="userSpaceOnUse">
      <path
        d="M8,12l34,6M60,30l40,-5M18,70l28,10M90,64l36,8M40,104l44,-4M100,118l30,6M4,128l26,-6M70,6l22,8"
        fill="none"
        stroke={dark(palette.kraft, 0.35)}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </pattern>
    <filter id={ids.soft} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation={10} />
    </filter>
  </defs>
);

/** The cream paper itself, fading in over the first second. */
export const PaperBase: React.FC<{ palette: Palette }> = ({ palette }) => {
  const ck = useClock();
  return <rect width={1080} height={1920} fill={palette.background} opacity={ck.ramp(T.paperFade[0], T.paperFade[1], 'out')} />;
};

/**
 * Grain and vignette, laid over everything in their own SVG. The noise is a
 * fixed-seed feTurbulence, so every render is identical.
 */
export const PaperGrain: React.FC<{ ids: SvgIds; palette: Palette }> = ({ ids, palette }) => {
  const ck = useClock();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: ck.ramp(T.paperFade[0], T.paperFade[1], 'out') }}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" aria-hidden="true">
        <defs>
          <filter id={ids.grain} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} seed={7} stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.18  0 0 0 0 0.16  0 0 0 0 0.15  0.6 0 0 0 -0.2" />
          </filter>
          <radialGradient id={ids.vignette} cx="50%" cy="46%" r="72%">
            <stop offset="58%" stopColor={palette.background} stopOpacity={0} />
            <stop offset="100%" stopColor={dark(palette.background, 0.35)} stopOpacity={0.5} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} filter={`url(#${ids.grain})`} opacity={0.45} />
        <rect width={1080} height={1920} fill={`url(#${ids.vignette})`} />
      </svg>
    </AbsoluteFill>
  );
};
