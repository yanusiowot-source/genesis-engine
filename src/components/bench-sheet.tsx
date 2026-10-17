import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Copy } from "@/lib/universe/i18n";

type Props = {
  copy: Copy;
  onClose: () => void;
};

export function BenchSheet({ copy, onClose }: Props) {
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={copy.closePanel}
        className="overlay-scrim absolute inset-0 bg-bg/80"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bench-title"
        className="overlay-sheet relative z-10 flex max-h-[min(42rem,90dvh)] w-full max-w-md flex-col rounded-t-[var(--radius-xl)] bg-bg-elevated shadow-[var(--shadow-border)] sm:rounded-[var(--radius-xl)]"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
              {copy.siliconGuess}
            </p>
            <h2 id="bench-title" className="mt-1 font-display text-2xl tracking-[-0.02em] text-fg">
              {copy.siliconBenchTitle}
            </h2>
          </div>
          <Button variant="ghost" size="icon" className="size-11 shrink-0" aria-label={copy.closePanel} autoFocus onClick={onClose}>
            <X />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <p className="text-pretty text-sm leading-relaxed text-fg">{copy.siliconBenchTale}</p>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-muted">{copy.siliconBenchOhm}</p>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-muted">{copy.siliconBenchRadio}</p>
          <ol className="mt-3 flex list-decimal flex-col gap-3 pl-5">
            {copy.siliconBenchSteps.map((step) => (
              <li key={step.slice(0, 24)} className="text-pretty text-sm leading-relaxed text-fg">
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-fg">{copy.siliconBenchPaste}</p>
          <div className="mt-3 flex flex-col gap-4">
            {copy.siliconBenchCode.map((code, i) => (
              <figure key={copy.siliconBenchCaps[i]} className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <figcaption className="font-mono text-xs text-fg">{copy.siliconBenchCaps[i]}</figcaption>
                  <button
                    type="button"
                    className="min-h-11 rounded-[var(--radius-sm)] px-3 text-sm text-fg shadow-[var(--shadow-border)]"
                    onClick={() => {
                      const done = () => {
                        setCopied(i);
                        window.setTimeout(() => setCopied((n) => (n === i ? null : n)), 1600);
                      };
                      const fallback = () => {
                        const area = document.createElement("textarea");
                        area.value = code;
                        area.setAttribute("readonly", "");
                        area.style.position = "fixed";
                        area.style.left = "-9999px";
                        document.body.appendChild(area);
                        area.select();
                        document.execCommand("copy");
                        area.remove();
                        done();
                      };
                      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code).then(done, fallback);
                      else fallback();
                    }}
                  >
                    {copied === i ? copy.siliconBenchCopied : copy.siliconBenchCopy}
                  </button>
                </div>
                <pre className="mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-[var(--radius-sm)] bg-bg px-3 py-2 font-mono text-xs leading-relaxed text-fg">
                  {code}
                </pre>
                <figcaption className="mt-1 text-pretty text-xs leading-relaxed text-fg-subtle">
                  {copy.siliconBenchNotes[i]}
                </figcaption>
                <p className="mt-1 text-pretty text-xs leading-relaxed text-fg">{copy.siliconBenchWhere[i]}</p>
              </figure>
            ))}
          </div>
          <h3 className="mt-6 font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
            {copy.siliconDeckTitle}
          </h3>
          <ol className="mt-3 flex list-decimal flex-col gap-3 pl-5">
            {copy.siliconDeckSteps.map((step) => (
              <li key={step.slice(0, 24)} className="text-pretty text-sm leading-relaxed text-fg">
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-subtle">{copy.siliconBenchLaw}</p>
        </div>
      </div>
    </div>
  );
}
