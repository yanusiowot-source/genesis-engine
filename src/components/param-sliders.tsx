import { Slider } from "@/components/ui/slider";
import type { Copy } from "@/lib/universe/i18n";
import { OUR_UNIVERSE, PARAM_META } from "@/lib/universe/physics";
import type { ParamKey, UniverseParams } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  params: UniverseParams;
  onChange: (key: ParamKey, value: number) => void;
};

export function ParamSliders({ copy, params, onChange }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {PARAM_META.map((meta) => {
        const value = params[meta.key];
        const digits = meta.step < 0.01 ? 3 : 2;
        const text = copy.params[meta.key];
        return (
          <label key={meta.key} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-fg">
                {text.label}
              </span>
              <span className="font-mono text-xs tabular-nums text-fg-muted">
                {value.toFixed(digits)}
                <span className="ml-1 text-fg-subtle">{meta.unit}</span>
              </span>
            </div>
            <Slider
              min={meta.min}
              max={meta.max}
              step={meta.step}
              value={[value]}
              marker={OUR_UNIVERSE[meta.key]}
              onValueChange={([v]) => {
                if (typeof v !== "number") return;
                const next = Number(v.toFixed(digits));
                if (Math.abs(next - value) < meta.step / 2) return;
                onChange(meta.key, next);
              }}
              aria-label={text.label}
              title={text.hint}
            />
            <div className="flex justify-between text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
              <span>{text.low}</span>
              <span>{text.high}</span>
            </div>
            <p className="text-pretty text-xs leading-relaxed text-fg-muted">{text.hint}</p>
          </label>
        );
      })}
    </div>
  );
}
