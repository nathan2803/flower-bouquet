import React, { useId, useMemo } from 'react';
import { AbsoluteFill } from 'remotion';
import { DEFAULT_FLOWERS, DEFAULT_PALETTE, defaultBouquetProps } from './config';
import { ContainerBack, ContainerFront, RibbonBow } from './Container';
import { CONTAINERS } from './containers';
import { Flower } from './Flower';
import { FloatingPetals } from './FloatingPetals';
import { layoutFlowers, type Calm } from './flowers';
import { FONTS } from './fonts';
import { CardTwine, NoteCard } from './NoteCard';
import { Opening } from './Opening';
import { PaperBase, PaperDefs, PaperGrain, type SvgIds } from './PaperBackground';
import { GustContext } from './Shapes';
import type { BouquetProps, Palette } from './types';

export type BouquetCompositionProps = BouquetProps & {
  /** Frames at which a breeze was blown (the web page adds these live). */
  gusts?: number[];
  /** Gentler ambient sway, for prefers-reduced-motion. */
  reducedMotion?: boolean;
};

/**
 * The whole gift. Drawn back to front:
 * paper → container back → stems → flower heads → container front →
 * flowers spilling over the rim → note card → twine + bow → seal + heading →
 * drifting petals → grain.
 *
 * Every value comes from useCurrentFrame() (via useClock) plus the gust list,
 * so a frame always renders the same picture in the Studio, the Player and
 * the MP4. After frame 360 the ambient motion loops forever without a seam.
 */
export const BouquetComposition: React.FC<BouquetCompositionProps> = ({
  recipientName = defaultBouquetProps.recipientName,
  message = defaultBouquetProps.message,
  senderName = defaultBouquetProps.senderName,
  heading = defaultBouquetProps.heading ?? '',
  signoff = defaultBouquetProps.signoff ?? '',
  container = 'wrap',
  arrangement = 'dome',
  palette: paletteOverrides,
  flowers,
  gusts = [],
  reducedMotion = false,
}) => {
  const palette: Palette = { ...DEFAULT_PALETTE, ...paletteOverrides };
  const paletteKey = JSON.stringify(palette);
  const flowersKey = JSON.stringify(flowers);
  const box = CONTAINERS[container] ? container : 'wrap';
  const calm: Calm = { sway: reducedMotion ? 0.35 : 1 };

  const laidOut = useMemo(
    () => layoutFlowers(flowers && flowers.length ? flowers : DEFAULT_FLOWERS, palette, box, arrangement),
    // Recompute only when the inputs' contents change, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flowersKey, paletteKey, box, arrangement],
  );
  const inside = laidOut.filter((f) => !f.spills);
  const spilling = laidOut.filter((f) => f.spills);
  const bow = CONTAINERS[box].bow;

  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ids: SvgIds = {
    fibers: `bq${uid}-fibers`,
    soft: `bq${uid}-soft`,
    grain: `bq${uid}-grain`,
    vignette: `bq${uid}-vignette`,
  };

  return (
    <GustContext.Provider value={gusts}>
      <AbsoluteFill style={{ backgroundColor: '#FFFDFB', fontFamily: FONTS.serif }}>
        <svg
          viewBox="0 0 1080 1920"
          width="100%"
          height="100%"
          role="img"
          aria-label={`An animated bouquet for ${recipientName}, with a note card from ${senderName}`}
        >
          <PaperDefs ids={ids} palette={palette} />
          <PaperBase palette={palette} />
          <ContainerBack container={box} palette={palette} fiberId={ids.fibers} />
          {laidOut.map((f) => (
            <Flower key={`stem-${f.index}`} flower={f} palette={palette} layer="stem" calm={calm} />
          ))}
          {inside.map((f) => (
            <Flower key={`head-${f.index}`} flower={f} palette={palette} layer="head" calm={calm} />
          ))}
          <ContainerFront container={box} palette={palette} fiberId={ids.fibers} />
          {spilling.map((f) => (
            <Flower key={`head-${f.index}`} flower={f} palette={palette} layer="head" calm={calm} />
          ))}
          <NoteCard
            palette={palette}
            bow={bow}
            softId={ids.soft}
            recipientName={recipientName}
            message={message}
            senderName={senderName}
            signoff={signoff}
          />
          <CardTwine palette={palette} bow={bow} />
          <RibbonBow container={box} palette={palette} />
          <Opening palette={palette} heading={heading} recipientName={recipientName} />
          <FloatingPetals palette={palette} calm={calm} />
        </svg>
        <PaperGrain ids={ids} palette={palette} />
      </AbsoluteFill>
    </GustContext.Provider>
  );
};
