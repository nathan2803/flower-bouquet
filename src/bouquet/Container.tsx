import React from 'react';
import { CONTAINERS, bowShapes } from './containers';
import { Shapes, useClock } from './Shapes';
import type { ContainerType, Palette } from './types';

type Props = { container: ContainerType; palette: Palette; fiberId: string };

/** Drawn behind the stems: tissue, basket handle and mouth, vase shadow… */
export const ContainerBack: React.FC<Props> = ({ container, palette, fiberId }) => (
  <Shapes shapes={CONTAINERS[container].back(useClock(), palette, fiberId)} />
);

/** Drawn in front of the stems: kraft folds, woven basket, glass vase, hatbox, ribbon band. */
export const ContainerFront: React.FC<Props> = ({ container, palette, fiberId }) => (
  <Shapes shapes={CONTAINERS[container].front(useClock(), palette, fiberId)} />
);

export const RibbonBow: React.FC<{ container: ContainerType; palette: Palette }> = ({ container, palette }) => (
  <Shapes shapes={bowShapes(useClock(), palette, CONTAINERS[container].bow)} />
);
