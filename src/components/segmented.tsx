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
  wrap?: boolean;
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
  wrap = false,
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
    const rootBox = root.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const next = {
      x: box.left - rootBox.left,
      y: box.top - rootBox.top,
      w: box.width,
      h: box.height,
    };
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
      onKeyDown={(event) => {
        const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
        const back = event.key === "ArrowLeft" || event.key === "ArrowUp";
        if (!forward && !back) return;
        event.preventDefault();
        const index = items.findIndex((item) => item.id === value);
        const next = items[(index + (forward ? 1 : -1) + items.length) % items.length];
        if (!next) return;
        onChange(next.id);
        const root = rootRef.current;
        if (!root) return;
        window.requestAnimationFrame(() => {
          root.querySelector<HTMLElement>(`[data-seg="${CSS.escape(next.id)}"]`)?.focus();
        });
      }}
      className={cn(
        "relative flex",
        stacked ? "gap-0 p-1" : "h-11 gap-0.5 p-0.5",
        scroll && "overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        wrap && "flex-wrap",
        "rounded-[var(--radius-sm)] bg-bg-elevated/70",
        className,
      )}
    >
      <span
        aria-hidden
        className="seg-pill pointer-events-none absolute left-0 top-0 rounded-[var(--radius-lg)] bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]"
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
            tabIndex={active ? 0 : -1}
            title={title}
            onClick={() => {
              haptic(8);
              onChange(id);
            }}
            className={cn(
              "relative z-[1] inline-flex min-w-11 items-center justify-center",
              "rounded-[var(--radius-xs)] text-sm font-medium",
              "transition-[color] duration-[var(--motion-quick)] ease-[var(--ease-out)]",
              stacked
                ? cn(
                    "h-auto min-h-12 min-w-0 flex-1 flex-col gap-0.5 px-1 py-1.5",
                    collapseLabel && "h-11 py-0 sm:h-auto sm:min-h-12 sm:py-1.5",
                  )
                : cn(
                  "min-h-0 min-w-0 gap-1 px-1.5",
                  wrap
                    ? "h-auto min-h-11 w-[calc(50%-0.125rem)] max-w-full flex-none py-1.5 text-xs sm:w-auto sm:min-w-[9rem] sm:max-w-full sm:flex-1 sm:basis-[9rem] sm:py-1.5 sm:text-sm"
                    : scroll
                      ? "h-11 shrink-0"
                      : "h-11 flex-1",
                ),
              active ? "text-accent" : "text-fg-muted hover:text-fg",
              nudge === id && "nudge-ring",
            )}
            data-nudge={nudge === id ? id : undefined}
          >
            <Icon className={stacked ? "size-5" : "size-4"} strokeWidth={active ? 2.2 : 1.8} />
            <span
              className={cn(
                wrap ? "whitespace-normal text-center leading-tight" : "min-w-0 max-w-full truncate text-center leading-tight",
                collapseLabel && "hidden sm:block",
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
