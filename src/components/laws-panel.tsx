import { useEffect, useMemo, useState } from "react";
import { CatalogScatter } from "@/components/catalog-overlay";
import { Button } from "@/components/ui/button";
import {
  catalogImageFits,
  catalogTableFits,
} from "@/lib/universe/fits";
import { downloadBlob, downloadBytes } from "@/lib/universe/publish";
import { catalogVotable } from "@/lib/universe/votable";
import { Slider } from "@/components/ui/slider";
import {
  bfLabel,
  defaultHypothesis,
  formatBf,
  type BayesResult,
  type Hypothesis,
} from "@/lib/universe/bayes";
import { loadPlate, plateKey, savePlate } from "@/lib/universe/catalog-cache";
import { formatPct } from "@/lib/universe/format";
import { haptic } from "@/lib/universe/haptic";
import type { Copy } from "@/lib/universe/i18n";
import { discoverLawAsync, testHypothesisAsync } from "@/lib/universe/law-client";
import {
  DEFAULT_CONE,
  catalogQuality,
  fetchPanstarrsCone,
  fetchPanstarrsCutout,
  type CatalogResult,
  type CutoutResult,
} from "@/lib/universe/mast";
import { PARAM_META, evaluate } from "@/lib/universe/physics";
import type { ResearchTarget } from "@/lib/universe/research";
import { RESEARCH_TARGETS, scoreOf } from "@/lib/universe/research";
import { randomSeed } from "@/lib/universe/rng";
import { SYM, predictLaw, type DiscoveryResult } from "@/lib/universe/symbolic";
import type { ParamKey, UniverseParams } from "@/lib/universe/types";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  params: UniverseParams;
  target: ResearchTarget;
  law: DiscoveryResult | null;
  bayes: BayesResult | null;
  catalog: CatalogResult | null;
  cutout: CutoutResult | null;
  overlay: boolean;
  onTarget: (target: ResearchTarget) => void;
  onLaw: (result: DiscoveryResult) => void;
  onBayes: (result: BayesResult) => void;
  onCatalog: (result: CatalogResult, cutout: CutoutResult | null, cached: boolean) => void;
  onToggleOverlay: () => void;
};

const TARGETS: ResearchTarget[] = RESEARCH_TARGETS;
const KEYS: ParamKey[] = PARAM_META.map((m) => m.key);

let lawsPrimedFor: string | null = null;

const fieldClass =
  "h-11 w-full rounded-[var(--radius-sm)] bg-bg px-3 font-mono text-sm tabular-nums text-fg shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-accent/50";

export function LawsPanel({
  copy,
  params,
  target,
  law,
  bayes,
  catalog,
  cutout,
  overlay,
  onTarget,
  onLaw,
  onBayes,
  onCatalog,
  onToggleOverlay,
}: Props) {
  const [hyp, setHyp] = useState<Hypothesis>(defaultHypothesis);
  const [ra, setRa] = useState(DEFAULT_CONE.ra);
  const [dec, setDec] = useState(DEFAULT_CONE.dec);
  const [radius, setRadius] = useState(DEFAULT_CONE.radiusDeg);
  const [busyLaw, setBusyLaw] = useState(false);
  const [busyBayes, setBusyBayes] = useState(false);
  const [busyCat, setBusyCat] = useState(false);
  const [cached, setCached] = useState(false);
  const meta = PARAM_META.find((m) => m.key === hyp.key)!;
  useEffect(() => {
    if (law) setBusyLaw(false);
  }, [law]);

  useEffect(() => {
    setHyp((h) => (h.target === target ? h : { ...h, target }));
  }, [target]);

  const runLaw = async (silent = false) => {
    if (busyLaw) return;
    if (!silent) haptic(12);
    setBusyLaw(true);
    try {
      onLaw(await discoverLawAsync(randomSeed(), target));
    } catch {
      /* worker failed — Discover stays available */
    } finally {
      setBusyLaw(false);
    }
  };

  useEffect(() => {
    if (law?.target === target) return;
    if (lawsPrimedFor === target) return;
    lawsPrimedFor = target;
    let live = true;
    void (async () => {
      setBusyLaw(true);
      try {
        const next = await discoverLawAsync(randomSeed(), target);
        if (!live) return;
        onLaw(next);
      } catch {
        if (live) lawsPrimedFor = null;
      } finally {
        if (live) setBusyLaw(false);
      }
    })();
    return () => {
      live = false;
    };
    // first visit per corridor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const runBayes = async () => {
    if (busyBayes) return;
    haptic(12);
    setBusyBayes(true);
    try {
      onBayes(await testHypothesisAsync(randomSeed(), { ...hyp, target }));
    } finally {
      setBusyBayes(false);
    }
  };

  const runCatalog = async () => {
    if (busyCat) return;
    haptic(10);
    setBusyCat(true);
    try {
      const q = {
        ra: wrapRa(ra),
        dec: clamp(dec, -90, 90),
        radiusDeg: clamp(radius, 0.005, 0.15),
      };
      setRa(q.ra);
      setDec(q.dec);
      setRadius(q.radiusDeg);
      const key = plateKey(q.ra, q.dec, q.radiusDeg);
      const hit = await loadPlate(key);
      if (hit) {
        setCached(true);
        onCatalog(hit.catalog, hit.cutout ?? null, true);
        return;
      }
      const cone = await fetchPanstarrsCone({ data: q });
      let plate: CutoutResult | null = null;
      try {
        plate = await fetchPanstarrsCutout({ data: { ra: q.ra, dec: q.dec } });
      } catch {
        plate = null;
      }
      if (cone.ok) {
        await savePlate(key, {
          savedAt: Date.now(),
          catalog: cone,
          cutout: plate?.ok ? plate : undefined,
        });
      }
      setCached(false);
      onCatalog(cone, plate, false);
    } finally {
      setBusyCat(false);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-medium">{copy.laws.title}</h3>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">{copy.laws.hint}</p>
      </div>

      <TargetGrid copy={copy} target={target} onTarget={onTarget} locked={busyLaw} />

      <div>
        <h4 className="text-sm font-medium">{copy.laws.symbolic}</h4>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">
          {copy.laws.symbolicHint}
        </p>
        <Button className="mt-3 w-full" onClick={() => void runLaw()} disabled={busyLaw} data-fitting={busyLaw ? "1" : undefined}>
          {busyLaw ? copy.laws.discovering : copy.laws.discover}
        </Button>
        {law && law.target === target ? (
          <LawBlock copy={copy} law={law} params={params} />
        ) : busyLaw ? null : (
          <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-subtle">
            {copy.laws.empty}
          </p>
        )}
      </div>

      <div className="h-px bg-border" />

      <div>
        <h4 className="text-sm font-medium">{copy.laws.bayes}</h4>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">
          {copy.laws.bayesHint}
        </p>

        <label className="mt-3 block text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
          {copy.laws.param}
        </label>
        <select
          className={cn(fieldClass, "mt-1")}
          value={hyp.key}
          onChange={(e) => {
            const key = e.target.value as ParamKey;
            const next = PARAM_META.find((m) => m.key === key)!;
            setHyp((h) => ({
              ...h,
              key,
              threshold: clamp(h.threshold, next.min, next.max),
            }));
          }}
        >
          {KEYS.map((k) => (
            <option key={k} value={k}>
              {copy.params[k].label} ({SYM[k]})
            </option>
          ))}
        </select>

        <div className="mt-3 grid grid-cols-2 gap-1 rounded-[var(--radius-sm)] bg-bg p-1">
          {(["lt", "gt"] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => setHyp((h) => ({ ...h, dir }))}
              className={cn(
                "h-11 rounded-[var(--radius-xs)] text-[0.6875rem] font-medium tracking-wide uppercase",
                hyp.dir === dir ? "bg-bg-subtle text-fg" : "text-fg-subtle hover:text-fg",
              )}
            >
              {dir === "lt" ? copy.laws.dirLt : copy.laws.dirGt}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-3">
          <span className="text-xs text-fg-muted">{copy.laws.threshold}</span>
          <span className="font-mono text-xs tabular-nums text-fg">
            {hyp.threshold.toFixed(meta.step < 0.01 ? 3 : 2)} {meta.unit}
          </span>
        </div>
        <Slider
          min={meta.min}
          max={meta.max}
          step={meta.step}
          value={[hyp.threshold]}
          onValueChange={([v]) => {
            if (typeof v === "number") setHyp((h) => ({ ...h, threshold: v }));
          }}
          aria-label={copy.laws.threshold}
        />

        <p className="mt-2 text-pretty text-xs leading-relaxed text-fg-subtle">
          {copy.params[hyp.key].label} {hyp.dir === "lt" ? "<" : ">"}{" "}
          {hyp.threshold.toFixed(meta.step < 0.01 ? 3 : 2)} → {copy.research.target[hyp.target]}
        </p>

        <Button className="mt-3 w-full" onClick={() => void runBayes()} disabled={busyBayes}>
          {busyBayes ? copy.laws.testing : copy.laws.test}
        </Button>
        {bayes ? <BayesBlock copy={copy} result={bayes} /> : null}
      </div>

      <div className="h-px bg-border" />

      <div>
        <h4 className="text-sm font-medium">{copy.laws.catalog}</h4>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">
          {copy.laws.catalogHint}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <NumField label={copy.laws.ra} value={ra} onChange={setRa} step={0.001} />
          <NumField label={copy.laws.dec} value={dec} onChange={setDec} step={0.001} />
          <NumField label={copy.laws.radius} value={radius} onChange={setRadius} step={0.005} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => void runCatalog()} disabled={busyCat}>
            {busyCat ? copy.laws.loading : copy.laws.load}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setRa(DEFAULT_CONE.ra);
              setDec(DEFAULT_CONE.dec);
              setRadius(DEFAULT_CONE.radiusDeg);
            }}
          >
            {copy.laws.m31}
          </Button>
        </div>
        {catalog && catalog.ok ? (
          <CatalogBlock
            copy={copy}
            catalog={catalog}
            cutout={cutout}
            cached={cached}
            overlay={overlay}
            onToggleOverlay={onToggleOverlay}
          />
        ) : catalog && !catalog.ok ? (
          <p className="mt-3 text-sm text-sterile">{catalog.error}</p>
        ) : (
          <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-subtle">
            {copy.laws.emptyCatalog}
          </p>
        )}
      </div>
    </section>
  );
}

function TargetGrid({
  copy,
  target,
  onTarget,
  locked = false,
}: {
  copy: Copy;
  target: ResearchTarget;
  onTarget: (t: ResearchTarget) => void;
  locked?: boolean;
}) {
  return (
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
            disabled={locked}
            onClick={() => onTarget(id)}
            className={cn(
              "flex h-auto min-h-11 w-full min-w-0 items-center justify-center whitespace-normal text-balance rounded-[var(--radius-xs)] px-2 py-1.5 text-center text-[0.6875rem] font-medium leading-tight uppercase",
              locked && "opacity-60",
              active ? "bg-bg-subtle text-fg" : "text-fg-subtle hover:text-fg",
            )}
          >
            {copy.research.target[id]}
          </button>
        );
      })}
    </div>
  );
}

function LawBlock({
  copy,
  law,
  params,
}: {
  copy: Copy;
  law: DiscoveryResult;
  params: UniverseParams;
}) {
  const pred = predictLaw(law.best.expr, params);
  const truth = useMemo(() => scoreOf(evaluate(params), law.target), [law.target, params]);
  const stats = [
    { k: copy.laws.r2Train, v: law.best.r2Train.toFixed(2) },
    { k: copy.laws.r2Test, v: law.best.r2Test.toFixed(2) },
    { k: copy.laws.aic, v: law.best.aic.toFixed(0) },
    { k: copy.laws.complexity, v: String(law.best.complexity) },
  ];
  return (
    <div className="mt-4 flex flex-col gap-3">
      <p className="break-all font-mono text-xs leading-relaxed text-fg">
        {law.best.formula}
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {stats.map((s) => (
          <div key={s.k} className="min-w-0">
            <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{s.k}</dt>
            <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{s.v}</dd>
          </div>
        ))}
      </dl>
      <p className="font-mono text-[0.6875rem] tabular-nums text-fg-subtle uppercase">
        {copy.laws.method}{" "}
        {law.best.method === "gp" ? copy.laws.methodGp : copy.laws.methodDict}
      </p>
      <div className="flex justify-between gap-3">
        <span className="text-xs text-fg-muted">
          {copy.laws.thisSkyLaw} {formatPct(pred)}
        </span>
        <span className="text-xs text-fg-muted">
          {copy.laws.thisSkyTrue} {formatPct(truth)}
        </span>
      </div>
      <p className="text-pretty text-xs leading-relaxed text-fg-subtle">{copy.laws.residual}</p>
    </div>
  );
}

function BayesBlock({ copy, result }: { copy: Copy; result: BayesResult }) {
  const label = bfLabel(result.bf10);
  const rows = [
    { k: copy.laws.pCond, v: formatPct(result.pCond) },
    { k: copy.laws.pNot, v: formatPct(result.pNot) },
    { k: copy.laws.delta, v: `${result.delta >= 0 ? "+" : ""}${formatPct(result.delta)}` },
    { k: copy.laws.bf, v: formatBf(result.bf10) },
    { k: copy.laws.logBf, v: result.logBf10.toFixed(2) },
    { k: copy.laws.pGreater, v: formatPct(result.pGreater) },
    {
      k: copy.laws.nCond,
      v: `${result.kCond}/${result.nCond}`,
    },
    { k: copy.laws.nNot, v: `${result.kNot}/${result.nNot}` },
  ];
  return (
    <div className="mt-4 flex flex-col gap-3">
      <p className="text-sm text-fg">{copy.laws.support[label]}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {rows.map((s) => (
          <div key={s.k} className="min-w-0">
            <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{s.k}</dt>
            <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{s.v}</dd>
          </div>
        ))}
      </dl>
      <p className="font-mono text-[0.6875rem] tabular-nums text-fg-subtle">
        {copy.laws.ci} {formatPct(result.pCondLo)}–{formatPct(result.pCondHi)}
      </p>
    </div>
  );
}

function CatalogBlock({
  copy,
  catalog,
  cutout,
  cached,
  overlay,
  onToggleOverlay,
}: {
  copy: Copy;
  catalog: Extract<CatalogResult, { ok: true }>;
  cutout: CutoutResult | null;
  cached: boolean;
  overlay: boolean;
  onToggleOverlay: () => void;
}) {
  const dq = catalogQuality(catalog.stars);
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-1 font-mono text-[0.6875rem] tabular-nums text-fg-subtle uppercase">
          <span>
            {copy.laws.stars} {dq.n}
          </span>
          <span>
            {copy.laws.dqComplete} {formatPct(dq.complete)}
          </span>
          <span>
            {copy.laws.dqDet} {dq.meanDet.toFixed(1)}
          </span>
          <span>{copy.laws.dqNiche[dq.niche]}</span>
          {cached ? <span>{copy.laws.cached}</span> : null}
        </div>
        <Button variant="outline" size="sm" onClick={onToggleOverlay}>
          {overlay ? copy.laws.hideSky : copy.laws.showSky}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-11"
          onClick={() => {
            downloadBytes(
              `genesis-ps1-${catalog.ra.toFixed(2)}-${catalog.dec.toFixed(2)}.fits`,
              catalogTableFits(catalog),
              "application/fits",
            );
            downloadBytes(
              `genesis-ps1-${catalog.ra.toFixed(2)}-${catalog.dec.toFixed(2)}-img.fits`,
              catalogImageFits(catalog),
              "application/fits",
            );
          }}
        >
          {copy.desk.fitsCatalog}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-11"
          onClick={() => {
            downloadBlob(
              `genesis-ps1-${catalog.ra.toFixed(2)}-${catalog.dec.toFixed(2)}.xml`,
              new Blob([catalogVotable(catalog)], { type: "application/x-votable+xml" }),
            );
          }}
        >
          {copy.desk.votableCatalog}
        </Button>
      </div>
      <CatalogScatter catalog={catalog} className="h-40 w-full" />
      {cutout?.ok ? (
        <figure>
          <img
            src={cutout.dataUrl}
            alt={copy.laws.cutout}
            className="w-full rounded-[var(--radius-sm)]"
          />
          <figcaption className="mt-2 text-pretty text-xs leading-relaxed text-fg-subtle">
            {copy.laws.cutoutHint}
          </figcaption>
        </figure>
      ) : null}
      <ul className="flex flex-col gap-1.5">
        {catalog.stars.slice(0, 8).map((s) => (
          <li
            key={`${s.name}-${s.ra}`}
            className="flex items-baseline justify-between gap-3 font-mono text-[0.6875rem] tabular-nums text-fg-muted"
          >
            <span className="min-w-0 truncate text-fg">{s.name}</span>
            <span>
              {s.ra.toFixed(3)} {s.dec.toFixed(3)}
              <span className="ml-2 text-fg-subtle">
                {copy.laws.mag} {s.r?.toFixed(1) ?? "—"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
}) {
  return (
    <label className="min-w-0">
      <span className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{label}</span>
      <input
        type="number"
        className={cn(fieldClass, "mt-1")}
        value={Number.isFinite(value) ? value : ""}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function wrapRa(ra: number): number {
  if (!Number.isFinite(ra)) return DEFAULT_CONE.ra;
  const x = ra % 360;
  return x < 0 ? x + 360 : x;
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
