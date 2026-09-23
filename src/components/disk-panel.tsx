import { useMemo } from "react";
import type { Copy } from "@/lib/universe/i18n";
import { buildGalaxy } from "@/lib/universe/galaxy";
import { diskDossier } from "@/lib/universe/observatory";
import type { DiskNiche, Evaluation, UniverseParams } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
  visualSeed: number;
};

const NICHE_TONE: Record<DiskNiche, string> = {
  fragmenting: "text-life",
  hot: "text-fg-subtle",
  rigid: "text-fg-muted",
  marginal: "text-fg",
};

function qPath(
  samples: { r: number; Q: number }[],
  maxR: number,
  maxQ: number,
  x0: number,
  y0: number,
  w: number,
  h: number,
): string {
  return samples
    .map((s, i) => {
      const x = x0 + (s.r / maxR) * w;
      const y = y0 + h - (Math.min(s.Q, maxQ) / maxQ) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function DiskPanel({ copy, params, evaluation, visualSeed }: Props) {
  const d = diskDossier(params, evaluation);
  const h0Long = useMemo(
    () => buildGalaxy(params, evaluation, visualSeed, 0.45).h0Long,
    [params, evaluation, visualSeed],
  );
  const maxR = d.mesh[d.mesh.length - 1]?.r ?? 1;
  const maxQ = 3;
  const path = qPath(d.mesh, maxR, maxQ, 8, 6, 304, 70);
  const q1y = 6 + 70 - (1 / maxQ) * 70;

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{copy.obs.diskTitle}</h3>
      <p className={`font-mono text-xl tracking-wide uppercase ${NICHE_TONE[d.niche]}`}>
        {copy.obs.diskNiche[d.niche]}
      </p>
      <p className="text-pretty text-xs leading-relaxed text-fg-muted">
        {copy.obs.diskNicheHint[d.niche]} {copy.obs.diskHint}
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.diskQ}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{d.Q.toFixed(2)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.diskPitch}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{Math.round(d.pitchDeg)}°</dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.diskShear}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{d.shear.toFixed(2)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.diskPlummer}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{d.plummerA.toFixed(3)}</dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{copy.obs.diskH0}</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{h0Long}</dd>
        </div>
      </dl>
      <svg
        viewBox="0 0 320 96"
        className="h-auto w-full text-fg"
        role="img"
        aria-label={copy.obs.diskTitle}
      >
        <line x1="8" y1="76" x2="312" y2="76" stroke="currentColor" strokeOpacity="0.12" />
        <line
          x1="8"
          y1={q1y}
          x2="312"
          y2={q1y}
          stroke="currentColor"
          strokeOpacity={d.unstable > 0 ? 0.7 : 0.22}
          strokeDasharray="3 4"
        />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <p className="font-mono text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
        {copy.obs.diskQ1}
        {d.unstable > 0 ? ` · ${d.unstable}` : ""}
      </p>
    </section>
  );
}
