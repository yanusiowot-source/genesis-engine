import { useEffect, useState } from "react";
import type { Copy } from "@/lib/universe/i18n";
import type { CosmicEpoch, SkyMode } from "@/lib/universe/types";

type PlateId = "disk" | "worlds" | "lens" | "fire" | "clash" | "shred" | "cluster" | "ember" | "orbit" | "sun" | "giant" | "burst" | "cinder" | "pulse" | "hole";

const PHOTO: Record<PlateId, string> = {
  disk: "/proof/m51.jpg",
  worlds: "/proof/moon.jpg",
  lens: "/proof/ring.jpg",
  fire: "/proof/cmb.jpg",
  clash: "/proof/antennae.jpg",
  shred: "/proof/shred.jpg",
  cluster: "/proof/cluster.jpg",
  ember: "/proof/crab.jpg",
  orbit: "/proof/saturn.jpg",
  sun: "/proof/sun.jpg",
  giant: "/proof/giant.jpg",
  burst: "/proof/crab.jpg",
  cinder: "/proof/sirius.jpg",
  pulse: "/proof/crab.jpg",
  hole: "/proof/hole.jpg",
};

const FACE: Partial<Record<PlateId, string>> = {
  disk: "/proof/herschel.jpg",
  worlds: "/proof/galileo.jpg",
  cluster: "/proof/newton.jpg",
  orbit: "/proof/kepler.jpg",
};

function plateId(mode: SkyMode, epoch: CosmicEpoch, fragmenting: boolean, ringHalo: boolean, star: string | null): PlateId {
  if (star === "mainSequence") return "sun";
  if (star === "giant") return "giant";
  if (star === "supernova") return "burst";
  if (star === "whiteDwarf") return "cinder";
  if (star === "neutronStar") return "pulse";
  if (star === "blackHole") return "hole";
  if (epoch === "recombination") return "fire";
  if (epoch === "degeneracy" || epoch === "blackHoles") return "ember";
  if (mode === "collision") return "clash";
  if (mode === "lensing") return ringHalo ? "lens" : "cluster";
  if (mode === "planetarium") return "orbit";
  if (fragmenting) return "shred";
  return "disk";
}

function laterLine(stage: string, mass: number, proof: Copy["proof"]): string {
  if (stage === "whiteDwarf" || stage === "neutronStar" || stage === "blackHole") return proof.fateDone;
  const heavy = mass >= 25;
  const mid = mass >= 8;
  if (stage === "supernova") return heavy ? proof.fateToHole : proof.fateToPulse;
  if (stage === "giant") return heavy ? proof.fateHole : mid ? proof.fateBurst : proof.fateCinder;
  return heavy ? proof.fateHole : mid ? proof.fateBurst : proof.fateQuiet;
}

type Look = { stage: string; mass: number; age: number; tau: number; n: number; m: number };

function yearsLeft(n: number): string {
  if (n > 100) return "";
  return n >= 10 ? n.toFixed(0) : n.toFixed(1);
}

function clockLine(stage: string, age: number, tau: number, proof: Copy["proof"]): string {
  if (stage === "whiteDwarf" || stage === "neutronStar" || stage === "blackHole" || stage === "supernova") return "";
  const end = stage === "giant" ? tau - age : tau * 0.88 - age;
  if (!(end > 0.05)) return "";
  if (end > 100) return stage === "giant" ? "" : proof.leftLong;
  const n = yearsLeft(end);
  const line = stage === "giant" ? proof.leftGiant : proof.leftQuiet;
  return line.replace("{n}", n);
}

export function starLesson(stage: string, mass: number, age: number, tau: number, proof: Copy["proof"]): string {
  const clock = clockLine(stage, age, tau, proof);
  const later = laterLine(stage, mass, proof);
  return clock ? `${clock} ${later}` : later;
}

type Props = {
  copy: Copy;
  mode: SkyMode;
  epoch: CosmicEpoch;
  fragmenting: boolean;
  ringHalo: boolean;
  star: string | null;
  look: Look | null;
  onStep?: (dir: -1 | 1) => void;
  variant: "thumb" | "row";
};

export function ProofButton({ copy, mode, epoch, fragmenting, ringHalo, star, look, onStep, variant }: Props) {
  const [open, setOpen] = useState(false);
  const id = plateId(mode, epoch, fragmenting, ringHalo, star);
  const plate = copy.proof[id];
  const photo = PHOTO[id];
  const face = FACE[id];
  const here = look
    ? `${look.n} / ${look.m} · ${look.mass.toFixed(2)} ${copy.proof.solar} · ${look.age.toFixed(1)} ${copy.proof.year}`
    : "";
  const later = look ? laterLine(look.stage, look.mass, copy.proof) : "";
  const clock = look ? clockLine(look.stage, look.age, look.tau, copy.proof) : "";

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={
          variant === "thumb"
            ? "proof-thumb absolute top-2 right-2 z-[4] w-14 overflow-hidden rounded-[var(--radius-sm)] bg-bg/80 text-fg shadow-[var(--shadow-border)]"
            : "proof-row flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-sm)] px-1 text-left"
        }
        aria-label={`${copy.proof.open}. ${plate.title}${here ? `. ${here}` : ""}`}
        onClick={() => setOpen(true)}
      >
        <img src={photo} alt="" className={variant === "thumb" ? "size-14 object-cover" : "size-10 shrink-0 rounded-[var(--radius-xs)] object-cover"} />
        {variant === "thumb" && star ? (
          <span className="block truncate px-1 py-0.5 text-center font-mono text-[0.6rem] leading-tight text-fg">{plate.title}</span>
        ) : null}
        {variant === "row" ? (
          <span className="min-w-0">
            <span className="block truncate font-display text-sm text-fg">{plate.title}</span>
            <span className="block truncate font-mono text-[0.65rem] tracking-[0.08em] text-fg-subtle uppercase">{copy.proof.open}</span>
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
          <button type="button" className="overlay-scrim absolute inset-0 bg-bg/80" aria-label={copy.proof.close} onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="proof-title"
            className="overlay-sheet relative z-10 max-h-[min(40rem,92dvh)] w-full max-w-md overflow-y-auto rounded-t-[var(--radius-xl)] bg-bg-elevated px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-border)] sm:rounded-[var(--radius-xl)]"
          >
            <img src={photo} alt={plate.title} className="aspect-[16/10] w-full rounded-[var(--radius-md)] object-cover" />
            <h2 id="proof-title" className="mt-4 font-display text-2xl tracking-[-0.02em] text-fg">{plate.title}</h2>
            {here ? <p className="mt-1 font-mono text-xs text-fg-subtle">{here}</p> : null}
            {clock ? <p className="mt-2 text-pretty text-sm leading-relaxed text-fg">{clock}</p> : null}
            {face ? (
              <div className="mt-3 flex items-center gap-3">
                <img src={face} alt="" className="size-16 shrink-0 rounded-[var(--radius-sm)] object-cover object-top" />
                <p className="min-w-0">
                  <span className="block font-display text-lg text-fg">{plate.person}</span>
                  <span className="block font-mono text-xs text-fg-subtle">{plate.years}</span>
                </p>
              </div>
            ) : null}
            <p className="mt-3 text-pretty text-sm leading-relaxed text-fg">{plate.body}</p>
            {later ? <p className="mt-3 text-pretty text-sm leading-relaxed text-fg">{later}</p> : null}
            <p className="mt-3 font-mono text-[0.65rem] leading-relaxed tracking-[0.04em] text-fg-subtle">{plate.credit}</p>
            {look && look.m > 1 && onStep ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" className="min-h-11 rounded-[var(--radius-sm)] text-sm text-fg shadow-[var(--shadow-border)]" onClick={() => onStep(-1)}>
                  {copy.proof.prev}
                </button>
                <button type="button" className="min-h-11 rounded-[var(--radius-sm)] text-sm text-fg shadow-[var(--shadow-border)]" onClick={() => onStep(1)}>
                  {copy.proof.next}
                </button>
              </div>
            ) : null}
            <button type="button" className="mt-4 min-h-11 w-full rounded-[var(--radius-sm)] text-sm text-fg-muted" onClick={() => setOpen(false)}>
              {copy.proof.close}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
