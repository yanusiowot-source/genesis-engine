import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Copy, Locale } from "@/lib/universe/i18n";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  locale: Locale;
  onLocale: () => void;
  onDone: (born?: boolean) => void;
};

export function Onboarding({ copy, locale: _locale, onLocale, onDone }: Props) {
  const [step, setStep] = useState(0);
  const page = copy.onboarding[step];

  useEffect(() => {
    const id = window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>("[data-onboard-cta]")?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [step]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDone(false);
      if (event.key === "Enter" || event.key === "ArrowRight") {
        if (event.target instanceof HTMLButtonElement) return;
        event.preventDefault();
        if (step >= copy.onboarding.length - 1) onDone(true);
        else setStep((s) => s + 1);
      }
      if (event.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copy.onboarding.length, onDone, step]);

  if (!page) return null;
  const last = step === copy.onboarding.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4rem))] pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboard-title"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-bg/40" />
      <div className="relative z-10 flex items-start justify-between gap-3 pointer-events-auto">
        <p className="min-w-0 truncate font-mono text-[0.6875rem] tracking-[0.08em] text-fg-subtle uppercase">
          {copy.kicker}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label={copy.language}
          onClick={onLocale}
        >
          <Languages />
        </Button>
      </div>
      <div
        key={step}
        className="relative z-10 mx-auto mt-auto flex w-full max-w-md flex-col rounded-[var(--radius-lg)] bg-bg-elevated/85 px-5 py-5"
      >
        <p className="onboard-rise font-mono text-[0.6875rem] tabular-nums text-fg-subtle" aria-live="polite">
          {step + 1} / {copy.onboarding.length}
        </p>
        <h2
          id="onboard-title"
          className="onboard-rise onboard-rise-2 mt-2 font-display text-3xl leading-tight tracking-[-0.03em] text-fg sm:text-4xl"
        >
          {page.title}
        </h2>
        <p className="onboard-rise onboard-rise-3 mt-3 max-w-prose text-pretty text-sm leading-relaxed text-fg-muted sm:text-base">
          {page.body}
        </p>
      </div>
      <div className="relative z-10 mx-auto mt-5 flex w-full max-w-md flex-col gap-5">
        <div className="flex justify-center gap-1.5" aria-hidden>
          {copy.onboarding.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 rounded-full transition-[width,background-color] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                i === step ? "w-6 bg-accent" : "w-1.5 bg-bg-subtle",
              )}
            />
          ))}
        </div>
        <div className="relative z-10 flex items-center justify-between gap-3 pointer-events-auto">
          <Button
            variant="ghost"
            className="min-h-11 min-w-20 transform-none"
            data-onboard-skip
            onClick={() => onDone(false)}
          >
            {copy.skip}
          </Button>
          <Button
            data-onboard-cta
            className="min-h-11 min-w-28"
            onClick={() => {
              if (last) onDone(true);
              else setStep((s) => s + 1);
            }}
          >
            {last ? copy.birth : copy.continue}
          </Button>
        </div>
      </div>
    </div>
  );
}
