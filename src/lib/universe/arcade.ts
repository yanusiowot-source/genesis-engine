/** Games beside the lab. They do not read or write a sky. */

export type Dir = "left" | "right" | "up" | "down";

export type Tiles = {
  cells: number[];
  score: number;
  over: boolean;
  won: boolean;
};

export type Spawn = { index: number; value: 2 | 4 };

const TILES = 16;

export function startTiles(a: Spawn, b: Spawn): Tiles {
  const cells = Array(TILES).fill(0);
  cells[a.index] = a.value;
  if (b.index !== a.index) cells[b.index] = b.value;
  return { cells, score: 0, over: false, won: false };
}

function pack(line: number[]): { line: number[]; score: number } {
  const kept = line.filter((n) => n > 0);
  const out: number[] = [];
  let score = 0;
  for (let i = 0; i < kept.length; i++) {
    const here = kept[i] ?? 0;
    const next = kept[i + 1] ?? 0;
    if (here && here === next) {
      const joined = here * 2;
      out.push(joined);
      score += joined;
      i += 1;
    } else if (here) out.push(here);
  }
  while (out.length < 4) out.push(0);
  return { line: out.slice(0, 4), score };
}

function linesOf(cells: number[], dir: Dir): number[][] {
  const lines: number[][] = [];
  if (dir === "left" || dir === "right") {
    for (let y = 0; y < 4; y++) {
      const row = [0, 1, 2, 3].map((x) => cells[y * 4 + x] ?? 0);
      lines.push(dir === "right" ? row.reverse() : row);
    }
  } else {
    for (let x = 0; x < 4; x++) {
      const col = [0, 1, 2, 3].map((y) => cells[y * 4 + x] ?? 0);
      lines.push(dir === "down" ? col.reverse() : col);
    }
  }
  return lines;
}

function cellsOf(lines: number[][], dir: Dir): number[] {
  const cells = Array(TILES).fill(0);
  if (dir === "left" || dir === "right") {
    lines.forEach((line, y) => {
      const row = dir === "right" ? [...line].reverse() : line;
      row.forEach((v, x) => {
        cells[y * 4 + x] = v;
      });
    });
  } else {
    lines.forEach((line, x) => {
      const col = dir === "down" ? [...line].reverse() : line;
      col.forEach((v, y) => {
        cells[y * 4 + x] = v;
      });
    });
  }
  return cells;
}

export function tilesCanMove(cells: number[]): boolean {
  if (cells.some((n) => n === 0)) return true;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const v = cells[y * 4 + x];
      if (x < 3 && cells[y * 4 + x + 1] === v) return true;
      if (y < 3 && cells[(y + 1) * 4 + x] === v) return true;
    }
  }
  return false;
}

/** One slide. A tile merges once. No change means no new tile. */
export function moveTiles(state: Tiles, dir: Dir, spawn: Spawn): Tiles {
  if (state.over) return state;
  let score = state.score;
  const packed = linesOf(state.cells, dir).map((line) => {
    const next = pack(line);
    score += next.score;
    return next.line;
  });
  const cells = cellsOf(packed, dir);
  const same = cells.every((n, i) => n === state.cells[i]);
  if (same) return state;
  if (cells[spawn.index] === 0) cells[spawn.index] = spawn.value;
  const won = state.won || cells.some((n) => n >= 2048);
  return { cells, score, won, over: !tilesCanMove(cells) };
}

export const SNAKE_W = 14;
export const SNAKE_H = 18;

export type Snake = {
  body: { x: number; y: number }[];
  dir: Dir;
  food: { x: number; y: number };
  alive: boolean;
  score: number;
};

const OPP: Record<Dir, Dir> = { left: "right", right: "left", up: "down", down: "up" };

export function startSnake(food: { x: number; y: number }): Snake {
  return {
    body: [
      { x: 4, y: 8 },
      { x: 3, y: 8 },
      { x: 2, y: 8 },
    ],
    dir: "right",
    food,
    alive: true,
    score: 0,
  };
}

export function freeCell(
  body: { x: number; y: number }[],
  prefer: { x: number; y: number },
): { x: number; y: number } {
  const on = (x: number, y: number) => body.some((p) => p.x === x && p.y === y);
  if (!on(prefer.x, prefer.y)) return prefer;
  for (let y = 0; y < SNAKE_H; y++) {
    for (let x = 0; x < SNAKE_W; x++) {
      if (!on(x, y)) return { x, y };
    }
  }
  return prefer;
}

export function stepSnake(state: Snake, turn: Dir | null, nextFood: { x: number; y: number }): Snake {
  if (!state.alive) return state;
  const dir = turn && turn !== OPP[state.dir] ? turn : state.dir;
  const head = state.body[0] ?? { x: 0, y: 0 };
  const x = head.x + (dir === "left" ? -1 : dir === "right" ? 1 : 0);
  const y = head.y + (dir === "up" ? -1 : dir === "down" ? 1 : 0);
  if (x < 0 || y < 0 || x >= SNAKE_W || y >= SNAKE_H) return { ...state, dir, alive: false };
  const eat = x === state.food.x && y === state.food.y;
  const torso = eat ? state.body : state.body.slice(0, -1);
  if (torso.some((p) => p.x === x && p.y === y)) return { ...state, dir, alive: false };
  const body = [{ x, y }, ...torso];
  return {
    body,
    dir,
    alive: true,
    score: eat ? state.score + 1 : state.score,
    food: eat ? freeCell(body, nextFood) : state.food,
  };
}

export const WELL_W = 10;
export const WELL_H = 20;

const SHAPES: [number, number][][][] = [
  [
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
    [
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
    ],
  ],
  [
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
  ],
  [
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  [
    [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
  ],
  [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [2, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
  ],
  [
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 2],
      [1, 2],
    ],
  ],
  [
    [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  ],
];

export type Blocks = {
  well: number[];
  id: number;
  rot: number;
  x: number;
  y: number;
  next: number;
  score: number;
  lines: number;
  over: boolean;
};

export type BlockAct = "left" | "right" | "rot" | "down" | "drop" | "tick";

function shape(id: number, rot: number, x: number, y: number): [number, number][] {
  const rots = SHAPES[id] ?? SHAPES[0]!;
  const cells = rots[rot % rots.length] ?? rots[0]!;
  return cells.map(([cx, cy]) => [x + cx, y + cy]);
}

function hits(well: number[], cells: [number, number][]): boolean {
  return cells.some(([x, y]) => x < 0 || x >= WELL_W || y >= WELL_H || (y >= 0 && (well[y * WELL_W + x] ?? 0) > 0));
}

export function startBlocks(id: number, next: number): Blocks {
  const state: Blocks = {
    well: Array(WELL_W * WELL_H).fill(0),
    id,
    rot: 0,
    x: 3,
    y: 0,
    next,
    score: 0,
    lines: 0,
    over: false,
  };
  if (hits(state.well, shape(id, 0, 3, 0))) return { ...state, over: true };
  return state;
}

const KICKS: [number, number][] = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, -1],
  [-2, 0],
  [2, 0],
];

function lock(state: Blocks, incoming: number): Blocks {
  const well = state.well.slice();
  for (const [x, y] of shape(state.id, state.rot, state.x, state.y)) {
    if (y >= 0) well[y * WELL_W + x] = state.id + 1;
  }
  const rows: number[][] = [];
  let cleared = 0;
  for (let y = WELL_H - 1; y >= 0; y--) {
    const row = well.slice(y * WELL_W, y * WELL_W + WELL_W);
    if (row.every((n) => n > 0)) cleared += 1;
    else rows.push(row);
  }
  const nextWell = Array(WELL_W * WELL_H).fill(0);
  rows.forEach((row, r) => {
    const y = WELL_H - 1 - r;
    row.forEach((n, x) => {
      nextWell[y * WELL_W + x] = n;
    });
  });
  const score = state.score + [0, 100, 300, 500, 800][cleared]!;
  const spawned = startBlocks(state.next, incoming);
  return { ...spawned, well: nextWell, score, lines: state.lines + cleared, over: spawned.over };
}

export function actBlocks(state: Blocks, act: BlockAct, incoming: number): Blocks {
  if (state.over) return state;
  if (act === "left" || act === "right") {
    const x = state.x + (act === "left" ? -1 : 1);
    if (hits(state.well, shape(state.id, state.rot, x, state.y))) return state;
    return { ...state, x };
  }
  if (act === "rot") {
    const rot = (state.rot + 1) % (SHAPES[state.id]?.length ?? 1);
    for (const [kx, ky] of KICKS) {
      if (!hits(state.well, shape(state.id, rot, state.x + kx, state.y + ky))) {
        return { ...state, rot, x: state.x + kx, y: state.y + ky };
      }
    }
    return state;
  }
  if (act === "drop") {
    let y = state.y;
    while (!hits(state.well, shape(state.id, state.rot, state.x, y + 1))) y += 1;
    return lock({ ...state, y }, incoming);
  }
  const y = state.y + 1;
  if (!hits(state.well, shape(state.id, state.rot, state.x, y))) return { ...state, y };
  return lock(state, incoming);
}

export function ghostY(state: Blocks): number {
  if (state.over) return state.y;
  let y = state.y;
  while (!hits(state.well, shape(state.id, state.rot, state.x, y + 1))) y += 1;
  return y;
}

export function ghostCells(state: Blocks): [number, number][] {
  return shape(state.id, state.rot, state.x, ghostY(state));
}

export function previewCells(id: number): [number, number][] {
  return shape(id, 0, 0, 0);
}

export function snakeDelay(score: number): number {
  return Math.max(70, 170 - Math.max(0, score) * 6);
}

export function blockDelay(lines: number): number {
  return Math.max(160, 700 - Math.max(0, lines) * 36);
}

export function blockCells(state: Blocks): [number, number][] {
  return shape(state.id, state.rot, state.x, state.y);
}

/** A spark on a lane. Jump clears a ridge. The sky is not involved. */
export const RUN_W = 18;
export const RUN_H = 7;
export const RUN_X = 4;

const ARC = [2, 3, 3, 2, 1];

export type Run = {
  ground: number[];
  y: number;
  hop: number;
  score: number;
  alive: boolean;
};

export function startRun(): Run {
  return { ground: Array(RUN_W).fill(0), y: 0, hop: -1, score: 0, alive: true };
}

export function stepRun(state: Run, jump: boolean, next: number): Run {
  if (!state.alive) return state;
  let hop = state.hop;
  if (jump && hop < 0) hop = 0;
  let y = 0;
  if (hop >= 0) {
    y = ARC[hop] ?? 0;
    hop += 1;
    if (hop >= ARC.length) hop = -1;
  }
  const ground = state.ground.slice(1);
  const cell = next === 3 ? -1 : next >= 2 ? 2 : next === 1 ? 1 : 0;
  ground.push(cell);
  const rock = ground[RUN_X] ?? 0;
  const alive = !(rock > 0 && y < rock);
  const mote = alive && rock < 0 && y === 0;
  return {
    ground,
    y: alive ? y : 0,
    hop: alive ? hop : -1,
    score: state.score + 1 + (mote ? 2 : 0),
    alive,
  };
}

export function runDelay(score: number): number {
  return Math.max(80, 220 - Math.floor(Math.max(0, score) / 2) * 4);
}
