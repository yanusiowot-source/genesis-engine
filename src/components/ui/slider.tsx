import * as SliderPrimitive from "@radix-ui/react-slider";
import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

function Slider({
  className,
  marker,
  trackClassName,
  trackStyle,
  rangeClassName,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root> & {
  marker?: number;
  trackClassName?: string;
  trackStyle?: CSSProperties;
  rangeClassName?: string;
}) {
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const markerPct =
    marker === undefined ? null : ((marker - min) / (max - min)) * 100;

  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex h-11 w-full touch-none items-center select-none",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn("relative h-1 w-full grow overflow-visible rounded-full bg-bg-subtle", trackClassName)}
        style={trackStyle}
      >
        <SliderPrimitive.Range className={cn("absolute h-full rounded-full bg-accent/70", rangeClassName)} />
        {markerPct !== null ? (
          <span
            aria-hidden
            className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg-subtle"
            style={{ left: `${markerPct}%` }}
          />
        ) : null}
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={
          "block size-6 min-h-[24px] min-w-[24px] rounded-full bg-accent shadow-[var(--shadow-border)] " +
          "outline-none focus-visible:ring-2 focus-visible:ring-accent/50 " +
          "disabled:pointer-events-none"
        }
      />
    </SliderPrimitive.Root>
  );
}

export { Slider };
