import { useEffect } from "react";
import { X } from "lucide-react";
import { KeepDesk } from "@/components/keep-desk";
import { Button } from "@/components/ui/button";
import type { Copy } from "@/lib/universe/i18n";

type Props = {
  copy: Copy;
  onClose: () => void;
};

export function KeepSheet({ copy, onClose }: Props) {
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
        aria-labelledby="keep-title"
        className="overlay-sheet relative z-10 max-h-[min(44rem,92dvh)] w-full max-w-md overflow-y-auto rounded-t-[var(--radius-xl)] bg-bg-elevated px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-border)] sm:rounded-[var(--radius-xl)]"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-10 size-11"
          aria-label={copy.closePanel}
          onClick={onClose}
        >
          <X />
        </Button>
        <KeepDesk copy={copy} compact />
      </div>
    </div>
  );
}
