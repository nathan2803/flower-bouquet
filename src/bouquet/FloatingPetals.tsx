import React from 'react';
import type { Calm } from './flowers';
import { driftingPetals, gustPetals } from './petals';
import { Shapes, useClock } from './Shapes';
import type { Palette } from './types';

export const FloatingPetals: React.FC<{ palette: Palette; calm: Calm }> = ({ palette, calm }) => {
  const ck = useClock();
  return <Shapes shapes={[...driftingPetals(ck, palette, calm), ...gustPetals(ck, palette)]} />;
};
