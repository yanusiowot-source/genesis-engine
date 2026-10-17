import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Copy } from "@/lib/universe/i18n";
import type { Fate } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  fate: Fate;
  onClose: () => void;
};

export function FateNote({ copy, fate, onClose }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button type="button" aria-label={copy.closePanel} className="overlay-scrim absolute inset-0 bg-bg/80" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fate-note-title"
        className="overlay-sheet relative z-10 max-h-[min(32rem,90dvh)] w-full max-w-md overflow-y-auto rounded-t-[var(--radius-xl)] bg-bg-elevated px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-border)] sm:rounded-[var(--radius-xl)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">{copy.fateAsk}</p>
            <h2 id="fate-note-title" className="mt-1 font-display text-2xl tracking-[-0.02em] text-fg">
              {copy.fateLabel[fate]}
            </h2>
          </div>
          <Button variant="ghost" size="icon" className="size-11 shrink-0" aria-label={copy.closePanel} autoFocus onClick={onClose}>
            <X />
          </Button>
        </div>
        <p className="mt-4 text-pretty text-sm leading-relaxed text-fg">{copy.fateCopy[fate]}</p>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-muted">{copy.fateNote}</p>
      </div>
    </div>
  );
}
