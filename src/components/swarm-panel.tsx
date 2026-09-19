import type { Copy } from "@/lib/universe/i18n";
import { swarmFactors } from "@/lib/universe/physics";
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

export function SwarmPanel({ copy, params, evaluation, onOpen }: Props) {
  const factors = swarmFactors(params, evaluation);
  const tone =
    evaluation.swarmProb >= 0.45
      ? "text-cyan"
      : evaluation.swarmProb >= 0.18
        ? "text-fg"
        : "text-fg-subtle";

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <h3 className="text-sm font-medium">{copy.swarmTitle}</h3>
        <p className={cn("font-mono text-sm tabular-nums", tone)}>
          {formatPct(evaluation.swarmProb)}
        </p>
      </div>
      <p className="text-pretty text-sm leading-relaxed text-fg-muted">
        {copy.swarmNote[evaluation.swarmNiche]}
      </p>
      <ul className="flex flex-col gap-2.5">
        {factors.map((f) => (
          <li key={f.id} className="flex flex-col gap-1">
            <div className="flex justify-between gap-3">
              <span className="text-xs text-fg-muted">{copy.swarmFactors[f.id]}</span>
              <span className="font-mono text-xs tabular-nums text-fg">
                {Math.round(f.value * 100)}%
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-bg-subtle">
              <div
                className="h-full rounded-full bg-cyan/80"
                style={{ width: `${Math.round(f.value * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <Button variant="outline" className="min-h-11" onClick={onOpen}>
        {copy.swarmOpen}
      </Button>
    </section>
  );
}
