import { BookOpen } from "lucide-react";
import type { Copy } from "@/lib/universe/i18n";
import { passageLine, passageRef, type Passage } from "@/lib/universe/scripture";

type Props = {
  copy: Copy;
  locale: string;
  passage: Passage;
  onOpen: () => void;
};

export function ScriptureLine({ copy, locale, passage, onOpen }: Props) {
  return (
    <button
      type="button"
      data-scripture={passage.id}
      onClick={onOpen}
      aria-label={`${copy.scripture.open}. ${passageRef(passage, locale)}`}
      className="scripture-line mt-1 flex min-h-11 w-full max-w-md items-center gap-2 rounded-[var(--radius-sm)] bg-transparent p-0 text-left"
    >
      <BookOpen className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
      <span className="min-w-0">
        <span className="block font-display text-sm leading-snug text-pretty text-fg italic line-clamp-2">
          {passageLine(passage, locale)}
        </span>
        <span className="mt-0.5 block font-mono text-xs tracking-[0.12em] text-fg-muted uppercase">
          {passageRef(passage, locale)}
        </span>
      </span>
    </button>
  );
}
