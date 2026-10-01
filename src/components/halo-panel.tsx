import type { Copy } from "@/lib/universe/i18n";
import { formatPct } from "@/lib/universe/format";
import { haloDossier } from "@/lib/universe/observatory";
import type { Evaluation, UniverseParams } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
};

const FACTOR_IDS = ["share", "rotation", "lens", "clustering"] as const;

export function HaloPanel({ copy, params, evaluation }: Props) {
  const d = haloDossier(params, evaluation);

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{copy.obs.haloTitle}</h3>
      <p className="font-display text-xl tracking-[-0.02em] text-fg">
        {copy.obs.haloNiche[d.niche]}
      </p>
      <p className="font-mono text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
        {copy.obs.haloModel[d.model]}
      </p>
      <p className="text-pretty text-xs leading-relaxed text-fg-muted">
        {copy.obs.haloNicheHint[d.niche]} {copy.obs.haloHint}
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.dm}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{formatPct(d.share)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.haloOuter}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">
            {Math.round(d.outerKms)} {copy.obs.rotationV}
          </dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.haloBaryonV}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg-muted">
            {Math.round(d.baryonKms)} {copy.obs.rotationV}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.haloTheta}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{d.thetaE.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.haloC}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{d.concentration.toFixed(1)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.haloRs}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{d.rs.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.haloContract}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">×{d.contraction.toFixed(2)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.haloCore}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{d.core.toFixed(3)}</dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.haloEinasto}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{d.einastoA.toFixed(2)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">n</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{d.coreN.toFixed(2)}</dd>
        </div>
      </dl>
      <svg
        viewBox="0 0 320 96"
        className="h-auto w-full text-fg"
        role="img"
        aria-label={copy.obs.haloKappa}
      >
        <line x1="8" y1="76" x2="312" y2="76" stroke="currentColor" strokeOpacity="0.12" />
        <line x1="8" y1={6 + 70 - 70 / 2} x2="312" y2={6 + 70 - 70 / 2} stroke="currentColor" strokeOpacity="0.22" strokeDasharray="3 4" />
        <path
          d={d.kappa
            .map((s, i) => {
              const maxR = d.kappa[d.kappa.length - 1]?.r ?? 1;
              const x = 8 + (s.r / maxR) * 304;
              const y = 6 + 70 - (Math.min(s.kappa, 2) / 2) * 70;
              return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
      <p className="font-mono text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
        {copy.obs.haloKappa} = 1 {copy.obs.haloTheta}
        <span className="text-fg-subtle/50"> · </span>
        {copy.obs.haloKs} {d.kappaS.toFixed(2)}
      </p>
      <svg
        viewBox="0 0 320 96"
        className="h-auto w-full text-fg"
        role="img"
        aria-label={copy.obs.haloCompare}
      >
        <line x1="8" y1="76" x2="312" y2="76" stroke="currentColor" strokeOpacity="0.12" />
        {(["nfw", "einasto", "burkert"] as const).map((key) => {
          const n = d.compare.length;
          const dpath = d.compare
            .map((s, i) => {
              const x = 8 + (i / Math.max(n - 1, 1)) * 304;
              const log = Math.log10(Math.max(s[key], 0.01));
              const y = 6 + 70 - ((log + 1.5) / 4) * 70;
              return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(" ");
          const law = key === d.model;
          return (
            <path
              key={key}
              d={dpath}
              fill="none"
              stroke="currentColor"
              strokeWidth={law ? 2.2 : 1.15}
              strokeOpacity={law ? 1 : key === "nfw" ? 0.32 : 0.48}
              strokeDasharray={law ? undefined : key === "nfw" ? "3 4" : "1 3"}
            />
          );
        })}
      </svg>
      <p className="font-mono text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
        {d.model === "einasto" || d.model === "burkert" || d.model === "nfw"
          ? null
          : `${copy.obs.haloModel[d.model]} · ${copy.obs.haloOffChart} `}
        {copy.obs.haloModel.einasto} dlnρ {d.slopeE.toFixed(2)}
        <span className="text-fg-subtle/50"> · </span>
        {copy.obs.haloModel.nfw} {d.slopeN.toFixed(2)}
        <span className="text-fg-subtle/50"> · </span>
        {copy.obs.haloModel.burkert} {d.slopeB.toFixed(2)}
      </p>
      <ul className="flex flex-col gap-2.5">
        {FACTOR_IDS.map((id) => {
          const f = d.factors.find((x) => x.id === id);
          const value = f?.value ?? 0;
          return (
            <li key={id} className="flex flex-col gap-1">
              <div className="flex justify-between gap-3">
                <span className="text-xs text-fg-muted">{copy.obs.haloFactor[id]}</span>
                <span className="font-mono text-xs tabular-nums text-fg">{Math.round(value * 100)}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-bg-subtle">
                <div className="h-full rounded-full bg-accent/80" style={{ width: `${Math.round(value * 100)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
