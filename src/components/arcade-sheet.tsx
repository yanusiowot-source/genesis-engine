import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
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
  tileMoves,
  runDelay,
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

type TileMotion = { id: number; before: number[]; after: number[]; dir: Dir };

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
  if (roll < chance) return score > 36 && roll < 0.05 ? 2 : 1;
  if (score > 20 && roll > 0.9) return 3;
  return 0;
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
  const [round, setRound] = useState(0);
  const [motion, setMotion] = useState<TileMotion | null>(null);
  const turn = useRef<Dir | null>(null);
  const jump = useRef(false);
  const tilesRef = useRef(tiles);
  tilesRef.current = tiles;

  const slide = useCallback((dir: Dir) => {
    if (paused) return;
    const state = tilesRef.current;
    if (state.over) return;
    const next = moveTiles(state, dir, spawnTile(state.cells));
    if (next === state) return;
    setMotion((prev) => ({
      id: (prev?.id ?? 0) + 1,
      before: state.cells,
      after: next.cells,
      dir,
    }));
    setTiles(next);
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
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-[var(--radius-sm)] bg-bg p-1 sm:grid-cols-4" role="tablist">
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
                "flex h-auto min-h-11 w-full min-w-0 items-center justify-center rounded-[var(--radius-xs)] px-2 py-1.5 text-center text-sm leading-tight",
                kind === id ? "bg-bg-subtle text-fg" : "text-fg-subtle",
              )}
              onClick={() => setKind(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="games-hint mt-2 text-pretty text-sm leading-relaxed text-fg-muted" title={kind === "tiles" ? copy.gamesTilesHint : kind === "snake" ? copy.gamesSnakeHint : kind === "blocks" ? copy.gamesBlocksHint : copy.gamesRunHint}>
          {kind === "tiles"
            ? copy.gamesTilesHint
            : kind === "snake"
              ? copy.gamesSnakeHint
              : kind === "blocks"
                ? copy.gamesBlocksHint
                : copy.gamesRunHint}
        </p>
        <div className="mt-2 flex shrink-0 items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-sm tabular-nums text-fg">
            <span>{copy.gamesScore} {score}</span>
            {best[kind] > 0 ? <span>{copy.gamesBest} {best[kind]}</span> : null}
            {kind === "blocks" ? <span>{copy.gamesLines} {blocks.lines}</span> : null}
            {kind === "tiles" && tiles.won ? <span>{copy.gamesWon}</span> : null}
            {paused && !over ? <span>{copy.gamesPause}</span> : null}
            {over ? <span>{copy.gamesOver}</span> : null}
          </div>
          <Button variant="outline" className="min-h-11 shrink-0 px-3" onClick={() => setPaused((v) => !v)} disabled={over}>
            {paused ? copy.gamesPlay : copy.gamesPause}
          </Button>
          <Button
            variant="outline"
            className="min-h-11 shrink-0 px-3"
            onClick={() => {
              setPaused(false);
              setMotion(null);
              setRound((n) => n + 1);
              if (kind === "tiles") setTiles(freshTiles());
              else if (kind === "snake") setSnake(freshSnake());
              else if (kind === "run") setRun(startRun());
              else setBlocks(freshBlocks());
            }}
          >
            {copy.gamesAgain}
          </Button>
        </div>
        <div
          className={cn(
            "relative mt-2 flex min-h-0 flex-1 touch-none overflow-hidden rounded-[var(--radius-md)] bg-bg [container-type:size]",
            kind === "run" ? "items-stretch" : "items-center justify-center",
          )}
          {...swipe}
        >
          {kind === "tiles" ? <TileBoard key={round} cells={tiles.cells} motion={motion} /> : null}
          {kind === "snake" ? <SnakeBoard key={round} snake={snake} /> : null}
          {kind === "blocks" ? <BlockBoard key={round} state={blocks} /> : null}
          {kind === "run" ? <RunBoard key={round} run={run} /> : null}
        </div>
        <div className="mt-2 shrink-0 bg-bg-elevated pt-2">
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
        "flex h-11 items-center justify-center rounded-[var(--radius-sm)] bg-bg-subtle px-1 text-center text-xs leading-tight text-balance text-fg shadow-[var(--shadow-border)] active:scale-[0.97]",
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

function laneIds(ground: number[], bag: { ids: number[]; seq: number; prev: number[] | null }) {
  if (bag.prev !== ground) {
    if (bag.ids.length !== ground.length) {
      bag.seq = ground.length;
      bag.ids = ground.map((_, index) => index);
    } else {
      bag.ids = [...bag.ids.slice(1), bag.seq++];
    }
    bag.prev = ground;
  }
  return bag.ids;
}

function RunBoard({ run }: { run: Run }) {
  const bag = useRef({ ids: [] as number[], seq: 0, prev: null as number[] | null });
  const ids = laneIds(run.ground, bag.current);
  const unit = 100 / RUN_W;
  const ground = 11;
  const step = 9;
  const stars = [8, 22, 37, 51, 68, 84];
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[var(--radius-md)]"
      style={{
        background: "linear-gradient(180deg, #100d18 0%, #1c1730 48%, #2a221c 100%)",
        boxShadow: "inset 0 0 36px rgba(0,0,0,0.35)",
        ["--glide" as string]: `${Math.max(56, runDelay(run.score) - 16)}ms`,
      }}
    >
      {stars.map((left, i) => (
        <span
          key={left}
          aria-hidden
          className="absolute size-1 rounded-full bg-[#f4efe2]"
          style={{ left: `${left}%`, top: `${10 + ((i * 17) % 42)}%`, opacity: 0.35 + (i % 3) * 0.2 }}
        />
      ))}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0"
        style={{
          height: `${ground}%`,
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--color-fg) 28%, transparent), color-mix(in oklab, var(--color-fg) 8%, transparent))",
        }}
      />
      {run.ground.map((height, x) => {
        if (height > 0) {
          return (
            <span
              key={ids[x]}
              aria-hidden
              className="game-lane absolute"
              style={{
                left: `${x * unit + unit * 0.12}%`,
                width: `${unit * 0.76}%`,
                bottom: `${ground - 0.4}%`,
                height: `${height * step}%`,
                borderRadius: "5px 5px 2px 2px",
                background: "linear-gradient(180deg, #f7f1e4 0 22%, #c4a98a 22% 38%, #6d5848 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
              }}
            />
          );
        }
        if (height < 0) {
          return (
            <span
              key={ids[x]}
              aria-hidden
              className="game-lane absolute rounded-full"
              style={{
                left: `${x * unit + unit * 0.22}%`,
                width: `${unit * 0.5}%`,
                aspectRatio: "1",
                bottom: `${ground + 1.5}%`,
                background: "radial-gradient(circle at 35% 35%, #fffaf0, #f0d78a 55%, #c4a15a)",
                boxShadow: "0 0 12px #f0d78a",
              }}
            />
          );
        }
        return null;
      })}
      {run.alive
        ? [3, 2, 1].map((back) => (
            <span
              key={back}
              aria-hidden
              className="game-spark absolute rounded-full"
              style={{
                left: `${(RUN_X - back + 0.28) * unit}%`,
                width: `${unit * (0.42 - back * 0.06)}%`,
                aspectRatio: "1",
                bottom: `${ground + run.y * step + 1}%`,
                background: "#f0d78a",
                opacity: 0.16,
              }}
            />
          ))
        : null}
      <span
        aria-hidden
        className="game-spark absolute rounded-full"
        style={{
          left: `${(RUN_X + 0.12) * unit}%`,
          width: `${unit * 0.76}%`,
          aspectRatio: "1",
          bottom: `${ground + (run.alive ? run.y : 0) * step}%`,
          background: run.alive
            ? "radial-gradient(circle at 35% 35%, #fffaf0, #f0d78a 60%, #c9a24a)"
            : "#8a7360",
          boxShadow: run.alive ? "0 0 16px #f0d78a" : undefined,
          opacity: run.alive ? 1 : 0.45,
        }}
      />
    </div>
  );
}

type TilePiece = {
  id: number;
  value: number;
  x: number;
  y: number;
  ox: number;
  oy: number;
  fresh: boolean;
  pop: boolean;
  ghost: boolean;
  mergeTo: number;
};

let tileSerial = 1;

function cellXY(index: number) {
  return { x: index % 4, y: Math.floor(index / 4) };
}

function easeMotion() {
  return typeof window === "undefined" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function seedPieces(cells: number[]): TilePiece[] {
  const pieces: TilePiece[] = [];
  cells.forEach((value, index) => {
    if (!value) return;
    const pos = cellXY(index);
    pieces.push({
      id: tileSerial++,
      value,
      x: pos.x,
      y: pos.y,
      ox: 0,
      oy: 0,
      fresh: true,
      pop: false,
      ghost: false,
      mergeTo: 0,
    });
  });
  return pieces;
}

function commitPieces(pieces: TilePiece[]): TilePiece[] {
  return pieces
    .filter((piece) => !piece.ghost)
    .map((piece) => ({
      ...piece,
      value: piece.mergeTo || piece.value,
      mergeTo: 0,
      ox: 0,
      oy: 0,
      fresh: false,
      pop: false,
    }));
}

function slidePieces(pieces: TilePiece[], before: number[], dir: Dir, after: number[]): TilePiece[] {
  const smooth = easeMotion();
  const byCell = new Map(commitPieces(pieces).map((piece) => [piece.y * 4 + piece.x, piece]));
  const next: TilePiece[] = [];
  const groups = new Map<number, TilePiece[]>();
  for (const move of tileMoves(before, dir)) {
    const piece = byCell.get(move.from);
    if (!piece) continue;
    const from = cellXY(move.from);
    const to = cellXY(move.to);
    const moved: TilePiece = {
      ...piece,
      x: to.x,
      y: to.y,
      ox: smooth ? from.x - to.x : 0,
      oy: smooth ? from.y - to.y : 0,
      fresh: false,
      pop: false,
      ghost: false,
      mergeTo: 0,
      value: before[move.from] ?? piece.value,
    };
    next.push(moved);
    const group = groups.get(move.to) ?? [];
    group.push(moved);
    groups.set(move.to, group);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const stay = group[0];
    const gone = group[1];
    if (!stay || !gone) continue;
    if (smooth) {
      stay.mergeTo = stay.value * 2;
      gone.ghost = true;
    } else {
      stay.value = stay.value * 2;
      gone.ghost = true;
    }
  }
  const landed = new Set(groups.keys());
  after.forEach((value, index) => {
    if (!value || landed.has(index)) return;
    const pos = cellXY(index);
    next.push({
      id: tileSerial++,
      value,
      x: pos.x,
      y: pos.y,
      ox: 0,
      oy: 0,
      fresh: true,
      pop: false,
      ghost: false,
      mergeTo: 0,
    });
  });
  return smooth ? next : next.filter((piece) => !piece.ghost);
}

function tileInk(n: number): CSSProperties {
  const ink = TILE_INK[n] ?? "#f4efe2";
  const dark = n >= 128;
  return {
    background: `linear-gradient(165deg, color-mix(in oklab, ${ink} 40%, white) 0%, ${ink} 46%, color-mix(in oklab, ${ink} 62%, black) 100%)`,
    color: dark ? "#1a1424" : "#f4efe8",
    boxShadow:
      n >= 2048
        ? "0 0 18px rgba(240,215,138,0.55), inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 10px rgba(0,0,0,0.28)"
        : "inset 0 1px 0 rgba(255,255,255,0.38), 0 4px 8px rgba(0,0,0,0.22)",
    textShadow: dark ? "0 1px 0 rgba(255,255,255,0.28)" : "0 1px 1px rgba(0,0,0,0.38)",
    fontSize: n >= 1024 ? "0.78em" : "1em",
  };
}

function TileBoard({ cells, motion }: { cells: number[]; motion: TileMotion | null }) {
  const [pieces, setPieces] = useState(() => seedPieces(cells));
  const [seen, setSeen] = useState(0);
  if (motion && motion.id !== seen) {
    setSeen(motion.id);
    setPieces(slidePieces(pieces, motion.before, motion.dir, motion.after));
  }

  const finish = () => {
    setPieces((current) => {
      if (!current.some((piece) => piece.ox || piece.oy || piece.ghost || piece.mergeTo)) return current;
      return current
        .filter((piece) => !piece.ghost)
        .map((piece) => ({
          ...piece,
          value: piece.mergeTo || piece.value,
          mergeTo: 0,
          pop: Boolean(piece.mergeTo),
          fresh: false,
          ox: 0,
          oy: 0,
        }));
    });
  };

  return (
    <div
      className="relative"
      style={{
        width: "min(100cqw, 100cqh, 22rem)",
        aspectRatio: "1 / 1",
        borderRadius: "var(--radius-md)",
        background: "radial-gradient(120% 90% at 50% 0%, #342b46 0%, #14111c 72%)",
        boxShadow: "inset 0 0 0 1px rgba(244,239,232,0.08), inset 0 16px 32px rgba(0,0,0,0.35)",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 grid gap-1.5 p-1.5"
        style={{
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gridTemplateRows: "repeat(4, minmax(0, 1fr))",
        }}
      >
        {Array.from({ length: 16 }, (_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-xs)]"
            style={{
              background: "rgba(244,239,232,0.045)",
              boxShadow: "inset 0 2px 5px rgba(0,0,0,0.35)",
            }}
          />
        ))}
      </div>
      <div
        className="absolute inset-0 grid gap-1.5 p-1.5"
        style={{
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gridTemplateRows: "repeat(4, minmax(0, 1fr))",
        }}
      >
        {pieces.map((piece) => (
          <div
            key={`${piece.id}-${piece.x}-${piece.y}`}
            className={cn("game-tile relative min-h-0 min-w-0", (piece.ox || piece.oy) && "is-slide")}
            style={{
              gridColumn: piece.x + 1,
              gridRow: piece.y + 1,
              zIndex: piece.ghost ? 1 : 2,
              ["--from-x" as string]: `calc(${piece.ox} * (100% + 0.375rem))`,
              ["--from-y" as string]: `calc(${piece.oy} * (100% + 0.375rem))`,
            }}
            onAnimationEnd={(event) => {
              if (event.animationName !== "game-slide") return;
              finish();
            }}
          >
            <div
              className={cn(
                "game-face absolute inset-0 flex items-center justify-center rounded-[var(--radius-xs)] font-mono font-semibold tabular-nums text-[clamp(0.8rem,18cqmin,1.4rem)]",
                piece.fresh && "is-born",
                piece.pop && "is-pop",
              )}
              style={tileInk(piece.value)}
            >
              {piece.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function snakeTags(
  body: { x: number; y: number }[],
  bag: { ids: number[]; seq: number; head: string; len: number },
) {
  const head = body[0] ? `${body[0].x},${body[0].y}` : "";
  if (bag.ids.length === 0) {
    bag.seq = 1;
    bag.ids = body.map(() => bag.seq++);
  } else if (head !== bag.head) {
    if (body.length > bag.len) bag.ids = [...bag.ids, bag.seq++];
    else if (body.length < bag.len) bag.ids = bag.ids.slice(0, body.length);
  }
  bag.head = head;
  bag.len = body.length;
  return bag.ids;
}

function cellBox(x: number, y: number, cols: number, rows: number): CSSProperties {
  return {
    position: "absolute",
    width: `calc((100% - ${cols - 1} * 1px) / ${cols})`,
    height: `calc((100% - ${rows - 1} * 1px) / ${rows})`,
    left: `calc(${x} * ((100% - ${cols - 1} * 1px) / ${cols} + 1px))`,
    top: `calc(${y} * ((100% - ${rows - 1} * 1px) / ${rows} + 1px))`,
  };
}

function eyesFor(dir: Dir): CSSProperties[] {
  const dot: CSSProperties = {
    position: "absolute",
    width: "22%",
    height: "22%",
    borderRadius: "999px",
    background: "#1a1424",
  };
  if (dir === "left" || dir === "right") {
    const left = dir === "right" ? "62%" : "16%";
    return [
      { ...dot, left, top: "18%" },
      { ...dot, left, top: "58%" },
    ];
  }
  const top = dir === "down" ? "62%" : "16%";
  return [
    { ...dot, top, left: "18%" },
    { ...dot, top, left: "58%" },
  ];
}

function SnakeBoard({ snake }: { snake: Snake }) {
  const bag = useRef({ ids: [] as number[], seq: 1, head: "", len: 0 });
  const tags = snakeTags(snake.body, bag.current);
  const eyes = eyesFor(snake.dir);
  return (
    <div
      className="relative"
      style={{
        width: `min(100cqw, calc(100cqh * ${SNAKE_W} / ${SNAKE_H}))`,
        aspectRatio: `${SNAKE_W} / ${SNAKE_H}`,
        borderRadius: "var(--radius-sm)",
        background: "radial-gradient(120% 80% at 50% 0%, #221c30 0%, #100e16 70%)",
        boxShadow: "inset 0 0 0 1px rgba(244,239,232,0.08), inset 0 12px 28px rgba(0,0,0,0.28)",
        ["--glide" as string]: `${Math.max(48, snakeDelay(snake.score) - 18)}ms`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 grid gap-px p-1"
        style={{
          gridTemplateColumns: `repeat(${SNAKE_W}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${SNAKE_H}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: SNAKE_W * SNAKE_H }, (_, i) => (
          <div key={i} className="rounded-[2px]" style={{ background: "rgba(244,239,232,0.04)" }} />
        ))}
      </div>
      <div className="absolute inset-1">
        <span
          aria-hidden
          className="game-food absolute rounded-full"
          style={{
            ...cellBox(snake.food.x, snake.food.y, SNAKE_W, SNAKE_H),
            background: "radial-gradient(circle at 35% 35%, #ffd2c2, #e07a52 70%)",
            boxShadow: "0 0 8px rgba(224,122,82,0.65)",
          }}
        />
        {snake.body.map((part, index) => {
          const head = index === 0;
          return (
            <span
              key={tags[index]}
              aria-hidden
              className="game-move absolute rounded-[4px]"
              style={{
                ...cellBox(part.x, part.y, SNAKE_W, SNAKE_H),
                zIndex: head ? 2 : 1,
                borderRadius: head ? "999px" : "4px",
                background: !snake.alive
                  ? "#6d6458"
                  : head
                    ? "radial-gradient(circle at 35% 30%, #fff6d8, #f0d78a 62%, #b8893e)"
                    : "linear-gradient(160deg, #e7f6ec, #7dba92 55%, #4e8a68)",
                boxShadow: head && snake.alive ? "0 0 10px rgba(240,215,138,0.75)" : "inset 0 1px 0 rgba(255,255,255,0.35)",
                opacity: snake.alive ? 1 : 0.45,
                overflow: "hidden",
              }}
            >
              {head && snake.alive
                ? eyes.map((style, eye) => <span key={eye} style={style} />)
                : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}

const BLOCK_INK = ["#7eb6ff", "#e8d48a", "#c9a6ff", "#8ec8a0", "#e07a52", "#7eb6ff", "#e0946a", "#e07a8c"];

function brickFace(ink: string): CSSProperties {
  return {
    background: `linear-gradient(160deg, color-mix(in oklab, ${ink} 35%, white), ${ink} 58%, color-mix(in oklab, ${ink} 55%, black))`,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), 0 1px 0 rgba(0,0,0,0.25)",
  };
}

function BlockBoard({ state }: { state: Blocks }) {
  const bag = useRef({ epoch: 1, y: state.y, filled: -1 });
  const filled = state.well.reduce((n, cell) => n + (cell > 0 ? 1 : 0), 0);
  if (bag.current.filled < 0) bag.current.filled = filled;
  else if (state.y < bag.current.y - 1 || filled !== bag.current.filled) {
    bag.current.epoch += 1;
    bag.current.y = state.y;
    bag.current.filled = filled;
  } else bag.current.y = state.y;
  const epoch = bag.current.epoch;
  const [wipe, setWipe] = useState(0);
  const linesSeen = useRef(state.lines);
  if (state.lines !== linesSeen.current) {
    linesSeen.current = state.lines;
    setWipe((n) => n + 1);
  }
  const live = state.over
    ? []
    : blockCells(state).filter(([x, y]) => y >= 0 && y < WELL_H && x >= 0 && x < WELL_W);
  const covered = new Set(live.map(([x, y]) => y * WELL_W + x));
  const ghost = state.over
    ? []
    : ghostCells(state).filter(([x, y]) => {
        if (y < 0 || y >= WELL_H || x < 0 || x >= WELL_W) return false;
        const index = y * WELL_W + x;
        return !covered.has(index) && state.well[index] === 0;
      });
  const ink = BLOCK_INK[state.id + 1] ?? "#f4efe2";
  return (
    <div
      className="relative"
      style={{
        width: `min(100cqw, calc(100cqh * ${WELL_W} / ${WELL_H}))`,
        aspectRatio: `${WELL_W} / ${WELL_H}`,
        borderRadius: "var(--radius-sm)",
        background: "radial-gradient(120% 70% at 50% 0%, #241e33 0%, #100e16 75%)",
        boxShadow: "inset 0 0 0 1px rgba(244,239,232,0.08), inset 0 14px 28px rgba(0,0,0,0.28)",
      }}
    >
      <div
        className="absolute inset-0 grid gap-px p-1"
        style={{
          gridTemplateColumns: `repeat(${WELL_W}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${WELL_H}, minmax(0, 1fr))`,
        }}
      >
        {state.well.map((n, i) => (
          <div
            key={i}
            className="min-h-0 min-w-0 rounded-[2px]"
            style={
              n > 0
                ? brickFace(BLOCK_INK[n] ?? "#f4efe2")
                : { background: "rgba(244,239,232,0.04)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.28)" }
            }
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-1">
        {wipe > 0 ? <span key={wipe} aria-hidden className="game-wipe absolute inset-0 rounded-[2px]" /> : null}
        {ghost.map(([x, y]) => (
          <span
            key={`g${x}-${y}`}
            aria-hidden
            className="absolute rounded-[2px]"
            style={{
              ...cellBox(x, y, WELL_W, WELL_H),
              boxShadow: "inset 0 0 0 1px rgba(244,239,232,0.45)",
            }}
          />
        ))}
        {live.map(([x, y], index) => (
          <span
            key={`${epoch}-${index}`}
            aria-hidden
            className="game-brick absolute rounded-[2px]"
            style={{ ...cellBox(x, y, WELL_W, WELL_H), ...brickFace(ink) }}
          />
        ))}
      </div>
    </div>
  );
}
