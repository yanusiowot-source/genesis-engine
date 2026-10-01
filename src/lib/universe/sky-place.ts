export function gpuOffered(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

/** DOM truth: offered is not live. wait ≠ adapter. */
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
