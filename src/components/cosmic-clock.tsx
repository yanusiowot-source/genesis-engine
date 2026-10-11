import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatGyr, formatKelvin } from "@/lib/universe/format";
import { haptic } from "@/lib/universe/haptic";
import type { Copy } from "@/lib/universe/i18n";
import {
  cosmicAgeGyr,
  cmbTempK,
  EPOCH_INK,
  EPOCH_MARKS,
  epochJumpT,
  epochShown,
  epochTickT,
  nowMarker,
} from "@/lib/universe/observatory";
import { clamp } from "@/lib/universe/rng";
import type { CosmicEpoch, Evaluation, UniverseParams } from "@/lib/universe/types";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  params: UniverseParams;
  evaluation: Evaluation;
  value: number;
  evolving: boolean;
  liveRef?: { current: number };
  onChange: (t: number) => void;
  onToggleEvolve: () => void;
  onEggLight?: () => void;
};

const JUMPS = ["inflation", "reionization", "stellar", "heatDeath"] as const;

export function CosmicClock({
  copy,
  params,
  evaluation,
  value,
  evolving,
  liveRef,
  onChange,
  onToggleEvolve,
  onEggLight,
}: Props) {
  const [live, setLive] = useState(value);
  useEffect(() => {
    if (!evolving || !liveRef) {
      setLive(value);
      return;
    }
    setLive(liveRef.current);
    const id = window.setInterval(() => {
      setLive(liveRef.current);
    }, 64);
    return () => window.clearInterval(id);
  }, [evolving, liveRef, value]);
  const shown = evolving ? live : value;
  const epoch = epochShown(shown);
  const now = nowMarker(params, evaluation);
  const age = cosmicAgeGyr(shown, params, evaluation);
  const cmb = cmbTempK(shown, params);
  const ink = EPOCH_INK[epoch];
  const track = `linear-gradient(90deg, ${EPOCH_MARKS.map((m) => `${EPOCH_INK[m.id]} ${(m.t * 100).toFixed(1)}%`).join(", ")})`;
  const lastJump = useRef<CosmicEpoch | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const raw = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 80 : 1);
      const step = clamp(raw / 700, -0.06, 0.06);
      if (step === 0) return;
      onChangeRef.current(clamp(shownRef.current + step, 0, 1));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <section
      ref={rootRef}
      className="flex flex-col gap-1"
      data-hud-clock
      data-epoch={epoch}
      data-evolving={evolving ? "1" : "0"}
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => {
            haptic(10);
            onToggleEvolve();
          }}
          aria-label={evolving ? copy.obs.evolving : copy.obs.evolve}
          aria-pressed={evolving}
        >
          <span className="relative inline-flex size-4">
            <Pause
              className={cn(
                "absolute inset-0 size-4 transition-[opacity,transform,filter] duration-[var(--motion-fast)] ease-[var(--ease-in-out)]",
                evolving ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]",
              )}
            />
            <Play
              className={cn(
                "ml-px size-4 transition-[opacity,transform,filter] duration-[var(--motion-fast)] ease-[var(--ease-in-out)]",
                evolving ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-0",
              )}
            />
          </span>
        </Button>
        <div className="min-w-0 flex-1">
          <p
            className="epoch-ink mb-0.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 font-mono text-xs uppercase"
            style={{ color: ink }}
          >
            <span className="min-w-0 text-pretty">{copy.obs.epochs[epoch]}</span>
            <span className="shrink-0 tabular-nums tracking-normal">
              {formatGyr(age)}
              <span className="text-fg-subtle"> · </span>
              {formatKelvin(cmb)}
            </span>
          </p>
          <div className="relative">
            <Slider
              min={0}
              max={1}
              step={0.002}
              value={[shown]}
              trackStyle={{ background: track }}
              rangeClassName="bg-white/25"
              onValueChange={([v]) => {
                if (typeof v !== "number") return;
                onChange(v);
              }}
              aria-label={copy.obs.clock}
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-11">
              {EPOCH_MARKS.map((m) => {
                const active = epoch === m.id;
                const left =
                  m.t <= 0.01 ? "0.75%" : m.t >= 0.98 ? "99.25%" : `${m.t * 100}%`;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-label={copy.obs.epochs[m.id]}
                    aria-pressed={active}
                    title={copy.obs.epochs[m.id]}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => {
                      haptic(8);
                      if (m.id === "inflation" && (active || lastJump.current === "inflation")) {
                        onEggLight?.();
                      }
                      lastJump.current = m.id;
                      onChange(epochTickT(m.id));
                    }}
                    className="pointer-events-auto absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ left }}
                  >
                    <span
                      aria-hidden
                      className="epoch-ink absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{ background: EPOCH_INK[m.id], opacity: active ? 1 : 0.55 }}
                    />
                  </button>
                );
              })}
              <button
                type="button"
                aria-label={copy.obs.now}
                aria-pressed={Math.abs(shown - now) < 0.02}
                title={copy.obs.now}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => {
                  haptic(8);
                  onChange(now);
                }}
                className="pointer-events-auto absolute top-1/2 z-[1] size-5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: `${now * 100}%` }}
              >
                <span
                  aria-hidden
                  className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[var(--shadow-border)]"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="hud-actions" role="group" aria-label={copy.obs.epochs[epoch]} data-hud-tall>
        {JUMPS.map((id) => {
          const active = epoch === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                haptic(8);
                if (id === "inflation" && (active || lastJump.current === "inflation")) {
                  onEggLight?.();
                }
                lastJump.current = id;
                onChange(epochJumpT(id, params, evaluation));
              }}
              className={cn(
                "epoch-ink h-11 min-h-11 rounded-[var(--radius-xs)] px-2",
                "text-xs font-medium whitespace-nowrap",
                active ? "text-fg" : "text-fg-muted hover:text-fg",
              )}
              style={active ? { backgroundColor: `${ink}33`, color: ink } : undefined}
              aria-pressed={active}
            >
              {copy.obs.jumps[id]}
            </button>
          );
        })}
      </div>
    </section>
  );
}

