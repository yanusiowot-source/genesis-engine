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

export function bootNfwKernel(bytes: BufferSource): boolean {
  try {
    const inst = new WebAssembly.Instance(new WebAssembly.Module(bytes), {});
    const exp = inst.exports as Record<string, unknown>;
    if (typeof exp.nfw_f !== "function") return false;
    api = {
      nfw_f: exp.nfw_f as NfwApi["nfw_f"],
      nfw_kappa: exp.nfw_kappa as NfwApi["nfw_kappa"],
      nfw_mean_kappa: exp.nfw_mean_kappa as NfwApi["nfw_mean_kappa"],
      nfw_einstein_x: exp.nfw_einstein_x as NfwApi["nfw_einstein_x"],
    };
    return true;
  } catch {
    api = null;
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
  if (api) return true;
  const href = wasmHref();
  if (!href || typeof fetch === "undefined") return false;
  try {
    const res = await fetch(href);
    if (!res.ok) return false;
    return bootNfwKernel(await res.arrayBuffer());
  } catch {
    return false;
  }
}
