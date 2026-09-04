import type { Copy } from "@/lib/universe/i18n";
import { CHEM_DELAY_GYR } from "@/lib/universe/physics";
import type { Evaluation } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  evaluation: Evaluation;
};

export function EpochTimeline({ copy, evaluation }: Props) {
  const end = Math.max(evaluation.stellarLifetimeGyr, 0.01);
  const stars = clamp01(evaluation.timeToStarsGyr / end);
  const lifeStart = clamp01((evaluation.timeToStarsGyr + CHEM_DELAY_GYR) / end);
  const lifeEnd = clamp01((evaluation.timeToStarsGyr + CHEM_DELAY_GYR + evaluation.lifeWindowGyr) / end);
  const hasWindow = evaluation.lifeWindowGyr > 0.05;

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{copy.epochTitle}</h3>
      <div className="relative h-2 rounded-full bg-bg-subtle">
        {hasWindow ? (
          <span
            className="absolute top-0 h-full rounded-full bg-life/70"
            style={{
              left: `${lifeStart * 100}%`,
              width: `${Math.max((lifeEnd - lifeStart) * 100, 1.5)}%`,
            }}
          />
        ) : null}
        <Mark left={stars} label={copy.epochStars} />
      </div>
      <div className="flex justify-between gap-2 font-mono text-[0.6875rem] text-fg-subtle">
        <span>{copy.epochOrigin}</span>
        <span>{copy.epochEnd}</span>
      </div>
    </section>
  );
}

function Mark({ left, label }: { left: number; label: string }) {
  return (
    <span
      className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
      style={{ left: `${left * 100}%` }}
      title={label}
    />
  );
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
