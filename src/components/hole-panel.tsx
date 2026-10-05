import type { Copy } from "@/lib/universe/i18n";
import { formatSci } from "@/lib/universe/format";
import {
  agnDossier,
  effectiveRadius,
  grmhdDossier,
  magorrianRatio,
  sphereOfInfluence,
} from "@/lib/universe/observatory";
import type { AgnNiche, Evaluation, UniverseParams } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
};

const NICHE_TONE: Record<AgnNiche, string> = {
  quiet: "text-fg-subtle",
  maintain: "text-fg",
  quasar: "text-life",
  quench: "text-fg-muted",
};

function magReadout(mag: number): { text: string; unit: string | null } {
  if (!(mag > 0)) return { text: "0", unit: null };
  if (mag >= 1e-4) return { text: (mag * 1000).toFixed(2), unit: "×10⁻³" };
  return { text: formatSci(mag), unit: null };
}

export function HolePanel({ copy, params, evaluation }: Props) {
  const agn = agnDossier(params, evaluation);
  const g = grmhdDossier(params, evaluation);
  const mag = magorrianRatio(params, evaluation);
  const magText = magReadout(mag);
  const soi = sphereOfInfluence(params, evaluation) / Math.max(effectiveRadius(params, evaluation), 1e-4);
  const live = agn.mode !== "off";
  const peak = Math.max(g.bz, g.bp, 1e-12);
  const bzW = (g.bz / peak) * 304;
  const bpW = (g.bp / peak) * 304;

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{copy.obs.bhTitle}</h3>
      <p className={`font-display text-xl tracking-[-0.02em] ${NICHE_TONE[agn.niche]}`}>
        {copy.obs.bhNiche[agn.niche]}
      </p>
      <p className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
        <span>{copy.obs.agnMode[agn.mode]}</span>
        {live ? <span>{copy.obs.agnDrive[agn.drive]}</span> : null}
        <span>{copy.obs.grmhdState[g.state]}</span>
        {g.adaf ? <span>{copy.obs.madAdaf}</span> : null}
        {g.fr !== "none" ? <span>{copy.obs.madFr[g.fr]}</span> : null}
      </p>
      <p className="text-pretty text-xs leading-relaxed text-fg-muted">{copy.obs.bhHint}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.bhMagorrian}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">
            {magText.text}
            {magText.unit ? (
              <span className="ml-1 text-[0.6875rem] text-fg-subtle">{magText.unit}</span>
            ) : null}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.bhSoi}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{soi.toFixed(3)}</dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.grmhdSpin}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{g.aStar.toFixed(2)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.grmhdEff}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">
            {(g.ntEff * 100).toFixed(1)}%
            <span className="ml-2 text-[0.6875rem] text-fg-subtle">{g.isco.toFixed(2)} M</span>
          </dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.agnLambda}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{agn.lambda.toFixed(3)}</dd>
        </div>
        {live ? (
          <div className="text-right">
            <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.agnHeat}</dt>
            <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{agn.heat.toFixed(2)}</dd>
          </div>
        ) : null}
      </dl>
      {live ? (
        <>
          <svg
            viewBox="0 0 320 48"
            className="h-auto w-full text-fg"
            role="img"
            aria-label={copy.obs.bhTitle}
          >
            <rect x="8" y="8" width={bzW.toFixed(1)} height="10" fill="currentColor" opacity={g.winner === "bp" ? 0.35 : 1} />
            <rect x="8" y="28" width={bpW.toFixed(1)} height="10" fill="currentColor" opacity={g.winner === "bz" ? 0.35 : 0.85} />
          </svg>
          <p className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
            <span>{copy.obs.grmhdBz}</span>
            <span>{copy.obs.grmhdBp}</span>
            <span>{copy.obs.grmhdWin[g.winner]}</span>
            <span>{copy.obs.fluxNiche[g.fluxNiche]}</span>
            <span>
              {copy.obs.grmhdEta} {g.etaBz.toFixed(2)}
            </span>
          </p>
          {g.state === "mad" ? (
            <dl className="grid grid-cols-2 gap-x-4">
              <div>
                <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.madSigma}</dt>
                <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{g.sigma.toFixed(1)}</dd>
              </div>
              <div className="text-right">
                <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.madFill}</dt>
                <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{(g.fill * 100).toFixed(0)}%</dd>
              </div>
            </dl>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
