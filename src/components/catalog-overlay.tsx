import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Copy } from "@/lib/universe/i18n";
import type { CatalogResult, CatalogStar } from "@/lib/universe/mast";
import { cn } from "@/lib/utils";

type OkCatalog = Extract<CatalogResult, { ok: true }>;

type Props = {
  copy: Copy;
  catalog: OkCatalog;
  onClose: () => void;
};

export function CatalogOverlay({ copy, catalog, onClose }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label={copy.laws.plate}
      className="absolute top-28 left-4 z-20 w-64 max-w-[calc(100vw-2rem)] rounded-[var(--radius-md)] bg-bg-elevated/90 p-3 shadow-[var(--shadow-border)] sm:left-auto sm:right-8"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
            {copy.laws.plate}
          </p>
          <p className="mt-1 text-pretty text-[0.6875rem] leading-relaxed text-fg-muted">
            {copy.laws.plateHint}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          aria-label={copy.laws.hideSky}
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      <CatalogScatter
        catalog={catalog}
        className="mt-3 h-36 w-full"
        label={`${copy.laws.plate} · ${catalog.stars.length}`}
      />
      <p className="mt-2 font-mono text-[0.6875rem] tabular-nums text-fg-subtle">
        {catalog.stars.length} · {catalog.ra.toFixed(3)} {catalog.dec.toFixed(3)}
      </p>
    </div>
  );
}

export function CatalogScatter({
  catalog,
  className,
  label,
}: {
  catalog: OkCatalog;
  className?: string;
  label?: string;
}) {
  const w = 220;
  const h = 160;
  const pad = 14;
  const ra0 = catalog.ra;
  const dec0 = catalog.dec;
  const r = Math.max(catalog.radiusDeg, 0.008);
  const project = (s: CatalogStar) => {
    const x = pad + ((s.ra - (ra0 - r)) / (2 * r)) * (w - pad * 2);
    const y = pad + (((dec0 + r) - s.dec) / (2 * r)) * (h - pad * 2);
    return { x, y };
  };

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("text-fg", className)}
      role="img"
      aria-label={label ?? `${catalog.stars.length}`}
    >
      <rect
        x="0.5"
        y="0.5"
        width={w - 1}
        height={h - 1}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.18"
        rx="4"
      />
      <circle
        cx={w / 2}
        cy={h / 2}
        r={Math.min(w, h) / 2 - pad}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeDasharray="3 4"
      />
      {catalog.stars.map((s, i) => {
        const p = project(s);
        const mag = s.r ?? s.g ?? 18;
        const size = Math.max(1.4, 5.2 - (mag - 14) * 0.45);
        const tone =
          s.g !== null && s.r !== null && s.g - s.r < 0.45
            ? "var(--color-fg)"
            : s.g !== null && s.r !== null && s.g - s.r > 1
              ? "var(--color-silicon)"
              : "var(--color-life)";
        return (
          <circle
            key={`${s.name}-${i}`}
            cx={p.x}
            cy={p.y}
            r={size}
            fill={tone}
            opacity={0.88}
          />
        );
      })}
    </svg>
  );
}
