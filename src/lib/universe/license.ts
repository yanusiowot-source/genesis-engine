import { COPY_CURRENCY, COPY_PRICE } from "./studio.ts";

export type PayRailId = "usdt" | "btc";

export type LicenseReceipt = {
  sku: "desktop";
  rail: PayRailId;
  amount: string;
  currency: string;
  tx: string;
  plate: string;
  issuedAt: number;
};

export const LICENSE_KEY = "genesis-engine-license";
export const PLATE_MARK = "125";

export function normalizeTx(raw: string, rail?: PayRailId): string {
  let tx = raw.trim().replace(/\s+/g, "");
  if (rail === "usdt" && /^[0-9a-fA-F]{64}$/.test(tx)) tx = `0x${tx}`;
  if (rail === "btc" && /^0x[0-9a-fA-F]{64}$/i.test(tx)) tx = tx.slice(2);
  return tx;
}

export function isPlausibleTx(raw: string, rail: PayRailId): boolean {
  const tx = normalizeTx(raw, rail);
  if (rail === "usdt") return /^0x[0-9a-fA-F]{64}$/.test(tx);
  return /^[0-9a-fA-F]{64}$/.test(tx);
}

export function plateOf(tx: string): string {
  const n = normalizeTx(tx).toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < n.length; i++) {
    h ^= n.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hex = (h >>> 0).toString(16).padStart(8, "0").toUpperCase();
  return `GE-${PLATE_MARK}-${hex.slice(0, 4)}`;
}

export function mintReceipt(tx: string, rail: PayRailId): LicenseReceipt | null {
  if (!isPlausibleTx(tx, rail)) return null;
  const hash = normalizeTx(tx, rail);
  const receipt: LicenseReceipt = {
    sku: "desktop",
    rail,
    amount: COPY_PRICE,
    currency: rail === "usdt" ? COPY_CURRENCY : "BTC",
    tx: hash,
    plate: plateOf(hash),
    issuedAt: Date.now(),
  };
  persistReceipt(receipt);
  return receipt;
}

export function receiptText(receipt: LicenseReceipt): string {
  const when = new Date(receipt.issuedAt).toISOString().slice(0, 10);
  const rail = receipt.rail === "usdt" ? "USDT · BEP20" : "Bitcoin · Segwit";
  return [
    "Genesis Engine",
    "Desktop copy — personal",
    `Plate: ${receipt.plate}`,
    `Rail: ${rail}`,
    `Amount: ${COPY_PRICE} ${COPY_CURRENCY}${receipt.rail === "btc" ? " equivalent" : ""}`,
    `Tx: ${receipt.tx}`,
    `Issued: ${when}`,
    "",
    "This plate is a copy of the settlement on this device.",
    "It is not a lock on the public laboratory.",
    "The author writes back on X with the window. Not a store. Not instant.",
    "Personal use. No redistribution of the source.",
    "© 2026 Ян Ярошевич",
  ].join("\n");
}

export function fillOrder(template: string, plate: string, tx: string): string {
  return template.replaceAll("{plate}", plate).replaceAll("{tx}", tx);
}

export function loadReceipt(): LicenseReceipt | null {
  try {
    const raw = localStorage.getItem(LICENSE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LicenseReceipt;
    if (!parsed || parsed.sku !== "desktop" || !parsed.plate || !parsed.tx) return null;
    if (parsed.rail !== "usdt" && parsed.rail !== "btc") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistReceipt(receipt: LicenseReceipt): void {
  try {
    localStorage.setItem(LICENSE_KEY, JSON.stringify(receipt));
  } catch {
    /* ignore */
  }
}

export function clearReceipt(): void {
  try {
    localStorage.removeItem(LICENSE_KEY);
  } catch {
    /* ignore */
  }
}
