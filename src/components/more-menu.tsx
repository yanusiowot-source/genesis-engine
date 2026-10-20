import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  onSwarm: () => void;
  onHighway: () => void;
  onBelt: () => void;
  onCluster: () => void;
  onDwarf: () => void;
  nudge?: boolean;
};

export function MoreMenu({ copy, onOurs, onSilicon, onDesert, onEternal, onSwarm, onHighway, onBelt, onCluster, onDwarf, nudge }: Props) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ left: number; width: number; bottom: number; maxH: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = root.current?.getBoundingClientRect();
      if (!r) return;
      const width = Math.min(288, window.innerWidth - 24);
      const left = Math.min(Math.max(12, r.right - width), window.innerWidth - width - 12);
      const maxH = Math.max(176, r.top - 16);
      setBox({ left, width, bottom: window.innerHeight - r.top + 8, maxH });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (root.current?.contains(target) || menu.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    const el = root.current;
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (el?.contains(next) || menu.current?.contains(next)) return;
      setOpen(false);
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
        className={cn(nudge && "nudge-ring")}
        aria-label={copy.skies}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="skies-menu"
        onClick={() => {
          haptic(8);
          setOpen((v) => !v);
        }}
      >
        <span>{copy.skies}</span>
        <ChevronUp
          className={cn(
            "size-4 transition-transform duration-[var(--motion-quick)] ease-[var(--ease-out)]",
            open ? "rotate-180" : "",
          )}
        />
      </Button>
      {open && box
        ? createPortal(
            <div
              ref={menu}
              id="skies-menu"
              role="menu"
              className={cn(
                "menu-pop overflow-y-auto overscroll-contain",
                "rounded-[var(--radius-md)] bg-bg-elevated py-1 shadow-[var(--shadow-border)]",
              )}
              style={{
                position: "fixed",
                left: box.left,
                width: box.width,
                bottom: box.bottom,
                maxHeight: box.maxH,
                zIndex: 60,
              }}
            >
              <p className="px-3 pt-2 pb-1 font-mono text-[0.6875rem] text-fg-subtle">
                {copy.skies}
              </p>
              <MenuItem label={copy.ours} onClick={() => pick(onOurs)} />
              <MenuItem label={copy.presetCluster} onClick={() => pick(onCluster)} />
              <MenuItem label={copy.presetDwarf} onClick={() => pick(onDwarf)} />
              <MenuItem label={copy.presetSilicon} onClick={() => pick(onSilicon)} />
              <MenuItem label={copy.presetEternal} onClick={() => pick(onEternal)} />
              <MenuItem label={copy.presetSwarm} onClick={() => pick(onSwarm)} />
              <MenuItem label={copy.presetHighway} onClick={() => pick(onHighway)} />
              <MenuItem label={copy.presetBelt} onClick={() => pick(onBelt)} />
              <MenuItem label={copy.presetDesert} onClick={() => pick(onDesert)} />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex min-h-11 w-full items-center whitespace-normal px-3 py-2 text-left text-sm leading-snug text-pretty text-fg transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)] hover:bg-bg-subtle"
    >
      {label}
    </button>
  );
}
