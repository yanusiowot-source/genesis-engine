import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPct } from "@/lib/universe/format";
import type { Copy } from "@/lib/universe/i18n";
import { swarmDossier } from "@/lib/universe/physics";
import type { Evaluation, UniverseParams } from "@/lib/universe/types";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
  onClose: () => void;
};

export function SwarmDossier({ copy, params, evaluation, onClose }: Props) {
  const dossier = swarmDossier(params, evaluation);
  const tone =
    evaluation.swarmProb >= 0.45
      ? "text-cyan"
      : evaluation.swarmProb >= 0.18
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
    { k: copy.swarmHops, v: String(dossier.hops) },
    { k: copy.swarmCrossing, v: `${dossier.crossingMyr} Myr` },
    { k: copy.swarmMetal, v: formatPct(dossier.metalIndex) },
    { k: copy.swarmHost, v: formatPct(dossier.host) },
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
        aria-labelledby="swarm-title"
        className="overlay-sheet relative z-10 flex max-h-[min(42rem,90dvh)] w-full max-w-md flex-col rounded-t-[var(--radius-xl)] bg-bg-elevated shadow-[var(--shadow-border)] sm:rounded-[var(--radius-xl)]"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div>
            <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
              {copy.swarm}
            </p>
            <h2
              id="swarm-title"
              className="mt-1 font-display text-2xl tracking-[-0.02em] text-fg"
            >
              {copy.swarmTitle}
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
            {formatPct(evaluation.swarmProb)}
          </p>
          <p className="mt-1 text-sm text-fg-muted">{copy.swarmNote[evaluation.swarmNiche]}</p>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-muted">{copy.swarmHint}</p>

          <ul className="mt-4 grid grid-cols-2 gap-2">
            {stats.map((row) => (
              <li
                key={row.k}
                className="rounded-[var(--radius-md)] bg-bg-subtle px-3 py-2 shadow-[var(--shadow-border)]"
              >
                <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-fg-subtle uppercase">
                  {row.k}
                </p>
                <p className="mt-1 font-mono text-sm tabular-nums text-fg">{row.v}</p>
              </li>
            ))}
          </ul>

          <ul className="mt-4 flex flex-col gap-2.5">
            {dossier.factors.map((f) => (
              <li key={f.id} className="flex flex-col gap-1">
                <div className="flex justify-between gap-3">
                  <span className="text-xs text-fg-muted">{copy.swarmFactors[f.id]}</span>
                  <span className="font-mono text-xs tabular-nums text-fg">{formatPct(f.value)}</span>
                </div>
                <span className="h-1 overflow-hidden rounded-full bg-bg-subtle">
                  <span
                    className="block h-full rounded-full bg-cyan/70"
                    style={{ width: `${Math.round(f.value * 100)}%` }}
                  />
                </span>
                <p className="text-[0.6875rem] leading-relaxed text-fg-subtle">
                  {copy.swarmFactorHint[f.id]}
                </p>
              </li>
            ))}
          </ul>

          <h3 className="mt-5 text-sm font-medium">{copy.swarmWhy}</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {copy.swarmFacts.map((fact) => (
              <li key={fact} className="text-pretty text-sm leading-relaxed text-fg-muted">
                {fact}
              </li>
            ))}
          </ul>

          <h3 className="mt-5 text-sm font-medium">{copy.swarmBlockers}</h3>
          {dossier.blockers.length ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {dossier.blockers.map((id) => (
                <li key={id} className="text-pretty text-sm leading-relaxed text-fg">
                  {copy.swarmBlocker[id]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-pretty text-sm leading-relaxed text-fg-muted">{copy.swarmNoVeto}</p>
          )}
          <p className="mt-4 text-pretty text-sm leading-relaxed text-fg-subtle">{copy.swarmCaveat}</p>
        </div>
      </div>
    </div>
  );
}
