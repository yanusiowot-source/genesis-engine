import type { Copy } from "@/lib/universe/i18n";
import { siliconFactors } from "@/lib/universe/physics";
import type { Evaluation, UniverseParams } from "@/lib/universe/types";
import { formatPct } from "@/lib/universe/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
  onOpen: () => void;
};

export function SiliconPanel({ copy, params, evaluation, onOpen }: Props) {
  const factors = siliconFactors(params, evaluation);
  const tone =
    evaluation.siliconProb >= 0.45
      ? "text-silicon"
      : evaluation.siliconProb >= 0.18
        ? "text-fg"
        : "text-fg-subtle";

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <h3 className="text-sm font-medium">{copy.siliconTitle}</h3>
        <p className={cn("font-mono text-sm tabular-nums", tone)}>
          {formatPct(evaluation.siliconProb)}
        </p>
      </div>
      <p className="text-pretty text-sm leading-relaxed text-fg-muted">
        {copy.siliconNote[evaluation.siliconNiche]}
      </p>
      <p className="text-pretty text-sm leading-relaxed text-fg">
        <span className="font-mono text-[0.65rem] tracking-[0.08em] text-fg-subtle uppercase">{copy.siliconGuess}. </span>
        {copy.siliconCyborg}
      </p>
      <ul className="flex flex-col gap-2.5">
        {factors.map((f) => (
          <li key={f.id} className="flex flex-col gap-1">
            <div className="flex justify-between gap-3">
              <span className="text-xs text-fg-muted">{copy.siliconFactors[f.id]}</span>
              <span className="font-mono text-xs tabular-nums text-fg">
                {Math.round(f.value * 100)}%
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-bg-subtle">
              <div
                className="h-full rounded-full bg-silicon/80"
                style={{ width: `${Math.round(f.value * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <Button variant="outline" onClick={onOpen}>
        {copy.siliconOpen}
      </Button>
    </section>
  );
}
