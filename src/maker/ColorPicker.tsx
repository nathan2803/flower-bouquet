import React, { useEffect, useId, useRef, useState } from 'react';

/** Colours that suit flowers, named for screen readers and tooltips. */
export const FLOWER_SWATCHES: { hex: string; name: string }[] = [
  { hex: '#FFFDF7', name: 'White' },
  { hex: '#F7E3D3', name: 'Cream' },
  { hex: '#F4D58D', name: 'Butter' },
  { hex: '#F2B632', name: 'Sunflower' },
  { hex: '#F2A17E', name: 'Coral' },
  { hex: '#E26D7D', name: 'Watermelon' },
  { hex: '#F2C4C4', name: 'Blush' },
  { hex: '#E8A0A8', name: 'Dusty rose' },
  { hex: '#D97F8E', name: 'Deep rose' },
  { hex: '#B5475A', name: 'Wine' },
  { hex: '#E8DDF2', name: 'Pale lilac' },
  { hex: '#C9B3E3', name: 'Lilac' },
  { hex: '#A99BD0', name: 'Lavender' },
  { hex: '#7B5EA7', name: 'Violet' },
  { hex: '#A9B8E0', name: 'Periwinkle' },
  { hex: '#8FB3E3', name: 'Sky' },
  { hex: '#8FA893', name: 'Sage' },
  { hex: '#6F8F6A', name: 'Fern' },
];

/** Extra neutrals for paper, containers and backgrounds. */
export const PAPER_SWATCHES: { hex: string; name: string }[] = [
  { hex: '#FAF6F0', name: 'Paper' },
  { hex: '#F3EDE4', name: 'Linen' },
  { hex: '#D9B99B', name: 'Kraft' },
  { hex: '#C49A6C', name: 'Wicker' },
  { hex: '#CFE3E0', name: 'Sea glass' },
  { hex: '#E7C6C0', name: 'Rose box' },
];

const COLUMNS = 6;
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

type Props = {
  /** What this colour is for, e.g. "Rose colour". */
  label: string;
  value: string;
  onChange: (hex: string) => void;
  swatches?: { hex: string; name: string }[];
  /** Offer "Natural colour" to go back to the default. */
  onReset?: () => void;
  /** Show the label text beside the circle. */
  showLabel?: boolean;
};

/**
 * A colour circle that opens a panel of named swatches, plus a custom
 * colour option. Arrow keys move between swatches; Escape closes.
 */
export const ColorPicker: React.FC<Props> = ({ label, value, onChange, swatches = FLOWER_SWATCHES, onReset, showLabel = false }) => {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const panelId = useId();
  const named = swatches.find((s) => same(s.hex, value));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    const current = swatches.findIndex((s) => same(s.hex, value));
    items.current[current >= 0 ? current : 0]?.focus();
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, swatches, value]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLUMNS, ArrowUp: -COLUMNS };
    if (e.key in step) {
      e.preventDefault();
      items.current[Math.max(0, Math.min(swatches.length - 1, i + step[e.key]))]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  return (
    <div className={`cpick ${showLabel ? 'cpick--labelled' : ''}`} ref={wrap} onKeyDown={(e) => e.key === 'Escape' && open && close()}>
      <button
        ref={trigger}
        type="button"
        className="cpick__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${label}: ${named?.name ?? value}`}
        title={label}
        onClick={() => {
          const r = trigger.current?.getBoundingClientRect();
          setAlignRight(Boolean(r && r.left + 300 > window.innerWidth - 12));
          setOpen((o) => !o);
        }}
      >
        <span className="cpick__dot" style={{ background: value }} />
        {showLabel && <span className="cpick__label">{label}</span>}
      </button>
      {open && (
        <div className={`cpick__panel ${alignRight ? 'cpick__panel--right' : ''}`} id={panelId} role="dialog" aria-label={label}>
          <p className="cpick__title">{label}</p>
          <div className="cpick__grid">
            {swatches.map((s, i) => (
              <button
                key={s.hex}
                ref={(el) => {
                  items.current[i] = el;
                }}
                type="button"
                className="cpick__swatch"
                aria-pressed={same(s.hex, value)}
                aria-label={s.name}
                title={s.name}
                onKeyDown={(e) => onKey(e, i)}
                onClick={() => {
                  onChange(s.hex);
                  close();
                }}
              >
                <span style={{ background: s.hex }} />
              </button>
            ))}
          </div>
          <div className="cpick__actions">
            {onReset && (
              <button
                type="button"
                className="cpick__action"
                onClick={() => {
                  onReset();
                  close();
                }}
              >
                Natural colour
              </button>
            )}
            <label className="cpick__action cpick__custom">
              <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
              <span className="cpick__rainbow" aria-hidden="true" />
              Custom colour…
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
