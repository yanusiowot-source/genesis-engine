import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Copy } from "@/lib/universe/i18n";
import {
  ATLAS_N,
  FATE_ORDER,
  MANDATE_COUNT,
  MANDATE_IDS,
  actOf,
  missingFates,
  nextOpen,
  sealedCount,
  type MandateAct,
  type MandateId,
  type MandateProgress,
} from "@/lib/universe/mandate";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  progress: MandateProgress;
  onClose: () => void;
  onAct: (act: MandateAct) => void;
};

export function MandateSheet({ copy, progress, onClose, onAct }: Props) {
  const next = nextOpen(progress);
  const n = sealedCount(progress);
  const missing = missingFates(progress);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
        aria-labelledby="work-title"
        className="overlay-sheet relative z-10 max-h-[min(42rem,90dvh)] w-full max-w-lg overflow-y-auto rounded-t-[var(--radius-xl)] bg-bg-elevated px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-border)] sm:rounded-[var(--radius-xl)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="work-title"
              className="font-display text-2xl tracking-[-0.02em] text-fg"
            >
              {copy.mandate.title}
            </h2>
            <p className="mt-1 font-mono text-[0.6875rem] tabular-nums tracking-[0.14em] text-fg-subtle uppercase">
              {copy.mandate.progress.replace("{n}", String(n)).replace("{m}", String(MANDATE_COUNT))}
            </p>
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
        <p className="mt-2 text-pretty text-sm leading-relaxed text-fg-muted">
          {copy.mandate.hint}
        </p>
        <ol className="mt-5 flex flex-col gap-2">
          {MANDATE_IDS.map((id, i) => {
            const chapter = copy.mandate.chapters[id];
            const sealed = Boolean(progress.sealed[id]);
            const isNext = id === next;
            return (
              <li
                key={id}
                className={cn(
                  "help-card rounded-[var(--radius-lg)] px-4 py-3 shadow-[var(--shadow-border)]",
                  isNext && "nudge-ring",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">
                    {String(i + 1).padStart(2, "0")} · {chapter.title}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-[0.6875rem] tracking-[0.14em] uppercase",
                      sealed ? "text-life" : "text-fg-subtle",
                    )}
                  >
                    {sealed ? copy.mandate.sealed : isNext ? copy.mandate.next : copy.mandate.openLabel}
                  </span>
                </div>
                <p className="mt-1.5 text-pretty text-sm leading-relaxed text-fg">
                  {chapter.body}
                </p>
                {id === "atlas" ? (
                  <div className="mt-3">
                    <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-fg-subtle uppercase">
                      {copy.mandate.atlasHave} {progress.fates.length}/{ATLAS_N}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {FATE_ORDER.map((fate) => {
                        const have = progress.fates.includes(fate);
                        return (
                          <span
                            key={fate}
                            className={cn(
                              "rounded-full px-2 py-0.5 font-mono text-[0.625rem] tracking-wide uppercase",
                              have ? "bg-life/20 text-life" : "bg-bg-subtle text-fg-subtle",
                            )}
                          >
                            {copy.fateLabel[fate]}
                          </span>
                        );
                      })}
                    </div>
                    {missing.length > 0 ? (
                      <p className="mt-2 text-pretty text-xs leading-relaxed text-fg-subtle">
                        {copy.mandate.atlasNeed}: {missing.map((f) => copy.fateLabel[f]).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {!sealed ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      variant={isNext ? "default" : "outline"}
                      className="h-11 w-full sm:w-auto"
                      onClick={() => onAct(actOf(id))}
                    >
                      {ctaLabel(copy, id)}
                    </Button>
                    {id === "atlas" && missing.includes("void") ? (
                      <Button
                        variant="outline"
                        className="h-11 w-full sm:w-auto"
                        onClick={() => onAct("desert")}
                      >
                        {copy.presetDesert}
                      </Button>
                    ) : null}
                    <p className="w-full text-pretty text-xs leading-relaxed text-fg-subtle">
                      {chapter.hint}
                    </p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
        {next === null ? (
          <p className="mt-5 text-pretty text-sm leading-relaxed text-fg-muted">{copy.mandate.done}</p>
        ) : null}
      </div>
    </div>
  );
}

function ctaLabel(copy: Copy, id: MandateId): string {
  switch (actOf(id)) {
    case "birth":
      return copy.birth;
    case "survey":
      return copy.survey;
    case "ours":
      return copy.ours;
    case "silicon":
      return copy.presetSilicon;
    case "eternal":
      return copy.presetEternal;
    case "tide":
      return copy.presetSwarm;
    case "desert":
      return copy.presetDesert;
    case "refine":
      return copy.refine;
    case "chronicle":
      return copy.commission;
    case "star":
      return copy.star;
  }
}
