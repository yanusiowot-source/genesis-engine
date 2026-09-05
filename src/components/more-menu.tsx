import { useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/universe/haptic";
import type { Copy } from "@/lib/universe/i18n";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  onOurs: () => void;
  onSilicon: () => void;
  onDesert: () => void;
  onEternal: () => void;
  compact?: boolean;
};

export function MoreMenu({ copy, onOurs, onSilicon, onDesert, onEternal, compact }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    const el = root.current;
    const onFocusOut = (event: FocusEvent) => {
      if (!el?.contains(event.relatedTarget as Node)) setOpen(false);
    };
    el?.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
      el?.removeEventListener("focusout", onFocusOut);
    };
  }, [open]);

  const pick = (fn: () => void) => {
    haptic(8);
    fn();
    setOpen(false);
  };

  return (
    <div ref={root} className="relative shrink-0">
      <Button
        variant="outline"
        className={cn("h-11 gap-1.5", compact ? "w-11 px-0 sm:w-auto sm:px-3" : "px-3")}
        aria-label={copy.skies}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="skies-menu"
        onClick={() => {
          haptic(8);
          setOpen((v) => !v);
        }}
      >
        <span className={cn(compact && "hidden sm:inline")}>{copy.skies}</span>
        <ChevronUp
          className={cn(
            "size-4 transition-transform duration-[var(--motion-quick)] ease-[var(--ease-out)]",
            open ? "rotate-180" : "",
          )}
        />
      </Button>
      {open ? (
        <div
          id="skies-menu"
          role="menu"
          className={cn(
            "menu-pop absolute right-0 bottom-full z-20 mb-2 min-w-52 overflow-hidden",
            "rounded-[var(--radius-md)] bg-bg-elevated py-1 shadow-[var(--shadow-border)]",
          )}
        >
          <p className="px-3 pt-2 pb-1 font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
            {copy.skies}
          </p>
          <MenuItem label={copy.ours} onClick={() => pick(onOurs)} />
          <MenuItem label={copy.presetSilicon} onClick={() => pick(onSilicon)} />
          <MenuItem label={copy.presetEternal} onClick={() => pick(onEternal)} />
          <MenuItem label={copy.presetDesert} onClick={() => pick(onDesert)} />
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex min-h-11 w-full items-center px-3 text-left text-sm text-fg transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)] hover:bg-bg-subtle"
    >
      {label}
    </button>
  );
}
