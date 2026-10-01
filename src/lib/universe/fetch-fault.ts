export type FetchFault = "timeout" | "network";

/** `TimeoutError` is `AbortSignal.timeout`. Older fetch reports that abort as `AbortError`. */
export function fetchFault(error: unknown): FetchFault {
  const name = error instanceof Error ? error.name : "";
  if (name === "TimeoutError" || name === "AbortError") return "timeout";
  return "network";
}
