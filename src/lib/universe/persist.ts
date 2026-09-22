/**
 * 0-dimensional persistent homology of a Euclidean point cloud.
 * Vietoris–Rips via Kruskal: a component born at 0 dies when two trees merge.
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
