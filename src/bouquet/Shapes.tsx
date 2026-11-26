import React, { createContext, useContext } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { Shape } from './geometry';
import { makeClock } from './timing';

/** Frames at which a breeze was blown; provided by BouquetComposition. */
export const GustContext = createContext<number[]>([]);

/** The current frame as a Clock for the geometry functions. */
export const useClock = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const gusts = useContext(GustContext);
  return makeClock(frame, fps, gusts);
};

/** Renders a list of path shapes in order (first = furthest back). */
export const Shapes: React.FC<{ shapes: Shape[] }> = ({ shapes }) => (
  <>
    {shapes.map((s, i) => (
      <path
        key={i}
        d={s.d}
        fill={s.f ?? 'none'}
        stroke={s.s ?? 'none'}
        strokeWidth={s.sw}
        strokeDasharray={s.da}
        strokeDashoffset={s.dof}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={s.o}
        transform={s.t}
      />
    ))}
  </>
);
