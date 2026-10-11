const RGB_INK = new Map<number, string>();

function inkChannel(channel: number): number {
  if (!Number.isFinite(channel)) return 0;
  return Math.min(255, Math.max(0, Math.round(channel)));
}

/** Cached `rgb()` for a star. Callers set `globalAlpha` themselves. */
export function rgbInk(r: number, g: number, b: number): string {
  const red = inkChannel(r);
  const green = inkChannel(g);
  const blue = inkChannel(b);
  const key = (red << 16) | (green << 8) | blue;
  const hit = RGB_INK.get(key);
  if (hit) return hit;
  const css = `rgb(${red},${green},${blue})`;
  RGB_INK.set(key, css);
  return css;
}

/**
 * Identity of a still epoch backdrop. Alpha is not part of it: the blit applies alpha.
 * A change to any field that paintEpoch reads must change the key.
 */
export function epochBackdropKey(input: {
  epoch: string;
  w: number;
  h: number;
  dpr: number;
  seed: number;
  quantumNoise: number;
  complexity: number;
  structure: number;
  eternalProb: number;
  whale: boolean;
  niche: string;
  ell1: number;
  baryonLoad: number;
}): string {
  return [
    input.epoch,
    input.w,
    input.h,
    input.dpr,
    input.seed,
    input.quantumNoise,
    input.complexity,
    input.structure,
    input.eternalProb,
    input.whale ? 1 : 0,
    input.niche,
    input.ell1,
    input.baryonLoad,
  ].join("|");
}

export function gpuOffered(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

/** `offered` means the browser exposes WebGPU. It does not mean an adapter is live. */
export function skyGpuMark(offered: boolean, live: boolean | null): "0" | "wait" | "live" {
  if (!offered) return "0";
  if (live === true) return "live";
  if (live === false) return "0";
  return "wait";
}

/** Local face-on point before the canvas rotate. Stretch and tide stay outside. */
export function faceOnLocal(x: number, y: number, scale: number): { x: number; y: number } {
  return { x: x * scale, y: y * scale };
}
