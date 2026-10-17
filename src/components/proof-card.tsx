import { useEffect, useState } from "react";
import type { Copy } from "@/lib/universe/i18n";
import type { CosmicEpoch, SkyMode } from "@/lib/universe/types";

type PlateId = "disk" | "worlds" | "lens" | "fire" | "clash" | "shred" | "cluster" | "ember" | "orbit";

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
};

const FACE: Partial<Record<PlateId, string>> = {
  disk: "/proof/herschel.jpg",
  worlds: "/proof/galileo.jpg",
  cluster: "/proof/newton.jpg",
  orbit: "/proof/kepler.jpg",
};

function plateId(mode: SkyMode, epoch: CosmicEpoch, fragmenting: boolean, ringHalo: boolean): PlateId {
  if (epoch === "recombination") return "fire";
  if (epoch === "degeneracy" || epoch === "blackHoles") return "ember";
  if (mode === "collision") return "clash";
  if (mode === "lensing") return ringHalo ? "lens" : "cluster";
  if (mode === "planetarium") return "orbit";
  if (fragmenting) return "shred";
  return "disk";
}

type Props = {
  copy: Copy;
  mode: SkyMode;
  epoch: CosmicEpoch;
  fragmenting: boolean;
  ringHalo: boolean;
  variant: "thumb" | "row";
};

export function ProofButton({ copy, mode, epoch, fragmenting, ringHalo, variant }: Props) {
  const [open, setOpen] = useState(false);
  const id = plateId(mode, epoch, fragmenting, ringHalo);
  const plate = copy.proof[id];
  const photo = PHOTO[id];
  const face = FACE[id];

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
            ? "proof-thumb absolute top-2 right-2 z-[4] size-14 overflow-hidden rounded-[var(--radius-sm)] shadow-[var(--shadow-border)]"
            : "proof-row flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-sm)] px-1 text-left"
        }
        aria-label={`${copy.proof.open}. ${plate.title}`}
        onClick={() => setOpen(true)}
      >
        <img src={photo} alt="" className={variant === "thumb" ? "size-full object-cover" : "size-10 shrink-0 rounded-[var(--radius-xs)] object-cover"} />
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
            <p className="mt-3 font-mono text-[0.65rem] leading-relaxed tracking-[0.04em] text-fg-subtle">{plate.credit}</p>
            <button type="button" className="mt-4 min-h-11 w-full rounded-[var(--radius-sm)] text-sm text-fg-muted" onClick={() => setOpen(false)}>
              {copy.proof.close}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
