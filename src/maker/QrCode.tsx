import React, { forwardRef, useId, useMemo } from 'react';
import type { Shape } from '../bouquet/geometry';
import { Shapes } from '../bouquet/Shapes';
import type { BouquetProps } from '../bouquet/types';
import { liftForScan, qrLook, qrMatrix, type QrLook } from './qr';
import { stickerFlower } from './stickers';

/** Light modules around the code, in modules. */
const MARGIN = 3;
/** The flower in the middle, as a share of the code's width. */
const EMBLEM = 0.22;
/** Sticker outline width, in the sticker's 100-unit box. */
const OUTLINE = 6;

const dot = (cx: number, cy: number, r: number) => `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;

/**
 * The bouquet's flower as a sticker: flat colours, thick outline in the
 * code's deep colour. Its colours are kept light so a camera reads the whole
 * sticker as one light patch (see liftForScan).
 */
const Emblem: React.FC<{ look: QrLook; cx: number; cy: number; size: number }> = ({ look, cx, cy, size }) => {
  const { hero, deep } = look;
  const shapes = useMemo(
    () =>
      stickerFlower(hero.type, hero.color, deep, hero.center).map((s) => ({
        ...s,
        f: liftForScan(s.f),
        s: s.f && s.f !== 'none' ? liftForScan(s.s) : liftForScan(s.s, 0.3),
      })),
    [hero, deep],
  );
  const silhouette: Shape[] = shapes
    .filter((s) => s.f && s.f !== 'none' && (s.o ?? 1) > 0.5)
    .map((s) => ({ ...s, f: deep, s: deep, sw: OUTLINE * 2, o: 1 }));
  const pad = OUTLINE + 2;
  return (
    <svg x={cx - size / 2} y={cy - size / 2} width={size} height={size} viewBox={`${-pad} ${-pad} ${100 + pad * 2} ${100 + pad * 2}`}>
      <Shapes shapes={silhouette} />
      <Shapes shapes={shapes} />
    </svg>
  );
};

type Props = { link: string; gift: BouquetProps; className?: string; title?: string };

/**
 * A QR code for the gift link in the bouquet's own colours: round dots fading
 * from the main flower colour to a deep shade, ringed corner eyes, and the
 * bouquet's flower in the middle.
 */
export const QrCode = forwardRef<SVGSVGElement, Props>(({ link, gift, className, title }, ref) => {
  const look = useMemo(() => qrLook(gift), [gift]);
  const { size, dark } = useMemo(() => qrMatrix(link), [link]);
  const id = useId().replace(/:/g, '');
  const total = size + MARGIN * 2;
  const mid = total / 2;
  const emblem = size * EMBLEM;
  const clear = emblem / 2 + 0.7;

  const dots = useMemo(() => {
    const inEye = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
    let d = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!dark(r, c) || inEye(r, c)) continue;
        const x = c + MARGIN + 0.5;
        const y = r + MARGIN + 0.5;
        if (Math.hypot(x - mid, y - mid) < clear) continue;
        d += dot(x, y, 0.49);
      }
    }
    return d;
  }, [size, dark, mid, clear]);

  const eyes = [
    [MARGIN, MARGIN],
    [MARGIN + size - 7, MARGIN],
    [MARGIN, MARGIN + size - 7],
  ];

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${total} ${total}`}
      className={className}
      role="img"
      aria-label={title ?? 'QR code for the gift link'}
    >
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1={MARGIN} x2="0" y2={total - MARGIN} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={look.top} />
          <stop offset="1" stopColor={look.deep} />
        </linearGradient>
      </defs>
      <rect width={total} height={total} fill={look.bg} />
      <path d={dots} fill={`url(#${id}g)`} />
      {eyes.map(([x, y]) => (
        <g key={`${x},${y}`}>
          <circle cx={x + 3.5} cy={y + 3.5} r={3} fill="none" stroke={look.deep} strokeWidth={1} />
          <circle cx={x + 3.5} cy={y + 3.5} r={1.5} fill={look.top} />
        </g>
      ))}
      <Emblem look={look} cx={mid} cy={mid} size={emblem} />
    </svg>
  );
});
QrCode.displayName = 'QrCode';

/**
 * Draws the code onto a card (code, "For Amelia", "Scan to open") and returns
 * it as a PNG. Text is drawn by the canvas so it uses the page's loaded fonts.
 */
export const qrCardPng = async (
  svg: SVGSVGElement,
  gift: BouquetProps,
  fonts: { serif: string; hand: string },
): Promise<Blob> => {
  const look = qrLook(gift);
  const W = 1200;
  const H = 1500;
  const pad = 110;
  const code = W - pad * 2;

  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    await Promise.all([document.fonts.load(`600 96px ${fonts.hand}`), document.fonts.load(`400 40px ${fonts.serif}`)]);

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = look.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, pad, pad, code, code);

    ctx.textAlign = 'center';
    ctx.fillStyle = look.deep;
    ctx.font = `600 104px ${fonts.hand}`;
    ctx.fillText(`For ${gift.recipientName}`, W / 2, pad + code + 140, W - pad * 2);
    ctx.globalAlpha = 0.72;
    ctx.font = `400 40px ${fonts.serif}`;
    ctx.fillText('Scan to open your bouquet', W / 2, pad + code + 210, W - pad * 2);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not draw the QR code'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
};
