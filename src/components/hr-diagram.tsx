import { useMemo } from "react";
import type { Copy } from "@/lib/universe/i18n";
import { censusOf, cosmicAgeGyr, samplePopulation } from "@/lib/universe/observatory";
import { isOurParams } from "@/lib/universe/physics";
import type { Evaluation, StellarStage, UniverseParams } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
  cosmicTime: number;
  visualSeed: number;
};

const TEFF_MIN = 2400;
const TEFF_MAX = 32000;
const LOG_L_MIN = -3;
const LOG_L_MAX = 6.2;

function xOf(teff: number): number {
  const t = Math.min(TEFF_MAX, Math.max(TEFF_MIN, teff));
  return (Math.log10(TEFF_MAX) - Math.log10(t)) / (Math.log10(TEFF_MAX) - Math.log10(TEFF_MIN));
}

function yOf(logL: number): number {
  const v = Math.min(LOG_L_MAX, Math.max(LOG_L_MIN, logL));
  return 1 - (v - LOG_L_MIN) / (LOG_L_MAX - LOG_L_MIN);
}

function colorFor(stage: StellarStage, rgb: [number, number, number]): string {
  if (stage === "blackHole") return "rgb(90,90,98)";
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

export function HrDiagram({ copy, params, evaluation, cosmicTime, visualSeed }: Props) {
  const age = cosmicAgeGyr(Math.round(cosmicTime * 40) / 40, params, evaluation);
  const pop = useMemo(
    () => samplePopulation(params, evaluation, age, visualSeed, 180),
    [params, evaluation, age, visualSeed],
  );
  const census = censusOf(pop);
  const ours = isOurParams(params);

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{copy.obs.hrTitle}</h3>
      <p className="text-pretty text-xs leading-relaxed text-fg-muted">{copy.obs.hrHint}</p>
      {pop.length === 0 ? (
        <p className="text-sm text-fg-subtle">{copy.obs.hrEmpty}</p>
      ) : (
        <div className="relative">
          <svg
            viewBox="0 0 320 220"
            className="h-auto w-full text-fg"
            role="img"
            aria-label={copy.obs.hrTitle}
          >
            <rect x="36" y="8" width="270" height="184" fill="transparent" />
            {pop.map((s, i) => {
              const cx = 36 + xOf(s.teff) * 270;
              const cy = 8 + yOf(s.logL) * 184;
              const r = s.stage === "giant" || s.stage === "supernova" ? 2.4 : 1.4;
              return (
                <circle
                  key={`${s.mass.toFixed(3)}-${i}`}
                  cx={Number(cx.toFixed(2))}
                  cy={Number(cy.toFixed(2))}
                  r={r}
                  fill={colorFor(s.stage, s.rgb)}
                  opacity={s.stage === "blackHole" ? 0.45 : 0.85}
                />
              );
            })}
            {ours ? (
              <circle
                cx={Number((36 + xOf(5772) * 270).toFixed(2))}
                cy={Number((8 + yOf(0) * 184).toFixed(2))}
                r="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            ) : null}
            <text x="36" y="214" fill="currentColor" fontSize="9" opacity="0.55">
              {copy.obs.hrT}
            </text>
            <text
              x="12"
              y="100"
              fill="currentColor"
              fontSize="9"
              opacity="0.55"
              transform="rotate(-90 12 100)"
            >
              {copy.obs.hrL}
            </text>
          </svg>
        </div>
      )}
      <dl className="grid grid-cols-3 gap-3 font-mono text-xs tabular-nums">
        <div className="min-w-0">
          <dt className="text-[0.6875rem] leading-tight tracking-wide text-fg-subtle uppercase">
            {copy.obs.censusMs}
          </dt>
          <dd className="mt-0.5 text-fg">{census.ms}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
            {copy.obs.censusGiant}
          </dt>
          <dd className="mt-0.5 text-fg">{census.giant}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
            {copy.obs.censusRemnant}
          </dt>
          <dd className="mt-0.5 text-fg">{census.remnant}</dd>
        </div>
      </dl>
    </section>
  );
}
