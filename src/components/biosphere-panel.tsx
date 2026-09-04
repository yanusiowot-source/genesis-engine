import { useMemo, useState } from "react";
import { formatCount, formatGtC, formatGyr, formatSci } from "@/lib/universe/format";
import {
  biosphereOf,
  sortTaxa,
  type TaxonSort,
} from "@/lib/universe/biosphere";
import type { Copy } from "@/lib/universe/i18n";
import type { Evaluation, UniverseParams } from "@/lib/universe/types";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
};

export function BiospherePanel({ copy, params, evaluation }: Props) {
  const [sort, setSort] = useState<TaxonSort>("biomass");
  const model = useMemo(() => biosphereOf(params, evaluation), [params, evaluation]);
  const taxa = useMemo(() => sortTaxa(model.taxa, sort), [model.taxa, sort]);
  const maxBio = taxa[0]?.biomassGtC || 1;
  const maxSp = Math.max(1, ...taxa.map((t) => t.species));

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium">{copy.bio.title}</h3>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">
          {copy.bio.hint}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
            {copy.bio.world}
          </dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">
            {formatGtC(model.worldGtC)}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
            {copy.bio.galaxy}
          </dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">
            {model.galaxyGtC > 0 ? `${formatSci(model.galaxyGtC)} Gt C` : "0 Gt C"}
          </dd>
        </div>
      </dl>
      <p className="text-pretty text-[0.6875rem] leading-relaxed text-fg-subtle">
        {copy.bio.galaxyHint}
      </p>

      <div>
        <h4 className="text-sm font-medium">{copy.bio.development}</h4>
        <ol className="mt-2 flex flex-col gap-2">
          {model.grades.map((g) => (
            <li key={g.id} className="flex items-baseline justify-between gap-3">
              <span className={cn("text-xs", g.open ? "text-fg" : "text-fg-subtle")}>
                {copy.bio.grades[g.id]}
              </span>
              <span className="font-mono text-[0.6875rem] tabular-nums text-fg-muted">
                {g.open
                  ? `${formatGyr(g.tOpenGyr)} · ${g.species >= 2 ? formatCount(g.species) : copy.bio.open}`
                  : copy.bio.closed}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {model.note === "empty" ? (
        <p className="text-pretty text-xs leading-relaxed text-sterile">{copy.bio.empty}</p>
      ) : model.note === "eternal" ? (
        <p className="text-pretty text-xs leading-relaxed text-eternal">{copy.bio.eternalNote}</p>
      ) : model.note === "silicon" ? (
        <p className="text-pretty text-xs leading-relaxed text-silicon">{copy.bio.siliconNote}</p>
      ) : (
        <p className="text-pretty text-xs leading-relaxed text-fg-subtle">{copy.bio.earthNote}</p>
      )}

      {taxa.length > 0 ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-medium">{copy.bio.taxaTitle}</h4>
            <div className="flex gap-1" role="group" aria-label={copy.bio.taxaTitle}>
              <button
                type="button"
                onClick={() => setSort("biomass")}
                className={cn(
                  "h-8 rounded-[var(--radius-xs)] px-2 text-[0.6875rem] font-medium",
                  sort === "biomass" ? "bg-bg-subtle text-fg" : "text-fg-subtle hover:text-fg",
                )}
                aria-pressed={sort === "biomass"}
              >
                {copy.bio.sortBiomass}
              </button>
              <button
                type="button"
                onClick={() => setSort("species")}
                className={cn(
                  "h-8 rounded-[var(--radius-xs)] px-2 text-[0.6875rem] font-medium",
                  sort === "species" ? "bg-bg-subtle text-fg" : "text-fg-subtle hover:text-fg",
                )}
                aria-pressed={sort === "species"}
              >
                {copy.bio.sortSpecies}
              </button>
            </div>
          </div>
          <ul className="mt-2 flex flex-col gap-2.5">
            {taxa.map((row) => {
              const width =
                sort === "species"
                  ? Math.round((row.species / maxSp) * 100)
                  : Math.round((row.biomassGtC / maxBio) * 100);
              return (
                <li key={row.id} className="flex flex-col gap-1">
                  <div className="flex justify-between gap-3">
                    <span className={cn("text-xs", row.open ? "text-fg-muted" : "text-fg-subtle")}>
                      {copy.bio.taxa[row.id]}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-fg">
                      {formatGtC(row.biomassGtC)}
                      <span className="ml-2 text-fg-subtle">
                        {row.open ? formatCount(row.species) : copy.bio.closed}
                      </span>
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-bg-subtle">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        model.path === "silicon"
                          ? "bg-silicon/80"
                          : row.open
                            ? "bg-life/80"
                            : "bg-fg-subtle/40",
                      )}
                      style={{ width: `${Math.max(row.open ? 2 : 0, width)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
