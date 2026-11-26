import { Player, type PlayerRef } from '@remotion/player';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MusicBox } from './audio/musicBox';
import { BouquetComposition, type BouquetCompositionProps } from './bouquet/BouquetComposition';
import { DEFAULT_PALETTE, VIDEO } from './bouquet/config';
import { FONTS } from './bouquet/fonts';
import { dark, light } from './bouquet/geometry';
import { AMBIENT_PERIOD, GUST_FRAMES, INTRO_FRAMES } from './bouquet/timing';
import type { BouquetProps } from './bouquet/types';

/**
 * The intro plays once, then the ambient sway keeps going. Its motion repeats
 * exactly every AMBIENT_PERIOD frames, so when this long timeline runs out we
 * jump back to the start of the hold and nobody sees a seam.
 */
export const LIVE_FRAMES = INTRO_FRAMES + AMBIENT_PERIOD * 10;

/** Set VITE_AUDIO_SRC in a .env file to play your own track instead of the music box. */
const AUDIO_SRC: string | undefined = import.meta.env.VITE_AUDIO_SRC;

const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const SoundIcon: React.FC<{ on: boolean }> = ({ on }) => (
  <Icon>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
    {on ? (
      <>
        <path d="M15.5 9a4 4 0 0 1 0 6" />
        <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
      </>
    ) : (
      <path d="m16 9.5 5 5m0-5-5 5" />
    )}
  </Icon>
);

const WindIcon = () => (
  <Icon>
    <path d="M3 8.5h10.5a2.5 2.5 0 1 0-2.5-2.5" />
    <path d="M3 12.5h15a2.5 2.5 0 1 1-2.5 2.5" />
    <path d="M3 16.5h7" />
  </Icon>
);

const ReplayIcon = () => (
  <Icon>
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 4v4.5h4.5" />
  </Icon>
);

const usePrefersReducedMotion = () => {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
};

/**
 * The gift itself: the Tap to open cover, the bouquet playing, music, the
 * Breeze button and the endless hold. `still` opens straight onto one frame.
 */
export const Gift: React.FC<{ gift: BouquetProps; still?: number | null }> = ({ gift, still = null }) => {
  const baseProps = gift;
  const reducedMotion = usePrefersReducedMotion();
  const playerRef = useRef<PlayerRef>(null);
  const musicBox = useRef<MusicBox | null>(null);
  const track = useRef<HTMLAudioElement | null>(null);
  const [opened, setOpened] = useState(false);
  const [inHold, setInHold] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [gusts, setGusts] = useState<number[]>([]);
  const [gustPulse, setGustPulse] = useState(0);

  const inputProps: BouquetCompositionProps = useMemo(
    () => ({ ...baseProps, gusts, reducedMotion }),
    [baseProps, gusts, reducedMotion],
  );
  const wax = dark(baseProps.palette?.rose ?? DEFAULT_PALETTE.rose, 0.32);

  useEffect(() => {
    document.title = `A little bouquet for ${baseProps.recipientName}`;
  }, [baseProps.recipientName]);

  // Track when the intro is over, and loop the hold when the timeline runs out.
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const onFrame = (e: { detail: { frame: number } }) => setInHold(e.detail.frame >= INTRO_FRAMES);
    const onEnded = () => {
      setGusts([]);
      player.seekTo(INTRO_FRAMES);
      player.play();
    };
    player.addEventListener('frameupdate', onFrame);
    player.addEventListener('ended', onEnded);
    return () => {
      player.removeEventListener('frameupdate', onFrame);
      player.removeEventListener('ended', onEnded);
    };
  }, []);

  // Don't animate or play music in a hidden tab.
  useEffect(() => {
    let resumeOnShow = false;
    const onVisibility = () => {
      const player = playerRef.current;
      if (!player) return;
      if (document.hidden) {
        resumeOnShow = player.isPlaying();
        player.pause();
        musicBox.current?.suspend();
        track.current?.pause();
      } else if (resumeOnShow) {
        player.play();
        musicBox.current?.resume();
        void track.current?.play().catch(() => undefined);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // `?frame=300` opens straight onto one still frame (handy for previews).
  useEffect(() => {
    if (still === null || !Number.isFinite(still) || still <= 0) return;
    setOpened(true);
    playerRef.current?.seekTo(Math.min(still, LIVE_FRAMES - 1));
  }, [still]);

  const startSound = useCallback(() => {
    musicBox.current ??= new MusicBox();
    musicBox.current.setMuted(!soundOn);
    if (AUDIO_SRC) {
      musicBox.current.start(false); // only for the breeze whoosh
      track.current ??= Object.assign(new Audio(AUDIO_SRC), { loop: true, volume: 0.6 });
      track.current.muted = !soundOn;
      void track.current.play().catch(() => undefined);
    } else {
      musicBox.current.start();
    }
  }, [soundOn]);

  const blow = useCallback(() => {
    const frame = playerRef.current?.getCurrentFrame() ?? 0;
    setGusts((g) => [...g.filter((x) => frame - x < GUST_FRAMES), frame + 1]);
    setGustPulse((p) => p + 1);
    musicBox.current?.whoosh();
  }, []);

  const open = () => {
    setOpened(true);
    setGusts([]);
    playerRef.current?.seekTo(0);
    playerRef.current?.play();
    startSound(); // inside the click, so the browser allows audio
  };

  const replay = () => {
    setGusts([]);
    setInHold(false);
    playerRef.current?.seekTo(0);
    playerRef.current?.play();
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    if (track.current) track.current.muted = !next;
    musicBox.current?.setMuted(!next);
  };

  return (
    <main className="page">
      <div className="stage">
        <Player
          ref={playerRef}
          component={BouquetComposition}
          inputProps={inputProps}
          durationInFrames={LIVE_FRAMES}
          fps={VIDEO.fps}
          compositionWidth={VIDEO.width}
          compositionHeight={VIDEO.height}
          style={{ width: '100%', height: '100%' }}
          controls={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
        />

        <div className={`cover ${opened ? 'cover--gone' : ''}`} aria-hidden={opened}>
          <div className="cover__inner">
            <svg className="cover__seal" viewBox="-80 -80 160 160" aria-hidden="true">
              <circle r="72" fill={wax} />
              <circle r="52" fill="none" stroke={light(wax, 0.42)} strokeWidth="3" opacity="0.7" />
              <text y="24" textAnchor="middle" fontSize="68" fontStyle="italic" fill={light(wax, 0.42)} style={{ fontFamily: FONTS.serif }}>
                {baseProps.recipientName.trim().charAt(0).toUpperCase()}
              </text>
            </svg>
            <p className="cover__line" style={{ fontFamily: FONTS.serif }}>
              {baseProps.heading}
            </p>
            <h1 className="cover__name" style={{ fontFamily: FONTS.serif }}>
              {baseProps.recipientName}
            </h1>
            <button type="button" className="btn btn--primary" onClick={open} disabled={opened}>
              Tap to open
            </button>
          </div>
        </div>

        <button
          type="button"
          className="round sound"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Turn music off' : 'Turn music on'}
          title={soundOn ? 'Music on' : 'Music off'}
        >
          <SoundIcon on={soundOn} />
        </button>

        {opened && (
          <div className="dock">
            <div className="dock__row">
              <button type="button" className="btn btn--ghost breeze" onClick={blow}>
                <span className="breeze__icon" key={gustPulse}>
                  <WindIcon />
                </span>
                Breeze
              </button>
              {inHold && (
                <button type="button" className="btn btn--ghost" onClick={replay}>
                  <ReplayIcon />
                  Watch again
                </button>
              )}

            </div>
          </div>
        )}
      </div>
    </main>
  );
};
