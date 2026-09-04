import type { Copy } from "@/lib/universe/i18n";
import { lifeFactors } from "@/lib/universe/physics";
import type { Evaluation } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  evaluation: Evaluation;
};

export function LifeFactors({ copy, evaluation }: Props) {
  const factors = lifeFactors(evaluation);
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{copy.factorsTitle}</h3>
      <ul className="flex flex-col gap-2.5">
        {factors.map((f) => (
          <li key={f.id} className="flex flex-col gap-1">
            <div className="flex justify-between gap-3">
              <span className="text-xs text-fg-muted">{copy.factors[f.id]}</span>
              <span className="font-mono text-xs tabular-nums text-fg">
                {Math.round(f.value * 100)}%
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-bg-subtle">
              <div
                className="h-full rounded-full bg-accent/80"
                style={{ width: `${Math.round(f.value * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
