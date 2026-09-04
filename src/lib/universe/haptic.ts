const KEY = "genesis-engine-haptics";

let enabled = true;

export function hapticEnabled(): boolean {
  return enabled;
}

export function loadHapticPref(): boolean {
  try {
    enabled = localStorage.getItem(KEY) !== "0";
  } catch {
    enabled = true;
  }
  return enabled;
}

export function setHapticEnabled(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function haptic(ms = 12): void {
  if (!enabled) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* unsupported */
  }
}
