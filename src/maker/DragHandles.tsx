import React, { useEffect, useRef, useState } from 'react';
import { FLOWER_LABELS, VIDEO } from '../bouquet/config';
import { pointToPosition, type LaidOutFlower } from '../bouquet/flowers';
import type { Arrangement, ContainerType } from '../bouquet/types';

type Props = {
  stage: React.RefObject<HTMLDivElement | null>;
  laid: LaidOutFlower[];
  container: ContainerType;
  arrangement: Arrangement;
  active: number | null;
  onStart: (index: number) => void;
  onMove: (index: number, x: number, y: number) => void;
};

/** Where the 1080 × 1920 canvas sits inside the stage (the Player letterboxes it). */
const useFit = (stage: Props['stage']) => {
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [stage]);
  const scale = Math.min(box.w / VIDEO.width, box.h / VIDEO.height) || 0;
  return { scale, ox: (box.w - VIDEO.width * scale) / 2, oy: (box.h - VIDEO.height * scale) / 2 };
};

/**
 * One handle per flower, laid over the preview. Drag a handle (mouse or
 * touch) to move that flower; or focus it and use the arrow keys.
 */
export const DragHandles: React.FC<Props> = ({ stage, laid, container, arrangement, active, onStart, onMove }) => {
  const { scale, ox, oy } = useFit(stage);
  const dragging = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const toPosition = (clientX: number, clientY: number) => {
    const rect = stage.current!.getBoundingClientRect();
    return pointToPosition((clientX - rect.left - ox) / scale, (clientY - rect.top - oy) / scale, container, arrangement);
  };

  if (!scale) return null;

  return (
    <div className={`handles ${isDragging ? 'is-dragging' : ''}`}>
      {laid.map((f) => {
        const name = FLOWER_LABELS[f.type];
        const pos = pointToPosition(f.hx, f.hy, container, arrangement);
        return (
          <button
            key={f.index}
            type="button"
            className={`handle ${active === f.index ? 'is-active' : ''}`}
            style={{ left: ox + f.hx * scale, top: oy + f.hy * scale }}
            aria-label={`Move ${name.toLowerCase()} (flower ${f.index + 1}). Arrow keys move it.`}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              dragging.current = f.index;
              setIsDragging(true);
              onStart(f.index);
            }}
            onPointerMove={(e) => {
              if (dragging.current !== f.index) return;
              const p = toPosition(e.clientX, e.clientY);
              onMove(f.index, p.x, p.y);
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              dragging.current = null;
              setIsDragging(false);
            }}
            onPointerCancel={() => {
              dragging.current = null;
              setIsDragging(false);
            }}
            onFocus={() => onStart(f.index)}
            onKeyDown={(e) => {
              const d = e.shiftKey ? 0.1 : 0.03;
              const moves: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] };
              const m = moves[e.key];
              if (!m) return;
              e.preventDefault();
              onMove(f.index, Math.round((pos.x + m[0]) * 100) / 100, Math.round((pos.y + m[1]) * 100) / 100);
            }}
          >
            <span className="handle__dot" />
          </button>
        );
      })}
    </div>
  );
};
