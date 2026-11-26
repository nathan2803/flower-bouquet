import React from 'react';
import { Composition } from 'remotion';
import { BouquetComposition, type BouquetCompositionProps } from '../bouquet/BouquetComposition';
import { PRESETS, VIDEO, defaultBouquetProps, type PresetName } from '../bouquet/config';

const presetProps = (name: PresetName): BouquetCompositionProps => {
  const { title: _title, ...rest } = PRESETS[name];
  return { ...defaultBouquetProps, ...rest };
};

/**
 * `Bouquet` is the main composition. The others use the preset mixes and
 * containers, so you can compare them in the Studio. `Bouquet-breeze` shows
 * a gust blowing through at 10 s (the web page adds gusts live).
 *
 * Render with your own text from the command line:
 *   npx remotion render src/remotion/index.ts Bouquet out/gift.mp4 \
 *     --props='{"recipientName":"Sam","senderName":"Alex","message":"You are my favourite person."}'
 */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Bouquet"
      component={BouquetComposition}
      durationInFrames={VIDEO.durationInFrames}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
      defaultProps={{ ...defaultBouquetProps, gusts: [] } satisfies BouquetCompositionProps}
    />
    <Composition
      id="Bouquet-breeze"
      component={BouquetComposition}
      durationInFrames={VIDEO.durationInFrames + 90}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
      defaultProps={{ ...defaultBouquetProps, gusts: [300] } satisfies BouquetCompositionProps}
    />
    {(Object.keys(PRESETS) as PresetName[])
      .filter((name) => name !== 'classic')
      .map((name) => (
        <Composition
          key={name}
          id={`Bouquet-${name}`}
          component={BouquetComposition}
          durationInFrames={VIDEO.durationInFrames}
          fps={VIDEO.fps}
          width={VIDEO.width}
          height={VIDEO.height}
          defaultProps={presetProps(name)}
        />
      ))}
  </>
);
