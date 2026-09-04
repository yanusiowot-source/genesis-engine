import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Copy as CopyText } from "@/lib/universe/i18n";
import { PAY_RAILS } from "@/lib/universe/studio";

export function PayRails({ copy }: { copy: CopyText }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-pretty text-sm leading-relaxed text-fg">{copy.payWarn}</p>
      {PAY_RAILS.map((rail) => (
        <PayRow key={rail.id} label={rail.label} value={rail.value} copyLabel={copy.payCopy} copiedLabel={copy.copied} />
      ))}
      <p className="text-pretty text-sm leading-relaxed text-fg-muted">{copy.payAfter}</p>
    </div>
  );
}

function PayRow({
  label,
  value,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-[var(--radius-md)] bg-bg-subtle px-4 py-3 shadow-[var(--shadow-border)]">
      <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">{label}</p>
      <p className="mt-1.5 break-all font-mono text-xs leading-relaxed text-fg">{value}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => {
          void navigator.clipboard.writeText(value).then(
            () => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            },
            () => {
              /* clipboard can be blocked; the address stays selectable */
            },
          );
        }}
      >
        {copied ? <Check /> : <Copy />}
        {copied ? copiedLabel : copyLabel}
      </Button>
    </div>
  );
}
