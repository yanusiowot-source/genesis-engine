import type { Copy } from "@/lib/universe/i18n";
import { acousticDossier } from "@/lib/universe/observatory";
import type { AcousticNiche, Evaluation, UniverseParams } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
};

const NICHE_TONE: Record<AcousticNiche, string> = {
  loaded: "text-life",
  clear: "text-fg",
  damped: "text-fg-subtle",
  silent: "text-fg-muted",
};

function pathOf(pts: { x: number; y: number }[]): string {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

export function AcousticPanel({ copy, params, evaluation }: Props) {
  const d = acousticDossier(params, evaluation);
  const maxEll = 1520;
  const maxD = Math.max(...d.curve.map((p) => p.dtt), 1);
  const samples = d.curve.map((p) => ({
    x: 16 + (p.ell / maxEll) * 292,
    y: 8 + (1 - p.dtt / maxD) * 72,
  }));

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">{copy.obs.acousticTitle}</h3>
        <span className="font-mono text-xs tabular-nums text-fg">
          {copy.obs.acousticEll} {Math.round(d.ell1)}
        </span>
      </div>
      <p className={`font-mono text-xl tracking-wide uppercase ${NICHE_TONE[d.niche]}`}>
        {copy.obs.acousticNiche[d.niche]}
      </p>
      <p className="text-pretty text-xs leading-relaxed text-fg-muted">
        {copy.obs.acousticNicheHint[d.niche]} {copy.obs.acousticHint}
      </p>
      <svg
        viewBox="0 0 320 96"
        className="h-auto w-full text-fg"
        role="img"
        aria-label={copy.obs.acousticTitle}
      >
        <line x1="16" y1="80" x2="308" y2="80" stroke="currentColor" strokeOpacity="0.12" />
        <path
          d={pathOf(samples)}
          fill="none"
          stroke="currentColor"
          strokeWidth={d.niche === "loaded" ? 2.1 : 1.5}
          strokeOpacity={d.niche === "silent" ? 0.35 : 1}
        />
        {d.peaks.map((p) => {
          const x = 16 + (p.ell / maxEll) * 292;
          if (x > 312) return null;
          const heavy = p.odd && d.baryonLoad > 1.15;
          return (
            <circle
              key={p.n}
              cx={x}
              cy={8 + (1 - p.dtt / maxD) * 72}
              r={heavy ? 3.2 : p.odd ? 2.2 : 1.6}
              fill="currentColor"
              opacity={heavy ? 1 : p.odd ? 0.75 : 0.38}
            />
          );
        })}
      </svg>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.acousticEll}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{Math.round(d.ell1)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.acousticEll3}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">
            {Math.round(d.peaks[2]?.ell ?? 0)}
          </dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.acousticOddEven}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{d.oddEven.toFixed(2)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.acousticLoad}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">×{d.baryonLoad.toFixed(2)}</dd>
        </div>
      </dl>
    </section>
  );
}
