import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { haptic } from "@/lib/universe/haptic";
import { cn } from "@/lib/utils";

export type SegmentItem<T extends string> = {
  id: T;
  label: string;
  title?: string;
  icon: LucideIcon;
};

type Pill = { x: number; y: number; w: number; h: number };

type Props<T extends string> = {
  items: SegmentItem<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  stacked?: boolean;
  collapseLabel?: boolean;
  nudge?: T | null;
  scroll?: boolean;
  className?: string;
};

export function Segmented<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  stacked = false,
  collapseLabel = false,
  nudge = null,
  scroll = false,
  className,
}: Props<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<Pill>({ x: 0, y: 0, w: 0, h: 0 });
  const [ready, setReady] = useState(false);

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(`[data-seg="${CSS.escape(value)}"]`);
    if (!el) return;
    const next = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    setPill(next);
    setReady(true);
  }, [value]);

  useLayoutEffect(() => {
    measure();
  }, [measure, items]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <div
      ref={rootRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative flex",
        stacked ? "gap-0 p-1" : "h-11 gap-0.5 p-0.5",
        scroll && "overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "rounded-[var(--radius-sm)] bg-bg-elevated/70",
        className,
      )}
    >
      <span
        aria-hidden
        className="seg-pill pointer-events-none absolute rounded-[var(--radius-lg)] bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]"
        data-ready={ready ? "1" : "0"}
        style={{
          width: pill.w,
          height: pill.h,
          transform: `translate(${pill.x}px, ${pill.y}px)`,
        }}
      />
      {items.map(({ id, label, title, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            data-seg={id}
            aria-selected={active}
            aria-label={label}
            title={title ?? label}
            onClick={() => {
              haptic(8);
              onChange(id);
            }}
            className={cn(
              "relative z-[1] inline-flex min-w-11 items-center justify-center",
              "rounded-[var(--radius-xs)] text-sm font-medium",
              "transition-[color] duration-[var(--motion-quick)] ease-[var(--ease-out)]",
              stacked
                ? cn("min-w-0 flex-1 flex-col gap-0.5 px-0.5", collapseLabel ? "h-11 sm:h-12" : "h-12")
                : cn("h-full min-h-0 gap-1 px-2", scroll ? "shrink-0" : "flex-1"),
              active ? "text-accent" : "text-fg-muted hover:text-fg",
              nudge === id && "nudge-ring",
            )}
            data-nudge={nudge === id ? id : undefined}
          >
            <Icon className={stacked ? "size-5" : "size-4"} strokeWidth={active ? 2.2 : 1.8} />
            <span
              className={cn(
                "max-w-full",
                !scroll && "truncate",
                collapseLabel && "hidden sm:inline",
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
