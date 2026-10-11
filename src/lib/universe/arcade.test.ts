import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  actBlocks,
  blockDelay,
  ghostY,
  moveTiles,
  snakeDelay,
  SNAKE_W,
  startBlocks,
  startRun,
  startSnake,
  stepRun,
  stepSnake,
  runDelay,
  RUN_X,
  WELL_W,
} from "./arcade.ts";

describe("arcade", () => {
  it("joins a pair once and leaves the rest", () => {
    const cells = Array(16).fill(0);
    cells[0] = 2;
    cells[1] = 2;
    cells[2] = 2;
    const moved = moveTiles({ cells, score: 0, over: false, won: false }, "left", { index: 15, value: 2 });
    assert.equal(moved.cells[0], 4);
    assert.equal(moved.cells[1], 2);
    assert.equal(moved.cells[2], 0);
    assert.equal(moved.score, 4);
    assert.equal(moved.cells[15], 2);
  });

  it("does not spawn when the slide does nothing", () => {
    const cells = Array(16).fill(0);
    cells[0] = 2;
    const state = { cells, score: 0, over: false, won: false };
    const moved = moveTiles(state, "left", { index: 3, value: 4 });
    assert.equal(moved, state);
  });

  it("marks 2048 without ending the board", () => {
    const cells = Array(16).fill(0);
    cells[0] = 1024;
    cells[1] = 1024;
    const moved = moveTiles({ cells, score: 0, over: false, won: false }, "left", { index: 15, value: 2 });
    assert.equal(moved.cells[0], 2048);
    assert.equal(moved.won, true);
    assert.equal(moved.over, false);
  });

  it("grows the snake and dies on the wall", () => {
    const snake = startSnake({ x: 5, y: 8 });
    const ate = stepSnake(snake, null, { x: 1, y: 1 });
    assert.equal(ate.score, 1);
    assert.equal(ate.body.length, 4);
    assert.equal(ate.food.x, 1);
    let wall = startSnake({ x: 0, y: 0 });
    wall = { ...wall, body: [{ x: SNAKE_W - 1, y: 1 }, { x: SNAKE_W - 2, y: 1 }], dir: "right" };
    const dead = stepSnake(wall, null, { x: 0, y: 0 });
    assert.equal(dead.alive, false);
  });

  it("refuses to reverse the snake into itself", () => {
    const snake = startSnake({ x: 8, y: 8 });
    const stepped = stepSnake(snake, "left", { x: 0, y: 0 });
    assert.equal(stepped.dir, "right");
    assert.equal(stepped.alive, true);
  });

  it("clears a full line of blocks and scores 100", () => {
    const well = Array(20 * WELL_W).fill(0);
    for (let x = 0; x < WELL_W; x++) {
      if (x !== 1 && x !== 2) well[19 * WELL_W + x] = 1;
    }
    const state = { ...startBlocks(1, 2), well, x: 0, y: 18, id: 1, rot: 0 };
    const locked = actBlocks(state, "tick", 3);
    assert.equal(locked.score, 100);
    assert.equal(locked.lines, 1);
    assert.equal(locked.well[19 * WELL_W + 1], 2);
    assert.equal(locked.well[18 * WELL_W + 1], 0);
    assert.equal(locked.id, 2);
    assert.equal(locked.next, 3);
  });

  it("parks the ghost on the floor, not inside the piece", () => {
    const state = startBlocks(1, 0);
    assert.ok(ghostY(state) > state.y);
    assert.equal(ghostY(state), 18);
  });

  it("speeds the snake and the blocks, and does not stop them", () => {
    assert.equal(snakeDelay(0), 170);
    assert.ok(snakeDelay(40) < snakeDelay(0));
    assert.equal(snakeDelay(999), 70);
    assert.equal(blockDelay(0), 700);
    assert.ok(blockDelay(8) < blockDelay(0));
    assert.equal(blockDelay(99), 160);
  });

  it("jumps a ridge and dies if the spark stays down", () => {
    let clear = startRun();
    clear = stepRun(clear, false, 1);
    for (let i = 0; i < 9; i++) clear = stepRun(clear, false, 0);
    clear = stepRun(clear, true, 0);
    clear = stepRun(clear, false, 0);
    clear = stepRun(clear, false, 0);
    clear = stepRun(clear, false, 0);
    assert.equal(clear.ground[RUN_X], 1);
    assert.equal(clear.alive, true);
    assert.ok(clear.y >= 1);

    let hit = startRun();
    hit = stepRun(hit, false, 1);
    for (let i = 0; i < 13; i++) hit = stepRun(hit, false, 0);
    assert.equal(hit.alive, false);
    assert.equal(stepRun(hit, true, 1), hit);
  });

  it("does not jump again while the spark is in the air", () => {
    const up = stepRun(startRun(), true, 0);
    const still = stepRun(up, true, 0);
    assert.equal(up.y, 2);
    assert.equal(still.y, 3);
    assert.equal(runDelay(0), 220);
    assert.ok(runDelay(40) < runDelay(0));
    assert.equal(runDelay(999), 80);
  });

  it("scores a mote on the ground and does not score it in the air", () => {
    let down = startRun();
    down = stepRun(down, false, 3);
    for (let i = 0; i < 13; i++) down = stepRun(down, false, 0);
    assert.equal(down.ground[RUN_X], -1);
    assert.equal(down.y, 0);
    assert.equal(down.alive, true);
    assert.equal(down.score, 16);

    let air = startRun();
    air = stepRun(air, false, 3);
    for (let i = 0; i < 9; i++) air = stepRun(air, false, 0);
    air = stepRun(air, true, 0);
    air = stepRun(air, false, 0);
    air = stepRun(air, false, 0);
    air = stepRun(air, false, 0);
    assert.equal(air.ground[RUN_X], -1);
    assert.ok(air.y >= 1);
    assert.equal(air.alive, true);
    assert.equal(air.score, 14);
  });
});
