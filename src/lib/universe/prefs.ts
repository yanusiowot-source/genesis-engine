export type TypeScale = "sm" | "md" | "lg";

const CONTRAST_KEY = "genesis-engine-contrast";
const TYPE_KEY = "genesis-engine-type";

export function loadContrast(): boolean {
  try {
    return localStorage.getItem(CONTRAST_KEY) === "1";
  } catch {
    return false;
  }
}

export function persistContrast(on: boolean): void {
  try {
    localStorage.setItem(CONTRAST_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function loadTypeScale(): TypeScale {
  try {
    const v = localStorage.getItem(TYPE_KEY);
    if (v === "sm" || v === "md" || v === "lg") return v;
  } catch {
    /* ignore */
  }
  return "md";
}

export function persistTypeScale(scale: TypeScale): void {
  try {
    localStorage.setItem(TYPE_KEY, scale);
  } catch {
    /* ignore */
  }
}

export function applyPrefs(contrast: boolean, scale: TypeScale): void {
  const root = document.documentElement;
  root.classList.toggle("contrast", contrast);
  root.dataset.type = scale;
}
