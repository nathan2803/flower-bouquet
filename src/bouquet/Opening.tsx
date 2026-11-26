import React from 'react';
import { FONTS } from './fonts';
import { SEAL_PATH, SEAL_RING, openingModel } from './openingModel';
import { Shapes, useClock } from './Shapes';
import type { Palette } from './types';

/**
 * Frames 0–95: a wax seal with the recipient's initial lands in the middle
 * with sparkles, then floats up under the heading as the name fades in.
 */
export const Opening: React.FC<{ palette: Palette; heading: string; recipientName: string }> = ({
  palette: pal,
  heading,
  recipientName,
}) => {
  const m = openingModel(useClock(), pal);
  return (
    <>
      <Shapes shapes={m.sparkles} />
      <g transform={m.seal.t} opacity={m.seal.o}>
        <path d={SEAL_PATH} fill={m.seal.wax} />
        <path d={SEAL_RING} fill="none" stroke={m.seal.emboss} strokeWidth={3} opacity={0.6} />
        <text x={0} y={24} textAnchor="middle" fontFamily={FONTS.serif} fontStyle="italic" fontSize={68} fill={m.seal.emboss}>
          {recipientName.trim().charAt(0).toUpperCase()}
        </text>
      </g>
      <text x={540} y={m.heading.y} textAnchor="middle" fontFamily={FONTS.serif} fontStyle="italic" fontSize={48} fill={pal.ink} fillOpacity={0.75} opacity={m.heading.o}>
        {heading}
      </text>
      <text x={540} y={m.name.y} textAnchor="middle" fontFamily={FONTS.serif} fontSize={124} fontWeight={500} fill={pal.ink} opacity={m.name.o}>
        {recipientName}
      </text>
    </>
  );
};
