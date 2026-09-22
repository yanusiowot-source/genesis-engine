type NfwApi = {
  nfw_f(x: number): number;
  nfw_kappa(x: number, ks: number): number;
  nfw_mean_kappa(x: number, ks: number): number;
  nfw_einstein_x(ks: number): number;
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

export function bootNfwKernel(bytes: ArrayBuffer | ArrayBufferView): boolean {
  try {
    const inst = new WebAssembly.Instance(new WebAssembly.Module(bytes as BufferSource), {});
    const exp = inst.exports as Record<string, unknown>;
    if (typeof exp.nfw_f !== "function") return false;
    api = {
      nfw_f: exp.nfw_f as NfwApi["nfw_f"],
      nfw_kappa: exp.nfw_kappa as NfwApi["nfw_kappa"],
      nfw_mean_kappa: exp.nfw_mean_kappa as NfwApi["nfw_mean_kappa"],
      nfw_einstein_x: exp.nfw_einstein_x as NfwApi["nfw_einstein_x"],
    };
    stamp(true);
    return true;
  } catch {
    api = null;
    stamp(false);
    return false;
  }
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
