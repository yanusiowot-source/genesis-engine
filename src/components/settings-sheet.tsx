import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, CircleHelp, Download, ExternalLink, Gamepad2, Info, Music, RotateCcw, ScrollText, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { LanguagePicker } from "@/components/language-picker";
import type { Copy, Locale } from "@/lib/universe/i18n";
import type { MusicSource, PlaylistEntry } from "@/lib/universe/audio";
import type { TypeScale } from "@/lib/universe/prefs";
import { cn } from "@/lib/utils";
import { AUTHOR_X_URL, PUBLIC_LAB_REPO_URL, PUBLIC_LAB_URL, PUBLIC_SOURCE_REPO_URL, isHostedLab } from "@/lib/universe/studio";

type Props = {
  copy: Copy;
  locale: Locale;
  haptics: boolean;
  sound: boolean;
  contrast: boolean;
  scripture: boolean;
  typeScale: TypeScale;
  standalone: boolean;
  musicSource: MusicSource;
  musicVolume: number;
  ownTrackName: string;
  ownTracks: PlaylistEntry[];
  playIndex: number;
  onLocale: (next: Locale) => void;
  onHaptics: (on: boolean) => void;
  onSound: (on: boolean) => void;
  onContrast: (on: boolean) => void;
  onScripture: (on: boolean) => void;
  onTypeScale: (scale: TypeScale) => void;
  onMusicSource: (source: MusicSource) => void;
  onMusicVolume: (value: number) => void;
  onPickTracks: (files: File[]) => void;
  onPlayTrack: (id: string) => void;
  onRemoveTrack: (id: string) => void;
  onClearTrack: () => void;
  onInstall: () => void;
  onReplay: () => void;
  onClearLog: () => void;
  onOurs: () => void;
  onSilicon: () => void;
  onDesert: () => void;
  onEternal: () => void;
  onSwarm: () => void;
  onHighway: () => void;
  onBelt: () => void;
  onCluster: () => void;
  onDwarf: () => void;
  onHelp: () => void;
  onGames: () => void;
  onCanon: () => void;
  onClose: () => void;
  openAbout?: boolean;
};

export function SettingsSheet({
  copy,
  locale,
  haptics,
  sound,
  contrast,
  scripture,
  typeScale,
  standalone,
  musicSource,
  musicVolume,
  ownTrackName,
  ownTracks,
  playIndex,
  onLocale,
  onHaptics,
  onSound,
  onContrast,
  onScripture,
  onTypeScale,
  onMusicSource,
  onMusicVolume,
  onPickTracks,
  onPlayTrack,
  onRemoveTrack,
  onClearTrack,
  onInstall,
  onReplay,
  onClearLog,
  onOurs,
  onSilicon,
  onDesert,
  onEternal,
  onSwarm,
  onHighway,
  onBelt,
  onCluster,
  onDwarf,
  onHelp,
  onGames,
  onCanon,
  onClose,
  openAbout = false,
}: Props) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [hosted, setHosted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const aboutRef = useRef<HTMLElement>(null);

  const scrollToAbout = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    aboutRef.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    setHosted(isHostedLab());
  }, []);

  useEffect(() => {
    if (!openAbout) return;
    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => scrollToAbout());
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
    };
  }, [openAbout]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!confirmClear) return;
    const id = window.setTimeout(() => setConfirmClear(false), 2800);
    return () => window.clearTimeout(id);
  }, [confirmClear]);

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
        aria-labelledby="settings-title"
        className="overlay-sheet relative z-10 max-h-[min(40rem,88dvh)] w-full max-w-md overflow-y-auto rounded-t-[var(--radius-xl)] bg-bg-elevated px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-border)] sm:rounded-[var(--radius-xl)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="settings-title"
            className="font-display text-2xl tracking-[-0.02em] text-fg"
          >
            {copy.settingsTitle}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            aria-label={copy.closePanel}
            autoFocus
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <Group label={copy.language}>
          <div className="p-3">
            <LanguagePicker copy={copy} locale={locale} onLocale={onLocale} />
          </div>
        </Group>

        <Group label={copy.appearance}>
          <div
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-3",
              "border-b border-border",
            )}
          >
            <span className="text-sm text-fg">{copy.contrast}</span>
            <Switch
              checked={contrast}
              label={copy.contrast}
              onChange={onContrast}
            />
          </div>
          <div
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-3",
              "border-b border-border",
            )}
          >
            <span className="text-sm text-fg">{copy.scripture.line}</span>
            <Switch
              checked={scripture}
              label={copy.scripture.line}
              onChange={onScripture}
            />
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-fg">{copy.textSize}</p>
            <div className="mt-2 flex rounded-[var(--radius-md)] bg-bg p-1">
              {(
                [
                  ["sm", copy.textSizeSm],
                  ["md", copy.textSizeMd],
                  ["lg", copy.textSizeLg],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={typeScale === id}
                  onClick={() => onTypeScale(id)}
                  className={cn(
                    "h-11 min-h-11 flex-1 rounded-[var(--radius-sm)] text-xs font-medium",
                    "transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                    typeScale === id
                      ? "bg-bg-elevated text-fg shadow-[var(--shadow-border)]"
                      : "text-fg-subtle",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Group>

        <Group label={copy.haptics}>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-fg">{copy.haptics}</span>
            <Switch
              checked={haptics}
              label={copy.haptics}
              onChange={onHaptics}
            />
          </div>
        </Group>

        <Group label={copy.musicTitle}>
          <div
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-3",
              "border-b border-border",
            )}
          >
            <span className="text-sm text-fg">{copy.soundscape}</span>
            <Switch checked={sound} label={copy.soundscape} onChange={onSound} />
          </div>
          <p className="px-4 pt-3 text-pretty text-xs leading-relaxed text-fg-muted">
            {copy.musicHint}
          </p>
          <div className="px-4 py-3">
            <p className="text-sm text-fg">{copy.musicVolume}</p>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[musicVolume]}
              onValueChange={([v]) => {
                if (typeof v === "number") onMusicVolume(v);
              }}
              aria-label={copy.musicVolume}
              className="mt-2"
            />
          </div>
          <Row
            active={musicSource === "cosmos"}
            onClick={() => onMusicSource("cosmos")}
            label={copy.musicCosmos}
          />
          <Row
            active={musicSource === "own"}
            onClick={() => onMusicSource("own")}
            label={copy.musicOwn}
            last={!ownTracks.length}
          />
          <div className="flex flex-col gap-2 border-t border-border px-4 py-3">
            <p className="text-xs text-fg-muted">
              {ownTracks.length
                ? `${copy.musicPlaying}: ${ownTrackName || ownTracks[playIndex]?.name || ""} · ${copy.musicCount.replace("{n}", String(ownTracks.length))}`
                : copy.musicEmpty}
            </p>
            {ownTracks.length ? (
              <ul className="max-h-48 overflow-y-auto">
                {ownTracks.map((track, i) => (
                  <li
                    key={track.id}
                    className="flex items-center gap-2 border-b border-border py-1.5 last:border-b-0"
                  >
                    <button
                      type="button"
                      className={cn(
                        "min-w-0 flex-1 truncate text-left text-sm",
                        i === playIndex ? "text-accent" : "text-fg",
                      )}
                      onClick={() => onPlayTrack(track.id)}
                    >
                      {track.name}
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      onClick={() => onRemoveTrack(track.id)}
                    >
                      {copy.musicRemove}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileRef.current?.click()}
              >
                <Music />
                {copy.musicPick}
              </Button>
              {ownTracks.length ? (
                <Button size="sm" variant="outline" onClick={onClearTrack}>
                  {copy.musicClear}
                </Button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.m4a,.aac,.wav,.flac,.ogg,.opus,.webm"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => {
                const files = [...(event.target.files ?? [])];
                if (files.length) onPickTracks(files);
                event.target.value = "";
              }}
            />
          </div>
        </Group>

        <Group label={copy.skies}>
          <ActionRow icon={RotateCcw} label={copy.ours} onClick={onOurs} />
          <ActionRow label={copy.presetCluster} onClick={onCluster} />
          <ActionRow label={copy.presetDwarf} onClick={onDwarf} />
          <ActionRow label={copy.presetSilicon} onClick={onSilicon} />
          <ActionRow label={copy.presetEternal} onClick={onEternal} />
          <ActionRow label={copy.presetSwarm} onClick={onSwarm} />
          <ActionRow label={copy.presetHighway} onClick={onHighway} />
          <ActionRow label={copy.presetBelt} onClick={onBelt} />
          <ActionRow label={copy.presetDesert} last onClick={onDesert} />
        </Group>

        <Group>
          <ActionRow icon={Gamepad2} label={copy.games} onClick={onGames} />
          <ActionRow icon={CircleHelp} label={copy.help} onClick={onHelp} />
          <ActionRow icon={ScrollText} label={copy.scripture.title} onClick={onCanon} />
          <ActionRow icon={Info} label={copy.aboutTitle} onClick={scrollToAbout} />
          {!standalone ? (
            <ActionRow icon={Download} label={copy.install} onClick={onInstall} />
          ) : null}
          <ActionRow icon={RotateCcw} label={copy.replayIntro} onClick={onReplay} />
          <ActionRow
            icon={Trash2}
            label={confirmClear ? copy.clearLogConfirm : copy.clearLog}
            danger
            last
            onClick={() => {
              if (!confirmClear) {
                setConfirmClear(true);
                return;
              }
              setConfirmClear(false);
              onClearLog();
            }}
          />
        </Group>

        <section ref={aboutRef} id="settings-about" className="mt-6 scroll-mt-3">
          <h3 className="px-1 font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
            {copy.aboutTitle}
          </h3>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-fg-muted">
            {copy.aboutBody}
          </p>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-fg">
            {copy.studioHonesty}
          </p>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-fg-muted">
            {copy.soundLesson}
          </p>
          {!hosted ? (
            <Button asChild variant="outline" className="mt-2 w-full">
              <a href={PUBLIC_LAB_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                {copy.studioPublicCta}
              </a>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="mt-2 w-full">
            <a href={PUBLIC_LAB_REPO_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              {copy.studioLabRepoCta}
            </a>
          </Button>
          <Button asChild variant="outline" className="mt-2 w-full">
            <a href={PUBLIC_SOURCE_REPO_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              {copy.studioSourceCta}
            </a>
          </Button>
          {!hosted ? (
            <Button asChild variant="outline" className="mt-2 w-full">
              <a href={AUTHOR_X_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                {copy.studioFollowCta}
              </a>
            </Button>
          ) : null}
          <p className="mt-4 text-sm text-fg">{copy.sourceCode}</p>
          <p className="mt-1 font-mono text-[0.6875rem] text-fg-subtle">{copy.version}</p>
        </section>
      </div>
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-5">
      {label ? (
        <h3 className="mb-2 px-1 font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">
          {label}
        </h3>
      ) : null}
      <div className="overflow-hidden rounded-[var(--radius-lg)] bg-bg-subtle">{children}</div>
    </section>
  );
}

function Row({
  label,
  active,
  last,
  onClick,
}: {
  label: string;
  active: boolean;
  last?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm",
        !last && "border-b border-border",
        active ? "text-accent" : "text-fg-muted",
      )}
    >
      {label}
      {active ? <Check className="size-4 text-accent" /> : null}
    </button>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onClick,
  danger,
  last,
}: {
  icon?: typeof Download;
  label: string;
  onClick: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-sm",
        !last && "border-b border-border",
        danger ? "text-sterile" : "text-fg",
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0" /> : null}
      {label}
    </button>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (on: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex h-11 w-11 shrink-0 items-center justify-center"
    >
      <span
        className={cn(
          "relative h-7 w-11 rounded-full",
          "transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)]",
          checked ? "bg-accent" : "bg-bg shadow-[var(--shadow-border)]",
        )}
      >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 block size-6 rounded-full",
          "transition-transform duration-[var(--motion-quick)] ease-[var(--ease-out)]",
          checked ? "translate-x-4 bg-accent-fg" : "translate-x-0 bg-fg-muted",
        )}
      />
      </span>
    </button>
  );
}
