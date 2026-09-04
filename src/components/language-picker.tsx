import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { Copy, Locale } from "@/lib/universe/i18n";
import {
  AUTHORED,
  CONSTRUCTED_COUNT,
  ENGLISH_NAMES,
  LIVING_COUNT,
  PINNED_CONSTRUCTED,
  autonym,
  catalogReady,
  hasPack,
  loadCatalog,
  searchLanguages,
} from "@/lib/universe/languages";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  locale: Locale;
  onLocale: (next: Locale) => void;
};

export function LanguagePicker({ copy, locale, onLocale }: Props) {
  const [q, setQ] = useState("");
  const [ready, setReady] = useState(() => catalogReady());
  const query = q.trim();

  useEffect(() => {
    if (catalogReady()) {
      setReady(true);
      return;
    }
    if (!query) return;
    let live = true;
    void loadCatalog()
      .then(() => {
        if (live) setReady(true);
      })
      .catch(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, [query]);

  const hits = useMemo(
    () => (ready && query ? searchLanguages(query, 48) : []),
    [query, ready],
  );
  const empty = query.length === 0;

  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder={copy.languageSearch}
        aria-label={copy.languageSearch}
        autoComplete="off"
        className="h-11 w-full rounded-[var(--radius-md)] bg-bg px-3 text-sm text-fg outline-none ring-1 ring-border placeholder:text-fg-subtle focus-visible:ring-accent"
      />
      <p className="px-1 text-[0.6875rem] leading-relaxed text-fg-subtle">
        {copy.languageAuthored}: {AUTHORED.length} · {copy.languageCatalog}:{" "}
        {LIVING_COUNT.toLocaleString()} + {CONSTRUCTED_COUNT}
      </p>
      <div className="h-52 overflow-y-auto overscroll-contain rounded-[var(--radius-lg)] bg-bg-subtle">
        {empty ? (
          <>
            {AUTHORED.map((id) => (
              <LangRow
                key={id}
                id={id}
                label={autonym(id)}
                hint={ENGLISH_NAMES[id]}
                active={locale === id}
                last={false}
                onPick={onLocale}
              />
            ))}
            {PINNED_CONSTRUCTED.filter((id) => !hasPack(id)).map((id) => (
              <LangRow
                key={id}
                id={id}
                label={ENGLISH_NAMES[id] ?? id}
                hint={id}
                active={locale === id}
                last={false}
                onPick={onLocale}
              />
            ))}
          </>
        ) : !ready ? (
          <p className="px-4 py-3 text-sm text-fg-subtle">{copy.languageLoading}</p>
        ) : hits.length === 0 ? (
          <p className="px-4 py-3 text-sm text-fg-subtle">{copy.languageFallback}</p>
        ) : (
          hits.map((row, i) => (
            <LangRow
              key={row.iso + row.id}
              id={row.id}
              label={autonym(row.id)}
              hint={`${row.name} · ${row.iso}`}
              active={locale === row.id}
              last={i === hits.length - 1}
              onPick={onLocale}
            />
          ))
        )}
      </div>
      {!hasPack(locale) ? (
        <p className="px-1 text-pretty text-[0.6875rem] leading-relaxed text-fg-subtle">
          {copy.languageFallback}
        </p>
      ) : null}
    </div>
  );
}

function LangRow({
  id,
  label,
  hint,
  active,
  last,
  onPick,
}: {
  id: string;
  label: string;
  hint?: string;
  active: boolean;
  last: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(id)}
      className={cn(
        "flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2.5 text-left",
        !last && "border-b border-border",
        active ? "text-accent" : "text-fg-muted",
      )}
    >
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm">{label}</span>
        {hint && hint !== label ? (
          <span className="truncate font-mono text-[0.625rem] text-fg-subtle">{hint}</span>
        ) : null}
      </span>
      {active ? <Check className="size-4 shrink-0 text-accent" /> : null}
    </button>
  );
}
