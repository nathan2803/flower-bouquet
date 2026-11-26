/**
 * Auto-arranging: give every flower a spot so the bouquet looks full but
 * nothing piles on top of anything else.
 *
 * Blooms go first, biggest first. Each one takes the spot inside the
 * bouquet's outline that overlaps the flowers already placed the least,
 * with a gentle pull towards the centre so the arrangement stays compact.
 * Greenery and sprays are spread around the rim, behind the blooms.
 * Everything is deterministic: the same flowers always land in the same place.
 */
import { ARRANGEMENTS, FLOWER_TYPES } from './flowers';
import type { Arrangement, FlowerSpec, FlowerType } from './types';

/** Rough head radius in px at scale 1, before the type's own scale. */
const HEAD_RADIUS: Partial<Record<FlowerType, number>> = {
  rose: 92,
  tulip: 70,
  daisy: 84,
  ranunculus: 84,
  lily: 100,
  peony: 104,
  sunflower: 106,
  carnation: 84,
  cosmos: 90,
  hydrangea: 82,
  anemone: 86,
};

export const headRadius = (f: FlowerSpec) =>
  (HEAD_RADIUS[f.type] ?? 90) * (FLOWER_TYPES[f.type]?.scale ?? 1) * (f.scale ?? 1);

const placed = (f: FlowerSpec) => typeof f.x === 'number' && typeof f.y === 'number';

/** Candidate spots inside the arrangement's outline, in normalised x/y. */
const candidates = (arrangement: Arrangement) => {
  const out: [number, number][] = [];
  const posy = arrangement === 'posy';
  for (let y = 0.12; y <= 1.0001; y += 0.04) {
    for (let x = -0.9; x <= 0.9001; x += 0.04) {
      // A dome: widest a little above the container, narrowing to the top.
      const inside = (x / 0.92) ** 2 + ((y - 0.46) / 0.6) ** 2 <= 1;
      if (inside && (!posy || Math.abs(x) < 0.85)) out.push([Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
    }
  }
  return out;
};

type Options = {
  /** Keep flowers that already have a position; only place the rest. */
  keepPlaced?: boolean;
};

export const autoArrange = (specs: FlowerSpec[], arrangement: Arrangement = 'dome', opts: Options = {}): FlowerSpec[] => {
  const { spread, height } = ARRANGEMENTS[arrangement] ?? ARRANGEMENTS.dome;
  const out = specs.map((f) => (opts.keepPlaced ? { ...f } : { ...f, x: undefined, y: undefined }));
  const isHead = (f: FlowerSpec) => Boolean(FLOWER_TYPES[f.type]?.head);
  const px = (x: number, y: number): [number, number] => [x * spread, y * height];

  // ---- blooms ----
  const fixed: { p: [number, number]; r: number }[] = out
    .filter((f) => isHead(f) && placed(f))
    .map((f) => ({ p: px(f.x!, f.y!), r: headRadius(f) }));
  const todo = out
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => isHead(f) && !placed(f))
    .sort((a, b) => headRadius(b.f) - headRadius(a.f) || a.i - b.i);
  const spots = candidates(arrangement);
  const centre = px(0, 0.58);

  for (const { f } of todo) {
    const r = headRadius(f);
    let best = spots[0];
    let bestCost = Infinity;
    for (const [x, y] of spots) {
      const p = px(x, y);
      let overlap = 0;
      for (const o of fixed) {
        // Allow a little layering (5%), punish anything more.
        const d = Math.hypot(p[0] - o.p[0], p[1] - o.p[1]);
        const gap = (r + o.r) * 0.95 - d;
        if (gap > 0) overlap += gap * gap;
      }
      const pull = Math.hypot(p[0] - centre[0], (p[1] - centre[1]) * 1.25);
      const cost = overlap + pull * 1.5 + (fixed.length === 0 ? pull * 50 : 0);
      if (cost < bestCost) {
        bestCost = cost;
        best = [x, y];
      }
    }
    f.x = best[0];
    f.y = best[1];
    fixed.push({ p: px(best[0], best[1]), r });
  }

  // Cascade: let the smallest bloom or two tumble over the front, to the right.
  if (arrangement === 'cascade' && !opts.keepPlaced) {
    const heads = out.filter(isHead).sort((a, b) => headRadius(a) - headRadius(b));
    const spill = heads.slice(0, Math.max(1, Math.floor(heads.length / 5)));
    spill.forEach((f, k) => {
      f.x = 0.55 + k * 0.18;
      f.y = -0.12 - k * 0.08;
      f.tilt = f.tilt ?? 22;
    });
  }

  // ---- greenery to the sides, sprays across the top ----
  const fillers = out.filter((f) => !isHead(f));
  const wideTypes: FlowerType[] = ['eucalyptus', 'fern'];
  const place = (group: FlowerSpec[], angles: number[], radius: [number, number]) => {
    const taken = group.filter(placed).map((f) => Math.atan2(f.y! - 0.42, f.x!));
    const free = group.filter((f) => !placed(f));
    const order = angles
      .map((a) => ({ a, d: taken.length ? Math.min(...taken.map((t) => Math.abs(t - a))) : 1 }))
      .sort((p, q) => q.d - p.d);
    free.forEach((f, k) => {
      const a = order[k % order.length].a;
      f.x = Math.round(Math.cos(a) * radius[0] * 100) / 100;
      f.y = Math.round((0.42 + Math.sin(a) * radius[1]) * 100) / 100;
    });
  };
  const wide = fillers.filter((f) => wideTypes.includes(f.type));
  const sprays = fillers.filter((f) => !wideTypes.includes(f.type));
  // Sides first (left, right), working up towards the shoulders.
  const sideAngles = Array.from({ length: Math.max(2, wide.length) }, (_, k) => {
    const level = Math.floor(k / 2) / Math.max(1, Math.ceil(wide.length / 2));
    const a = 0.06 + level * 0.22;
    return Math.PI * (k % 2 ? a : 1 - a);
  });
  place(wide, sideAngles, [1, 0.5]);
  // Sprays spread evenly over the top, from upper-left to upper-right.
  const n = Math.max(1, sprays.length);
  const topAngles = Array.from({ length: n }, (_, k) => Math.PI * (n === 1 ? 0.5 : 0.82 - (0.64 * k) / (n - 1)));
  place(sprays, topAngles, [0.82, 0.6]);

  return out;
};
