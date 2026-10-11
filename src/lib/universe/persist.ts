/**
 * 0-dimensional persistent homology of a Euclidean point cloud.
 * Vietoris–Rips via Kruskal: a component born at 0 dies when two trees merge.
 * The sample is every nth point, not a farthest-point sample.
 * The last component never dies. Drop that infinite bar or the count is the whole cloud.
 * Bottleneck compares deaths. Births are all 0; a nonzero birth would make this match wrong.
 * Not H₁, not a Čech complex, not the topology of spacetime.
 */

export type PersistBar = { birth: number; death: number };

function find(parent: number[], i: number): number {
  while (parent[i] !== i) {
    parent[i] = parent[parent[i]!]!;
    i = parent[i]!;
  }
  return i;
}

function stride<T>(items: T[], cap: number): T[] {
  if (items.length <= cap) return items;
  const out: T[] = [];
  for (let i = 0; i < cap; i++) {
    out.push(items[Math.floor((i * items.length) / cap)]!);
  }
  return out;
}

export function persistH0(points: number[][], cap = 48): PersistBar[] {
  const pts = stride(points, cap);
  const n = pts.length;
  if (n === 0) return [];
  if (n === 1) return [{ birth: 0, death: Number.POSITIVE_INFINITY }];
  const edges: { a: number; b: number; d: number }[] = [];
  for (let i = 0; i < n; i++) {
    const pi = pts[i]!;
    for (let j = i + 1; j < n; j++) {
      const pj = pts[j]!;
      let s = 0;
      const dim = Math.min(pi.length, pj.length);
      for (let k = 0; k < dim; k++) {
        const d = (pi[k] ?? 0) - (pj[k] ?? 0);
        s += d * d;
      }
      edges.push({ a: i, b: j, d: Math.sqrt(s) });
    }
  }
  edges.sort((x, y) => x.d - y.d);
  const parent = Array.from({ length: n }, (_, i) => i);
  const bars: PersistBar[] = [];
  let left = n;
  for (const e of edges) {
    const ia = find(parent, e.a);
    const ib = find(parent, e.b);
    if (ia === ib) continue;
    parent[ia] = ib;
    bars.push({ birth: 0, death: e.d });
    left -= 1;
    if (left === 1) break;
  }
  bars.push({ birth: 0, death: Number.POSITIVE_INFINITY });
  return bars;
}

/** Finite bars that live past tau. The infinite class is the whole cloud. */
export function persistLong(bars: PersistBar[], tau: number): number {
  let n = 0;
  for (const b of bars) {
    if (Number.isFinite(b.death) && b.death > tau) n += 1;
  }
  return n;
}

/** Finite bars as a persistence diagram. H0 births are 0. The infinite class is omitted. */
export function persistDiagram(bars: PersistBar[]): { birth: number; death: number }[] {
  const out: { birth: number; death: number }[] = [];
  for (const b of bars) {
    if (Number.isFinite(b.death)) out.push({ birth: b.birth, death: b.death });
  }
  return out;
}

function h0Match(a: number[], b: number[], t: number): boolean {
  const aa = a.filter((d) => d > 2 * t).sort((x, y) => x - y);
  const bb = b.filter((d) => d > 2 * t).sort((x, y) => x - y);
  if (aa.length !== bb.length) return false;
  for (let i = 0; i < aa.length; i++) {
    if (Math.abs(aa[i]! - bb[i]!) > t) return false;
  }
  return true;
}

/**
 * Bottleneck distance of two H0 diagrams.
 * Unmatched bars go to the diagonal at cost death/2.
 * Not Wasserstein-1, not H₁.
 */
export function persistBottleneck(a: PersistBar[], b: PersistBar[]): number {
  const da = persistDiagram(a).map((p) => p.death);
  const db = persistDiagram(b).map((p) => p.death);
  let lo = 0;
  let hi = 0;
  for (const d of da) hi = Math.max(hi, d);
  for (const d of db) hi = Math.max(hi, d);
  if (hi === 0) return 0;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (h0Match(da, db, mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

