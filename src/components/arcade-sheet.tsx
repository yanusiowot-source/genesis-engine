import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Copy } from "@/lib/universe/i18n";
import {
  actBlocks,
  blockCells,
  ghostCells,
  moveTiles,
  previewCells,
  SNAKE_H,
  SNAKE_W,
  snakeDelay,
  blockDelay,
  startBlocks,
  startRun,
  startSnake,
  startTiles,
  stepRun,
  stepSnake,
  runDelay,
  RUN_H,
  RUN_W,
  RUN_X,
  WELL_H,
  WELL_W,
  type BlockAct,
  type Blocks,
  type Dir,
  type Run,
  type Snake,
  type Spawn,
  type Tiles,
} from "@/lib/universe/arcade";
import { cn } from "@/lib/utils";

type Kind = "tiles" | "snake" | "blocks" | "run";

type Props = {
  copy: Copy;
  onClose: () => void;
};

const TILE_INK: Record<number, string> = {
  2: "#3a3450",
  4: "#4a4068",
  8: "#8a5a38",
  16: "#b85a32",
  32: "#c45a48",
  64: "#d46a3a",
  128: "#e0a050",
  256: "#e8c878",
  512: "#b7d48a",
  1024: "#8ec8a0",
  2048: "#f0d78a",
};

function spawnTile(cells: number[]): Spawn {
  const empty = cells.flatMap((n, i) => (n === 0 ? [i] : []));
  const index = empty[Math.floor(Math.random() * empty.length)] ?? 0;
  return { index, value: Math.random() < 0.9 ? 2 : 4 };
}

function freshTiles(): Tiles {
  const a = spawnTile(Array(16).fill(0));
  const rest = Array(16).fill(0);
  rest[a.index] = a.value;
  const b = spawnTile(rest);
  return startTiles(a, b);
}

function freshSnake(): Snake {
  return startSnake({ x: 10, y: 4 });
}

function freshBlocks(): Blocks {
  return startBlocks(Math.floor(Math.random() * 7), Math.floor(Math.random() * 7));
}

function nextRidge(score: number, crowded: boolean): number {
  if (crowded || score < 8) return 0;
  const roll = Math.random();
  const chance = Math.min(0.34, 0.14 + score / 600);
  if (roll >= chance) return 0;
  return score > 36 && roll < 0.05 ? 2 : 1;
}

const BEST_KEY = "genesis-arcade-best";

function loadBest(): Record<Kind, number> {
  try {
    const raw = JSON.parse(localStorage.getItem(BEST_KEY) || "{}") as Partial<Record<Kind, number>>;
    const n = (v: unknown) => (typeof v === "number" && v > 0 ? Math.floor(v) : 0);
    return { tiles: n(raw.tiles), snake: n(raw.snake), blocks: n(raw.blocks), run: n(raw.run) };
  } catch {
    return { tiles: 0, snake: 0, blocks: 0, run: 0 };
  }
}

function useSwipe(onDir: (dir: Dir) => void, onTap: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (event: PointerEvent) => {
      start.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event: PointerEvent) => {
      const from = start.current;
      start.current = null;
      if (!from) return;
      const dx = event.clientX - from.x;
      const dy = event.clientY - from.y;
      if (Math.hypot(dx, dy) < 28) {
        onTap();
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) onDir(dx > 0 ? "right" : "left");
      else onDir(dy > 0 ? "down" : "up");
    },
  };
}

export function ArcadeSheet({ copy, onClose }: Props) {
  const [kind, setKind] = useState<Kind>("tiles");
  const [tiles, setTiles] = useState(freshTiles);
  const [snake, setSnake] = useState(freshSnake);
  const [blocks, setBlocks] = useState(freshBlocks);
  const [run, setRun] = useState(startRun);
  const [paused, setPaused] = useState(false);
  const [best, setBest] = useState(loadBest);
  const turn = useRef<Dir | null>(null);
  const jump = useRef(false);

  const slide = useCallback((dir: Dir) => {
    if (paused) return;
    setTiles((state) => (state.over ? state : moveTiles(state, dir, spawnTile(state.cells))));
  }, [paused]);
  const nudge = useCallback((act: BlockAct) => {
    if (paused) return;
    setBlocks((state) => actBlocks(state, act, Math.floor(Math.random() * 7)));
  }, [paused]);
  const swipe = useSwipe((dir) => {
    if (paused) return;
    if (kind === "run") {
      if (dir === "up") jump.current = true;
      return;
    }
    if (kind === "tiles") slide(dir);
    else if (kind === "snake") turn.current = dir;
    else if (dir === "left" || dir === "right" || dir === "down") nudge(dir === "down" ? "down" : dir);
    else nudge("rot");
  }, () => {
    if (!paused && kind === "run") jump.current = true;
  });

  useEffect(() => {
    if (kind !== "snake" || !snake.alive || paused) return;
    const id = window.setInterval(() => {
      const next = turn.current;
      turn.current = null;
      setSnake((state) =>
        stepSnake(state, next, {
          x: Math.floor(Math.random() * SNAKE_W),
          y: Math.floor(Math.random() * SNAKE_H),
        }),
      );
    }, snakeDelay(snake.score));
    return () => window.clearInterval(id);
  }, [kind, snake.alive, snake.score, paused]);

  useEffect(() => {
    if (kind !== "blocks" || blocks.over || paused) return;
    const id = window.setInterval(() => {
      setBlocks((state) => actBlocks(state, "tick", Math.floor(Math.random() * 7)));
    }, blockDelay(blocks.lines));
    return () => window.clearInterval(id);
  }, [kind, blocks.over, blocks.lines, paused]);

  useEffect(() => {
    if (kind !== "run" || !run.alive || paused) return;
    const id = window.setInterval(() => {
      const hop = jump.current;
      jump.current = false;
      setRun((state) => {
        const crowded = state.ground.slice(-2).some((n) => n > 0);
        return stepRun(state, hop, nextRidge(state.score, crowded));
      });
    }, runDelay(run.score));
    return () => window.clearInterval(id);
  }, [kind, run.alive, run.score, paused]);

  useEffect(() => {
    const mark =
      kind === "tiles" ? tiles.score : kind === "snake" ? snake.score : kind === "blocks" ? blocks.score : run.score;
    setBest((prev) => {
      if (mark <= prev[kind]) return prev;
      const next = { ...prev, [kind]: mark };
      try {
        localStorage.setItem(BEST_KEY, JSON.stringify(next));
      } catch {
        /* the board still shows this round */
      }
      return next;
    });
  }, [kind, tiles.score, snake.score, blocks.score, run.score]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (paused) return;
      const dir =
        event.key === "ArrowLeft"
          ? "left"
          : event.key === "ArrowRight"
            ? "right"
            : event.key === "ArrowUp"
              ? "up"
              : event.key === "ArrowDown"
                ? "down"
                : null;
      if (!dir && event.key !== " " && event.key.toLowerCase() !== "w" && event.key.toLowerCase() !== "a" && event.key.toLowerCase() !== "s" && event.key.toLowerCase() !== "d") {
        return;
      }
      event.preventDefault();
      if (kind === "tiles" && dir) slide(dir);
      if (kind === "snake") {
        const wasd =
          event.key.toLowerCase() === "a"
            ? "left"
            : event.key.toLowerCase() === "d"
              ? "right"
              : event.key.toLowerCase() === "w"
                ? "up"
                : event.key.toLowerCase() === "s"
                  ? "down"
                  : dir;
        if (wasd) turn.current = wasd;
      }
      if (kind === "blocks") {
        if (dir === "left" || dir === "right") nudge(dir);
        else if (dir === "down") nudge("down");
        else if (dir === "up" || event.key === " ") nudge(event.key === " " ? "drop" : "rot");
      }
      if (kind === "run" && (dir === "up" || event.key === " " || event.key.toLowerCase() === "w")) {
        jump.current = true;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [kind, nudge, onClose, paused, slide]);

  const score =
    kind === "tiles" ? tiles.score : kind === "snake" ? snake.score : kind === "blocks" ? blocks.score : run.score;
  const over = kind === "tiles" ? tiles.over : kind === "snake" ? !snake.alive : kind === "blocks" ? blocks.over : !run.alive;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center">
      <button type="button" aria-label={copy.closePanel} className="overlay-scrim absolute inset-0 bg-bg/80" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="games-title"
        className="overlay-sheet relative z-10 flex h-dvh w-full max-w-md flex-col overflow-hidden bg-bg-elevated px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-border)] sm:h-[min(44rem,92dvh)] sm:rounded-[var(--radius-xl)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="games-title" className="font-display text-2xl tracking-[-0.02em] text-fg">
              {copy.gamesTitle}
            </h2>
            <p className="mt-1 line-clamp-2 max-w-prose text-sm text-fg-muted">{copy.gamesNote}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label={copy.closePanel} onClick={onClose}>
            <X />
          </Button>
        </div>
        <div className="mt-3 flex gap-1" role="tablist">
          {(
            [
              ["tiles", copy.gamesTiles],
              ["snake", copy.gamesSnake],
              ["blocks", copy.gamesBlocks],
              ["run", copy.gamesRun],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={kind === id}
              className={cn(
                "h-11 min-w-0 flex-1 truncate rounded-[var(--radius-xs)] px-1 text-xs sm:text-sm",
                kind === id ? "bg-bg-subtle text-fg" : "text-fg-subtle",
              )}
              onClick={() => setKind(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-fg-muted">
          {kind === "tiles"
            ? copy.gamesTilesHint
            : kind === "snake"
              ? copy.gamesSnakeHint
              : kind === "blocks"
                ? copy.gamesBlocksHint
                : copy.gamesRunHint}
        </p>
        <div className="mt-2 shrink-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-sm tabular-nums text-fg">
            <span>{copy.gamesScore} {score}</span>
            {best[kind] > 0 ? <span>{copy.gamesBest} {best[kind]}</span> : null}
            {kind === "blocks" ? <span>{copy.gamesLines} {blocks.lines}</span> : null}
            {kind === "tiles" && tiles.won ? <span>{copy.gamesWon}</span> : null}
            {paused && !over ? <span>{copy.gamesPause}</span> : null}
            {over ? <span>{copy.gamesOver}</span> : null}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="outline" className="min-h-11" onClick={() => setPaused((v) => !v)} disabled={over}>
              {paused ? copy.gamesPlay : copy.gamesPause}
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => {
                setPaused(false);
                if (kind === "tiles") setTiles(freshTiles());
                else if (kind === "snake") setSnake(freshSnake());
                else if (kind === "run") setRun(startRun());
                else setBlocks(freshBlocks());
              }}
            >
              {copy.gamesAgain}
            </Button>
          </div>
        </div>
        <div className="mt-2 flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden [container-type:size]" {...swipe}>
          {kind === "tiles" ? <TileBoard cells={tiles.cells} /> : null}
          {kind === "snake" ? <SnakeBoard snake={snake} /> : null}
          {kind === "blocks" ? <BlockBoard state={blocks} /> : null}
          {kind === "run" ? <RunBoard run={run} /> : null}
        </div>
        <div className="mt-2 shrink-0">
          {kind === "blocks" ? <NextPiece id={blocks.next} label={copy.gamesNext} /> : null}
          <Pad
            kind={kind}
            turn={copy.gamesTurn}
            drop={copy.gamesDrop}
            jump={copy.gamesJump}
            onDir={(dir) => {
              if (paused) return;
              if (kind === "run") {
                if (dir === "up") jump.current = true;
                return;
              }
              if (kind === "tiles") slide(dir);
              else if (kind === "snake") turn.current = dir;
              else if (dir === "left" || dir === "right") nudge(dir);
              else nudge("rot");
            }}
            onSoft={() => {
              if (paused) return;
              if (kind === "run") jump.current = true;
              else if (kind === "blocks") nudge("down");
              else if (kind === "tiles") slide("down");
              else turn.current = "down";
            }}
            onDrop={() => nudge("drop")}
          />
        </div>
      </div>
    </div>
  );
}

function Pad({
  kind,
  turn,
  drop,
  jump,
  onDir,
  onSoft,
  onDrop,
}: {
  kind: Kind;
  turn: string;
  drop: string;
  jump: string;
  onDir: (dir: Dir) => void;
  onSoft: () => void;
  onDrop: () => void;
}) {
  const key = (label: string, run: () => void, wide = false) => (
    <button
      type="button"
      className={cn(
        "flex h-14 items-center justify-center rounded-[var(--radius-sm)] bg-bg-subtle px-1 text-center text-xs leading-tight text-balance text-fg",
        wide && "col-span-4",
      )}
      onClick={run}
    >
      {label}
    </button>
  );
  if (kind === "run") {
    return (
      <div className="mx-auto grid w-full max-w-[22rem] grid-cols-4 gap-2">
        {key(jump, onSoft, true)}
      </div>
    );
  }
  return (
    <div className="mx-auto grid w-full max-w-[22rem] grid-cols-4 gap-2">
      {key("←", () => onDir("left"))}
      {key(kind === "blocks" ? turn : "↑", () => onDir(kind === "blocks" ? "up" : "up"))}
      {key("→", () => onDir("right"))}
      {key(kind === "blocks" ? drop : "↓", kind === "blocks" ? onDrop : onSoft)}
    </div>
  );
}

function NextPiece({ id, label }: { id: number; label: string }) {
  const cells = new Set(previewCells(id).map(([x, y]) => y * 4 + x));
  return (
    <div className="mb-2 flex items-center justify-end gap-2">
      <span className="font-mono text-[0.6875rem] text-fg-subtle">{label}</span>
      <div className="grid grid-cols-4 gap-px">
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            className="size-2.5"
            style={{ background: cells.has(i) ? (BLOCK_INK[id + 1] ?? "#f4efe2") : "transparent" }}
          />
        ))}
      </div>
    </div>
  );
}

function RunBoard({ run }: { run: Run }) {
  const cells: { rock: boolean; spark: boolean; trail: boolean; lane: boolean }[] = [];
  for (let y = RUN_H - 1; y >= 0; y--) {
    for (let x = 0; x < RUN_W; x++) {
      const height = run.ground[x] ?? 0;
      const rock = y < height;
      const spark = run.alive && x === RUN_X && y === run.y;
      const trail = !rock && !spark && y === run.y && x < RUN_X && x >= RUN_X - 2;
      cells.push({ rock, spark, trail, lane: y === 0 && !rock && !spark });
    }
  }
  return (
    <div
      className="grid gap-px rounded-[var(--radius-sm)] bg-bg p-1"
      style={{
        width: "min(100cqw, 26rem)",
        aspectRatio: `${RUN_W} / ${RUN_H}`,
        gridTemplateColumns: `repeat(${RUN_W}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${RUN_H}, minmax(0, 1fr))`,
      }}
    >
      {cells.map((cell, i) => (
        <div
          key={i}
          className={cell.spark ? "min-h-0 min-w-0 rounded-full" : "min-h-0 min-w-0"}
          style={{
            background: cell.spark
              ? "#f0d78a"
              : cell.rock
                ? "#d7c4a3"
                : cell.trail
                  ? "rgba(240, 215, 138, 0.35)"
                  : cell.lane
                    ? "color-mix(in oklab, var(--color-fg) 14%, transparent)"
                    : "color-mix(in oklab, var(--color-fg) 5%, transparent)",
          }}
        />
      ))}
    </div>
  );
}

function TileBoard({ cells }: { cells: number[] }) {
  return (
    <div
      className="grid gap-1.5 rounded-[var(--radius-md)] bg-bg p-1.5"
      style={{
        width: "min(100cqw, 100cqh, 22rem)",
        aspectRatio: "1 / 1",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gridTemplateRows: "repeat(4, minmax(0, 1fr))",
      }}
    >
      {cells.map((n, i) => (
        <div
          key={i}
          className="flex min-h-0 min-w-0 items-center justify-center rounded-[var(--radius-xs)] font-mono font-medium tabular-nums text-[clamp(0.8rem,18cqmin,1.35rem)]"
          style={{
            background: n ? (TILE_INK[n] ?? "#f4efe2") : "color-mix(in oklab, var(--color-fg) 8%, transparent)",
            color: n >= 128 && n < 2048 ? "#1a1424" : "#f4efe8",
          }}
        >
          {n || ""}
        </div>
      ))}
    </div>
  );
}

function SnakeBoard({ snake }: { snake: Snake }) {
  const food = snake.food.y * SNAKE_W + snake.food.x;
  const body = new Set(snake.body.map((p) => p.y * SNAKE_W + p.x));
  const head = snake.body[0] ? snake.body[0].y * SNAKE_W + snake.body[0].x : -1;
  return (
    <div
      className="grid gap-px rounded-[var(--radius-sm)] bg-bg p-1"
      style={{
        width: `min(100cqw, calc(100cqh * ${SNAKE_W} / ${SNAKE_H}))`,
        aspectRatio: `${SNAKE_W} / ${SNAKE_H}`,
        gridTemplateColumns: `repeat(${SNAKE_W}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${SNAKE_H}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: SNAKE_W * SNAKE_H }, (_, i) => (
        <div
          key={i}
          className="min-h-0 min-w-0"
          style={{
            background:
              i === head ? "#e8d48a" : body.has(i) ? "#8ec8a0" : i === food ? "#e07a52" : "color-mix(in oklab, var(--color-fg) 8%, transparent)",
          }}
        />
      ))}
    </div>
  );
}

const BLOCK_INK = ["#7eb6ff", "#e8d48a", "#c9a6ff", "#8ec8a0", "#e07a52", "#7eb6ff", "#e0946a", "#e07a8c"];

function BlockBoard({ state }: { state: Blocks }) {
  const paint = state.well.slice();
  const live = new Set<number>();
  if (!state.over) {
    for (const [x, y] of blockCells(state)) {
      if (y >= 0 && y < WELL_H && x >= 0 && x < WELL_W) {
        paint[y * WELL_W + x] = state.id + 1;
        live.add(y * WELL_W + x);
      }
    }
    for (const [x, y] of ghostCells(state)) {
      if (y < 0 || y >= WELL_H || x < 0 || x >= WELL_W) continue;
      const i = y * WELL_W + x;
      if (!live.has(i) && paint[i] === 0) paint[i] = -1;
    }
  }
  return (
    <div
      className="grid gap-px rounded-[var(--radius-sm)] bg-bg p-1"
      style={{
        width: `min(100cqw, calc(100cqh * ${WELL_W} / ${WELL_H}))`,
        aspectRatio: `${WELL_W} / ${WELL_H}`,
        gridTemplateColumns: `repeat(${WELL_W}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${WELL_H}, minmax(0, 1fr))`,
      }}
    >
      {paint.map((n, i) => (
        <div
          key={i}
          className="min-h-0 min-w-0"
          style={{
            background: n > 0 ? (BLOCK_INK[n] ?? "#f4efe2") : "color-mix(in oklab, var(--color-fg) 7%, transparent)",
            boxShadow: n < 0 ? "inset 0 0 0 1px rgba(244,239,232,0.45)" : undefined,
          }}
        />
      ))}
    </div>
  );
}
