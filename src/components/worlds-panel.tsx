import { useMemo } from "react";
import type { Copy } from "@/lib/universe/i18n";
import { cosmicAgeGyr } from "@/lib/universe/observatory";
import { keplerPoint, systemOf, watchPlanets, WATCH_HOURS, type Planet } from "@/lib/universe/orbits";
import type { Evaluation, UniverseParams } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
  cosmicTime: number;
  visualSeed: number;
};

function span(aAu: number): string {
  if (aAu < 0.01) return aAu.toExponential(1);
  if (aAu < 1) return aAu.toFixed(3);
  return aAu.toFixed(2);
}

function clock(periodYr: number, yr: string, day: string): string {
  if (periodYr < 0.2) {
    const days = periodYr * 365.25;
    return `${days < 10 ? days.toFixed(1) : days.toFixed(0)} ${day}`;
  }
  const text = periodYr >= 100 ? periodYr.toFixed(0) : periodYr >= 10 ? periodYr.toFixed(1) : periodYr.toFixed(2);
  return `${text} ${yr}`;
}

function phaseDeg(planet: Planet): number {
  const point = keplerPoint(planet.aAu, planet.ecc, planet.longitude);
  const angle = Math.atan2(point.y, point.x);
  return (Math.round((angle * 180) / Math.PI) + 360) % 360;
}

export function WorldsPanel({ copy, params, evaluation, cosmicTime, visualSeed }: Props) {
  const age = cosmicAgeGyr(Math.round(cosmicTime * 40) / 40, params, evaluation);
  const system = useMemo(
    () => systemOf(params, evaluation, age, visualSeed),
    [params, evaluation, age, visualSeed],
  );
  const watch = useMemo(
    () => (system ? watchPlanets(system.planets, system.mass, WATCH_HOURS) : null),
    [system],
  );

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{copy.obs.worldsTitle}</h3>
      {system ? (
        <>
          <p className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.6875rem] tabular-nums text-fg-subtle">
            <span>
              {copy.obs.worldsHost} {system.mass.toFixed(2)} M☉
            </span>
            <span>{copy.obs.worldsStage[system.stage]}</span>
            <span>
              R★ {system.photosphereAu.toFixed(4)} {copy.obs.worldsAu}
            </span>
            {watch ? (
              <span>
                {watch.hours} {copy.obs.worldsHour} ΔE/E {watch.drift.toExponential(1)}
                {watch.impacts > 0 ? ` ${copy.obs.worldsImpacts} ${watch.impacts}` : ""}
              </span>
            ) : null}
          </p>
          <ul className="flex flex-col gap-3">
            {system.planets.map((planet, index) => (
              <li key={index} className="flex flex-col gap-1">
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[0.6875rem] tabular-nums text-fg">
                  <span className="text-fg-subtle">{index + 1}</span>
                  <span>
                    a {span(planet.aAu)} {copy.obs.worldsAu}
                  </span>
                  <span>P {clock(planet.periodYr, copy.obs.worldsYr, copy.obs.worldsDay)}</span>
                  <span>
                    {planet.massMe >= 10 ? planet.massMe.toFixed(0) : planet.massMe.toFixed(1)} M⊕
                  </span>
                  <span>
                    {planet.fate === "swallowed" ? copy.obs.worldsSwallowed : copy.obs.worldsBound}
                  </span>
                </div>
                <p className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[0.6875rem] tabular-nums text-fg-muted">
                  <span>e {planet.ecc.toFixed(2)}</span>
                  <span>
                    {copy.obs.worldsPhase} {phaseDeg(planet)}°
                  </span>
                  <span>
                    {copy.obs.worldsPull}{" "}
                    {(planet.pull.starAuYr2 > 0
                      ? planet.pull.othersAuYr2 / planet.pull.starAuYr2
                      : 0
                    ).toExponential(1)}
                  </span>
                  <span>{copy.obs.worldsEncounter[planet.encounter]}</span>
                </p>
                {planet.ring ? (
                  <p className="font-mono text-[0.6875rem] tabular-nums text-fg-muted">
                    {copy.obs.worldsRing} {span(planet.ring.innerAu)}–{span(planet.ring.outerAu)}{" "}
                    {copy.obs.worldsAu}
                  </p>
                ) : null}
                {planet.moons.length > 0 ? (
                  <ul className="flex flex-col gap-0.5 pl-4">
                    {planet.moons.map((moon, moonIndex) => (
                      <li
                        key={moonIndex}
                        className="flex flex-wrap gap-x-3 font-mono text-[0.6875rem] tabular-nums text-fg-muted"
                      >
                        <span>
                          {copy.obs.worldsMoon} {moonIndex + 1}
                        </span>
                        <span>
                          a {span(moon.aAu)} {copy.obs.worldsAu}
                        </span>
                        <span>P {clock(moon.periodYr, copy.obs.worldsYr, copy.obs.worldsDay)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-fg-subtle">{copy.obs.worldsEmpty}</p>
      )}
      <p className="text-pretty text-xs leading-relaxed text-fg-muted">{copy.obs.worldsHint}</p>
    </section>
  );
}
