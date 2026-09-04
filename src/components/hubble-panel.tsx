import type { Copy } from "@/lib/universe/i18n";
import { formatPct } from "@/lib/universe/format";
import { environmentClass } from "@/lib/universe/physics";
import type { Evaluation, Morphology } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  evaluation: Evaluation;
};

const MIX_KEYS = ["spiral", "elliptical", "irregular"] as const;

export function HubblePanel({ copy, evaluation }: Props) {
  const env = evaluation.environmentDensity;
  const klass = environmentClass(env);
  const mix = evaluation.hubbleMix;
  const morph: Morphology = evaluation.morphology;

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{copy.obs.hubbleTitle}</h3>
      <p className="text-pretty text-xs leading-relaxed text-fg-muted">{copy.obs.hubbleHint}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
            {copy.obs.thisType}
          </dt>
          <dd className="mt-0.5 font-mono text-sm text-fg">{copy.morphology[morph]}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
            {copy.obs.env}
          </dt>
          <dd className="mt-0.5 font-mono text-sm text-fg">
            {copy.obs.envLabel[klass]}
            <span className="ml-2 text-fg-subtle">{formatPct(env)}</span>
          </dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.dm}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">
            {formatPct(evaluation.darkMatterFraction)}
          </dd>
        </div>
      </dl>
      <p className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.hubbleField}</p>
      <ul className="flex flex-col gap-2.5">
        {MIX_KEYS.map((key) => (
          <li key={key} className="flex flex-col gap-1">
            <div className="flex justify-between gap-3">
              <span className="text-xs text-fg-muted">{copy.morphology[key]}</span>
              <span className="font-mono text-xs tabular-nums text-fg">
                {Math.round(mix[key] * 100)}%
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-bg-subtle">
              <div
                className="h-full rounded-full bg-accent/80"
                style={{ width: `${Math.round(mix[key] * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
