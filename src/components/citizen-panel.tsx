import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  SPECTRAL_TYPES,
  binColor,
  gradeSpectrum,
  gradeTransit,
  loadCitizenScore,
  makeSpectrumTask,
  makeTransitTask,
  type CitizenScore,
  type SpectralType,
} from "@/lib/universe/citizen";
import { haptic } from "@/lib/universe/haptic";
import type { Copy } from "@/lib/universe/i18n";
import { randomSeed } from "@/lib/universe/rng";
import type { UniverseParams } from "@/lib/universe/types";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  params: UniverseParams;
  visualSeed: number;
};

export function CitizenPanel({ copy, params, visualSeed }: Props) {
  const [score, setScore] = useState<CitizenScore>(() =>
    typeof window === "undefined" ? { spectrumTried: 0, spectrumOk: 0, transitTried: 0, transitOk: 0 } : loadCitizenScore(),
  );
  const [specSeed, setSpecSeed] = useState(() => visualSeed ^ 0x51);
  const [trSeed, setTrSeed] = useState(() => visualSeed ^ 0xa7);
  const [specGuess, setSpecGuess] = useState<SpectralType | null>(null);
  const [trGuess, setTrGuess] = useState<boolean | null>(null);

  const spectrum = useMemo(
    () => makeSpectrumTask(specSeed, params),
    [specSeed, params],
  );
  const transit = useMemo(() => makeTransitTask(trSeed, params), [trSeed, params]);

  const specLocked = specGuess !== null;
  const trLocked = trGuess !== null;

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-medium">{copy.citizen.title}</h3>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">
          {copy.citizen.hint}
        </p>
        <p className="mt-2 font-mono text-[0.6875rem] tabular-nums text-fg-subtle uppercase">
          {copy.citizen.score} {score.spectrumOk + score.transitOk}/
          {score.spectrumTried + score.transitTried || 0}
        </p>
      </div>

      <div>
        <h4 className="text-sm font-medium">{copy.citizen.spectrum}</h4>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">
          {copy.citizen.spectrumAsk}
        </p>
        <div
          className="mt-3 flex h-16 items-end gap-px rounded-[var(--radius-sm)] bg-bg px-1 pb-1 pt-2"
          aria-hidden
        >
          {spectrum.bins.map((v, i) => (
            <span
              key={i}
              className="min-w-0 flex-1 rounded-[1px]"
              style={{
                height: `${Math.max(8, v * 100)}%`,
                background: binColor(i, spectrum.bins.length),
                opacity: 0.55 + v * 0.45,
              }}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1 sm:grid-cols-7">
          {SPECTRAL_TYPES.map((t) => {
            const picked = specGuess === t;
            const reveal = specLocked && t === spectrum.type;
            return (
              <button
                key={t}
                type="button"
                disabled={specLocked}
                onClick={() => {
                  haptic(8);
                  const graded = gradeSpectrum(score, spectrum, t);
                  setScore(graded.next);
                  setSpecGuess(t);
                }}
                className={cn(
                  "h-11 rounded-[var(--radius-xs)] text-[0.6875rem] font-medium",
                  "shadow-[var(--shadow-border)]",
                  reveal
                    ? "bg-life/20 text-life"
                    : picked
                      ? "bg-sterile/20 text-sterile"
                      : "text-fg-muted hover:text-fg",
                )}
                aria-label={copy.citizen.types[t]}
              >
                {t}
              </button>
            );
          })}
        </div>
        {specLocked ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-sm text-fg-muted">
              {specGuess === spectrum.type ? copy.citizen.correct : copy.citizen.wrong}
              <span className="ml-2 font-mono text-xs text-fg-subtle">
                {" "}
                {spectrum.type} · {spectrum.teff} K
              </span>
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSpecGuess(null);
                setSpecSeed(randomSeed());
              }}
            >
              {copy.citizen.next}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="h-px bg-border" />

      <div>
        <h4 className="text-sm font-medium">{copy.citizen.transit}</h4>
        <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">
          {copy.citizen.transitAsk}
        </p>
        <TransitPlot samples={transit.samples} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            disabled={trLocked}
            onClick={() => {
              haptic(8);
              const graded = gradeTransit(score, transit, true);
              setScore(graded.next);
              setTrGuess(true);
            }}
          >
            {copy.citizen.hasTransit}
          </Button>
          <Button
            variant="outline"
            disabled={trLocked}
            onClick={() => {
              haptic(8);
              const graded = gradeTransit(score, transit, false);
              setScore(graded.next);
              setTrGuess(false);
            }}
          >
            {copy.citizen.noTransit}
          </Button>
        </div>
        {trLocked ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-sm text-fg-muted">
              {trGuess === transit.hasTransit
                ? copy.citizen.correct
                : transit.hasTransit
                  ? copy.citizen.hasTransit
                  : copy.citizen.noTransit}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTrGuess(null);
                setTrSeed(randomSeed());
              }}
            >
              {copy.citizen.next}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TransitPlot({ samples }: { samples: number[] }) {
  const w = 280;
  const h = 72;
  const min = 0.96;
  const max = 1.02;
  const pts = samples
    .map((v, i) => {
      const x = (i / (samples.length - 1)) * w;
      const y = h - ((v - min) / (max - min)) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-16 w-full text-fg" role="img">
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
