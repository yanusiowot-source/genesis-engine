import { useEffect } from "react";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Copy } from "@/lib/universe/i18n";
import {
  PASSAGES,
  THEME_LABEL,
  THEME_ORDER,
  passageText,
  passageUrl,
  passageRef,
  tongueOf,
  type PassageId,
} from "@/lib/universe/scripture";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  locale: string;
  currentId: PassageId;
  onClose: () => void;
};

export function ScriptureSheet({ copy, locale, currentId, onClose }: Props) {
  const tongue = tongueOf(locale);
  const labels = THEME_LABEL[tongue];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const el = document.getElementById(`canon-${currentId}`);
    el?.scrollIntoView({ block: "nearest" });
    return () => window.removeEventListener("keydown", onKey);
  }, [currentId, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={copy.closePanel}
        className="overlay-scrim absolute inset-0 bg-bg/80"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="canon-title"
        className="overlay-sheet relative z-10 max-h-[min(42rem,90dvh)] w-full max-w-lg overflow-y-auto rounded-t-[var(--radius-xl)] bg-bg-elevated px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-border)] sm:rounded-[var(--radius-xl)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
              {copy.scripture.kicker}
            </p>
            <h2
              id="canon-title"
              className="mt-1 font-display text-2xl tracking-[-0.02em] text-fg"
            >
              {copy.scripture.title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            aria-label={copy.closePanel}
            autoFocus
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-fg-muted">
          {copy.scripture.intro}
        </p>
        <ol className="mt-5 flex flex-col gap-2">
          {PASSAGES.slice()
            .sort(
              (a, b) =>
                THEME_ORDER.indexOf(a.theme) - THEME_ORDER.indexOf(b.theme),
            )
            .map((passage) => {
              const active = passage.id === currentId;
              return (
                <li
                  key={passage.id}
                  id={`canon-${passage.id}`}
                  className={cn(
                    "rounded-[var(--radius-lg)] px-4 py-3 shadow-[var(--shadow-border)]",
                    active ? "bg-bg-subtle" : "help-card",
                  )}
                >
                  <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">
                    {labels[passage.theme]} · {passageRef(passage, locale)}
                  </p>
                  <p className="mt-1.5 font-display text-sm leading-relaxed text-pretty text-fg italic">
                    {passageText(passage, locale)}
                  </p>
                  <a
                    href={passageUrl(passage, locale)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.12em] text-fg-subtle uppercase"
                  >
                    <ExternalLink className="size-3.5" aria-hidden />
                    {copy.scripture.source}
                  </a>
                </li>
              );
            })}
        </ol>
        <p className="mt-5 font-mono text-[0.6875rem] leading-relaxed text-fg-subtle">
          {copy.scripture.hint}
        </p>
      </div>
    </div>
  );
}
