/** Newtonian three-body problem, G = 1, equal masses. Not the cosmological model. */

export type Pt = { x: number; y: number };

export type Braid = {
  exact: boolean;
  paths: [Pt[], Pt[], Pt[]];
};

type Body = { x: number; y: number; vx: number; vy: number };

const DT = 0.0025;
const STEPS = 9600;
const STRIDE = 12;
const ESCAPE = 6;

/** Euler's collinear equilibrium. Equal masses sit on a line and turn. It is unstable. */
function lineBodies(kick: number): Body[] {
  const w = Math.sqrt(1.25);
  return [
    { x: 1, y: 0, vx: 0, vy: w },
    { x: -1, y: 0, vx: 0, vy: -w },
    { x: 0, y: kick, vx: 0, vy: 0 },
  ];
}

function accelerate(bodies: Body[]): Array<{ ax: number; ay: number }> {
  const a = bodies.map(() => ({ ax: 0, ay: 0 }));
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      const r2 = dx * dx + dy * dy + 1e-9;
      const s = 1 / (r2 * Math.sqrt(r2));
      a[i].ax += dx * s;
      a[i].ay += dy * s;
      a[j].ax -= dx * s;
      a[j].ay -= dy * s;
    }
  }
  return a;
}

export function integrateThree(kick: number): Braid["paths"] {
  const bodies = lineBodies(kick);
  let acc = accelerate(bodies);
  const paths: [Pt[], Pt[], Pt[]] = [[], [], []];
  for (let step = 0; step < STEPS; step++) {
    if (step % STRIDE === 0) {
      for (let i = 0; i < 3; i++) paths[i].push({ x: bodies[i].x, y: bodies[i].y });
    }
    for (let i = 0; i < 3; i++) {
      bodies[i].vx += acc[i].ax * DT * 0.5;
      bodies[i].vy += acc[i].ay * DT * 0.5;
      bodies[i].x += bodies[i].vx * DT;
      bodies[i].y += bodies[i].vy * DT;
    }
    acc = accelerate(bodies);
    for (let i = 0; i < 3; i++) {
      bodies[i].vx += acc[i].ax * DT * 0.5;
      bodies[i].vy += acc[i].ay * DT * 0.5;
    }
    if (bodies.some((b) => Math.hypot(b.x, b.y) > ESCAPE)) break;
  }
  return paths;
}

const KICKS = [0, 0.0006, -0.0006, 0.0015, -0.0015, 0.004, -0.004, 0.01, -0.01];

let cached: Braid[] | null = null;

/** The exact line, and the thicket that grows when the middle mass is moved by a hair. */
export function threeForest(): Braid[] {
  if (cached) return cached;
  cached = KICKS.map((kick) => ({ exact: kick === 0, paths: integrateThree(kick) }));
  return cached;
}

/** Same starts as the forest, so the picture can arrive one curve at a time. */
export function threeKicks(): number[] {
  return KICKS;
}
