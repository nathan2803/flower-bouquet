import React from 'react';
import { cardPose, doodle, twineShapes, wrapMessage, type BowPoint } from './card';
import { circ, clamp01, dark, n, roundRect, sc } from './geometry';
import { FONTS } from './fonts';
import { Shapes, useClock } from './Shapes';
import { T } from './timing';
import type { Palette } from './types';

export type { BowPoint } from './card';

export const CardTwine: React.FC<{ palette: Palette; bow: BowPoint }> = ({ palette, bow }) => (
  <Shapes shapes={twineShapes(useClock(), palette, bow)} />
);

type NoteCardProps = {
  palette: Palette;
  bow: BowPoint;
  softId: string;
  recipientName: string;
  message: string;
  senderName: string;
  signoff: string;
};

export const NoteCard: React.FC<NoteCardProps> = ({ palette: pal, bow, softId, recipientName, message, senderName, signoff }) => {
  const ck = useClock();
  const p = cardPose(ck, bow);
  const { size, lines } = wrapMessage(message);
  const lh = Math.round(size * 1.12);
  const top = lines.length > 3 ? -30 : -14;
  const rows = Math.max(3, lines.length);
  const toO = ck.ramp(T.cardTo[0], T.cardTo[1], 'out');
  const fromO = ck.ramp(T.cardFrom[0], T.cardFrom[1], 'out');

  return (
    <g
      transform={`translate(${n(p.x)} ${n(p.y)}) rotate(${n(p.rotate)}) scale(${sc(p.scale)})`}
      opacity={n(clamp01(p.v * 3))}
    >
      <path d={roundRect(-370, -176, 740, 380, 18)} fill={pal.ink} opacity={0.18} filter={`url(#${softId})`} />
      <path d={roundRect(-360, -190, 720, 380, 18)} fill={pal.cream} stroke={dark(pal.cream, 0.12)} strokeWidth={2} />
      <path d={roundRect(-338, -168, 676, 336, 10)} fill="none" stroke={pal.rose} strokeWidth={1.6} opacity={0.55} />
      {Array.from({ length: rows }, (_, i) => (
        <path key={i} d={`M-300,${top + i * lh + 14}H300`} stroke={pal.sage} strokeWidth={1.4} opacity={0.4} />
      ))}
      <Shapes shapes={doodle(pal)} />
      <path d={circ(-318, -148, 9)} fill={pal.background} stroke={dark(pal.kraft, 0.3)} strokeWidth={2} />

      <text x={-300} y={-92} fill={pal.ink} opacity={toO}>
        <tspan fontFamily={FONTS.serif} fontStyle="italic" fontSize={32} fillOpacity={0.68}>
          To
        </tspan>
        <tspan dx={16} fontFamily={FONTS.hand} fontSize={68} fontWeight={600}>
          {recipientName}
        </tspan>
      </text>

      {lines.map((line, i) => {
        const o = ck.ramp(T.cardLines + i * 7, T.cardLines + 18 + i * 7, 'out');
        return (
          <text
            key={i}
            x={-300}
            y={n(top + i * lh + (1 - o) * 10)}
            fontFamily={FONTS.hand}
            fontSize={size}
            fontWeight={500}
            fill={pal.ink}
            opacity={o}
          >
            {line}
          </text>
        );
      })}

      <text x={304} y={160} textAnchor="end" fill={pal.ink} opacity={fromO}>
        <tspan fontFamily={FONTS.serif} fontStyle="italic" fontSize={30} fillOpacity={0.68}>
          {signoff}
        </tspan>
        <tspan dx={14} fontFamily={FONTS.hand} fontSize={60} fontWeight={600}>
          {senderName}
        </tspan>
      </text>
    </g>
  );
};
