import React from 'react';
import { headShapes, stemShapes, type Calm, type LaidOutFlower } from './flowers';
import { Shapes, useClock } from './Shapes';
import type { Palette } from './types';

/**
 * One stem of the bouquet. It is drawn in two passes so every head sits in
 * front of every stem: render all `layer="stem"` first, then all `layer="head"`.
 *
 * - stem: the stroke draws on with stroke-dashoffset, leaves spring out as it
 *   passes them, fillers (eucalyptus, fern, berries…) grow along it.
 * - head: petals open one by one with an overshooting spring.
 * Both sway around the container's tie point and bend when a breeze blows.
 */
export const Flower: React.FC<{ flower: LaidOutFlower; palette: Palette; layer: 'stem' | 'head'; calm: Calm }> = ({
  flower,
  palette,
  layer,
  calm,
}) => {
  const ck = useClock();
  const shapes = layer === 'stem' ? stemShapes(flower, ck, palette, calm) : headShapes(flower, ck, palette, calm);
  return <Shapes shapes={shapes} />;
};
