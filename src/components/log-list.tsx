import { ChevronRight, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Copy, Locale } from "@/lib/universe/i18n";
import { formatPct, formatRelative } from "@/lib/universe/format";
import { isViable, plateScore, filterByMeta, journalEmptyKind, type PlatePath } from "@/lib/universe/archive";
import { compareToOurs, formatCompareLine, plateTitle } from "@/lib/universe/compare";
import { isOurParams } from "@/lib/universe/physics";
import type { Fate, Morphology, UniverseRecord } from "@/lib/universe/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "viable" | "starred";
type PathCut = "any" | Exclude<PlatePath, "none">;
type FateCut = "any" | Fate;
type MorphCut = "any" | Morphology;

const FATE_CUTS: Fate[] = [
  "habitable",
  "teeming",
  "enduring",
  "sterile",
  "fog",
  "flash",
  "void",
  "crunch",
  "rip",
];

const MORPH_CUTS: Morphology[] = ["spiral", "elliptical", "irregular", "scattered"];

function CutSelect<T extends string>({
  value,
  onChange,
  options,
  name,
}: {
  value: T;
  onChange: (id: T) => void;
  options: { id: T; label: string }[];
  name: string;
}) {
  return (
    <select
      aria-label={name}
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="h-11 w-full min-w-0 rounded-[var(--radius-sm)] bg-bg-subtle px-3 text-xs text-fg"
      style={{ colorScheme: "dark" }}
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.id === "any" ? `${name} · ${o.label}` : o.label}
        </option>
      ))}
    </select>
  );
}

type Props = {
  copy: Copy;
  locale: Locale;
  archive: UniverseRecord[];
  currentId: string;
  workLabel?: string;
  onOpenWork?: () => void;
  onRestore: (record: UniverseRecord) => void;
  onStar: (id: string) => void;
  onRemove: (id: string) => void;
};

export function LogList({
  copy,
  locale,
  archive,
  currentId,
  workLabel,
  onOpenWork,
  onRestore,
  onStar,
  onRemove,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [pathCut, setPathCut] = useState<PathCut>("any");
  const [fateCut, setFateCut] = useState<FateCut>("any");
  const [morphCut, setMorphCut] = useState<MorphCut>("any");

  const query = useMemo(
    () => ({
      viable: filter === "viable" ? true : undefined,
      starred: filter === "starred" ? true : undefined,
      path: pathCut === "any" ? undefined : pathCut,
      fate: fateCut === "any" ? undefined : fateCut,
      morphology: morphCut === "any" ? undefined : morphCut,
    }),
    [filter, pathCut, fateCut, morphCut],
  );

  const items = useMemo(() => filterByMeta(archive, query), [archive, query]);
  const emptyKind = journalEmptyKind(archive.length, items.length, query);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: copy.filterAll },
    { id: "viable", label: copy.filterViable },
    { id: "starred", label: copy.filterStarred },
  ];
  const paths: { id: PathCut; label: string }[] = [
    { id: "any", label: copy.filterAll },
    { id: "carbon", label: copy.carbon },
    { id: "silicon", label: copy.silicon },
    { id: "eternal", label: copy.eternal },
    { id: "swarm", label: copy.swarm },
  ];

  return (
    <section className="flex flex-col gap-3 pb-8">
      {workLabel && onOpenWork ? (
        <button
          type="button"
          onClick={onOpenWork}
          className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-md)] bg-bg-subtle px-3 text-left"
        >
          <span className="min-w-0 truncate font-mono text-[0.6875rem] tracking-[0.08em] text-fg-subtle uppercase">
            {workLabel}
          </span>
          <ChevronRight className="size-4 shrink-0 text-fg-subtle" />
        </button>
      ) : null}

      {archive.length > 0 ? (
        <>
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 rounded-[var(--radius-md)] bg-bg-subtle p-1">
              {filters.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    aria-pressed={active}
                    className={cn(
                      "h-11 min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] px-1 text-xs font-medium",
                      "transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                      active ? "bg-bg-elevated text-fg shadow-[var(--shadow-border)]" : "text-fg-subtle",
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            <span className="w-8 shrink-0 text-right font-mono text-[0.6875rem] tabular-nums text-fg-subtle">
              {items.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <CutSelect
              value={pathCut}
              onChange={setPathCut}
              name={copy.mandate.chapters.corridor.title}
              options={paths}
            />
            <CutSelect
              value={fateCut}
              onChange={setFateCut}
              name={copy.fate}
              options={([{ id: "any" as FateCut, label: copy.filterAll }] as { id: FateCut; label: string }[]).concat(
                FATE_CUTS.map((id) => ({ id, label: copy.fateLabel[id] })),
              )}
            />
            <CutSelect
              value={morphCut}
              onChange={setMorphCut}
              name={copy.obs.modes.galaxy}
              options={([{ id: "any" as MorphCut, label: copy.filterAll }] as { id: MorphCut; label: string }[]).concat(
                MORPH_CUTS.map((id) => ({ id, label: copy.morphology[id] })),
              )}
            />
          </div>
        </>
      ) : null}

      {items.length === 0 ? (
        <p className="py-6 text-sm text-fg-subtle">
          {emptyKind === "empty"
            ? copy.logEmpty
            : emptyKind === "starred"
              ? copy.logEmptyStarred
              : emptyKind === "viable"
                ? copy.logEmptyViable
                : copy.logEmptyCut}
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((r) => {
            const reading = plateScore(r);
            const versus = formatCompareLine(compareToOurs(r.params), copy);
            const ours = isOurParams(r.params);
            const pathTone =
              reading.path === "swarm"
                ? "text-cyan"
                : reading.path === "eternal"
                  ? "text-eternal"
                  : reading.path === "silicon"
                    ? "text-silicon"
                    : isViable(r)
                      ? "text-life"
                      : "text-fg-subtle";
            const pathTag =
              reading.path === "swarm"
                ? copy.swarm
                : reading.path === "eternal"
                  ? copy.eternal
                  : reading.path === "silicon"
                    ? copy.silicon
                    : null;
            return (
            <li key={r.id} className="flex items-stretch gap-0.5">
              <button
                type="button"
                onClick={() => onRestore(r)}
                className={cn(
                  "flex min-h-11 min-w-0 flex-1 items-start justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left",
                  "transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                  r.id === currentId
                    ? "bg-bg-subtle text-fg"
                    : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">
                    {plateTitle(r.params, copy, r.name)}
                    {ours ? (
                      <span className="ml-2 font-mono text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
                        {copy.oursBadge}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[0.6875rem] text-fg-subtle">
                    {r.catalog}
                    <span className="mx-1.5 text-fg-subtle/50">·</span>
                    {copy.fateLabel[r.evaluation.fate]}
                    <span className="mx-1.5 text-fg-subtle/50">·</span>
                    {formatRelative(r.createdAt, locale)}
                  </span>
                  <span className="mt-1 line-clamp-2 text-[0.6875rem] leading-relaxed text-fg-subtle">
                    {versus ?? copy.fateCopy[r.evaluation.fate]}
                  </span>
                </span>
                <span className={cn("shrink-0 font-mono text-xs tabular-nums", pathTone)}>
                  {formatPct(reading.value)}
                  {pathTag ? (
                    <span className="ml-1 text-[0.625rem] tracking-wide uppercase">
                      {pathTag}
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
            );
          })}
        </ul>
      )}
    </section>
  );
}
