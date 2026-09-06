import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { formatGyr } from "@/lib/universe/format";
import { haptic } from "@/lib/universe/haptic";
import type { Copy } from "@/lib/universe/i18n";
import {
  cosmicAgeGyr,
  EPOCH_MARKS,
  epochBlend,
  nowMarker,
} from "@/lib/universe/observatory";
import type { Evaluation, UniverseParams } from "@/lib/universe/types";
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
  const blend = epochBlend(shown);
  const epoch = blend.mix >= 0.5 ? blend.to : blend.from;
  const now = nowMarker(params, evaluation);
  const age = cosmicAgeGyr(shown, params, evaluation);
  const lastJump = useRef<(typeof JUMPS)[number] | null>(null);

  return (
    <section
      className="flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-bg-elevated/80 px-3 py-2 shadow-[var(--shadow-border)]"
      data-hud-clock
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            haptic(10);
            onToggleEvolve();
          }}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-xs)] text-fg transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)] hover:bg-bg-subtle"
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
                "size-4 transition-[opacity,transform,filter] duration-[var(--motion-fast)] ease-[var(--ease-in-out)]",
                evolving ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-0",
              )}
            />
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-medium">{copy.obs.clock}</h3>
            <p
              key={epoch}
              className="hud-swap truncate font-mono text-[0.6875rem] tracking-wide text-fg-muted uppercase"
            >
              {copy.obs.epochs[epoch]}
            </p>
          </div>
          <div className="relative">
            <Slider
              min={0}
              max={1}
              step={0.002}
              value={[shown]}
              marker={now}
              onValueChange={([v]) => {
                if (typeof v !== "number") return;
                onChange(v);
              }}
              aria-label={copy.obs.clock}
            />
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2">
              {EPOCH_MARKS.filter((m) => m.t > 0.02 && m.t < 0.98).map((m) => (
                <span
                  key={m.id}
                  className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg-subtle/70"
                  style={{ left: `${m.t * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-1" role="group" aria-label={copy.obs.epochs[epoch]} data-hud-tall>
        {JUMPS.map((id) => {
          const mark = EPOCH_MARKS.find((m) => m.id === id);
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
                if (mark) onChange(mark.t);
              }}
              className={cn(
                "h-11 min-h-11 min-w-0 flex-1 truncate rounded-[var(--radius-xs)] px-1",
                "text-[0.6875rem] font-medium tracking-wide",
                "transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                active ? "bg-bg-subtle text-fg" : "text-fg-subtle hover:text-fg",
              )}
              aria-pressed={active}
            >
              {copy.obs.jumps[id]}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between gap-3 font-mono text-[0.6875rem] tabular-nums text-fg-subtle" data-hud-tall>
        <span>{formatGyr(age)}</span>
        <span>{copy.obs.now}</span>
      </div>
    </section>
  );
}
