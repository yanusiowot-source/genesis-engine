import { FileOutput, Sigma } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { McmcView } from "@/components/mcmc-view";
import { Button } from "@/components/ui/button";
import type { BayesResult } from "@/lib/universe/bayes";
import { intelligenceWindow } from "@/lib/universe/civilization";
import { formatPct } from "@/lib/universe/format";
import {
  catalogImageFits,
  catalogTableFits,
  galaxyFits,
  mcmcImageFits,
  mcmcTableFits,
} from "@/lib/universe/fits";
import { haptic } from "@/lib/universe/haptic";
import type { Copy, Locale } from "@/lib/universe/i18n";
import { runMcmcAsync } from "@/lib/universe/law-client";
import type { CatalogResult } from "@/lib/universe/mast";
import { analyzePosterior, type McmcResult, type PosteriorAnalysis } from "@/lib/universe/mcmc";
import { PARAM_META, siliconDossier } from "@/lib/universe/physics";
import {
  downloadBlob,
  downloadBytes,
  downloadDocx,
  downloadPptx,
} from "@/lib/universe/publish";
import { buildFieldReport, reportFilename } from "@/lib/universe/report";
import type { ExpeditionResult, ResearchTarget } from "@/lib/universe/research";
import { randomSeed } from "@/lib/universe/rng";
import type { DiscoveryResult } from "@/lib/universe/symbolic";
import type { UniverseParams, UniverseRecord } from "@/lib/universe/types";
import {
  catalogVotable,
  mcmcVotable,
  universeVotable,
} from "@/lib/universe/votable";
import {
  SKY_CLASSES,
  goldClass,
  rankedVotes,
  recordVote,
  zooniverseClassificationsCsv,
  zooniverseSubjectsCsv,
  type SkyClass,
  type SkyVote,
} from "@/lib/universe/zooniverse";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  locale: Locale;
  record: UniverseRecord;
  target: ResearchTarget;
  result: McmcResult | null;
  catalog: CatalogResult | null;
  expedition: ExpeditionResult | null;
  law: DiscoveryResult | null;
  bayes: BayesResult | null;
  votes: SkyVote[];
  onVotes: (votes: SkyVote[]) => void;
  onResult: (result: McmcResult) => void;
  onApply: (params: UniverseParams, visualSeed: number) => void;
};

let deskPrimed = false;

export function DeskPanel({
  copy,
  locale,
  record,
  target,
  result,
  catalog,
  expedition,
  law,
  bayes,
  votes,
  onVotes,
  onResult,
  onApply,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [klass, setKlass] = useState<SkyClass>("habitable");
  const [rating, setRating] = useState(3);
  const silicon = useMemo(
    () => siliconDossier(record.params, record.evaluation),
    [record.params, record.evaluation],
  );
  const civ = useMemo(
    () => intelligenceWindow(record.params, record.evaluation),
    [record.params, record.evaluation],
  );
  const reportArgs = {
    record,
    locale,
    copy,
    silicon,
    civ,
    expedition,
    law,
    bayes,
    mcmc: result,
  };
  const existing = votes.find((v) => v.catalog === record.catalog);
  const board = rankedVotes(votes);

  useEffect(() => {
    if (result) setBusy(false);
  }, [result]);

  const flash = (id: string) => {
    setSaved(id);
    window.setTimeout(() => setSaved(null), 1200);
  };

  const run = async (silent = false) => {
    if (busy) return;
    if (!silent) haptic(12);
    setBusy(true);
    try {
      onResult(await runMcmcAsync(randomSeed(), record.params, target));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (result || deskPrimed) return;
    deskPrimed = true;
    let live = true;
    void (async () => {
      setBusy(true);
      try {
        const next = await runMcmcAsync(randomSeed(), record.params, target);
        onResult(next);
      } finally {
        setBusy(false);
      }
    })();
    return () => {
      live = false;
    };
    // first visit only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const okCatalog = catalog && catalog.ok ? catalog : null;

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-medium">{copy.desk.title}</h3>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">{copy.desk.hint}</p>
      </div>

      <div>
        <h4 className="text-sm font-medium">{copy.desk.mcmc}</h4>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">{copy.desk.mcmcHint}</p>
        <Button className="mt-3 w-full" onClick={() => void run()} disabled={busy} data-walking={busy ? "1" : undefined}>
          <Sigma />
          {busy ? copy.desk.running : copy.desk.run}
        </Button>
        {result ? (
          <McmcBlock
            copy={copy}
            result={result}
            here={record.params}
            visualSeed={record.visualSeed}
            onApply={onApply}
          />
        ) : (
          <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-subtle">{copy.desk.empty}</p>
        )}
      </div>

      <div className="h-px bg-border" />

      <div>
        <h4 className="text-sm font-medium">{copy.desk.exportTitle}</h4>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ExportBtn
            label={copy.desk.fitsGalaxy}
            saved={saved === "fg"}
            copy={copy}
            onClick={() => {
              downloadBytes(`genesis-${record.catalog.toLowerCase()}-disk.fits`, galaxyFits(record), "application/fits");
              flash("fg");
            }}
          />
          <ExportBtn
            label={copy.desk.votable}
            saved={saved === "vu"}
            copy={copy}
            onClick={() => {
              downloadBlob(
                `genesis-${record.catalog.toLowerCase()}.xml`,
                new Blob([universeVotable(record)], { type: "application/x-votable+xml" }),
              );
              flash("vu");
            }}
          />
          <ExportBtn
            label={copy.desk.fitsMcmc}
            saved={saved === "fm"}
            copy={copy}
            disabled={!result}
            title={!result ? copy.desk.needChain : undefined}
            onClick={() => {
              if (!result) return;
              downloadBytes(
                `genesis-${record.catalog.toLowerCase()}-mcmc.fits`,
                mcmcTableFits(result),
                "application/fits",
              );
              downloadBytes(
                `genesis-${record.catalog.toLowerCase()}-posterior.fits`,
                mcmcImageFits(result),
                "application/fits",
              );
              flash("fm");
            }}
          />
          <ExportBtn
            label={copy.desk.votableMcmc}
            saved={saved === "vm"}
            copy={copy}
            disabled={!result}
            title={!result ? copy.desk.needChain : undefined}
            onClick={() => {
              if (!result) return;
              downloadBlob(
                `genesis-${record.catalog.toLowerCase()}-chain.xml`,
                new Blob([mcmcVotable(result)], { type: "application/x-votable+xml" }),
              );
              flash("vm");
            }}
          />
          <ExportBtn
            label={copy.desk.fitsCatalog}
            saved={saved === "fc"}
            copy={copy}
            disabled={!okCatalog}
            title={!okCatalog ? copy.desk.needCatalog : undefined}
            onClick={() => {
              if (!okCatalog) return;
              downloadBytes(
                `genesis-${record.catalog.toLowerCase()}-ps1.fits`,
                catalogTableFits(okCatalog),
                "application/fits",
              );
              downloadBytes(
                `genesis-${record.catalog.toLowerCase()}-ps1-img.fits`,
                catalogImageFits(okCatalog),
                "application/fits",
              );
              flash("fc");
            }}
          />
          <ExportBtn
            label={copy.desk.votableCatalog}
            saved={saved === "vc"}
            copy={copy}
            disabled={!okCatalog}
            title={!okCatalog ? copy.desk.needCatalog : undefined}
            onClick={() => {
              if (!okCatalog) return;
              downloadBlob(
                `genesis-${record.catalog.toLowerCase()}-ps1.xml`,
                new Blob([catalogVotable(okCatalog)], { type: "application/x-votable+xml" }),
              );
              flash("vc");
            }}
          />
          <ExportBtn
            label={copy.desk.markdown}
            saved={saved === "md"}
            copy={copy}
            onClick={() => {
              downloadBlob(
                reportFilename(record),
                new Blob([buildFieldReport(reportArgs)], { type: "text/markdown;charset=utf-8" }),
              );
              flash("md");
            }}
          />
          <ExportBtn
            label={copy.desk.docx}
            saved={saved === "dx"}
            copy={copy}
            onClick={() => {
              void downloadDocx(reportArgs).then(() => flash("dx"));
            }}
          />
          <ExportBtn
            label={copy.desk.pptx}
            saved={saved === "pp"}
            copy={copy}
            onClick={() => {
              void downloadPptx(reportArgs).then(() => flash("pp"));
            }}
          />
        </div>
      </div>

      <div className="h-px bg-border" />

      <div>
        <h4 className="text-sm font-medium">{copy.desk.citizen}</h4>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">{copy.desk.citizenHint}</p>
        <p className="mt-2 font-mono text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
          {copy.desk.classify}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {SKY_CLASSES.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setKlass(id)}
              className={cn(
                "h-11 rounded-[var(--radius-xs)] px-1.5 text-[0.6875rem] font-medium tracking-wide",
                klass === id ? "bg-bg-subtle text-fg" : "text-fg-subtle hover:text-fg",
              )}
              aria-pressed={klass === id}
            >
              {copy.desk.classLabel[id]}
            </button>
          ))}
        </div>
        <p className="mt-3 font-mono text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
          {copy.desk.rating}
        </p>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${copy.desk.rating} ${n}`}
              aria-pressed={n === rating}
              onClick={() => setRating(n)}
              className={cn(
                "h-11 flex-1 rounded-[var(--radius-xs)] font-mono text-sm tabular-nums",
                n <= rating ? "bg-bg-subtle text-fg" : "text-fg-subtle hover:text-fg",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <Button
          className="mt-3 w-full"
          onClick={() => {
            haptic(10);
            onVotes(recordVote(record, klass, rating));
          }}
        >
          {copy.desk.submit}
        </Button>
        {existing ? (
          <p className="mt-2 text-pretty text-sm text-fg-muted">
            {existing.match ? copy.desk.match : copy.desk.miss}
            <span className="ml-2 font-mono text-xs text-fg-subtle uppercase">
              {copy.desk.gold} {copy.desk.classLabel[goldClass(record.evaluation)]}
            </span>
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="text-sm font-medium">{copy.desk.board}</h4>
          <p className="font-mono text-[0.6875rem] tabular-nums text-fg-subtle uppercase">
            {copy.desk.points} {votes.reduce((s, v) => s + 3 + v.rating + (v.match ? 2 : 0), 0)}
          </p>
        </div>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-subtle">{copy.desk.local}</p>
        {board.length === 0 ? (
          <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-subtle">{copy.desk.emptyBoard}</p>
        ) : (
          <ol className="mt-3 flex flex-col gap-2">
            {board.slice(0, 8).map((v, i) => (
              <li key={v.catalog} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-fg">
                  <span className="mr-2 font-mono text-[0.6875rem] text-fg-subtle">{i + 1}</span>
                  {v.name}
                </span>
                <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-fg-subtle uppercase">
                  {copy.desk.classLabel[v.class]} · {v.rating} · {formatPct(v.lifeProb)}
                </span>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ExportBtn
            label={copy.desk.zooniverse}
            saved={saved === "z"}
            copy={copy}
            disabled={votes.length === 0}
            onClick={() => {
              downloadBlob(
                "genesis-zooniverse-classifications.csv",
                new Blob([zooniverseClassificationsCsv(votes)], { type: "text/csv;charset=utf-8" }),
              );
              flash("z");
            }}
          />
          <ExportBtn
            label={copy.desk.subjects}
            saved={saved === "s"}
            copy={copy}
            disabled={votes.length === 0}
            onClick={() => {
              downloadBlob(
                "genesis-zooniverse-subjects.csv",
                new Blob([zooniverseSubjectsCsv(votes)], { type: "text/csv;charset=utf-8" }),
              );
              flash("s");
            }}
          />
        </div>
      </div>
    </section>
  );
}

function McmcBlock({
  copy,
  result,
  here,
  visualSeed,
  onApply,
}: {
  copy: Copy;
  result: McmcResult;
  here: UniverseParams;
  visualSeed: number;
  onApply: (params: UniverseParams, visualSeed: number) => void;
}) {
  const reading = useMemo(() => analyzePosterior(result, here), [result, here]);
  const rows = [
    { k: copy.desk.accept, v: formatPct(result.acceptRate) },
    { k: copy.desk.ess, v: result.ess.toFixed(0) },
    { k: copy.desk.rhat, v: reading.rhat.toFixed(2) },
    { k: copy.desk.tau, v: reading.tau.toFixed(1) },
    { k: copy.desk.samples, v: String(result.samples.length) },
    { k: copy.desk.map, v: formatPct(result.map.score) },
  ];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <McmcView copy={copy} result={result} />
      <PosteriorFlat result={result} />
      <LogLTrace copy={copy} values={reading.logL} />
      <p className="font-mono text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
        {copy.desk.prior}
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {rows.map((s) => (
          <div key={s.k} className="min-w-0">
            <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{s.k}</dt>
            <dd
              className={cn(
                "mt-0.5 font-mono text-sm tabular-nums",
                s.k === copy.desk.rhat && reading.rhat > 1.2 ? "text-sterile" : "text-fg",
              )}
            >
              {s.v}
            </dd>
          </div>
        ))}
      </dl>
      {reading.rhat > 1.2 ? (
        <p className="text-pretty text-xs leading-relaxed text-fg-muted">{copy.desk.rhatHint}</p>
      ) : null}

      <div>
        <h4 className="text-sm font-medium">{copy.desk.analysis}</h4>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">
          {copy.desk.analysisHint}
        </p>
      </div>

      <Marginals copy={copy} reading={reading} />

      <div>
        <h4 className="text-sm font-medium">{copy.desk.corridorMass}</h4>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">
          {copy.desk.corridorHint}
        </p>
        <dl className="mt-3 grid grid-cols-3 gap-3">
          <Mass k={copy.carbon} v={reading.viableCarbon} tone="life" />
          <Mass k={copy.silicon} v={reading.viableSilicon} tone="silicon" />
          <Mass k={copy.eternal} v={reading.viableEternal} tone="eternal" />
        </dl>
      </div>

      {reading.pairing ? (
        <p className="text-pretty text-sm leading-relaxed text-fg-muted">
          {copy.desk.pairing}
          <span className="ml-2 font-mono tabular-nums text-fg">
            {copy.params[reading.pairing.a].label} × {copy.params[reading.pairing.b].label}
            <span className="ml-2">
              {reading.pairing.r < 0 ? "−" : "+"}
              {Math.abs(reading.pairing.r).toFixed(2)}
            </span>
          </span>
        </p>
      ) : null}

      <Button
        variant="outline"
        onClick={() => {
          haptic(8);
          onApply(result.map.params, visualSeed ^ 0x51c);
        }}
      >
        {copy.desk.loadMap}
      </Button>
    </div>
  );
}

function Mass({
  k,
  v,
  tone,
}: {
  k: string;
  v: number;
  tone: "life" | "silicon" | "eternal";
}) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{k}</dt>
      <dd
        className={cn(
          "mt-0.5 font-mono text-sm tabular-nums",
          v >= 0.18
            ? tone === "eternal"
              ? "text-eternal"
              : tone === "silicon"
                ? "text-silicon"
                : "text-life"
            : "text-fg-subtle",
        )}
      >
        {formatPct(v)}
      </dd>
    </div>
  );
}

function Marginals({ copy, reading }: { copy: Copy; reading: PosteriorAnalysis }) {
  return (
    <div>
      <h4 className="text-sm font-medium">{copy.desk.marginals}</h4>
      <p className="mt-1 text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
        {copy.desk.median} · {copy.desk.interval} · {copy.desk.thisInCloud}
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {reading.marginals.map((m) => {
          const meta = PARAM_META.find((p) => p.key === m.key)!;
          const span = meta.max - meta.min || 1;
          const at = (v: number) => ((v - meta.min) / span) * 240;
          return (
            <li key={m.key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs text-fg-muted">{copy.params[m.key].label}</span>
                <span className="font-mono text-[0.6875rem] tabular-nums text-fg">
                  {m.q50.toFixed(2)}
                  <span className="ml-2 text-fg-subtle">
                    {m.q16.toFixed(2)}–{m.q84.toFixed(2)}
                  </span>
                  {m.here !== undefined ? (
                    <span className="ml-2 text-fg-subtle">{formatPct(m.here)}</span>
                  ) : null}
                </span>
              </div>
              <svg viewBox="0 0 240 28" className="h-7 w-full" role="img" aria-hidden>
                <rect
                  x={at(m.q16).toFixed(1)}
                  y="2"
                  width={Math.max(1, at(m.q84) - at(m.q16)).toFixed(1)}
                  height="24"
                  fill="currentColor"
                  className="text-accent/15"
                />
                {m.bins.map((h, i) => (
                  <rect
                    key={i}
                    x={((i + 0.12) * 240) / m.bins.length}
                    y={(28 - 2 - h * 22).toFixed(1)}
                    width={240 / m.bins.length - 1.2}
                    height={(h * 22).toFixed(1)}
                    fill="currentColor"
                    className="text-fg-subtle/70"
                  />
                ))}
                <line
                  x1={at(m.q50).toFixed(1)}
                  x2={at(m.q50).toFixed(1)}
                  y1="2"
                  y2="26"
                  stroke="currentColor"
                  className="text-fg"
                  strokeWidth="1.2"
                />
                <line
                  x1={at(m.map).toFixed(1)}
                  x2={at(m.map).toFixed(1)}
                  y1="2"
                  y2="26"
                  stroke="currentColor"
                  className="text-accent"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                {m.hereValue !== undefined ? (
                  <line
                    x1={at(m.hereValue).toFixed(1)}
                    x2={at(m.hereValue).toFixed(1)}
                    y1="2"
                    y2="26"
                    stroke="currentColor"
                    className="text-life"
                    strokeWidth="1"
                  />
                ) : null}
              </svg>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LogLTrace({ copy, values }: { copy: Copy; values: number[] }) {
  if (values.length < 4) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(1e-6, hi - lo);
  const w = 240;
  const h = 36;
  const d = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = h - 2 - ((v - lo) / span) * (h - 4);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <div>
      <p className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.desk.trace}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 h-9 w-full text-accent" role="img" aria-hidden>
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

function ExportBtn({
  label,
  saved,
  copy,
  onClick,
  disabled,
  title,
}: {
  label: string;
  saved: boolean;
  copy: Copy;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-11 w-full whitespace-normal text-center leading-tight"
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      <FileOutput />
      {saved ? copy.desk.saved : label}
    </Button>
  );
}

function PosteriorFlat({ result }: { result: McmcResult }) {
  const gMeta = PARAM_META.find((m) => m.key === "gravity")!;
  const mMeta = PARAM_META.find((m) => m.key === "matter")!;
  const lo = result.logLMin;
  const span = Math.max(1e-6, result.logLMax - result.logLMin);
  const w = 280;
  const h = 96;
  const step = Math.max(1, Math.floor(result.samples.length / 220));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full text-fg" role="img" aria-hidden>
      <rect width={w} height={h} fill="transparent" />
      {result.samples.map((s, i) => {
        if (i % step !== 0) return null;
        const x = ((s.params.gravity - gMeta.min) / (gMeta.max - gMeta.min)) * w;
        const y = (1 - (s.params.matter - mMeta.min) / (mMeta.max - mMeta.min)) * h;
        const t = (s.logL - lo) / span;
        const r = Math.round(160 + (84 - 160) * t);
        const g = Math.round(138 + (163 - 138) * t);
        const b = Math.round(126 + (144 - 126) * t);
        return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="1.6" fill={`rgb(${r} ${g} ${b})`} />;
      })}
    </svg>
  );
}
