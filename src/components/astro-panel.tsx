import type { Copy } from "@/lib/universe/i18n";
import { formatGyr, formatSci } from "@/lib/universe/format";
import { derivedAstro } from "@/lib/universe/physics";
import type { Evaluation, UniverseParams } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
};

function formatOmegaK(k: number, flat: string): string {
  if (Math.abs(k) < 0.015) return `0.00 · ${flat}`;
  return k.toFixed(2);
}

export function AstroPanel({ copy, params, evaluation }: Props) {
  const d = derivedAstro(params, evaluation);
  const rows = [
    { k: copy.astroHubble, v: `${d.hubble.toFixed(1)} km/s/Mpc` },
    { k: copy.astroAge, v: formatGyr(d.ageGyr) },
    { k: copy.astroGalaxy, v: `${d.galaxyKpc.toFixed(1)} kpc` },
    { k: copy.astroSfr, v: `${d.sfr.toFixed(2)} M☉/yr` },
    { k: copy.astroRho, v: `${formatSci(d.rhoCrit)} kg/m³` },
    { k: copy.astroCurvature, v: formatOmegaK(d.omegaK, copy.astroFlat) },
  ];
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{copy.astroTitle}</h3>
      <p className="text-pretty text-xs leading-relaxed text-fg-muted">{copy.astroHint}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {rows.map((s) => (
          <div key={s.k} className="min-w-0">
            <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{s.k}</dt>
            <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{s.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
