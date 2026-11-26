/**
 * Kraft-paper wrap: tissue fanned behind the flowers, an inner kraft panel,
 * two front panels folding in from each side and a ribbon band at the tie.
 * Used by the `wrap` container (see containers.ts).
 */
import { dark, light, n, sc, vis, type Shape } from './geometry';
import { SPRINGS, T, type Clock } from './timing';
import type { Palette } from './types';

export const TISSUE =
  'M540,1300C430,1180 250,1000 150,770C210,700 260,720 300,650C360,690 420,610 470,600C520,640 560,590 610,600C660,620 700,690 760,650C810,720 870,700 930,770C830,1000 650,1180 540,1300Z';
const BACK_PANEL = 'M190,1000Q540,925 890,1000L600,1640Q540,1662 480,1640Z';
const LEFT_PANEL = 'M170,990C260,1010 420,1080 600,1110L590,1650C560,1665 520,1665 495,1650Z';
const LEFT_LIP = 'M170,990C260,1010 420,1080 600,1110L586,1165C430,1130 290,1075 200,1035Z';
const RIGHT_PANEL = 'M910,990C820,1010 660,1090 480,1125L490,1655C520,1668 560,1668 585,1655Z';
const RIGHT_LIP = 'M910,990C820,1010 660,1090 480,1125L494,1182C650,1145 790,1080 880,1035Z';

/**
 * Two tissue sheets fanning out from a point. `cx, cy` is where the fan
 * gathers; `size` scales it (1 = the full wrap).
 */
export const tissueShapes = (ck: Clock, pal: Palette, cx = 540, cy = 1300, size = 1): Shape[] => {
  const v1 = ck.spring(T.tissue[0], SPRINGS.soft);
  const v2 = ck.spring(T.tissue[1], SPRINGS.soft);
  const fan = (deg: number, s: number) =>
    `translate(${cx - 540} ${cy - 1300}) rotate(${deg} 540 1300) translate(540 1300) scale(${sc(s * size)}) translate(-540 -1300)`;
  return [
    { d: TISSUE, f: pal.tissue, o: n(vis(v1) * 0.9), t: fan(-7, 0.55 + 0.45 * v1) },
    { d: TISSUE, f: light(pal.tissue, 0.45), o: n(vis(v2) * 0.85), t: fan(8, 0.5 + 0.47 * v2) },
  ];
};

/** Behind the flowers: tissue, then the inside of the kraft cone rises. */
export const wrapBackShapes = (ck: Clock, pal: Palette, fiberId: string): Shape[] => {
  const vb = ck.spring(T.backKraft, SPRINGS.soft);
  const rise = `translate(0 ${n((1 - vb) * 90)})`;
  return [
    ...tissueShapes(ck, pal),
    { d: BACK_PANEL, f: dark(pal.kraft, 0.2), o: vis(vb), t: rise },
    { d: BACK_PANEL, f: `url(#${fiberId})`, o: n(vis(vb) * 0.5), t: rise },
  ];
};

/** In front of the stems: kraft panels fold in from each side, then the ribbon band wraps across. */
export const wrapFrontShapes = (ck: Clock, pal: Palette, fiberId: string): Shape[] => {
  const K = pal.kraft;
  const R = pal.ribbon;
  const fib = `url(#${fiberId})`;
  const vl = ck.spring(T.leftPanel, SPRINGS.soft);
  const vr = ck.spring(T.rightPanel, SPRINGS.soft);
  const vband = ck.spring(T.band, SPRINGS.soft);
  const fold = (v: number, dir: -1 | 1) =>
    `translate(${n(dir * (1 - v) * 240)} ${n((1 - v) * 40)}) rotate(${n(dir * (1 - v) * 16)} 540 1650)`;
  const lt = fold(vl, -1);
  const rt = fold(vr, 1);
  const ol = vis(vl);
  const or = vis(vr);
  const bandT = `translate(540 0) scale(${sc(vband)} 1) translate(-540 0)`;
  return [
    { d: LEFT_PANEL, f: K, s: dark(K, 0.3), sw: 1.5, o: ol, t: lt },
    { d: LEFT_PANEL, f: fib, o: n(ol * 0.55), t: lt },
    { d: 'M330,1050L520,1560M440,1085L548,1600', s: dark(K, 0.25), sw: 1.5, o: n(ol * 0.35), t: lt },
    { d: LEFT_LIP, f: light(K, 0.18), s: dark(K, 0.2), sw: 1, o: n(ol * 0.92), t: lt },
    { d: RIGHT_PANEL, f: light(K, 0.06), s: dark(K, 0.3), sw: 1.5, o: or, t: rt },
    { d: RIGHT_PANEL, f: fib, o: n(or * 0.55), t: rt },
    { d: 'M750,1050L560,1560M640,1100L532,1600', s: dark(K, 0.25), sw: 1.5, o: n(or * 0.35), t: rt },
    { d: RIGHT_LIP, f: light(K, 0.24), s: dark(K, 0.2), sw: 1, o: n(or * 0.92), t: rt },
    { d: 'M482,1130L490,1655', s: dark(K, 0.45), sw: 3, o: n(or * 0.3), t: rt },
    { d: 'M291,1232Q540,1272 790,1232L772,1276Q540,1316 309,1276Z', f: R, s: dark(R, 0.25), sw: 1.5, o: vis(vband), t: bandT },
    { d: 'M300,1246Q540,1284 782,1246', s: light(R, 0.35), sw: 3, o: n(vis(vband) * 0.6), t: bandT },
  ];
};
