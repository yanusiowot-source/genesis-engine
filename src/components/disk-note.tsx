import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Copy } from "@/lib/universe/i18n";
import type { DiskNiche } from "@/lib/universe/types";

type Props = {
  copy: Copy;
  q: number;
  niche: DiskNiche;
  onClose: () => void;
};

export function DiskNote({ copy, q, niche, onClose }: Props) {
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
        aria-labelledby="disk-q-title"
        className="overlay-sheet relative z-10 max-h-[min(32rem,90dvh)] w-full max-w-md overflow-y-auto rounded-t-[var(--radius-xl)] bg-bg-elevated px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-border)] sm:rounded-[var(--radius-xl)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">{copy.diskAsk}</p>
            <h2 id="disk-q-title" className="mt-1 font-display text-2xl tracking-[-0.02em] text-fg">
              {copy.obs.diskQ} {q.toFixed(1)}
              <span className="text-fg-muted"> · {copy.obs.diskNiche[niche]}</span>
            </h2>
          </div>
          <Button variant="ghost" size="icon" className="size-11 shrink-0" aria-label={copy.closePanel} autoFocus onClick={onClose}>
            <X />
          </Button>
        </div>
        <p className="mt-4 text-pretty text-sm leading-relaxed text-fg">{copy.obs.diskNicheHint[niche]}</p>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-muted">{copy.diskNote}</p>
      </div>
    </div>
  );
}
