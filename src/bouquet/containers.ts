/**
 * What holds the flowers. Each container says where the stems gather
 * (`tie`), how far down they run (`baseY`), where the bow sits, and what it
 * draws behind the stems (`back`) and in front of them (`front`).
 */
import { bezLength, dark, ell, light, lerp, n, sc, vis, withTransform, type Cubic, type Shape } from './geometry';
import { SPRINGS, T, gustBend, type Clock } from './timing';
import type { ContainerType, Palette } from './types';
import { tissueShapes, wrapBackShapes, wrapFrontShapes } from './WrappingPaper';

type Builder = (ck: Clock, pal: Palette, fiberId: string) => Shape[];

export type ContainerDef = {
  tie: [number, number];
  baseY: number;
  bow: { x: number; y: number; scale: number };
  /** Raise the flowers by this many px (a vase stands taller than a wrap). */
  lift: number;
  back: Builder;
  front: Builder;
};

// ---------- basket ----------

const HANDLE: Cubic = [[262, 1100], [250, 640], [830, 640], [818, 1100]];
const HANDLE_D = 'M262,1100C250,640 830,640 818,1100';
const BASKET_BODY = 'M240,1092C246,1290 290,1460 372,1508Q540,1530 708,1508C790,1460 834,1290 840,1092Q540,1170 240,1092Z';
const BASKET_MOUTH = 'M240,1092Q540,1010 840,1092Q540,1170 240,1092Z';

const basketBack: Builder = (ck, pal) => {
  const W = pal.wicker;
  const vh = ck.ramp(T.tissue[0] - 6, T.tissue[0] + 22, 'out');
  const L = bezLength(HANDLE);
  const vm = ck.spring(T.backKraft, SPRINGS.soft);
  return [
    ...tissueShapes(ck, pal, 540, 1150, 0.72),
    { d: HANDLE_D, s: dark(W, 0.3), sw: 32, da: n(L), dof: n(L * (1 - vh)) },
    { d: HANDLE_D, s: W, sw: 22, da: n(L), dof: n(L * (1 - vh)) },
    { d: HANDLE_D, s: light(W, 0.3), sw: 6, da: '16 14', o: n(ck.ramp(T.tissue[0] + 16, T.tissue[0] + 30) * 0.8) },
    { d: BASKET_MOUTH, f: dark(W, 0.5), o: vis(vm), t: `translate(0 ${n((1 - vm) * 60)})` },
  ];
};

const basketFront: Builder = (ck, pal) => {
  const W = pal.wicker;
  const v = ck.spring(T.leftPanel, SPRINGS.soft);
  const rise = `translate(0 ${n((1 - v) * 130)})`;
  const o = vis(v);
  const out: Shape[] = [{ d: BASKET_BODY, f: dark(W, 0.08), s: dark(W, 0.38), sw: 2, o, t: rise }];
  // Woven rows: rounded strands, offset on alternate rows, following the basket's curve.
  for (let r = 0; r < 8; r++) {
    const y = 1146 + r * 47;
    const hw = 300 - 132 * Math.pow((y - 1092) / 416, 1.8) - 22;
    for (let x = 540 - hw + 30 + (r % 2) * 28; x < 540 + hw - 26; x += 56) {
      const u = (x - 540) / hw;
      const yy = y + 26 * (1 - u * u);
      out.push({
        d: `M${n(x - 24)},${n(yy)}a14,13 0 0 1 14,-13h20a14,13 0 0 1 0,26h-20a14,13 0 0 1 -14,-13Z`,
        f: r % 2 ? light(W, 0.1) : W,
        s: dark(W, 0.32),
        sw: 1.3,
        o,
        t: rise,
      });
    }
  }
  out.push({ d: 'M240,1092Q540,1170 840,1092', s: dark(W, 0.18), sw: 30, o, t: rise });
  out.push({ d: 'M240,1092Q540,1170 840,1092', s: light(W, 0.22), sw: 8, da: '18 12', o: n(o * 0.9), t: rise });
  return out;
};

// ---------- vase ----------

const VASE = 'M455,1110C470,1130 480,1150 478,1180C470,1250 300,1300 290,1440C282,1540 360,1600 400,1604L680,1604C720,1600 798,1540 790,1440C780,1300 610,1250 602,1180C600,1150 610,1130 625,1110Z';
const WATER = 'M318,1340Q540,1362 762,1340C786,1380 792,1410 790,1440C782,1540 720,1600 680,1604L400,1604C360,1600 298,1540 290,1440C288,1410 294,1380 318,1340Z';

const VASE_LIFT = 130;

const vaseBack: Builder = (ck, pal) => {
  const v = ck.spring(T.backKraft, SPRINGS.soft);
  return [{ d: ell(270, 24), f: pal.ink, o: n(0.08 * vis(v)), t: `translate(540 ${1608 - VASE_LIFT})` }];
};

const vaseFront: Builder = (ck, pal) => {
  const G = pal.glass;
  const v = ck.spring(T.leftPanel, SPRINGS.soft);
  const vw = ck.spring(T.rightPanel, SPRINGS.soft);
  const vb = ck.spring(T.band, SPRINGS.soft);
  const rise = `translate(0 ${n((1 - v) * 110)})`;
  const o = vis(v);
  // The water line tips gently when a breeze nudges the vase.
  const slosh = gustBend(ck, 6) * 0.18;
  return withTransform([
    { d: VASE, f: G, s: dark(G, 0.35), sw: 2.5, o: n(o * 0.42), t: rise },
    { d: WATER, f: dark(G, 0.1), o: n(vis(vw) * 0.32), t: `${rise} rotate(${n(slosh)} 540 1480)` },
    { d: 'M318,1340Q540,1362 762,1340', s: light(G, 0.5), sw: 3, o: n(vis(vw) * 0.7), t: `${rise} rotate(${n(slosh)} 540 1480)` },
    { d: 'M330,1400C324,1470 344,1530 382,1562', s: '#ffffff', sw: 9, o: n(o * 0.55), t: rise },
    { d: 'M562,1150C568,1162 570,1174 568,1190', s: '#ffffff', sw: 4, o: n(o * 0.5), t: rise },
    { d: 'M455,1110Q540,1128 625,1110Q540,1094 455,1110Z', f: light(G, 0.3), s: dark(G, 0.35), sw: 2, o, t: rise },
    { d: 'M470,1168Q540,1188 610,1168L607,1194Q540,1214 473,1194Z', f: pal.ribbon, s: dark(pal.ribbon, 0.25), sw: 1.4, o: vis(vb), t: `translate(540 0) scale(${sc(vb)} 1) translate(-540 0)` },
  ], `translate(0 ${-VASE_LIFT})`);
};

// ---------- hatbox ----------

const boxBack: Builder = (ck, pal) => {
  const v = ck.spring(T.backKraft, SPRINGS.soft);
  return [
    { d: 'M232,1112Q540,1040 848,1112Q540,1184 232,1112Z', f: dark(pal.box, 0.45), o: vis(v), t: `translate(0 ${n((1 - v) * 60)})` },
    ...tissueShapes(ck, pal, 540, 1170, 0.74),
  ];
};

const boxFront: Builder = (ck, pal) => {
  const B = pal.box;
  const R = pal.ribbon;
  const v = ck.spring(T.leftPanel, SPRINGS.soft);
  const vb = ck.spring(T.band, SPRINGS.soft);
  const rise = `translate(0 ${n((1 - v) * 130)})`;
  const o = vis(v);
  const stripes = [300, 380, 460, 540, 620, 700, 780].map((x) => {
    const ut = (x - 540) / 308;
    const ub = (x - 540) / 290;
    const top = 1112 + 36 * (1 - ut * ut) + 10;
    const bottom = 1500 + 40 * (1 - ub * ub) - 6;
    return `M${x},${n(top)}L${n(lerp(x, 540 + (x - 540) * 0.94, 1))},${n(bottom)}`;
  });
  return [
    { d: 'M232,1112L250,1500Q540,1580 830,1500L848,1112Q540,1184 232,1112Z', f: B, s: dark(B, 0.3), sw: 2, o, t: rise },
    { d: stripes.join(''), s: light(B, 0.25), sw: 16, o: n(o * 0.55), t: rise },
    { d: 'M232,1112Q540,1184 848,1112', s: dark(B, 0.14), sw: 18, o, t: rise },
    { d: 'M240,1290Q540,1366 840,1290L838,1334Q540,1410 242,1334Z', f: R, s: dark(R, 0.25), sw: 1.5, o: vis(vb), t: `${rise} translate(540 0) scale(${sc(vb)} 1) translate(-540 0)` },
  ];
};

// ---------- hand-tied posy (no container) ----------

const posyFront: Builder = (ck, pal) => {
  const R = pal.ribbon;
  const vb = ck.spring(T.band, SPRINGS.soft);
  const t = `translate(540 1250) scale(${sc(vb)} 1) translate(-540 -1250)`;
  return [
    { d: 'M496,1226Q540,1240 584,1226L588,1274Q540,1288 492,1274Z', f: R, s: dark(R, 0.25), sw: 1.5, o: vis(vb), t },
    { d: 'M494,1244Q540,1258 586,1244M493,1258Q540,1272 587,1258', s: light(R, 0.3), sw: 2, o: n(vis(vb) * 0.6), t },
  ];
};

export const CONTAINERS: Record<ContainerType, ContainerDef> = {
  wrap: { tie: [540, 1250], baseY: 1520, bow: { x: 540, y: 1270, scale: 1 }, lift: 0, back: wrapBackShapes, front: wrapFrontShapes },
  basket: { tie: [540, 1360], baseY: 1490, bow: { x: 296, y: 1086, scale: 0.78 }, lift: 0, back: basketBack, front: basketFront },
  vase: { tie: [540, 1185 - VASE_LIFT], baseY: 1585 - VASE_LIFT, bow: { x: 540, y: 1188 - VASE_LIFT, scale: 0.68 }, lift: VASE_LIFT, back: vaseBack, front: vaseFront },
  box: { tie: [540, 1360], baseY: 1480, bow: { x: 540, y: 1330, scale: 0.9 }, lift: 0, back: boxBack, front: boxFront },
  none: { tie: [540, 1250], baseY: 1560, bow: { x: 540, y: 1252, scale: 0.75 }, lift: 0, back: () => [], front: posyFront },
};

/** The bow pops on after the band: knot, then loops (bouncy), then tails, which flutter in a breeze. */
export const bowShapes = (ck: Clock, pal: Palette, bow: ContainerDef['bow']): Shape[] => {
  const R = pal.ribbon;
  const at = `translate(${bow.x} ${bow.y}) scale(${bow.scale})`;
  const vk = ck.spring(T.knot, SPRINGS.bouncy);
  const vL = ck.spring(T.loops[0], SPRINGS.bouncy);
  const vR = ck.spring(T.loops[1], SPRINGS.bouncy);
  const vT = ck.spring(T.tails, SPRINGS.soft);
  const flutter = gustBend(ck, 2);
  const loop = (v: number, dir: -1 | 1) => `${at} rotate(${n(dir * (1 - Math.min(1, v)) * 20 + flutter * 0.15)}) scale(${sc(v)})`;
  const lt = loop(vL, -1);
  const rt = loop(vR, 1);
  const tail = (k: number) => `${at} rotate(${n(flutter * k)}) scale(1 ${sc(vT)})`;
  const knot = `${at} scale(${sc(vk)})`;
  return [
    { d: 'M-8,6C-26,60 -52,112 -78,176L-52,166L-38,190C-18,126 -2,64 8,8Z', f: dark(R, 0.06), s: dark(R, 0.3), sw: 1.4, o: vis(vT), t: tail(0.8) },
    { d: 'M8,6C24,62 44,116 64,182L82,164L98,178C70,120 30,60 -4,8Z', f: R, s: dark(R, 0.3), sw: 1.4, o: vis(vT), t: tail(1.1) },
    { d: 'M0,0C-40,-74 -152,-66 -134,8C-120,58 -42,32 0,0Z', f: R, s: dark(R, 0.3), sw: 1.6, o: vis(vL), t: lt },
    { d: 'M-6,-2C-40,-46 -110,-48 -112,0C-80,-10 -40,-12 -6,-2Z', f: dark(R, 0.14), o: n(vis(vL) * 0.7), t: lt },
    { d: 'M0,0C40,-74 152,-66 134,8C120,58 42,32 0,0Z', f: R, s: dark(R, 0.3), sw: 1.6, o: vis(vR), t: rt },
    { d: 'M6,-2C40,-46 110,-48 112,0C80,-10 40,-12 6,-2Z', f: dark(R, 0.14), o: n(vis(vR) * 0.7), t: rt },
    { d: 'M-8,-26h16a16,16 0 0 1 16,16v18a16,16 0 0 1 -16,16h-16a16,16 0 0 1 -16,-16v-18a16,16 0 0 1 16,-16Z', f: dark(R, 0.1), s: dark(R, 0.35), sw: 1.5, o: vis(vk), t: knot },
    { d: 'M-12,-14C-4,-18 6,-18 12,-12', s: light(R, 0.4), sw: 2.4, o: n(vis(vk) * 0.8), t: knot },
  ];
};
