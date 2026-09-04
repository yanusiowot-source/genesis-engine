export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

function isPlain(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function mergeCopy<T>(base: T, overlay: DeepPartial<T> | undefined): T {
  if (overlay === undefined) return base;
  if (!isPlain(base) || !isPlain(overlay)) return overlay as T;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    if (value === undefined) continue;
    const prev = (base as Record<string, unknown>)[key];
    out[key] = isPlain(prev) && isPlain(value) ? mergeCopy(prev, value) : value;
  }
  return out as T;
}
