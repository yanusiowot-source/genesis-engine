import { useEffect } from "react";
import { AppWindow, ExternalLink, Monitor, Plus, Share, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Copy } from "@/lib/universe/i18n";
import type { HostKind, PlatformInfo } from "@/lib/universe/platform";
import { orderCopyUrl } from "@/lib/universe/studio";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  platform: PlatformInfo;
  canNativeInstall: boolean;
  onInstall: () => void;
  onClose: () => void;
};

export function InstallSheet({ copy, platform, canNativeInstall, onInstall, onClose }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows: { id: HostKind; title: string; body: string; Icon: typeof Monitor }[] = [
    { id: "windows", title: copy.platforms.windowsTitle, body: copy.platforms.windowsBody, Icon: AppWindow },
    { id: "linux", title: copy.platforms.linuxTitle, body: copy.platforms.linuxBody, Icon: Monitor },
    { id: "android", title: copy.platforms.androidTitle, body: copy.platforms.androidBody, Icon: Smartphone },
    { id: "ios", title: copy.platforms.iosTitle, body: copy.platforms.iosBody, Icon: Tablet },
  ];

  const current = platform.kind === "other" ? null : platform.kind;
  const canPrompt = canNativeInstall && !platform.native && platform.kind !== "ios" && !platform.standalone;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={copy.closePanel}
        className="overlay-scrim absolute inset-0 bg-bg/80"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        className="overlay-sheet relative z-10 max-h-[min(40rem,90dvh)] w-full max-w-md overflow-y-auto rounded-t-[var(--radius-xl)] bg-bg-elevated px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-border)] sm:rounded-[var(--radius-xl)]"
      >
        <h2 id="install-title" className="font-display text-2xl tracking-[-0.02em] text-fg">
          {copy.platforms.title}
        </h2>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-muted">
          {platform.native
            ? copy.platforms.desktopHere
            : platform.standalone
              ? copy.platforms.pwaHere
              : copy.platforms.intro}
        </p>

        {platform.kind === "macos" ? (
          <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-muted">
            {copy.platforms.macBody}
          </p>
        ) : null}

        <ul className="mt-5 flex flex-col gap-2">
          {rows.map((row) => {
            const active = current === row.id;
            return (
              <li
                key={row.id}
                className={cn(
                  "rounded-[var(--radius-md)] bg-bg-subtle px-3 py-3",
                  active && "shadow-[var(--shadow-border)]",
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-bg">
                    <row.Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">
                      {row.title}
                      {active ? (
                        <span className="ml-2 font-mono text-[0.625rem] tracking-[0.16em] text-fg-subtle uppercase">
                          {copy.platforms.here}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-pretty text-sm leading-relaxed text-fg-muted">{row.body}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {platform.kind === "ios" ? (
          <ol className="mt-4 flex flex-col gap-2">
            <li className="flex items-center gap-3 rounded-[var(--radius-md)] bg-bg-subtle px-3 py-3 text-sm text-fg">
              <span className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-bg">
                <Share className="size-4" />
              </span>
              {copy.installStepShare}
            </li>
            <li className="flex items-center gap-3 rounded-[var(--radius-md)] bg-bg-subtle px-3 py-3 text-sm text-fg">
              <span className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-bg">
                <Plus className="size-4" />
              </span>
              {copy.installStepHome}
            </li>
          </ol>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          {canPrompt ? <Button onClick={onInstall}>{copy.installCta}</Button> : null}
          {!platform.native ? (
            <Button asChild variant={canPrompt ? "outline" : "default"}>
              <a href={orderCopyUrl(copy.studioOrderText)} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                {copy.studioReserveCta}
              </a>
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            {copy.installDismiss}
          </Button>
        </div>
      </div>
    </div>
  );
}
