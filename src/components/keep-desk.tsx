import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { PayRails } from "@/components/pay-rails";
import { Button } from "@/components/ui/button";
import type { Copy } from "@/lib/universe/i18n";
import {
  fillOrder,
  loadReceipt,
  mintReceipt,
  type PayRailId,
  receiptText,
} from "@/lib/universe/license";
import { isStoreShell } from "@/lib/universe/platform";
import { downloadText } from "@/lib/universe/report";
import {
  clampCopyDollars,
  COPY_PRICE_CHOICES,
  COPY_PRICE_MAX,
  COPY_PRICE_MIN,
  orderCopyUrl,
} from "@/lib/universe/studio";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  compact?: boolean;
};

export function KeepDesk({ copy, compact = false }: Props) {
  const store = isStoreShell();
  const [rail, setRail] = useState<PayRailId>("usdt");
  const [tx, setTx] = useState("");
  const [dollarsText, setDollarsText] = useState(String(COPY_PRICE_MIN));
  const [receipt, setReceipt] = useState(() =>
    typeof window === "undefined" ? null : loadReceipt(),
  );
  const [error, setError] = useState(false);
  const receiptBox = useRef<HTMLDivElement>(null);
  const dollars = clampCopyDollars(
    dollarsText.trim() === "" ? COPY_PRICE_MIN : Number(dollarsText),
  );

  useEffect(() => {
    setReceipt(loadReceipt());
  }, []);

  useEffect(() => {
    if (!receipt) return;
    receiptBox.current?.scrollIntoView({ block: "nearest" });
  }, [receipt]);

  const orderHref = useMemo(() => {
    if (!receipt) return "";
    return orderCopyUrl(
      fillOrder(copy.keep.orderText, receipt.plate, receipt.tx, receipt.amount),
    );
  }, [copy.keep.orderText, receipt]);

  const mint = () => {
    const amount = clampCopyDollars(Number(dollarsText));
    setDollarsText(String(amount));
    const next = mintReceipt(tx, rail, amount);
    if (!next) {
      setError(true);
      return;
    }
    setError(false);
    setReceipt(next);
  };

  return (
    <div className={cn("flex flex-col gap-5", compact && "pr-1")}>
      <header className={compact ? "pr-10" : undefined}>
        <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
          {copy.keep.kicker}
        </p>
        <h2
          id="keep-title"
          className={cn(
            "mt-2 font-display tracking-[-0.03em] text-fg",
            compact ? "text-2xl" : "text-3xl",
          )}
        >
          {copy.keep.title}
        </h2>
        <p className="mt-2 font-mono text-sm tabular-nums text-accent">
          {store ? copy.keep.amount : `$${dollars}`}
        </p>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-muted">{copy.keep.lead}</p>
      </header>

      {store ? (
        <section className="rounded-[var(--radius-md)] bg-bg-subtle px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">
            {copy.keep.storeTitle}
          </p>
          <p className="mt-1.5 text-pretty text-sm leading-relaxed text-fg">{copy.keep.storeOnly}</p>
        </section>
      ) : null}

      {receipt && !store ? (
        <div
          ref={receiptBox}
          className="rounded-[var(--radius-md)] bg-bg-subtle px-4 py-4 shadow-[var(--shadow-border)]"
        >
          <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">
            {copy.keep.plateLabel}
          </p>
          <p className="mt-2 font-mono text-lg tabular-nums tracking-[0.12em] text-fg">
            {receipt.plate}
          </p>
          <p className="mt-1 font-mono text-sm tabular-nums text-fg-muted">${receipt.amount}</p>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-fg-muted">
            {copy.keep.receiptHint}
          </p>
          <p className="mt-2 break-all font-mono text-[0.6875rem] leading-relaxed text-fg-subtle">
            {receipt.tx}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 h-auto min-h-11 w-full whitespace-normal text-balance"
            onClick={() =>
              downloadText(`genesis-plate-${receipt.plate.toLowerCase()}.txt`, receiptText(receipt))
            }
          >
            <Download />
            {copy.keep.saveCta}
          </Button>
        </div>
      ) : null}

      {receipt && !store ? (
        <Button asChild className="h-auto min-h-11 w-full whitespace-normal text-balance">
          <a href={orderHref} target="_blank" rel="noopener noreferrer">
            <ExternalLink />
            {copy.keep.writeCta}
          </a>
        </Button>
      ) : null}

      {store ? null : (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="keep-dollars"
            className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase"
          >
            {copy.keep.dollarsLabel}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {COPY_PRICE_CHOICES.map((choice) => (
              <Button
                key={choice}
                type="button"
                variant={dollarsText === String(choice) ? "default" : "outline"}
                className="h-auto min-h-11 w-full whitespace-normal text-balance"
                aria-pressed={dollarsText === String(choice)}
                onClick={() => setDollarsText(String(choice))}
              >
                ${choice}
              </Button>
            ))}
          </div>
          <input
            id="keep-dollars"
            inputMode="numeric"
            pattern="[0-9]*"
            min={COPY_PRICE_MIN}
            max={COPY_PRICE_MAX}
            value={dollarsText}
            onChange={(event) => {
              setDollarsText(event.target.value.replace(/[^\d]/g, "").slice(0, 3));
            }}
            onBlur={() => setDollarsText(String(dollars))}
            autoComplete="off"
            className="h-11 w-full min-w-0 rounded-[var(--radius-md)] bg-bg-subtle px-3 font-mono text-sm text-fg tabular-nums outline-none ring-1 ring-border placeholder:text-fg-subtle focus-visible:ring-accent"
          />
          <p className="text-pretty text-sm leading-relaxed text-fg-muted">{copy.keep.dollarsHint}</p>
        </div>
      )}

      {store ? null : (
        <section className="rounded-[var(--radius-md)] bg-bg-subtle px-4 py-3">
          <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">
            {copy.keep.storeTitle}
          </p>
          <p className="mt-1.5 text-pretty text-sm leading-relaxed text-fg">{copy.keep.storeBody}</p>
        </section>
      )}

      {store ? null : (
        <PayRails
          copy={copy}
          rail={rail}
          compact={compact}
          onRail={(id) => {
            setRail(id);
            setError(false);
          }}
        />
      )}

      {store ? null : (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            mint();
          }}
        >
          <label htmlFor="keep-tx" className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
            {copy.keep.txLabel}
          </label>
          <input
            id="keep-tx"
            value={tx}
            onChange={(event) => {
              setTx(event.target.value);
              setError(false);
            }}
            placeholder={copy.keep.txPlaceholder}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={error}
            className="h-11 w-full min-w-0 rounded-[var(--radius-md)] bg-bg-subtle px-3 font-mono text-sm text-fg outline-none ring-1 ring-border placeholder:text-fg-subtle focus-visible:ring-accent"
          />
          {error ? <p className="text-sm text-sterile">{copy.keep.invalidTx}</p> : null}
          <Button type="submit" variant={receipt ? "outline" : "default"} disabled={!tx.trim()} className="h-auto min-h-11 w-full whitespace-normal text-balance">
            {copy.keep.mintCta}
          </Button>
        </form>
      )}

      {store ? null : (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
            {copy.keep.stepsTitle}
          </p>
          <ol className="flex flex-col gap-2">
            {[copy.keep.step1, copy.keep.step2, copy.keep.step3].map((step, i) => (
              <li
                key={step}
                className="flex gap-3 rounded-[var(--radius-md)] bg-bg-subtle px-4 py-3"
              >
                <span className="font-mono text-xs tabular-nums text-accent">{i + 1}</span>
                <p className="min-w-0 text-pretty text-sm leading-relaxed text-fg">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      <ul className="grid gap-2">
        <li className="rounded-[var(--radius-md)] bg-bg-subtle px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">
            {copy.keep.includedTitle}
          </p>
          <p className="mt-1.5 text-pretty text-sm leading-relaxed text-fg">{copy.keep.included}</p>
        </li>
        <li className="rounded-[var(--radius-md)] bg-bg-subtle px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">
            {copy.keep.notTitle}
          </p>
          <p className="mt-1.5 text-pretty text-sm leading-relaxed text-fg">{copy.keep.notBody}</p>
        </li>
      </ul>

      {store ? null : (
        <div className="rounded-[var(--radius-md)] bg-bg-subtle px-4 py-3">
          <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">
            {copy.keep.roomTitle}
          </p>
          <p className="mt-1.5 text-pretty text-sm leading-relaxed text-fg">{copy.keep.roomBody}</p>
          <Button asChild variant="outline" className="mt-3 h-auto min-h-11 w-full whitespace-normal text-balance">
            <a
              href={orderCopyUrl(copy.keep.roomOrderText)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink />
              {copy.keep.roomCta}
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
