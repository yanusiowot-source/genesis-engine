import type { Copy } from "@/lib/universe/i18n";
import { compareLines, compareToOurs } from "@/lib/universe/compare";
import { isOurParams } from "@/lib/universe/physics";
import type { UniverseParams } from "@/lib/universe/types";

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

  const lines = compareLines(compareToOurs(params), copy);
  if (lines.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{copy.compareTitle}</h3>
      <ul className="flex flex-col gap-1.5">
        {lines.map((line, index) => (
          <li
            key={line}
            className={
              index === 0
                ? "text-pretty text-sm leading-relaxed text-fg"
                : "text-pretty text-sm leading-relaxed text-fg-muted"
            }
          >
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
