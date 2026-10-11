import { memo } from "react";
import type { Copy } from "@/lib/universe/i18n";
import { formatPct } from "@/lib/universe/format";
import { environmentClass } from "@/lib/universe/physics";
import { haloDossier, rotationCurve, scalingDossier } from "@/lib/universe/observatory";
import type { Evaluation, Morphology, UniverseParams } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
};

const MIX_KEYS = ["spiral", "elliptical", "irregular"] as const;

function curvePath<T extends { r: number }>(
  samples: T[],
  pick: (s: T) => number,
  maxR: number,
  maxV: number,
  x0: number,
  y0: number,
  w: number,
  h: number,
): string {
  return samples
    .map((s, i) => {
      const x = x0 + (s.r / maxR) * w;
      const y = y0 + h - (pick(s) / maxV) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export const HubblePanel = memo(function HubblePanel({ copy, params, evaluation }: Props) {
  const env = evaluation.environmentDensity;
  const klass = environmentClass(env);
  const mix = evaluation.hubbleMix;
  const morph: Morphology = evaluation.morphology;
  const curve = rotationCurve(params, evaluation);
  const halo = haloDossier(params, evaluation);
  const scale = scalingDossier(params, evaluation);
  const maxR = curve[curve.length - 1]?.r ?? 1;
  const maxV = Math.max(...curve.map((s) => Math.max(s.v, s.vBaryon, s.vNfw, s.vBurkert)), 1e-4);
  const haloPath = curvePath(curve, (s) => s.v, maxR, maxV, 8, 6, 304, 70);
  const baryonPath = curvePath(curve, (s) => s.vBaryon, maxR, maxV, 8, 6, 304, 70);
  const nfwPath = curvePath(curve, (s) => s.vNfw, maxR, maxV, 8, 6, 304, 70);
  const burkertPath = curvePath(curve, (s) => s.vBurkert, maxR, maxV, 8, 6, 304, 70);

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
      </dl>
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="text-sm font-medium">{copy.obs.rotationCurve}</h4>
          <span className="font-mono text-xs tabular-nums text-fg">
            {Math.round(curve[curve.length - 1]?.vKms ?? 0)} {copy.obs.rotationV}
          </span>
        </div>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">{copy.obs.rotationHint}</p>
        <svg
          viewBox="0 0 320 96"
          className="mt-2 h-auto w-full text-fg"
          role="img"
          aria-label={copy.obs.rotationCurve}
        >
          <line x1="8" y1="76" x2="312" y2="76" stroke="currentColor" strokeOpacity="0.12" />
          <path d={baryonPath} fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d={nfwPath} fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.2" strokeDasharray="2 4" />
          <path d={burkertPath} fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.15" strokeDasharray="1 3" />
          <path d={haloPath} fill="none" stroke="currentColor" strokeWidth="1.75" />
        </svg>
        <p className="text-right font-mono text-[0.6875rem] text-fg-subtle uppercase">{copy.obs.rotationR}</p>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[0.6875rem] text-fg-subtle uppercase">
          <li className="flex items-center gap-1.5">
            <svg width="16" height="4" aria-hidden className="shrink-0 text-fg">
              <line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" strokeWidth="1.75" />
            </svg>
            {copy.obs.rotationHalo}
            <span className="text-fg-subtle/70">{copy.obs.haloModel[halo.model]}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <svg width="16" height="4" aria-hidden className="shrink-0 text-fg">
              <line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
            </svg>
            {copy.obs.rotationBaryon}
          </li>
          <li className="flex items-center gap-1.5">
            <svg width="16" height="4" aria-hidden className="shrink-0 text-fg">
              <line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 4" opacity="0.7" />
            </svg>
            {copy.obs.haloModel.nfw}
          </li>
          <li className="flex items-center gap-1.5">
            <svg width="16" height="4" aria-hidden className="shrink-0 text-fg">
              <line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" strokeWidth="1.15" strokeDasharray="1 3" opacity="0.7" />
            </svg>
            {copy.obs.haloModel.burkert}
          </li>
        </ul>
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="text-sm font-medium">{scale.kind === "fj" ? copy.obs.fpTitle : copy.obs.tfTitle}</h4>
          <span className="font-mono text-xs tabular-nums text-fg uppercase">
            {scale.kind === "fj" ? copy.obs.fpNiche[scale.fpNiche] : copy.obs.tfNiche[scale.niche]}
          </span>
        </div>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">
          {scale.kind === "fj" ? copy.obs.fpHint : copy.obs.tfHint}
        </p>
        {scale.kind === "fj" ? (
          <>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.fpRe}</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{scale.re.toFixed(2)}</dd>
            </div>
            <div className="text-right">
              <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.fjSigma}</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">
                {Math.round(scale.fpSigmaKms)} {copy.obs.rotationV}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.fpIe}</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{scale.ie.toFixed(2)}</dd>
            </div>
            <div className="text-right">
              <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.fpResidual}</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{scale.fpRatio.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.fpMl}</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">
                {scale.upsilon.toFixed(2)}
                <span className="ml-2 text-[0.6875rem] text-fg-subtle">{copy.obs.fpMlBranch[scale.mlBranch]}</span>
              </dd>
            </div>
            <div className="text-right">
              <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.fpSersic}</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{scale.sersicN.toFixed(1)}</dd>
            </div>
          </dl>
          <svg
            viewBox="0 0 320 72"
            className="mt-2 h-auto w-full text-fg"
            role="img"
            aria-label={copy.obs.fpMass}
          >
            {(() => {
              const seq = scale.massSeq;
              const masses = seq.map((s) => Math.log10(Math.max(s.mass, 1e-3)));
              const res = seq.map((s) => s.residual);
              const ups = seq.map((s) => s.upsilon);
              const loM = Math.min(...masses);
              const hiM = Math.max(...masses);
              const loR = Math.min(0.5, ...res, ...ups);
              const hiR = Math.max(1.6, ...res, ...ups);
              const xAt = (m: number) => 16 + ((m - loM) / Math.max(hiM - loM, 0.1)) * 284;
              const yAt = (r: number) => 60 - ((r - loR) / Math.max(hiR - loR, 0.1)) * 48;
              const fpPath = seq
                .map((s, i) => `${i === 0 ? "M" : "L"}${xAt(Math.log10(s.mass)).toFixed(1)} ${yAt(s.residual).toFixed(1)}`)
                .join(" ");
              const virPath = seq
                .map((s, i) => `${i === 0 ? "M" : "L"}${xAt(Math.log10(s.mass)).toFixed(1)} ${yAt(s.upsilon).toFixed(1)}`)
                .join(" ");
              const here = seq.reduce((p, s) =>
                Math.abs(s.mass - scale.dynMass) < Math.abs(p.mass - scale.dynMass) ? s : p,
              );
              return (
                <>
                  <line x1="16" y1={yAt(1)} x2="300" y2={yAt(1)} stroke="currentColor" strokeOpacity="0.18" strokeDasharray="3 4" />
                  <path d={virPath} fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.2" strokeDasharray="4 3" />
                  <path d={fpPath} fill="none" stroke="currentColor" strokeWidth="1.6" />
                  {here ? (
                    <circle cx={xAt(Math.log10(here.mass))} cy={yAt(here.residual)} r="2.4" fill="currentColor" />
                  ) : null}
                </>
              );
            })()}
          </svg>
          <div className="flex justify-between gap-3 font-mono text-[0.6875rem] text-fg-subtle uppercase">
            <span>{copy.obs.fpMass}</span>
            <span>{copy.obs.fpResidual}</span>
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-4">
            <div>
              <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.fjTitle}</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{scale.fjRatio.toFixed(2)}</dd>
            </div>
          </dl>
          <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">{copy.obs.massHint}</p>
          <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2">
            <div>
              <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.massPhot}</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{scale.massEst.mPhot.toFixed(3)}</dd>
            </div>
            <div className="text-center">
              <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.massVirial}</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{scale.massEst.mVirial.toFixed(3)}</dd>
            </div>
            <div className="text-right">
              <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.massLens}</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{scale.massEst.mLens.toFixed(3)}</dd>
            </div>
          </dl>
          <dl className="mt-2 grid grid-cols-2 gap-x-4">
            <div>
              <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.massTitle}</dt>
              <dd className="mt-0.5 font-mono text-sm text-fg">{copy.obs.massNiche[scale.massEst.niche]}</dd>
            </div>
          </dl>

          </>
        ) : (
          <>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.tfRatio}</dt>
            <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{scale.tfRatio.toFixed(2)}</dd>
          </div>
          <div className="text-right">
            <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.rarTitle}</dt>
            <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">
              {(scale.rar[scale.rar.length - 1]?.gObs ?? 0).toFixed(2)}
              <span className="text-fg-subtle"> / </span>
              {(scale.rar[scale.rar.length - 1]?.gBar ?? 0).toFixed(2)}
            </dd>
          </div>
        </dl>
        <svg
          viewBox="0 0 320 96"
          className="mt-2 h-auto w-full text-fg"
          role="img"
          aria-label={copy.obs.rarTitle}
        >
          {(() => {
            const logs = scale.rar.map((s) => ({
              b: Math.log10(Math.max(s.gBar, 1e-4)),
              o: Math.log10(Math.max(s.gObs, 1e-4)),
            }));
            const lo = Math.min(...logs.flatMap((p) => [p.b, p.o]));
            const hi = Math.max(...logs.flatMap((p) => [p.b, p.o]));
            const span = Math.max(hi - lo, 0.2);
            const xAt = (v: number) => 16 + ((v - lo) / span) * 284;
            const yAt = (v: number) => 84 - ((v - lo) / span) * 72;
            const x0 = xAt(lo);
            const y0 = yAt(lo);
            const x1 = xAt(hi);
            const y1 = yAt(hi);
            return (
              <>
                <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 4" />
                {logs.map((p, i) => (
                  <circle
                    key={i}
                    cx={xAt(p.b)}
                    cy={yAt(p.o)}
                    r="2.2"
                    fill="currentColor"
                    opacity={0.45 + (i / logs.length) * 0.5}
                  />
                ))}
              </>
            );
          })()}
        </svg>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.massPhot}</dt>
            <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{scale.massEst.mPhot.toFixed(3)}</dd>
          </div>
          <div className="text-right">
            <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.massTitle}</dt>
            <dd className="mt-0.5 font-mono text-sm text-fg">{copy.obs.massNiche[scale.massEst.niche]}</dd>
          </div>
        </dl>
          </>
        )}
      </div>
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
});
