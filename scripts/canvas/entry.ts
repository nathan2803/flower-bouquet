/**
 * The whole scene as plain data for one frame, using the project's own
 * drawing code. Bundled (with remotion-shim.ts standing in for Remotion) into
 * the Design canvas preview by `npm run canvas:bundle`.
 */
import { cardPose, doodle, twineShapes, wrapMessage } from '../../src/bouquet/card';
import { DEFAULT_FLOWERS, DEFAULT_PALETTE, PRESETS } from '../../src/bouquet/config';
import { CONTAINERS, bowShapes } from '../../src/bouquet/containers';
import { FLOWER_TYPE_NAMES, headShapes, layoutFlowers, stemShapes } from '../../src/bouquet/flowers';
import { dark, n, sc, type Shape } from '../../src/bouquet/geometry';
import { SEAL_PATH, SEAL_RING, openingModel } from '../../src/bouquet/openingModel';
import { driftingPetals, gustPetals } from '../../src/bouquet/petals';
import { makeClock } from '../../src/bouquet/timing';
import type { Arrangement, ContainerType, FlowerSpec, Palette } from '../../src/bouquet/types';

type Opts = {
  palette?: Partial<Palette>;
  flowers?: FlowerSpec[];
  container?: ContainerType;
  arrangement?: Arrangement;
  message?: string;
  gusts?: number[];
  /** Just the flowers: no container, card, seal or heading (for the flower library). */
  bare?: boolean;
};

const fill = (shapes: Shape[]) =>
  shapes.map((s) => ({ d: s.d, f: s.f ?? 'none', s: s.s ?? 'none', sw: s.sw ?? 0, o: s.o ?? 1, t: s.t ?? '', da: s.da ?? 'none', dof: s.dof ?? 0 }));

export const scene = (frame: number, opts: Opts, ids: { fibers: string }) => {
  const pal: Palette = { ...DEFAULT_PALETTE, ...opts.palette };
  const box: ContainerType = opts.container && CONTAINERS[opts.container] ? opts.container : 'wrap';
  const ck = makeClock(frame, 30, opts.gusts ?? []);
  const calm = { sway: 1 };
  const els = layoutFlowers(opts.flowers?.length ? opts.flowers : DEFAULT_FLOWERS, pal, opts.bare ? 'none' : box, opts.arrangement ?? 'dome');
  const stems = els.flatMap((e) => stemShapes(e, ck, pal, calm));
  const inside = els.filter((e) => !e.spills).flatMap((e) => headShapes(e, ck, pal, calm));
  const spill = els.filter((e) => e.spills).flatMap((e) => headShapes(e, ck, pal, calm));
  if (opts.bare) {
    return { pal, back: fill([...stems, ...inside, ...spill]), front: [], petals: [], card: null, op: null, paper: 1 };
  }
  const def = CONTAINERS[box];
  const p = cardPose(ck, def.bow);
  const m = wrapMessage(opts.message ?? '');
  const lh = Math.round(m.size * 1.12);
  const top = m.lines.length > 3 ? -30 : -14;
  const op = openingModel(ck, pal);
  return {
    pal,
    paper: n(ck.ramp(0, 30, 'out')),
    back: fill([...def.back(ck, pal, ids.fibers), ...stems, ...inside, ...def.front(ck, pal, ids.fibers), ...spill]),
    card: {
      t: `translate(${n(p.x)} ${n(p.y)}) rotate(${n(p.rotate)}) scale(${sc(p.scale)})`,
      o: n(Math.min(1, Math.max(0, p.v * 3))),
      toO: n(ck.ramp(234, 252, 'out')),
      fromO: n(ck.ramp(268, 288, 'out')),
      rules: Array.from({ length: Math.max(3, m.lines.length) }, (_, i) => `M-300,${top + i * lh + 14}H300`),
      lines: m.lines.map((text, i) => {
        const o = ck.ramp(244 + i * 7, 262 + i * 7, 'out');
        return { text, size: m.size, y: n(top + i * lh + (1 - o) * 10), o: n(o) };
      }),
      doodle: fill(doodle(pal)),
      edge: dark(pal.cream, 0.12),
      hole: dark(pal.kraft, 0.3),
    },
    front: fill([...twineShapes(ck, pal, def.bow), ...bowShapes(ck, pal, def.bow)]),
    op: { ...op, sparkles: fill(op.sparkles), sealPath: SEAL_PATH, sealRing: SEAL_RING },
    petals: fill([...driftingPetals(ck, pal, calm), ...gustPetals(ck, pal)]),
  };
};

export const presets = Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, v]));
export { DEFAULT_PALETTE, DEFAULT_FLOWERS, FLOWER_TYPE_NAMES, dark };
