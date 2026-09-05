import type { Copy } from "@/lib/universe/i18n";
import { compareToOurs, formatCompareLine, formatDelta } from "@/lib/universe/compare";
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

  const line = formatCompareLine(compareToOurs(params), copy);
  const rows = paramDeltas(params);
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{copy.compareTitle}</h3>
      {line ? <p className="text-pretty text-sm leading-relaxed text-fg-muted">{line}</p> : null}
      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => {
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
                {quiet ? "0" : formatDelta(row.delta)}
                <span className="ml-1 text-fg-subtle">{row.unit}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
