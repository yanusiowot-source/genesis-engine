import { ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPct } from "@/lib/universe/format";
import type { Copy } from "@/lib/universe/i18n";
import type { ExpeditionResult, ResearchTarget, SampleRow } from "@/lib/universe/research";
import { RESEARCH_TARGETS } from "@/lib/universe/research";
import type { ParamKey, UniverseParams } from "@/lib/universe/types";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  target: ResearchTarget;
  result: ExpeditionResult | null;
  hunting?: boolean;
  onTarget: (target: ResearchTarget) => void;
  onRun: () => void;
  onApply: (params: UniverseParams, visualSeed: number) => void;
};

const TARGETS: ResearchTarget[] = RESEARCH_TARGETS;

export function ResearchPanel({
  copy,
  target,
  result,
  hunting = false,
  onTarget,
  onRun,
  onApply,
}: Props) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium">{copy.research.title}</h3>
      </div>

      <div
        className="grid grid-cols-2 gap-1 rounded-[var(--radius-sm)] bg-bg p-1 sm:grid-cols-3"
        role="radiogroup"
        aria-label={copy.research.title}
      >
        {TARGETS.map((id) => {
          const active = target === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              title={copy.research.targetHint[id]}
              onClick={() => onTarget(id)}
              className={cn(
                "h-11 rounded-[var(--radius-xs)] text-[0.6875rem] font-medium tracking-wide uppercase",
                "transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                active ? "bg-bg-subtle text-accent" : "text-fg-subtle hover:text-fg",
              )}
            >
              {copy.research.target[id]}
            </button>
          );
        })}
      </div>
      <p className="text-pretty text-xs leading-relaxed text-fg-subtle">
        {copy.research.targetHint[target]}
      </p>

      <Button onClick={onRun} disabled={hunting} data-hunting={hunting ? "1" : undefined}>
        <ScanSearch />
        {hunting ? copy.writing : copy.research.run}
      </Button>

      {hunting && !result ? (
        <p className="text-pretty text-sm leading-relaxed text-fg-subtle">{copy.writing}</p>
      ) : !result ? (
        <p className="text-pretty text-sm leading-relaxed text-fg-subtle">
          {copy.research.empty}
        </p>
      ) : (
        <ResultBlock copy={copy} result={result} onApply={onApply} />
      )}
    </section>
  );
}

function ResultBlock({
  copy,
  result,
  onApply,
}: {
  copy: Copy;
  result: ExpeditionResult;
  onApply: (params: UniverseParams, visualSeed: number) => void;
}) {
  const maxFate = Math.max(...result.fateHist.map((b) => b.n), 1);
  const stats = [
    { k: copy.research.sample, v: String(result.sampleN) },
    { k: copy.research.viableC, v: String(result.viableCarbon) },
    { k: copy.research.viableSi, v: String(result.viableSilicon) },
    { k: copy.research.viableEt, v: String(result.viableEternal) },
    { k: copy.research.corr, v: result.corr.toFixed(2) },
    {
      k: copy.research.percentile,
      v: formatPct(result.thisPercentile),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {stats.map((s) => (
          <div key={s.k} className="min-w-0">
            <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{s.k}</dt>
            <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{s.v}</dd>
          </div>
        ))}
      </dl>

      <div className="h-px bg-border" />

      <Bars
        title={copy.research.importance}
        hint={copy.research.importanceHint}
        rows={result.importance}
        labels={copy.params}
        tone="accent"
      />

      <Bars
        title={copy.research.local}
        rows={result.localSensitivity}
        labels={copy.params}
        tone="life"
      />

      <div>
        <h4 className="text-sm font-medium">{copy.research.fates}</h4>
        <ul className="mt-3 flex items-end gap-1" aria-label={copy.research.fates}>
          {result.fateHist.map((bin) => (
            <li key={bin.fate} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className="w-full rounded-[var(--radius-xs)] bg-fg-subtle/50"
                style={{ height: `${Math.max(4, (bin.n / maxFate) * 48)}px` }}
                title={`${copy.fateLabel[bin.fate]} · ${bin.n}`}
              />
              <span className="w-full truncate text-center font-mono text-[0.5625rem] text-fg-subtle uppercase">
                {bin.n}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {result.insights.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium">{copy.research.insightsTitle}</h4>
          <ul className="mt-2 flex flex-col gap-2">
            {result.insights.map((id) => (
              <li key={id} className="text-pretty text-sm leading-relaxed text-fg-muted">
                {copy.research.insights[id]}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <FindGroup
        title={copy.research.observer}
        copy={copy}
        rows={result.observer}
        onApply={onApply}
      />
      <FindGroup
        title={copy.research.theorist}
        copy={copy}
        rows={result.theorist}
        onApply={onApply}
      />
    </div>
  );
}

function Bars({
  title,
  hint,
  rows,
  labels,
  tone,
}: {
  title: string;
  hint?: string;
  rows: { key: ParamKey; value: number }[];
  labels: Copy["params"];
  tone: "accent" | "life";
}) {
  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-medium">{title}</h4>
      {hint ? (
        <p className="text-pretty text-xs leading-relaxed text-fg-muted">{hint}</p>
      ) : null}
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.key} className="flex flex-col gap-1">
            <div className="flex justify-between gap-3">
              <span className="text-xs text-fg-muted">{labels[row.key].label}</span>
              <span className="font-mono text-xs tabular-nums text-fg">
                {formatPct(row.value)}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-bg-subtle">
              <div
                className={cn(
                  "h-full rounded-full",
                  tone === "life" ? "bg-life/80" : "bg-accent/80",
                )}
                style={{ width: `${Math.round(row.value * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FindGroup({
  title,
  copy,
  rows,
  onApply,
}: {
  title: string;
  copy: Copy;
  rows: SampleRow[];
  onApply: (params: UniverseParams, visualSeed: number) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium">{title}</h4>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={`${row.visualSeed}-${row.score}`}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-bg px-3 py-2"
          >
            <div className="min-w-0">
              <p className="font-mono text-xs tabular-nums text-fg">
                {copy.carbon} {formatPct(row.evaluation.lifeProb)}
                <span className="mx-2 text-fg-subtle/50">/</span>
                {copy.silicon} {formatPct(row.evaluation.siliconProb)}
                <span className="mx-2 text-fg-subtle/50">/</span>
                {copy.eternal} {formatPct(row.evaluation.eternalProb)}
              </p>
              <p className="mt-0.5 truncate text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
                {copy.fateLabel[row.evaluation.fate]}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApply(row.params, row.visualSeed)}
            >
              {copy.research.apply}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
