import { Player, type PlayerRef } from '@remotion/player';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BouquetComposition } from './bouquet/BouquetComposition';
import {
  CENTER_TYPES, DEFAULT_PALETTE, FLOWER_LABELS, PETAL_DEFAULTS, PRESETS, VIDEO, defaultBouquetProps, type PresetName,
} from './bouquet/config';
import { autoArrange } from './bouquet/arrange';
import { FLOWER_TYPES, layoutFlowers } from './bouquet/flowers';
import { FONTS } from './bouquet/fonts';
import type { Arrangement, BouquetProps, ContainerType, FlowerSpec, FlowerType, Palette } from './bouquet/types';
import { LIVE_FRAMES } from './Gift';
import { ColorPicker, FLOWER_SWATCHES, PAPER_SWATCHES } from './maker/ColorPicker';
import { DragHandles } from './maker/DragHandles';
import { FlowerPicker } from './maker/FlowerPicker';
import { MAX_FLOWERS, MAX_MESSAGE, giftLink } from './share';

/** The frame the preview rests on: everything open, card showing. */
const FINISHED = 400;

type Draft = Required<Pick<BouquetProps, 'recipientName' | 'senderName' | 'message' | 'heading' | 'container' | 'arrangement' | 'flowers'>> & {
  palette: Palette;
  preset: PresetName | null;
};

const fromPreset = (name: PresetName, keep?: Draft): Draft => {
  const p = PRESETS[name];
  return {
    recipientName: keep?.recipientName ?? '',
    senderName: keep?.senderName ?? '',
    message: keep?.message ?? '',
    heading: keep?.heading ?? defaultBouquetProps.heading ?? '',
    container: p.container ?? 'wrap',
    arrangement: p.arrangement ?? 'dome',
    palette: { ...DEFAULT_PALETTE, ...p.palette },
    flowers: (p.flowers ?? []).map((f) => ({ ...f })),
    preset: name,
  };
};

const CONTAINER_OPTIONS: { value: ContainerType; label: string }[] = [
  { value: 'wrap', label: 'Paper wrap' },
  { value: 'basket', label: 'Basket' },
  { value: 'vase', label: 'Vase' },
  { value: 'box', label: 'Hatbox' },
  { value: 'none', label: 'Hand-tied' },
];

const ARRANGEMENT_OPTIONS: { value: Arrangement; label: string }[] = [
  { value: 'dome', label: 'Dome' },
  { value: 'tall', label: 'Tall' },
  { value: 'wide', label: 'Wide' },
  { value: 'cascade', label: 'Cascade' },
  { value: 'posy', label: 'Posy' },
];

/** Which palette colour the container uses, and what to call it. */
const CONTAINER_COLOR: Partial<Record<ContainerType, { key: keyof Palette; label: string }>> = {
  wrap: { key: 'kraft', label: 'Paper' },
  basket: { key: 'wicker', label: 'Basket' },
  vase: { key: 'glass', label: 'Glass' },
  box: { key: 'box', label: 'Hatbox' },
};

const resolve = (c: string | undefined, pal: Palette) => (c && c in pal ? pal[c as keyof Palette] : c);
const flowerColor = (f: FlowerSpec, pal: Palette) => resolve(f.color ?? FLOWER_TYPES[f.type].color, pal) ?? '#ffffff';

/** A row of pill-shaped radio buttons. */
function Choice<T extends string>({ legend, name, value, options, onChange }: {
  legend: string; name: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <fieldset className="choices">
      <legend>{legend}</legend>
      <div className="choices__row">
        {options.map((o) => (
          <label key={o.value} className="choice">
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const ALL_SWATCHES = [...PAPER_SWATCHES, ...FLOWER_SWATCHES];
const CENTER_SWATCHES = [...FLOWER_SWATCHES, { hex: '#6B4423', name: 'Seed brown' }, { hex: '#2C2A4A', name: 'Ink blue' }];

const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void; swatches?: typeof FLOWER_SWATCHES }> = ({
  label, value, onChange, swatches = ALL_SWATCHES,
}) => <ColorPicker label={label} value={value} onChange={onChange} swatches={swatches} showLabel />;

const RemoveIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const FlowerRow: React.FC<{
  flower: FlowerSpec; index: number; palette: Palette; active: boolean;
  onChange: (f: FlowerSpec) => void; onRemove: () => void;
}> = ({ flower, index, palette, active, onChange, onRemove }) => {
  const label = FLOWER_LABELS[flower.type];
  const set = (patch: Partial<FlowerSpec>) => onChange({ ...flower, ...patch });
  const placed = typeof flower.x === 'number' && typeof flower.y === 'number';
  return (
    <li className={`flower ${active ? 'flower--active' : ''}`}>
      <div className="flower__main">
        <ColorPicker
          label={`${label} colour`}
          value={flowerColor(flower, palette)}
          onChange={(v) => set({ color: v })}
          onReset={() => set({ color: undefined })}
        />
        <FlowerPicker
          label={`Flower ${index + 1}`}
          value={flower.type}
          palette={palette}
          color={flower.color}
          onChange={(t) => set({ type: t, color: undefined, centerColor: undefined, petals: undefined })}
        />
        <label className="range">
          <span>Size</span>
          <input type="range" min={0.5} max={1.6} step={0.05} value={flower.scale ?? 1} onChange={(e) => set({ scale: Number(e.target.value) })} />
        </label>
        <button type="button" className="icon-btn" onClick={onRemove} aria-label={`Remove ${label.toLowerCase()}`}>
          <RemoveIcon />
        </button>
      </div>
      <details className="flower__more">
        <summary>Position and details</summary>
        <div className="flower__grid">
          <label className="range">
            <span>Left – right</span>
            <input type="range" min={-1} max={1} step={0.02} value={flower.x ?? 0} onChange={(e) => set({ x: Number(e.target.value), y: flower.y ?? 0.5 })} />
          </label>
          <label className="range">
            <span>Low – high</span>
            <input type="range" min={-0.3} max={1.05} step={0.02} value={flower.y ?? 0.5} onChange={(e) => set({ y: Number(e.target.value), x: flower.x ?? 0 })} />
          </label>
          <label className="range">
            <span>Tilt</span>
            <input type="range" min={-40} max={40} step={1} value={flower.tilt ?? 0} onChange={(e) => set({ tilt: Number(e.target.value) })} />
          </label>
          {FLOWER_TYPES[flower.type].head && (
            <label className="range">
              <span>Leaves</span>
              <input type="range" min={0} max={3} step={1} value={flower.leaves ?? FLOWER_TYPES[flower.type].leaves ?? 0} onChange={(e) => set({ leaves: Number(e.target.value) })} />
            </label>
          )}
          {PETAL_DEFAULTS[flower.type] !== undefined && (
            <label className="range">
              <span>Petals</span>
              <input type="range" min={4} max={24} step={1} value={flower.petals ?? PETAL_DEFAULTS[flower.type]} onChange={(e) => set({ petals: Number(e.target.value) })} />
            </label>
          )}
          {CENTER_TYPES.includes(flower.type) && (
            <ColorField
              label="Centre"
              swatches={CENTER_SWATCHES}
              value={resolve(flower.centerColor, palette) ?? (flower.type === 'anemone' ? '#2C2A4A' : flower.type === 'sunflower' ? '#6B4423' : palette.butter)}
              onChange={(v) => set({ centerColor: v })}
            />
          )}
          {!placed && <p className="hint">Placed automatically until you move it.</p>}
        </div>
      </details>
    </li>
  );
};

export const Builder: React.FC = () => {
  const [draft, setDraft] = useState<Draft>(() => fromPreset('classic'));
  const [adding, setAdding] = useState<FlowerType>('rose');
  /** Colour for flowers about to be added; undefined = the flower's natural colour. */
  const [addColor, setAddColor] = useState<string | undefined>(undefined);
  const [count, setCount] = useState(1);
  const [status, setStatus] = useState('');
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);

  const gift: BouquetProps = useMemo(
    () => ({
      ...defaultBouquetProps,
      recipientName: draft.recipientName.trim() || 'Someone special',
      senderName: draft.senderName.trim() || 'Me',
      message: draft.message.trim() || defaultBouquetProps.message,
      heading: draft.heading,
      container: draft.container,
      arrangement: draft.arrangement,
      palette: draft.palette,
      flowers: draft.flowers,
    }),
    [draft],
  );
  const link = useMemo(() => giftLink(gift), [gift]);
  const ready = draft.recipientName.trim() !== '' && draft.senderName.trim() !== '' && draft.flowers.length > 0;

  useEffect(() => {
    document.title = 'Make a bouquet';
  }, []);

  // Rest the preview on the finished bouquet; "Play from the start" runs the whole thing.
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(FINISHED);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    return () => {
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
    };
  }, []);

  const update = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch, preset: 'flowers' in patch || 'palette' in patch ? null : d.preset }));
    setStatus('');
  };
  const setColor = (key: keyof Palette, v: string) => update({ palette: { ...draft.palette, [key]: v } });
  const setFlower = (i: number, f: FlowerSpec) => update({ flowers: draft.flowers.map((x, j) => (j === i ? f : x)) });

  const play = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) {
      p.pause();
      p.seekTo(FINISHED);
      return;
    }
    p.seekTo(0);
    p.play();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setStatus('Link copied. Paste it into a message to send your bouquet.');
    } catch {
      setStatus('Couldn’t copy automatically. Select the link below and copy it.');
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: `A bouquet for ${gift.recipientName}`, text: `I made you something 💐`, url: link });
    } catch {
      /* closed the share sheet */
    }
  };

  const containerColor = CONTAINER_COLOR[draft.container];
  const laid = useMemo(
    () => layoutFlowers(draft.flowers, draft.palette, draft.container, draft.arrangement),
    [draft.flowers, draft.palette, draft.container, draft.arrangement],
  );
  const room = MAX_FLOWERS - draft.flowers.length;

  return (
    <main className="maker">
      <div className="maker__preview">
        <div className="maker__stage" ref={stageRef}>
          <Player
            ref={playerRef}
            component={BouquetComposition}
            inputProps={gift}
            durationInFrames={LIVE_FRAMES}
            fps={VIDEO.fps}
            compositionWidth={VIDEO.width}
            compositionHeight={VIDEO.height}
            style={{ width: '100%', height: '100%' }}
            controls={false}
            clickToPlay={false}
            initialFrame={FINISHED}
          />
          {!playing && (
            <DragHandles
              stage={stageRef}
              laid={laid}
              container={draft.container}
              arrangement={draft.arrangement}
              active={active}
              onStart={setActive}
              onMove={(i, x, y) => setFlower(i, { ...draft.flowers[i], x, y })}
            />
          )}
        </div>
        {!playing && <p className="hint maker__drag-hint">Drag the dots to move flowers.</p>}
        <button type="button" className="btn btn--ghost" onClick={play}>
          {playing ? 'Show the finished bouquet' : 'Play from the start'}
        </button>
      </div>

      <div className="maker__panel">
        <header className="maker__intro">
          <h1 style={{ fontFamily: FONTS.serif }}>Make a bouquet</h1>
          <p>Choose the flowers, write a note, then send the link. It opens as an animated gift.</p>
        </header>

        <section className="panel-section" aria-labelledby="sec-note">
          <h2 id="sec-note" style={{ fontFamily: FONTS.serif }}>The note</h2>
          <div className="fields">
            <label className="field">
              <span>To</span>
              <input value={draft.recipientName} maxLength={40} placeholder="Their name" onChange={(e) => update({ recipientName: e.target.value })} />
            </label>
            <label className="field">
              <span>From</span>
              <input value={draft.senderName} maxLength={40} placeholder="Your name" onChange={(e) => update({ senderName: e.target.value })} />
            </label>
            <label className="field field--wide">
              <span>Message</span>
              <textarea
                rows={3}
                value={draft.message}
                maxLength={MAX_MESSAGE}
                placeholder="Happy birthday! Thank you for making ordinary days feel like spring."
                onChange={(e) => update({ message: e.target.value })}
              />
              <small className="count">{draft.message.length} / {MAX_MESSAGE}</small>
            </label>
            <label className="field field--wide">
              <span>Line above their name</span>
              <input value={draft.heading} maxLength={60} onChange={(e) => update({ heading: e.target.value })} />
            </label>
          </div>
        </section>

        <section className="panel-section" aria-labelledby="sec-style">
          <h2 id="sec-style" style={{ fontFamily: FONTS.serif }}>Start from a bouquet</h2>
          <Choice
            legend="Ready-made mixes"
            name="preset"
            value={draft.preset ?? ('' as PresetName)}
            options={(Object.keys(PRESETS) as PresetName[]).map((k) => ({ value: k, label: PRESETS[k].title }))}
            onChange={(name) => setDraft((d) => fromPreset(name, d))}
          />
          <Choice legend="Holder" name="container" value={draft.container} options={CONTAINER_OPTIONS} onChange={(v) => update({ container: v })} />
          <Choice legend="Shape" name="arrangement" value={draft.arrangement} options={ARRANGEMENT_OPTIONS} onChange={(v) => update({ arrangement: v })} />
        </section>

        <section className="panel-section" aria-labelledby="sec-flowers">
          <div className="section-head">
            <h2 id="sec-flowers" style={{ fontFamily: FONTS.serif }}>Flowers</h2>
            <span className="muted">{draft.flowers.length} of {MAX_FLOWERS}</span>
          </div>
          <ol className="flowers">
            {draft.flowers.map((f, i) => (
              <FlowerRow
                key={i}
                index={i}
                flower={f}
                palette={draft.palette}
                active={active === i}
                onChange={(nf) => setFlower(i, nf)}
                onRemove={() => update({ flowers: draft.flowers.filter((_, j) => j !== i) })}
              />
            ))}
          </ol>
          {draft.flowers.length === 0 && <p className="hint">Add at least one flower.</p>}
          <div className="add-row">
            <div className="stepper" role="group" aria-label="How many to add">
              <button type="button" className="stepper__btn" aria-label="Fewer" disabled={count <= 1} onClick={() => setCount((c) => Math.max(1, c - 1))}>
                −
              </button>
              <input
                type="number"
                aria-label="How many"
                inputMode="numeric"
                min={1}
                max={room}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(room || 1, Math.round(Number(e.target.value) || 1))))}
              />
              <button type="button" className="stepper__btn" aria-label="More" disabled={count >= room} onClick={() => setCount((c) => Math.min(room, c + 1))}>
                +
              </button>
            </div>
            <ColorPicker
              label={`Colour for new ${FLOWER_LABELS[adding].toLowerCase()}`}
              value={flowerColor({ type: adding, color: addColor }, draft.palette)}
              onChange={setAddColor}
              onReset={() => setAddColor(undefined)}
            />
            <FlowerPicker
              label="Flower to add"
              value={adding}
              palette={draft.palette}
              color={addColor}
              onChange={(t) => {
                setAdding(t);
                setAddColor(undefined);
              }}
            />
            <button
              type="button"
              className="btn btn--ghost"
              disabled={room === 0}
              onClick={() => {
                const n = Math.min(count, room);
                const added = Array.from({ length: n }, (): FlowerSpec => ({ type: adding, color: addColor }));
                update({ flowers: autoArrange([...draft.flowers, ...added], draft.arrangement, { keepPlaced: true }) });
                setCount(1);
              }}
            >
              {room === 0 ? 'Bouquet is full' : count > 1 ? `Add ${Math.min(count, room)}` : 'Add flower'}
            </button>
            <button
              type="button"
              className="btn btn--quiet"
              disabled={draft.flowers.length === 0}
              onClick={() => update({ flowers: autoArrange(draft.flowers, draft.arrangement) })}
            >
              Arrange for me
            </button>
          </div>
        </section>

        <section className="panel-section" aria-labelledby="sec-colours">
          <h2 id="sec-colours" style={{ fontFamily: FONTS.serif }}>Colours</h2>
          <div className="colors">
            <ColorField label="Ribbon" value={draft.palette.ribbon} onChange={(v) => setColor('ribbon', v)} />
            {containerColor && (
              <ColorField label={containerColor.label} value={draft.palette[containerColor.key]} onChange={(v) => setColor(containerColor.key, v)} />
            )}
            {draft.container !== 'vase' && draft.container !== 'none' && (
              <ColorField label="Tissue" value={draft.palette.tissue} onChange={(v) => setColor('tissue', v)} />
            )}
            <ColorField label="Seal and card trim" value={draft.palette.rose} onChange={(v) => setColor('rose', v)} />
            <ColorField label="Leaves" value={draft.palette.sage} onChange={(v) => setColor('sage', v)} />
            <ColorField label="Background" value={draft.palette.background} onChange={(v) => setColor('background', v)} />
          </div>
        </section>

        <section className="panel-section send" aria-labelledby="sec-send">
          <h2 id="sec-send" style={{ fontFamily: FONTS.serif }}>Send it</h2>
          {!ready && <p className="hint">Fill in who it’s to and from, and keep at least one flower.</p>}
          <div className="send__row">
            <button type="button" className="btn btn--primary" onClick={copy} disabled={!ready}>
              Copy gift link
            </button>
            {'share' in navigator && (
              <button type="button" className="btn btn--ghost" onClick={share} disabled={!ready}>
                Share…
              </button>
            )}
            <a className={`btn btn--quiet ${ready ? '' : 'is-disabled'}`} href={ready ? link : undefined} target="_blank" rel="noreferrer" aria-disabled={!ready}>
              Open the gift
            </a>
          </div>
          <p className="send__status" role="status">
            {status}
          </p>
          <label className="field field--wide">
            <span>Gift link</span>
            <input readOnly value={ready ? link : ''} onFocus={(e) => e.currentTarget.select()} />
          </label>
          <p className="hint">The design and your note are saved inside the link itself, so anyone with the link can see them.</p>
        </section>
      </div>
    </main>
  );
};
