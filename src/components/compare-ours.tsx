import type { Copy } from "@/lib/universe/i18n";
import { compareToOurs, formatCompareLine } from "@/lib/universe/compare";
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

  const line = formatCompareLine(compareToOurs(params), copy);
  if (!line) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{copy.compareTitle}</h3>
      <p className="text-pretty text-sm leading-relaxed text-fg-muted">{line}</p>
    </section>
  );
}
