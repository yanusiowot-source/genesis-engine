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
      className="scripture-line flex min-h-11 w-full items-start gap-2 px-0.5 py-1 text-left"
    >
      <BookOpen className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      <span className="min-w-0 max-w-[68ch] flex-1">
        <span className="scripture-quote block font-display text-sm leading-snug text-pretty text-fg italic line-clamp-2">
          {passageLine(passage, locale)}
        </span>
        <span className="scripture-ref mt-0.5 block font-mono text-xs tracking-[0.12em] text-fg-muted uppercase">
          {passageRef(passage, locale)}
        </span>
      </span>
    </button>
  );
}
