import { APP_VERSION_SHORT } from "../../studio.ts";

/** Version text in a locale pack is stored as a prefix plus `__V__`. */
export function stamp<T>(value: T): T {
  if (typeof value === "string") return value.replaceAll("__V__", APP_VERSION_SHORT) as T;
  if (Array.isArray(value)) return value.map((item) => stamp(item)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) out[key] = stamp(item);
    return out as T;
  }
  return value;
}
