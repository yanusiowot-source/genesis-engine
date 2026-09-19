import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Copy as CopyText } from "@/lib/universe/i18n";
import type { PayRailId } from "@/lib/universe/license";
import { qrGrid } from "@/lib/universe/qr";
import { copyToClipboard, PAY_RAILS } from "@/lib/universe/studio";

type Props = {
  copy: CopyText;
  rail?: PayRailId;
  onRail?: (id: PayRailId) => void;
  compact?: boolean;
};

export function PayRails({ copy, rail: railProp, onRail, compact = false }: Props) {
  const [inner, setInner] = useState<PayRailId>(railProp ?? "usdt");
  const rail = railProp ?? inner;
  const selected = PAY_RAILS.find((item) => item.id === rail) ?? PAY_RAILS[0];

  const pick = (id: PayRailId) => {
    if (!railProp) setInner(id);
    onRail?.(id);
  };

  const warn = (
    <p className="text-pretty text-sm leading-relaxed text-fg">{copy.payWarn}</p>
  );

  return (
    <div className="flex flex-col gap-3">
      {compact ? null : warn}
      <div className="grid grid-cols-2 gap-2">
        {PAY_RAILS.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={item.id === rail ? "default" : "outline"}
            onClick={() => pick(item.id)}
            aria-pressed={item.id === rail}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-md)] bg-bg-subtle px-4 py-4 shadow-[var(--shadow-border)]">
        <PayQr value={selected.value} label={selected.label} compact={compact} />
        <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">
          {selected.label}
        </p>
        <p className="w-full break-all text-center font-mono text-xs leading-relaxed text-fg">
          {selected.value}
        </p>
        <CopyAddress value={selected.value} copyLabel={copy.payCopy} copiedLabel={copy.copied} />
      </div>
      {compact ? warn : null}
    </div>
  );
}

function PayQr({ value, label, compact }: { value: string; label: string; compact?: boolean }) {
  const { size, data } = useMemo(() => qrGrid(value), [value]);
  const quiet = 3;
  const dim = size + quiet * 2;
  const dots: string[] = [];
  for (let y = 0; y < size; y++) {
    const row = data[y];
    if (!row) continue;
    for (let x = 0; x < size; x++) {
      if (row[x]) dots.push(`${x + quiet} ${y + quiet}`);
    }
  }

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${dim} ${dim}`}
      className={`${compact ? "size-40" : "size-44"} rounded-[var(--radius-xs)] bg-qr-paper text-qr-ink`}
      shapeRendering="crispEdges"
    >
      <rect width={dim} height={dim} className="fill-qr-paper" />
      {dots.map((d) => {
        const [x, y] = d.split(" ");
        return <rect key={d} x={x} y={y} width="1" height="1" className="fill-qr-ink" />;
      })}
    </svg>
  );
}

function CopyAddress({
  value,
  copyLabel,
  copiedLabel,
}: {
  value: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        void copyToClipboard(value).then((ok) => {
          if (!ok) return;
          setCopied(true);
          window.clearTimeout(copiedTimer.current);
          copiedTimer.current = window.setTimeout(() => setCopied(false), 1600);
        });
      }}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? copiedLabel : copyLabel}
    </Button>
  );
}
