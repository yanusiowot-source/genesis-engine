import type { Copy } from "@/lib/universe/i18n";
import { isOurParams, paramDeltas } from "@/lib/universe/physics";
import type { UniverseParams } from "@/lib/universe/types";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  params: UniverseParams;
};

export function CompareOurs({ copy, params }: Props) {
  if (isOurParams(params)) {
    return (
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{copy.compareTitle}</h3>
        <p className="text-pretty text-sm leading-relaxed text-fg-muted">{copy.thisIsOurs}</p>
      </section>
    );
  }

  const rows = paramDeltas(params);
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{copy.compareTitle}</h3>
      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => {
          const digits = Math.abs(row.delta) < 0.01 && row.delta !== 0 ? 3 : 2;
          const sign = row.delta > 0 ? "+" : "";
          const quiet = Math.abs(row.delta) < 1e-6;
          return (
            <li key={row.key} className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-fg-muted">{copy.params[row.key].label}</span>
              <span
                className={cn(
                  "font-mono text-xs tabular-nums",
                  quiet ? "text-fg-subtle" : "text-fg",
                )}
              >
                {quiet ? "0" : `${sign}${row.delta.toFixed(digits)}`}
                <span className="ml-1 text-fg-subtle">{row.unit}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
