/** Browser stand-in for TanStack Start server functions in the static lab. */
type Run<T> = (ctx: { data: T }) => Promise<unknown> | unknown;

export function createServerFn(_opts?: { method?: string }) {
  return {
    validator<T>(parse: (input: unknown) => T) {
      return {
        handler(run: Run<T>) {
          return async (args?: { data?: unknown }) =>
            run({ data: parse(args?.data) });
        },
      };
    },
    handler(run: Run<unknown>) {
      return async (args?: { data?: unknown }) => run({ data: args?.data });
    },
  };
}

export function createMiddleware() {
  return {
    server: () => ({
      handler: (fn: unknown) => fn,
    }),
  };
}

export function getRequest(): never {
  throw new Error("No server request in the public lab.");
}

export function getCookie(): undefined {
  return undefined;
}

export function setCookie(): void {}
