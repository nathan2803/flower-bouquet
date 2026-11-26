import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FLOWER_LABELS } from '../bouquet/config';
import { FLOWER_TYPE_NAMES, headShapes, layoutFlowers, stemShapes } from '../bouquet/flowers';
import { Shapes } from '../bouquet/Shapes';
import { makeClock } from '../bouquet/timing';
import type { FlowerType, Palette } from '../bouquet/types';

/** Fully bloomed and still: frame 400, no sway. */
const STILL = makeClock(400, 30, []);
const CALM = { sway: 0 };

/** A small picture of one flower, drawn by the same code as the bouquet. */
export const FlowerThumb: React.FC<{ type: FlowerType; color?: string; palette: Palette; size?: number }> = ({ type, color, palette, size = 56 }) => {
  const shapes = useMemo(() => {
    const [e] = layoutFlowers([{ type, color, x: 0, y: 0.5 }], palette, 'none', 'dome');
    return [...stemShapes(e, STILL, palette, CALM), ...headShapes(e, STILL, palette, CALM)];
  }, [type, color, palette]);
  return (
    <svg viewBox="410 660 260 260" width={size} height={size} aria-hidden="true" className="thumb">
      <Shapes shapes={shapes} />
    </svg>
  );
};

const COLUMNS = 3;

/**
 * A flower chooser that shows what each flower looks like. A button opens a
 * grid of previews; arrow keys move between them, Enter picks, Escape closes.
 */
export const FlowerPicker: React.FC<{
  value: FlowerType;
  onChange: (t: FlowerType) => void;
  palette: Palette;
  color?: string;
  label: string;
}> = ({ value, onChange, palette, color, label }) => {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    items.current[FLOWER_TYPE_NAMES.indexOf(value)]?.focus();
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, value]);

  const pick = (t: FlowerType) => {
    onChange(t);
    setOpen(false);
    trigger.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = FLOWER_TYPE_NAMES.length;
    const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLUMNS, ArrowUp: -COLUMNS };
    if (e.key in step) {
      e.preventDefault();
      items.current[Math.max(0, Math.min(n - 1, i + step[e.key]))]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      items.current[e.key === 'Home' ? 0 : n - 1]?.focus();
    }
  };

  return (
    <div className="picker" ref={wrap}>
      <button
        ref={trigger}
        type="button"
        className="picker__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${label}: ${FLOWER_LABELS[value]}`}
        onClick={() => setOpen((o) => !o)}
      >
        <FlowerThumb type={value} color={color} palette={palette} size={36} />
        <span>{FLOWER_LABELS[value]}</span>
        <svg className="picker__chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div className="picker__panel" id={panelId} role="dialog" aria-label={label}>
          <div className="picker__grid">
            {FLOWER_TYPE_NAMES.map((t, i) => (
              <button
                key={t}
                ref={(el) => {
                  items.current[i] = el;
                }}
                type="button"
                className="picker__option"
                aria-pressed={t === value}
                onClick={() => pick(t)}
                onKeyDown={(e) => onKey(e, i)}
              >
                <FlowerThumb type={t} palette={palette} />
                <span>{FLOWER_LABELS[t]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
