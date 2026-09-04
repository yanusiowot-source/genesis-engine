import type { LangRow } from "./languages-core.ts";
import { AUTONYMS } from "./languages-core.ts";

let catalog: LangRow[] | null = null;
const byId = new Map<string, LangRow>();
const byIso = new Map<string, LangRow>();
let loading: Promise<LangRow[]> | null = null;

function index(rows: LangRow[]): void {
  byId.clear();
  byIso.clear();
  for (const row of rows) {
    byId.set(row.id, row);
    byIso.set(row.iso, row);
  }
}

export async function loadCatalog(): Promise<LangRow[]> {
  if (catalog) return catalog;
  if (!loading) {
    loading = import("./languages.json", { with: { type: "json" } })
      .catch(() => import("./languages.json"))
      .then((mod) => {
        const rows = ((mod as { default?: LangRow[] }).default ?? []) as LangRow[];
        catalog = rows;
        index(rows);
        return rows;
      })
      .catch((err) => {
        loading = null;
        throw err;
      });
  }
  return loading;
}

export function catalogReady(): boolean {
  return catalog !== null;
}

export function allLanguages(): readonly LangRow[] {
  return catalog ?? [];
}

export function languageById(id: string): LangRow | undefined {
  return byId.get(id) ?? byIso.get(id);
}

export function searchLanguages(query: string, limit = 40): LangRow[] {
  if (!catalog) return [];
  const q = query.trim().toLowerCase().normalize("NFKD");
  if (!q) return [];
  const out: LangRow[] = [];
  for (const row of catalog) {
    const auto = AUTONYMS[row.id];
    if (
      row.id === q ||
      row.iso === q ||
      row.name.toLowerCase().includes(q) ||
      (auto && auto.toLowerCase().includes(q))
    ) {
      out.push(row);
      if (out.length >= limit) break;
    }
  }
  return out;
}
