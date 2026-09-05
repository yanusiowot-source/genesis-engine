import { Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Copy, Locale } from "@/lib/universe/i18n";
import { formatPct, formatRelative } from "@/lib/universe/format";
import { isViable } from "@/lib/universe/archive";
import type { UniverseRecord } from "@/lib/universe/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "viable" | "starred";

type Props = {
  copy: Copy;
  locale: Locale;
  archive: UniverseRecord[];
  currentId: string;
  onRestore: (record: UniverseRecord) => void;
  onStar: (id: string) => void;
  onRemove: (id: string) => void;
};

export function LogList({
  copy,
  locale,
  archive,
  currentId,
  onRestore,
  onStar,
  onRemove,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo(() => {
    if (filter === "viable") return archive.filter(isViable);
    if (filter === "starred") return archive.filter((r) => r.starred);
    return archive;
  }, [archive, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: copy.filterAll },
    { id: "viable", label: copy.filterViable },
    { id: "starred", label: copy.filterStarred },
  ];

  return (
    <section className="flex flex-col gap-3 pb-8">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">{copy.log}</h3>
        <span className="font-mono text-[0.6875rem] tabular-nums text-fg-subtle">
          {items.length}
        </span>
      </div>

      <div className="flex rounded-[var(--radius-md)] bg-bg-subtle p-1">
        {filters.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className={cn(
                "h-11 min-h-11 flex-1 rounded-[var(--radius-sm)] text-xs font-medium",
                "transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                active ? "bg-bg-elevated text-fg shadow-[var(--shadow-border)]" : "text-fg-subtle",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-sm text-fg-subtle">
          {archive.length === 0
            ? copy.logEmpty
            : filter === "starred"
              ? copy.filterStarred
              : copy.filterViable}
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((r) => (
            <li key={r.id} className="flex items-stretch gap-0.5">
              <button
                type="button"
                onClick={() => onRestore(r)}
                className={cn(
                  "flex min-w-0 flex-1 items-baseline justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left",
                  "transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                  r.id === currentId
                    ? "bg-bg-subtle text-fg"
                    : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{r.name}</span>
                  <span className="mt-0.5 block truncate font-mono text-[0.6875rem] text-fg-subtle">
                    {r.catalog}
                    <span className="mx-1.5 text-fg-subtle/50">·</span>
                    {copy.fateLabel[r.evaluation.fate]}
                    <span className="mx-1.5 text-fg-subtle/50">·</span>
                    {formatRelative(r.createdAt, locale)}
                  </span>
                  <span className="mt-1 block truncate text-[0.6875rem] leading-relaxed text-fg-subtle">
                    {copy.fateCopy[r.evaluation.fate]}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-xs tabular-nums",
                    isViable(r) ? "text-life" : "text-fg-subtle",
                    r.evaluation.eternalProb > r.evaluation.lifeProb &&
                      r.evaluation.eternalProb > r.evaluation.siliconProb &&
                      "text-eternal",
                    r.evaluation.siliconProb > r.evaluation.lifeProb &&
                      r.evaluation.siliconProb >= r.evaluation.eternalProb &&
                      "text-silicon",
                  )}
                >
                  {formatPct(
                    Math.max(
                      r.evaluation.lifeProb,
                      r.evaluation.siliconProb ?? 0,
                      r.evaluation.eternalProb ?? 0,
                    ),
                  )}
                  {r.evaluation.eternalProb >
                  Math.max(r.evaluation.lifeProb, r.evaluation.siliconProb) + 0.02 ? (
                    <span className="ml-1 text-[0.625rem] tracking-wide uppercase">
                      {copy.eternal}
                    </span>
                  ) : r.evaluation.siliconProb > r.evaluation.lifeProb + 0.02 ? (
                    <span className="ml-1 text-[0.625rem] tracking-wide uppercase">
                      {copy.silicon}
                    </span>
                  ) : null}
                </span>
              </button>
              <button
                type="button"
                aria-label={r.starred ? copy.unstar : copy.star}
                onClick={() => onStar(r.id)}
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
                  r.starred ? "text-fg" : "text-fg-subtle hover:text-fg",
                )}
              >
                <Star className="size-4" fill={r.starred ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                aria-label={copy.remove}
                onClick={() => onRemove(r.id)}
                className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-fg-subtle hover:text-sterile"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
