import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Copy } from "@/lib/universe/i18n";

type Props = {
  copy: Copy;
  onKeep: () => void;
  onClose: () => void;
};

export function HelpSheet({ copy, onKeep, onClose }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
        aria-labelledby="help-title"
        className="overlay-sheet relative z-10 max-h-[min(42rem,90dvh)] w-full max-w-lg overflow-y-auto rounded-t-[var(--radius-xl)] bg-bg-elevated px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-border)] sm:rounded-[var(--radius-xl)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="help-title"
            className="font-display text-2xl tracking-[-0.02em] text-fg"
          >
            {copy.helpTitle}
          </h2>
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
          {copy.helpIntro}
        </p>
        <ol className="mt-5 flex flex-col gap-3">
          {copy.helpItems.map((item, i) => {
            const last = i === copy.helpItems.length - 1;
            const body = (
              <>
                <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">
                  {String(i + 1).padStart(2, "0")} · {item.title}
                </p>
                <p className="mt-1.5 text-pretty text-sm leading-relaxed text-fg">
                  {item.body}
                </p>
              </>
            );
            return (
              <li key={item.title}>
                {last ? (
                  <button
                    type="button"
                    onClick={onKeep}
                    className="help-card w-full rounded-[var(--radius-lg)] px-4 py-3 text-left shadow-[var(--shadow-border)]"
                  >
                    {body}
                    <span className="mt-2 block font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">
                      {copy.keep.openCta}
                    </span>
                  </button>
                ) : (
                  <div className="help-card rounded-[var(--radius-lg)] px-4 py-3 shadow-[var(--shadow-border)]">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <p className="mt-5 font-mono text-[0.6875rem] leading-relaxed text-fg-subtle">
          {copy.shortcutsTitle}: {copy.shortcutsBody}
        </p>
      </div>
    </div>
  );
}
