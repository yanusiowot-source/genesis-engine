import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatGyr, formatPct } from "@/lib/universe/format";
import type { Copy } from "@/lib/universe/i18n";
import { eternalDossier } from "@/lib/universe/physics";
import type { Evaluation, UniverseParams } from "@/lib/universe/types";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
  onClose: () => void;
};

export function EternalDossier({ copy, params, evaluation, onClose }: Props) {
  const dossier = eternalDossier(params, evaluation);
  const tone =
    evaluation.eternalProb >= 0.45
      ? "text-eternal"
      : evaluation.eternalProb >= 0.18
        ? "text-fg"
        : "text-fg-subtle";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stats = [
    { k: copy.eternalLambda, v: dossier.lambda.toFixed(2) },
    { k: copy.eternalRemnants, v: formatPct(dossier.remnantFraction) },
    { k: copy.eternalClock, v: formatGyr(dossier.clockGyr) },
    { k: copy.eternalSubjective, v: copy.subjectiveLabel[dossier.subjective] },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={copy.closePanel}
        className="overlay-scrim absolute inset-0 bg-bg/80"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="eternal-title"
        className="overlay-sheet relative z-10 flex max-h-[min(42rem,90dvh)] w-full max-w-md flex-col rounded-t-[var(--radius-xl)] bg-bg-elevated shadow-[var(--shadow-border)] sm:rounded-[var(--radius-xl)]"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div>
            <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
              {copy.eternal}
            </p>
            <h2
              id="eternal-title"
              className="mt-1 font-display text-2xl tracking-[-0.02em] text-fg"
            >
              {copy.eternalTitle}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            aria-label={copy.closePanel}
            autoFocus
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <p className={cn("font-mono text-3xl tabular-nums", tone)}>
            {formatPct(evaluation.eternalProb)}
          </p>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-fg-muted">
            {copy.eternalNote[evaluation.eternalNiche]}
          </p>
          <p className="mt-3 text-pretty text-xs leading-relaxed text-fg-subtle">
            {copy.eternalCaveat}
          </p>

          <section className="mt-6">
            <h3 className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
              {copy.eternalVsLife}
            </h3>
            <div className="mt-2 flex flex-col gap-2">
              <Meter label={copy.carbon} value={evaluation.lifeProb} barClass="bg-life/80" />
              <Meter
                label={copy.silicon}
                value={evaluation.siliconProb}
                barClass="bg-silicon/80"
              />
              <Meter
                label={copy.eternal}
                value={evaluation.eternalProb}
                barClass="bg-eternal/80"
              />
            </div>
          </section>

          <section className="mt-6">
            <h3 className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
              {copy.eternalWhy}
            </h3>
            <ol className="mt-3 flex flex-col gap-3">
              {copy.eternalFacts.map((fact) => (
                <li
                  key={fact.slice(0, 24)}
                  className="text-pretty text-sm leading-relaxed text-fg-muted"
                >
                  {fact}
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-6">
            <h3 className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
              {copy.eternalThisSky}
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              {stats.map((s) => (
                <div key={s.k} className="min-w-0">
                  <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
                    {s.k}
                  </dt>
                  <dd className="mt-0.5 font-mono text-sm text-fg">{s.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-6">
            <ul className="flex flex-col gap-3">
              {dossier.factors.map((f) => (
                <li key={f.id} className="flex flex-col gap-1">
                  <div className="flex justify-between gap-3">
                    <span className="text-xs text-fg-muted">{copy.eternalFactors[f.id]}</span>
                    <span className="font-mono text-xs tabular-nums text-fg">
                      {Math.round(f.value * 100)}%
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-bg-subtle">
                    <div
                      className="h-full rounded-full bg-eternal/80"
                      style={{ width: `${Math.round(f.value * 100)}%` }}
                    />
                  </div>
                  <p className="text-pretty text-xs leading-relaxed text-fg-subtle">
                    {copy.eternalFactorHint[f.id]}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h3 className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
              {copy.eternalBlockers}
            </h3>
            {dossier.blockers.length === 0 ? (
              <p className="mt-2 text-pretty text-sm leading-relaxed text-fg-muted">
                {copy.eternalNoVeto}
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {dossier.blockers.map((id) => (
                  <li
                    key={id}
                    className="text-pretty text-sm leading-relaxed text-sterile"
                  >
                    {copy.eternalBlocker[id]}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Meter({
  label,
  value,
  barClass,
}: {
  label: string;
  value: number;
  barClass: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between gap-3">
        <span className="text-xs text-fg-muted">{label}</span>
        <span className="font-mono text-xs tabular-nums text-fg">{formatPct(value)}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-bg-subtle">
        <div
          className={cn("h-full rounded-full", barClass)}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}
