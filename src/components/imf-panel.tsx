import type { Copy } from "@/lib/universe/i18n";
import { scalingDossier } from "@/lib/universe/observatory";
import type { Evaluation, ImfNiche, UniverseParams } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
};

const NICHE_TONE: Record<ImfNiche, string> = {
  top: "text-life",
  chabrier: "text-fg",
  salpeter: "text-fg-muted",
  bottom: "text-fg-subtle",
};

function curvePath(pts: { m: number; xi: number }[]): string {
  const logs = pts.map((p) => ({
    x: Math.log10(Math.max(p.m, 0.05)),
    y: Math.log10(Math.max(p.xi, 1e-6)),
  }));
  const loX = Math.min(...logs.map((p) => p.x));
  const hiX = Math.max(...logs.map((p) => p.x));
  const loY = Math.min(...logs.map((p) => p.y));
  const hiY = Math.max(...logs.map((p) => p.y));
  const xAt = (v: number) => 16 + ((v - loX) / Math.max(hiX - loX, 0.2)) * 284;
  const yAt = (v: number) => 48 - ((v - loY) / Math.max(hiY - loY, 0.2)) * 40;
  return logs
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(p.x).toFixed(1)} ${yAt(p.y).toFixed(1)}`)
    .join(" ");
}

export function ImfPanel({ copy, params, evaluation }: Props) {
  const scale = scalingDossier(params, evaluation);
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{copy.obs.imfTitle}</h3>
      <p className={`font-mono text-xl tracking-wide uppercase ${NICHE_TONE[scale.imfNiche]}`}>
        {copy.obs.imfNiche[scale.imfNiche]}
      </p>
      <p className="text-pretty text-xs leading-relaxed text-fg-muted">{copy.obs.imfHint}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.imfSlope}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{scale.imfX.toFixed(2)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.imfStar}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{scale.upsilonStar.toFixed(2)}</dd>
        </div>
      </dl>
      <svg
        viewBox="0 0 320 56"
        className="h-auto w-full text-fg"
        role="img"
        aria-label={copy.obs.imfTitle}
      >
        <path d={curvePath(scale.imfCurve)} fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <p className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
        <span>
          {copy.obs.imfMean} {scale.imfMean.toFixed(2)} M☉
        </span>
        <span>
          {copy.obs.imfSn} {(scale.imfSn * 100).toFixed(1)}%
        </span>
        <span>
          {copy.obs.imfR} {scale.imfR.toFixed(2)}
        </span>
        <span>
          {copy.obs.imfY} {scale.imfY.toFixed(3)}
        </span>
      </p>
    </section>
  );
}
