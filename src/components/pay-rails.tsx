import { useEffect, useRef, useState } from "react";
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
  const copiedTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

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
          void copyText(value).then((ok) => {
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
    </div>
  );
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
