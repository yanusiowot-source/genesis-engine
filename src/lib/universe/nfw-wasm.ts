type NfwApi = {
  nfw_f(x: number): number;
  nfw_kappa(x: number, ks: number): number;
  nfw_mean_kappa(x: number, ks: number): number;
  nfw_einstein_x(ks: number): number;
  nfw_fill_grid(n: number, x0: number, x1: number, ks: number): number;
  nfw_kappa_ptr(): number;
  nfw_mean_ptr(): number;
  memory: WebAssembly.Memory;
};

let api: NfwApi | null = null;

export function nfwKernel(): NfwApi | null {
  return api;
}

export function nfwWasmMark(live: boolean | null): "0" | "wait" | "live" {
  if (live === true) return "live";
  if (live === false) return "0";
  return "wait";
}

/** SIMD opcodes in the kernel. Offered is not live. */
export function wasmSimdOffered(): boolean {
  return typeof WebAssembly !== "undefined" && typeof WebAssembly.validate === "function";
}

function stamp(live: boolean | null) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.nfw = nfwWasmMark(live);
}

function bytesFromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bind(exp: Record<string, unknown>, memory: WebAssembly.Memory): NfwApi | null {
  if (typeof exp.nfw_f !== "function") return null;
  if (typeof exp.nfw_fill_grid !== "function") return null;
  if (typeof exp.nfw_kappa_ptr !== "function") return null;
  if (typeof exp.nfw_mean_ptr !== "function") return null;
  return {
    nfw_f: exp.nfw_f as NfwApi["nfw_f"],
    nfw_kappa: exp.nfw_kappa as NfwApi["nfw_kappa"],
    nfw_mean_kappa: exp.nfw_mean_kappa as NfwApi["nfw_mean_kappa"],
    nfw_einstein_x: exp.nfw_einstein_x as NfwApi["nfw_einstein_x"],
    nfw_fill_grid: exp.nfw_fill_grid as NfwApi["nfw_fill_grid"],
    nfw_kappa_ptr: exp.nfw_kappa_ptr as NfwApi["nfw_kappa_ptr"],
    nfw_mean_ptr: exp.nfw_mean_ptr as NfwApi["nfw_mean_ptr"],
    memory,
  };
}

export function bootNfwKernel(bytes: ArrayBuffer | ArrayBufferView): boolean {
  try {
    const inst = new WebAssembly.Instance(new WebAssembly.Module(bytes as BufferSource), {});
    const exp = inst.exports as Record<string, unknown>;
    const memory = exp.memory as WebAssembly.Memory | undefined;
    if (!memory) {
      api = null;
      stamp(false);
      return false;
    }
    const next = bind(exp, memory);
    if (!next) {
      api = null;
      stamp(false);
      return false;
    }
    api = next;
    stamp(true);
    return true;
  } catch {
    api = null;
    stamp(false);
    return false;
  }
}

export function nfwFillGrid(
  n: number,
  x0: number,
  x1: number,
  ks: number,
): { kappa: Float64Array; mean: Float64Array } | null {
  const k = api;
  if (!k || n < 1) return null;
  const count = k.nfw_fill_grid(n, x0, x1, ks) | 0;
  if (count < 1) return null;
  const kappa = new Float64Array(k.memory.buffer, k.nfw_kappa_ptr(), count);
  const mean = new Float64Array(k.memory.buffer, k.nfw_mean_ptr(), count);
  return { kappa: kappa.slice(), mean: mean.slice() };
}

export async function bootNfwEmbedded(): Promise<boolean> {
  if (api) return true;
  stamp(null);
  try {
    const { NFW_WASM_B64 } = await import("./nfw-bytes.ts");
    return bootNfwKernel(bytesFromB64(NFW_WASM_B64));
  } catch {
    stamp(false);
    return false;
  }
}

function wasmHref(): string | null {
  const loc = (globalThis as { location?: { href: string; pathname: string } }).location;
  if (!loc?.href) return null;
  if (loc.pathname.includes("/assets/")) {
    return loc.href.replace(/\/assets\/[^/?#]+/, "/nfw.wasm");
  }
  return new URL("nfw.wasm", loc.href).href;
}

export async function bootNfwWasm(): Promise<boolean> {
  if (await bootNfwEmbedded()) return true;
  const href = wasmHref();
  if (!href || typeof fetch === "undefined") return false;
  stamp(null);
  try {
    const res = await fetch(href);
    if (!res.ok) {
      stamp(false);
      return false;
    }
    return bootNfwKernel(await res.arrayBuffer());
  } catch {
    stamp(false);
    return false;
  }
}
