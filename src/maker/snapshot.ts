/**
 * "Save as image": the finished bouquet as a 1080 × 1920 PNG, the size of a
 * phone story. It copies the preview's own SVG layers onto a canvas, with
 * the fonts embedded so the heading and the handwriting come out right
 * (an SVG drawn as an image can't load fonts from the page).
 */
import { getInfo as caveatInfo } from '@remotion/google-fonts/Caveat';
import { getInfo as frauncesInfo } from '@remotion/google-fonts/Fraunces';
import { VIDEO } from '../bouquet/config';

/** The weights and styles the scene uses (see bouquet/fonts.ts). */
type FontInfo = { fontFamily: string; fonts: unknown };
const FACES: { info: FontInfo; style: 'normal' | 'italic'; weight: string }[] = [
  { info: frauncesInfo(), style: 'normal', weight: '400' },
  { info: frauncesInfo(), style: 'normal', weight: '500' },
  { info: frauncesInfo(), style: 'italic', weight: '400' },
  { info: caveatInfo(), style: 'normal', weight: '500' },
  { info: caveatInfo(), style: 'normal', weight: '600' },
];

const dataUrls = new Map<string, Promise<string>>();
const asDataUrl = (url: string) => {
  if (!dataUrls.has(url)) {
    dataUrls.set(
      url,
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`font ${r.status}`);
          return r.blob();
        })
        .then(
          (b) =>
            new Promise<string>((resolve, reject) => {
              const fr = new FileReader();
              fr.onload = () => resolve(fr.result as string);
              fr.onerror = () => reject(fr.error);
              fr.readAsDataURL(b);
            }),
        ),
    );
  }
  return dataUrls.get(url)!;
};

/** @font-face rules with the font files inlined. Missing fonts fall back quietly. */
const fontCss = async () => {
  const rules = await Promise.all(
    FACES.map(async ({ info, style, weight }) => {
      const url = (info.fonts as Record<string, Record<string, Record<string, string>>>)[style]?.[weight]?.latin;
      if (!url) return '';
      try {
        const src = await asDataUrl(url);
        return `@font-face{font-family:'${info.fontFamily}';font-style:${style};font-weight:${weight};src:url(${src}) format('woff2');}`;
      } catch {
        return '';
      }
    }),
  );
  return rules.join('');
};

const draw = async (ctx: CanvasRenderingContext2D, svg: SVGSVGElement, css: string) => {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('width', String(VIDEO.width));
  copy.setAttribute('height', String(VIDEO.height));
  if (css) {
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = css;
    copy.insertBefore(style, copy.firstChild);
  }
  // Layers faded with CSS opacity on their wrapper keep that opacity.
  const opacity = Number(getComputedStyle(svg.parentElement!).opacity) || 1;
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    ctx.globalAlpha = opacity;
    ctx.drawImage(img, 0, 0, VIDEO.width, VIDEO.height);
    ctx.globalAlpha = 1;
  } finally {
    URL.revokeObjectURL(url);
  }
};

/** Draws every full-size SVG layer inside `stage`, back to front, into a PNG. */
export const bouquetPng = async (stage: HTMLElement): Promise<Blob> => {
  const layers = [...stage.querySelectorAll<SVGSVGElement>(`svg[viewBox="0 0 ${VIDEO.width} ${VIDEO.height}"]`)];
  if (!layers.length) throw new Error('No bouquet to draw');
  const css = await fontCss();
  const canvas = document.createElement('canvas');
  canvas.width = VIDEO.width;
  canvas.height = VIDEO.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFDFB';
  ctx.fillRect(0, 0, VIDEO.width, VIDEO.height);
  for (const svg of layers) await draw(ctx, svg, css);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not draw the image'))), 'image/png'),
  );
};
