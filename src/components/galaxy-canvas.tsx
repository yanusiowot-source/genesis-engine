import { useEffect, useRef, useState } from "react";
import {
  adaptiveQuality,
  canvasDpr,
  lookCam,
  planetariumScreen,
  PLANETARIUM_FOV,
  projectLook,
  type GalaxyModel,
  type Star,
} from "@/lib/universe/galaxy";
import { buildGalaxyAsync, buildGalaxyNow } from "@/lib/universe/sky-client";
import { epochBackdropKey, faceOnLocal, gpuOffered, rgbInk, skyGpuMark } from "@/lib/universe/sky-place";
import {
  ACOUSTIC_VISUAL,
  acousticDossier,
  circularOmega,
  cosmicAgeGyr,
  diskDossier,
  einsteinRadius,
  haloModel,
  haloWashShape,
  nfwKappaS,
  nfwLensImages,
  nfwRadialX,
  nfwScale,
  epochShown,
  epochBlend,
  evolveStar,
  fateWash,
  galaxyVisibility,
  stepCosmicTime,
  type StarState,
} from "@/lib/universe/observatory";
import type { CosmicEpoch, Evaluation, SkyMode, UniverseParams } from "@/lib/universe/types";
import { isBeltParams, isHighwayParams, isOurParams } from "@/lib/universe/physics";
import { mulberry32 } from "@/lib/universe/rng";
import { QUIET_EGGS, type EggFlags } from "@/lib/universe/eggs";
import type { EncounterKind, SkyEncounter } from "@/lib/universe/encounters";

/**
 * Pixels and alphas for the star mark on screen.
 * Stellar mass, age, and temperature live in evolveStar.
 */
const POINT_STAR_PX = 0.9;
const HALO_MIN_ALPHA = 0.28;
const HALO_SPAN = 4.4;
const CORE_MIN_PX = 1.35;
const CORE_MIN_ALPHA = 0.42;
const CORE_SPAN = 0.32;
const LITE_MIN_PX = 1.35;
const LITE_GLOW_PX = 1.6;
const STAR_CORE: [number, number, number] = [255, 250, 240];

type StarStage = StarState["stage"];

function evolutionKey(ageGyr: number, gravity: number): number {
  return (Math.round(ageGyr * 48) << 8) ^ Math.round(gravity * 50);
}

function stageAlpha(stage: StarStage, base: number, flash: number): number {
  if (stage === "blackHole") return base * 0.4;
  if (stage === "whiteDwarf" || stage === "neutronStar") return base * 0.85;
  if (stage === "supernova") return Math.min(1, 0.55 + flash);
  return base;
}

function apparentRadius(radius: number, stage: StarStage, radiusScale: number, flash: number): number {
  if (stage === "supernova") return radius * (1.2 + flash * 7);
  return Math.max(0.35, radius * Math.pow(Math.max(radiusScale, 0.05), 0.22));
}

function isPointStar(size: number, stage: StarStage): boolean {
  return size <= POINT_STAR_PX && stage !== "supernova" && stage !== "blackHole";
}

function showsHalo(size: number, alpha: number, relaxed: boolean): boolean {
  return size > POINT_STAR_PX && alpha > HALO_MIN_ALPHA && !relaxed;
}

function showsCore(size: number, alpha: number): boolean {
  return size > CORE_MIN_PX && alpha > CORE_MIN_ALPHA;
}

function twinkleOf(phase: number, time: number, still: boolean): number {
  if (still) return 1;
  const fast = Math.sin(time * 2.4 + phase);
  const slow = Math.sin(time * 0.7 + phase * 1.7);
  return 0.62 + 0.24 * fast + 0.14 * slow;
}

/** Bright knot wanders inside the cloud. The cloud's place on the disk does not move. */
function nebulaBreath(phase: number, time: number, still: boolean): {
  a: number;
  r: number;
  dx: number;
  dy: number;
} {
  if (still) return { a: 1, r: 1, dx: 0, dy: 0 };
  return {
    a: 0.68 + 0.32 * Math.sin(time * 0.55 + phase),
    r: 0.9 + 0.12 * Math.sin(time * 0.37 + phase * 1.3),
    dx: Math.sin(time * 0.22 + phase) * 0.1,
    dy: Math.cos(time * 0.19 + phase * 0.8) * 0.07,
  };
}

/** Grain stays on the cloud. A new frame does not throw the dice again. */
function nebulaGrain(seed: number, i: number): { x: number; y: number; s: number } {
  const fract = (n: number) => n - Math.floor(n);
  const u = fract(Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453);
  const v = fract(Math.sin(seed * 4.123 + i * 19.19) * 24634.6345);
  const ang = u * Math.PI * 2;
  const rad = 0.12 + v * 0.55;
  return { x: Math.cos(ang) * rad, y: Math.sin(ang) * rad * 0.82, s: 0.16 + u * 0.2 };
}

/** One painter for the disk and the planetarium. Layers, not a second orbit. */
function paintNebula(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot: number,
  rgb: readonly [number, number, number],
  alpha: number,
  breath: { a: number; r: number; dx: number; dy: number },
  seed: number,
  lite: boolean,
): void {
  const radX = rx * breath.r;
  const radY = ry * breath.r;
  if (radX < 0.6 || radY < 0.6 || alpha <= 0) return;
  const a = Math.min(0.62, alpha * breath.a);
  const [cr, cg, cb] = rgb;
  const hot = (c: number) => Math.min(255, Math.round(c + (255 - c) * 0.55));
  const cool = (c: number) => Math.round(c * 0.62);
  const litX = breath.dx || 0.16;
  const litY = breath.dy || -0.08;
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(radX, radY);
  const shell = g.createRadialGradient(-litX * 0.8, -litY * 0.8, 0.05, 0, 0, 1.35);
  shell.addColorStop(0, `rgba(${cool(cr)},${cool(cg)},${cool(cb)},${a * 0.22})`);
  shell.addColorStop(1, "rgba(9,6,26,0)");
  g.fillStyle = shell;
  g.beginPath();
  g.arc(-litX * 0.35, -litY * 0.35, 1.2, 0, Math.PI * 2);
  g.fill();
  const veil = g.createRadialGradient(litX * 0.35, litY * 0.35, 0, 0, 0, 1.45);
  veil.addColorStop(0, `rgba(${cr},${cg},${cb},${a * 0.28})`);
  veil.addColorStop(0.5, `rgba(${cool(cr)},${cool(cg)},${cool(cb)},${a * 0.1})`);
  veil.addColorStop(1, "rgba(9,6,26,0)");
  g.fillStyle = veil;
  g.beginPath();
  g.arc(0, 0, 1.45, 0, Math.PI * 2);
  g.fill();
  const body = g.createRadialGradient(litX, litY, 0, 0, 0, 1);
  body.addColorStop(0, `rgba(${hot(cr)},${hot(cg)},${hot(cb)},${a})`);
  body.addColorStop(0.22, `rgba(${cr},${cg},${cb},${a * 0.55})`);
  body.addColorStop(0.62, `rgba(${cr},${cg},${cb},${a * 0.16})`);
  body.addColorStop(1, "rgba(9,6,26,0)");
  g.fillStyle = body;
  g.beginPath();
  g.arc(0, 0, 1, 0, Math.PI * 2);
  g.fill();
  if (!lite) {
    if (radX >= 36) {
      for (let i = 0; i < 5; i++) {
        const grain = nebulaGrain(seed, i);
        const puff = g.createRadialGradient(grain.x, grain.y, 0, grain.x, grain.y, grain.s);
        const bright = i % 2 === 0;
        puff.addColorStop(
          0,
          bright
            ? `rgba(${hot(cr)},${hot(cg)},${hot(cb)},${a * 0.42})`
            : `rgba(${cool(cr)},${cool(cg)},${cool(cb)},${a * 0.28})`,
        );
        puff.addColorStop(1, "rgba(9,6,26,0)");
        g.fillStyle = puff;
        g.beginPath();
        g.arc(grain.x, grain.y, grain.s, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.lineWidth = 0.045;
    g.lineCap = "round";
    g.strokeStyle = `rgba(${hot(cr)},${hot(cg)},${hot(cb)},${a * 0.55})`;
    for (let i = 0; i < 3; i++) {
      const ang = seed + i * 2.094;
      g.beginPath();
      g.arc(litX * 0.4, litY * 0.4, 0.28 + i * 0.18, ang, ang + 1.15);
      g.stroke();
    }
    g.globalCompositeOperation = "source-over";
    const shade = g.createRadialGradient(-litX * 1.4, -litY * 1.4, 0.05, 0, 0, 1.15);
    shade.addColorStop(0, `rgba(6,4,14,${Math.min(0.42, a * 0.9)})`);
    shade.addColorStop(0.55, `rgba(6,4,14,${a * 0.16})`);
    shade.addColorStop(1, "rgba(9,6,26,0)");
    g.fillStyle = shade;
    g.beginPath();
    g.arc(-litX * 0.45, -litY * 0.45, 0.95, 0, Math.PI * 2);
    g.fill();
    if (radY / radX < 0.62) {
      g.fillStyle = `rgba(8,6,16,${Math.min(0.34, a * 0.7)})`;
      g.beginPath();
      g.ellipse(0, 0, 0.86, 0.2, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
}

type Props = {
  params: UniverseParams;
  evaluation: Evaluation;
  visualSeed: number;
  cosmicTime: number;
  timeRef?: { current: number };
  evolving?: boolean;
  evolveUntil?: number;
  onEvolveEnd?: () => void;
  mode: SkyMode;
  collisionKey: number;
  eggs?: EggFlags;
  encounter?: SkyEncounter | null;
  onEncounter?: (kind: EncounterKind) => void;
  impactKey?: number;
  impactPower?: number;
  onVoyager?: () => void;
  onTau?: () => void;
  className?: string;
  relaxed?: boolean;
  paused?: boolean;
  scanning?: boolean;
  wakeKey?: number;
  ariaLabel?: string;
  nudgeRef?: { current: (dx: number, dy: number) => void };
  onSkyH0?: (h0Long: number) => void;
  gate?: {
    arm: string;
    closer: string;
    farther: string;
    shut: string;
    earlier: string;
    later: string;
    wait: string;
    empty: string;
    note: string;
    prev: string;
    next: string;
    year: string;
    stages: Record<string, string>;
  };
  onStepTime?: (dir: -1 | 1) => void;
  onGateLook?: (look: { stage: string; mass: number; age: number; n: number; m: number } | null) => void;
};

/** Frame clock. A hot preview drops the previous loop when this changes. */
const SKY_CLOCK = 2;

export function GalaxyCanvas({
  params,
  evaluation,
  visualSeed,
  cosmicTime,
  timeRef,
  evolving,
  evolveUntil,
  onEvolveEnd,
  mode,
  collisionKey,
  eggs,
  encounter,
  onEncounter,
  impactKey = 0,
  impactPower = 0,
  onVoyager,
  onTau,
  className,
  relaxed,
  paused,
  scanning,
  wakeKey,
  ariaLabel,
  nudgeRef: skyNudge,
  onSkyH0,
  gate,
  onStepTime,
  onGateLook,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gateOn, setGateOn] = useState(false);
  const [gatePlaced, setGatePlaced] = useState(false);
  const [gateZoom, setGateZoom] = useState(1);
  const [gateBodies, setGateBodies] = useState<{ mass: number; stage: string; age: number; x: number; y: number }[]>([]);
  const [gateAt, setGateAt] = useState(0);
  const [gateRing, setGateRing] = useState<{ x: number; y: number; r: number } | null>(null);
  const onGateLookRef = useRef(onGateLook);
  onGateLookRef.current = onGateLook;
  useEffect(() => {
    if (!gateOn || !gatePlaced || gateBodies.length === 0) {
      onGateLookRef.current?.(null);
      return;
    }
    const body = gateBodies[gateAt % gateBodies.length];
    if (!body) {
      onGateLookRef.current?.(null);
      return;
    }
    onGateLookRef.current?.({
      stage: body.stage,
      mass: body.mass,
      age: body.age,
      n: (gateAt % gateBodies.length) + 1,
      m: gateBodies.length,
    });
  }, [gateOn, gatePlaced, gateBodies, gateAt]);
  const gateRef = useRef<{ x: number; y: number; zoom: number } | null>(null);
  const gateOnRef = useRef(false);
  const gateDirty = useRef(false);
  const gateAtRef = useRef(0);
  const gateListKey = useRef("");
  const gateRingKey = useRef("");
  const onStepTimeRef = useRef(onStepTime);
  gateOnRef.current = gateOn;
  gateAtRef.current = gateAt;
  onStepTimeRef.current = onStepTime;
  if (gateRef.current) gateRef.current.zoom = gateZoom;
  if (!gateOn && gateRef.current) gateRef.current = null;
  const gpuCanvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<GalaxyModel | null>(null);
  const cosmicRef = useRef(cosmicTime);
  const timeLiveRef = useRef(timeRef);
  const evolvingRef = useRef(!!evolving);
  const evolveUntilRef = useRef(evolveUntil ?? 1);
  const onEvolveEndRef = useRef(onEvolveEnd);
  const onSkyH0Ref = useRef(onSkyH0);
  const modeRef = useRef(mode);
  const paramsRef = useRef(params);
  const evRef = useRef(evaluation);
  const collisionKeyRef = useRef(collisionKey);
  const seedRef = useRef(visualSeed);
  const eggsRef = useRef<EggFlags>(eggs ?? QUIET_EGGS);
  const encounterRef = useRef<SkyEncounter | null>(encounter ?? null);
  const onEncounterRef = useRef(onEncounter);
  const impactKeyRef = useRef(impactKey);
  const impactPowerRef = useRef(impactPower);
  const voyagerRef = useRef(onVoyager);
  const tauRef = useRef(onTau);
  const relaxedRef = useRef(!!relaxed);
  const pausedRef = useRef(!!paused);
  const scanningRef = useRef(!!scanning);
  const wakeRef = useRef(wakeKey ?? 0);
  const builtSeed = useRef<number | null>(null);
  const shipsRef = useRef(0);
  timeLiveRef.current = timeRef;
  evolvingRef.current = !!evolving;
  evolveUntilRef.current = evolveUntil ?? 1;
  onEvolveEndRef.current = onEvolveEnd;
  onSkyH0Ref.current = onSkyH0;
  if (!timeRef) cosmicRef.current = cosmicTime;
  modeRef.current = mode;
  paramsRef.current = params;
  evRef.current = evaluation;
  collisionKeyRef.current = collisionKey;
  seedRef.current = visualSeed;
  eggsRef.current = eggs ?? QUIET_EGGS;
  encounterRef.current = encounter ?? null;
  onEncounterRef.current = onEncounter;
  impactKeyRef.current = impactKey;
  impactPowerRef.current = impactPower;
  voyagerRef.current = onVoyager;
  tauRef.current = onTau;
  relaxedRef.current = !!relaxed;
  pausedRef.current = !!paused;
  scanningRef.current = !!scanning;
  wakeRef.current = wakeKey ?? 0;

  useEffect(() => {
    const q = adaptiveQuality();
    let cancelled = false;
    const apply = (built: { model: GalaxyModel; ships: number }) => {
      if (cancelled) return;
      modelRef.current = built.model;
      shipsRef.current = built.ships;
      builtSeed.current = visualSeed;
      onSkyH0Ref.current?.(built.model.h0Long);
    };
    const rebuild = () => {
      void buildGalaxyAsync(params, evaluation, visualSeed, q.scale)
        .then(apply)
        .catch(() => {
          if (!cancelled) apply(buildGalaxyNow(params, evaluation, visualSeed, q.scale));
        });
    };
    if (builtSeed.current !== visualSeed || !modelRef.current) {
      rebuild();
      return () => {
        cancelled = true;
      };
    }
    const id = window.setTimeout(rebuild, 90);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [params, evaluation, visualSeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const loupe = document.createElement("canvas");

    let frame = 0;
    let wait = 0;
    let running = true;
    let dpr = 1;
    let w = 0;
    let h = 0;
    let lastT = 0;
    let spin = 0;
    let turn = 0;
    let dragKind: "look" | "turn" | "" = "";
    let keys = 0;
    let armedKey = collisionKeyRef.current;
    let collisionT = modeRef.current === "collision" ? 1 : 0;
    let yaw = 0.12;
    let pitch = 0.05;
    let vYaw = 0;
    let vPitch = 0;
    let lastYaw = yaw;
    let yawTravel = 0;
    let voyagerSent = false;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let downX = 0;
    let downY = 0;
    let dragTravel = 0;
    const tauHit = { x: 0, y: 0, r: 0, live: false };
    const encHit = { x: 0, y: 0, r: 0, live: false, kind: "wow" as EncounterKind };
    let trauma = 0;
    let hitstop = 0;
    let lastImpact = -1;
    const diskBuf: { s: Star; px: number; py: number; depth: number; near: number }[] = [];
    const brightBuf: { x: number; y: number }[] = [];
    let hidden = typeof document !== "undefined" && document.hidden;
    let flash = 0;
    let lastSeed = seedRef.current;
    let lastWake = wakeRef.current;
    let lastMode = modeRef.current;
    let lastPaint = 0;
    let visualT = cosmicRef.current;
    let idlePaint = false;
    let painted = false;
    let frameLite = false;
    const starTarget: CanvasRenderingContext2D = ctx;
    const gpuEl = gpuCanvasRef.current;
    const wrap = wrapRef.current;
    let gpu: {
      draw: (
        model: GalaxyModel,
        view: {
          ox: number;
          oy: number;
          scale: number;
          rot: number;
          vis: number;
          w: number;
          h: number;
          dpr: number;
          time?: number;
          still?: boolean;
        },
      ) => void;
      clear: () => void;
      destroy: () => void;
    } | null = null;
    if (gpuEl && gpuOffered()) {
      if (wrap) wrap.dataset.skyGpu = skyGpuMark(true, null);
      void import("@/lib/universe/sky-gpu").then(({ createSkyGpu }) =>
        createSkyGpu(gpuEl).then((g) => {
          if (!running) {
            g?.destroy();
            return;
          }
          gpu = g;
          if (wrap) wrap.dataset.skyGpu = skyGpuMark(true, !!g);
        }),
      );
    }
    let stress = 3;
    const backdrop: { key: string; canvas: HTMLCanvasElement }[] = [];
    const evoCache = new WeakMap<Star, { k: number; st: StarState }>();
    const qualityRef = { current: adaptiveQuality() };
    const reducedMq =
      typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    const reducedRef = { current: !!reducedMq?.matches };
    const rr = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0.01);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const q = adaptiveQuality();
      qualityRef.current = q;
      const capW = Math.max(1, Math.floor(window.innerWidth || 1));
      const capH = Math.max(1, Math.floor(window.innerHeight || 1));
      const cssW = Math.floor(rect.width);
      const cssH = Math.floor(rect.height);
      w = Math.max(1, Math.min(capW, cssW >= 32 ? cssW : capW));
      h = Math.max(1, Math.min(capH, cssH >= 32 ? cssH : capH));
      const cap = stress >= 5 ? Math.min(q.dprCap, 1.05) : q.dprCap;
      dpr = canvasDpr(w, h, cap, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      if (gpuEl) {
        gpuEl.width = canvas.width;
        gpuEl.height = canvas.height;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      idlePaint = false;
      painted = false;
    };
    let resizeWait = 0;
    const requestResize = () => {
      window.clearTimeout(resizeWait);
      resizeWait = window.setTimeout(() => {
        resizeWait = 0;
        if (running) resize();
      }, 48);
    };

    const onReduce = () => {
      reducedRef.current = !!reducedMq?.matches;
    };
    reducedMq?.addEventListener("change", onReduce);

    const ro = new ResizeObserver(requestResize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();
    requestAnimationFrame(() => {
      if (running) resize();
    });

    const onDown = (event: PointerEvent) => {
      downX = event.clientX;
      downY = event.clientY;
      lastX = event.clientX;
      lastY = event.clientY;
      dragTravel = 0;
      if (modeRef.current === "planetarium") {
        dragging = true;
        dragKind = "look";
        canvas.setPointerCapture(event.pointerId);
      } else if (modeRef.current === "galaxy") {
        dragging = true;
        dragKind = "turn";
        canvas.setPointerCapture(event.pointerId);
      }
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      dragTravel += Math.hypot(dx, dy);
      if (dragKind === "turn") {
        turn -= dx * 0.006;
      } else {
        vYaw = -dx * 0.0045;
        vPitch = dy * 0.0032;
        yaw += vYaw;
        pitch = Math.max(-1.15, Math.min(1.15, pitch + vPitch));
      }
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onUp = (event: PointerEvent) => {
      const tap =
        dragTravel < 12 &&
        Math.hypot((event.clientX ?? downX) - downX, (event.clientY ?? downY) - downY) < 16;
      dragging = false;
      dragKind = "";
      try {
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      } catch {
        /* capture may already be gone */
      }
      if (!tap) return;
      const rect = canvas.getBoundingClientRect();
      const px = (event.clientX ?? downX) - rect.left;
      const py = (event.clientY ?? downY) - rect.top;
      if (encHit.live && Math.hypot(px - encHit.x, py - encHit.y) <= encHit.r) {
        trauma = Math.min(1, trauma + 0.62);
        hitstop = 0.09;
        onEncounterRef.current?.(encHit.kind);
        return;
      }
      if (gateOnRef.current && (modeRef.current === "galaxy" || modeRef.current === "planetarium")) {
        gateRef.current = { x: px, y: py, zoom: gateRef.current?.zoom ?? 1 };
        gateDirty.current = true;
        gateAtRef.current = 0;
        setGateAt(0);
        setGatePlaced(true);
        return;
      }
      if (tauHit.live && Math.hypot(px - tauHit.x, py - tauHit.y) <= tauHit.r) {
        tauRef.current?.();
      }
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    const onWheel = (event: WheelEvent) => {
      const gateNow = gateRef.current;
      if (!gateOnRef.current || !gateNow) return;
      event.preventDefault();
      const next = Math.min(8, Math.max(1, gateNow.zoom * (event.deltaY > 0 ? 0.86 : 1.16)));
      gateNow.zoom = next;
      gateDirty.current = true;
      setGateZoom(next);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    const onKey = (event: KeyboardEvent) => {
      const mode = modeRef.current;
      if (mode !== "galaxy" && mode !== "planetarium") return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      const step = event.shiftKey ? 0.18 : 0.09;
      if (mode === "galaxy") {
        if (event.key === "ArrowLeft") turn -= step;
        else if (event.key === "ArrowRight") turn += step;
        else return;
      } else if (event.key === "ArrowLeft") yaw -= step;
      else if (event.key === "ArrowRight") yaw += step;
      else if (event.key === "ArrowUp") pitch = Math.max(-1.15, pitch - step);
      else pitch = Math.min(1.15, pitch + step);
      keys = 4;
      window.clearTimeout(wait);
      wait = 0;
      cancelAnimationFrame(frame);
      if (running) frame = requestAnimationFrame(draw);
    };
    canvas.addEventListener("keydown", onKey);
    if (skyNudge) {
      skyNudge.current = (dx, dy) => {
        const modeNow = modeRef.current;
        if (modeNow === "galaxy") turn += dx;
        else if (modeNow === "planetarium") {
          yaw += dx;
          pitch = Math.max(-1.15, Math.min(1.15, pitch + dy));
        } else return;
        keys = 4;
        window.clearTimeout(wait);
        wait = 0;
        cancelAnimationFrame(frame);
        if (running) frame = requestAnimationFrame(draw);
      };
    }

    const onVis = () => {
      hidden = document.hidden;
      window.clearTimeout(wait);
      wait = 0;
      cancelAnimationFrame(frame);
      if (running) frame = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVis);

    const cachedStar = (s: Star, ageGyr: number): StarState => {
      const gravity = paramsRef.current.gravity;
      const key = evolutionKey(ageGyr, gravity);
      const hit = evoCache.get(s);
      if (hit?.k === key) return hit.st;
      const st = evolveStar(s.mass, ageGyr - s.birthGyr, gravity);
      evoCache.set(s, { k: key, st });
      return st;
    };

    const drawStar = (s: Star, x: number, y: number, ageGyr: number, vis: number, time: number) => {
      const g = starTarget;
      const paint = (rgb: readonly [number, number, number], alpha: number) => {
        g.globalAlpha = alpha;
        g.fillStyle = rgbInk(rgb[0], rgb[1], rgb[2]);
      };
      const fillPoint = (size: number) => {
        g.fillRect(x - size * 0.5, y - size * 0.5, size, size);
      };
      const fillDisc = (radius: number) => {
        g.beginPath();
        g.arc(x, y, rr(radius), 0, Math.PI * 2);
        g.fill();
      };
      try {
        if (frameLite) {
          const size = Math.max(LITE_MIN_PX, s.r * 0.95);
          const alpha = Math.min(1, s.a * vis * 1.45);
          if (size > LITE_GLOW_PX) {
            paint(s.rgb, alpha * 0.32);
            g.fillRect(x - size * 1.4, y - size * 1.4, size * 2.8, size * 2.8);
          }
          paint(s.rgb, alpha);
          fillPoint(size);
          return;
        }

        const evolved = cachedStar(s, ageGyr);
        if (evolved.stage === "unborn") return;

        const still = reducedRef.current || idlePaint;
        const alpha = stageAlpha(
          evolved.stage,
          Math.min(1, s.a * vis * twinkleOf(s.phase, time, still) * 1.25),
          evolved.flash,
        );
        const size = apparentRadius(s.r, evolved.stage, evolved.radiusScale, evolved.flash);

        if (isPointStar(size, evolved.stage)) {
          paint(evolved.rgb, Math.min(1, alpha));
          fillPoint(size);
          return;
        }
        if (showsHalo(size, alpha, relaxedRef.current)) {
          paint(evolved.rgb, Math.min(0.5, alpha * 0.42));
          fillDisc(size * HALO_SPAN);
        }
        paint(evolved.rgb, Math.min(1, alpha));
        fillDisc(size);
        if (showsCore(size, alpha)) {
          paint(STAR_CORE, Math.min(0.7, alpha * 0.48));
          fillDisc(size * CORE_SPAN);
        }
        if (evolved.stage === "supernova" && evolved.flash > 0.15) {
          g.globalAlpha = 1;
          g.strokeStyle = `rgba(255,244,220,${evolved.flash * 0.45})`;
          g.lineWidth = 1.2;
          g.beginPath();
          g.arc(x, y, rr(size * 2.4), 0, Math.PI * 2);
          g.stroke();
        }
        if (evolved.stage === "blackHole") {
          g.globalAlpha = 1;
          g.strokeStyle = `rgba(180,160,120,${0.35 * vis})`;
          g.lineWidth = 0.8;
          g.beginPath();
          g.ellipse(x, y, size * 2.8, size * 0.7, 0.4, 0, Math.PI * 2);
          g.stroke();
        }
      } finally {
        g.globalAlpha = 1;
      }
    };

    const drawGalaxyBody = (
      model: GalaxyModel,
      ox: number,
      oy: number,
      rot: number,
      scale: number,
      stretch: number,
      stars: Star[],
      ageGyr: number,
      vis: number,
      time: number,
      dustMul: number,
      late: boolean,
      eternalProb: number,
      tidal?: { dirX: number; dirY: number; rTide: number; pull: number },
      skipStars = false,
    ) => {
      const g = starTarget;
      g.save();
      g.translate(ox, oy);
      g.rotate(rot);
      g.scale(1 + stretch * 0.35, 1 - stretch * 0.2);
      const shear = stretch === 0 && !reducedRef.current && !frameLite;
      const omegaP = model.rotation * 0.52;
      const pms = paramsRef.current;
      const evn = evRef.current;
      const hydro = diskDossier(pms, evn);
      const orbit = (x: number, y: number, k: number) => {
        let px: number;
        let py: number;
        if (!shear) {
          const local = faceOnLocal(x, y, scale);
          px = local.x;
          py = local.y;
        } else {
          const rd = Math.hypot(x, y) || 1e-3;
          const omega = circularOmega(rd, pms, evn) * 0.55;
          const phi = Math.atan2(y, x) + (omega - omegaP) * time * k;
          px = Math.cos(phi) * rd * scale;
          py = Math.sin(phi) * rd * scale;
        }
        if (tidal && tidal.pull > 0.02) {
          const rd = Math.hypot(x, y) || 1e-3;
          if (rd > tidal.rTide) {
            const along = x * tidal.dirX + y * tidal.dirY >= 0 ? 1 : -0.62;
            const u = (rd / tidal.rTide - 1) * tidal.pull * along;
            px += tidal.dirX * u * scale;
            py += tidal.dirY * u * scale;
          }
        }
        return { x: px, y: py };
      };

      g.globalCompositeOperation = "lighter";
      if (!late && vis > 0.08) {
        const [cr, cg, cb] = model.coreRgb;
        const disk = g.createRadialGradient(0, 0, 0, 0, 0, scale * 1.18);
        disk.addColorStop(0, `rgba(${cr},${cg},${cb},${0.22 * vis})`);
        disk.addColorStop(0.32, `rgba(${cr},${cg},${cb},${0.1 * vis})`);
        disk.addColorStop(0.7, `rgba(${cr},${cg},${cb},${0.03 * vis})`);
        disk.addColorStop(1, "rgba(9,6,26,0)");
        g.fillStyle = disk;
        g.beginPath();
        g.ellipse(0, 0, scale * 1.12, scale * 0.8, 0, 0, Math.PI * 2);
        g.fill();
        if (evn.morphology === "spiral" && vis > 0.18 && hydro.niche !== "hot" && hydro.niche !== "rigid") {
          const arms = isOurParams(pms) ? 4 : 2;
          const wind = 2.6 + 18 / Math.max(hydro.pitchDeg, 6);
          g.strokeStyle = `rgba(${cr},${cg},${cb},${0.12 * vis})`;
          g.lineWidth = Math.max(3, scale * 0.05);
          g.lineCap = "round";
          if (hydro.niche === "fragmenting") g.setLineDash([scale * 0.08, scale * 0.07]);
          for (let a = 0; a < arms; a++) {
            g.beginPath();
            const off = (a * Math.PI * 2) / arms;
            for (let i = 0; i <= 24; i++) {
              const t = i / 24;
              const theta = t * wind + off;
              const rad = (0.1 + t * 1.2) * scale * 0.7;
              const x = Math.cos(theta) * rad;
              const y = Math.sin(theta) * rad * 0.78;
              if (i === 0) g.moveTo(x, y);
              else g.lineTo(x, y);
            }
            g.stroke();
          }
          g.setLineDash([]);
          if (hydro.niche !== "fragmenting") {
            g.globalCompositeOperation = "source-over";
            g.strokeStyle = `rgba(18, 10, 22, ${0.22 * vis})`;
            g.lineWidth = Math.max(1.1, scale * 0.016);
            for (let a = 0; a < arms; a++) {
              g.beginPath();
              const off = (a * Math.PI * 2) / arms;
              for (let i = 0; i <= 24; i++) {
                const t = i / 24;
                const theta = t * wind + off - 0.07;
                const rad = (0.1 + t * 1.2) * scale * 0.66;
                const x = Math.cos(theta) * rad;
                const y = Math.sin(theta) * rad * 0.78;
                if (i === 0) g.moveTo(x, y);
                else g.lineTo(x, y);
              }
              g.stroke();
            }
            g.globalCompositeOperation = "lighter";
          }
        }
      }
      if (!late) {
        const clumps = frameLite ? model.clumps.slice(0, 3) : model.clumps;
        const stillCloud = reducedRef.current;
        for (const cl of clumps) {
          const p = orbit(cl.x, cl.y, 0.12);
          const breath = nebulaBreath(cl.x * 12 + cl.y * 7, time, stillCloud);
          const rad = cl.r * scale;
          paintNebula(
            g,
            p.x,
            p.y,
            rad,
            rad * 0.82,
            stillCloud ? 0.4 : time * 0.05 + cl.x,
            cl.rgb,
            Math.min(0.5, cl.a * vis * 1.45),
            breath,
            cl.x * 12 + cl.y * 7,
            frameLite,
          );
        }

        if (!frameLite) {
          for (const d of model.dust) {
            const p = orbit(d.x, d.y, 0.08);
            const breath = nebulaBreath(d.x * 9 + d.y * 5, time, stillCloud);
            paintNebula(
              g,
              p.x,
              p.y,
              d.rx * scale,
              d.ry * scale,
              d.rot + (stillCloud ? 0 : time * 0.04),
              d.rgb,
              Math.min(0.36, d.a * dustMul * 2.1),
              breath,
              d.x * 9 + d.y * 5,
              false,
            );
          }
        }
      }

      const coreR = model.coreScale * scale * (0.85 + vis * 0.4) *
        (model.jet.flicker > 0 ? 0.88 + 0.12 * Math.sin(time * (1.6 + model.jet.flicker * 5)) : 1);
      const core = g.createRadialGradient(0, 0, 0, 0, 0, coreR);
      if (late && eternalProb > 0.18) {
        core.addColorStop(0, `rgba(180, 220, 255, ${0.22 * vis + 0.08 * eternalProb})`);
        core.addColorStop(0.35, `rgba(110, 160, 220, ${0.1 * vis + 0.05 * eternalProb})`);
        core.addColorStop(1, "rgba(9,6,26,0)");
      } else {
        const [cr, cg, cb] = model.coreRgb;
        core.addColorStop(0, `rgba(${cr},${cg},${cb},${0.72 * vis})`);
        core.addColorStop(0.22, `rgba(${cr},${cg},${cb},${0.28 * vis})`);
        core.addColorStop(0.55, `rgba(${cr},${cg},${cb},${0.1 * vis})`);
        core.addColorStop(1, "rgba(9,6,26,0)");
      }
      g.fillStyle = core;
      g.beginPath();
      g.arc(0, 0, coreR, 0, Math.PI * 2);
      g.fill();
      if (model.jet.power > 0 && vis > 0.12) {
        const pulse = 0.74 + 0.26 * Math.sin(time * (0.85 + model.jet.flicker * 3.2));
        const ja = Math.min(0.32, model.jet.power * vis * pulse);
        const [jr, jg, jb] = model.coreRgb;
        const span = scale * 1.48;
        const base = scale * 0.032;
        const mouth = scale * (0.07 + 0.05 * model.jet.power);
        g.save();
        g.rotate(model.jet.pa);
        for (const sgn of [-1, 1] as const) {
          const grad = g.createLinearGradient(0, 0, 0, sgn * span);
          grad.addColorStop(0, `rgba(${jr},${jg},${jb},${ja})`);
          grad.addColorStop(0.35, `rgba(${jr},${jg},${jb},${ja * 0.22})`);
          grad.addColorStop(1, "rgba(9,6,26,0)");
          g.fillStyle = grad;
          g.beginPath();
          g.moveTo(-base, 0);
          g.lineTo(base, 0);
          g.lineTo(mouth, sgn * span);
          g.lineTo(-mouth, sgn * span);
          g.closePath();
          g.fill();
        }
        g.restore();
      }
      g.globalCompositeOperation = "source-over";

      g.globalCompositeOperation = "lighter";
      if (!skipStars) {
      for (const s of stars) {
        const p = orbit(s.x, s.y, 0.32);
        drawStar(s, p.x, p.y, ageGyr, vis, time);
      }
      }
      if (model.jet.power > 0 && vis > 0.12 && !frameLite) {
        const pulse = 0.74 + 0.26 * Math.sin(time * (0.85 + model.jet.flicker * 3.2));
        const ja = Math.min(0.32, model.jet.power * vis * pulse);
        const [jr, jg, jb] = model.coreRgb;
        const span = scale * 1.48;
        const fri = model.jet.fr !== "frii";
        const lobeR = scale * (fri ? 0.4 : 0.2);
        const lobeY = span * (fri ? 0.58 : 0.9);
        g.save();
        g.rotate(model.jet.pa);
        for (const sgn of [-1, 1] as const) {
          const lg = g.createRadialGradient(0, sgn * lobeY, 0, 0, sgn * lobeY, lobeR);
          lg.addColorStop(0, `rgba(${jr},${jg},${jb},${ja * (fri ? 0.22 : 0.48)})`);
          lg.addColorStop(fri ? 0.55 : 0.4, `rgba(${jr},${jg},${jb},${ja * (fri ? 0.08 : 0.16)})`);
          lg.addColorStop(1, "rgba(9,6,26,0)");
          g.fillStyle = lg;
          g.beginPath();
          g.ellipse(0, sgn * lobeY, lobeR * (fri ? 0.62 : 0.48), lobeR, 0, 0, Math.PI * 2);
          g.fill();
        }
        g.restore();
      }
      g.globalCompositeOperation = "source-over";
      g.restore();
    };

    const drawPlanetarium = (
      model: GalaxyModel,
      cx: number,
      cy: number,
      scale: number,
      ageGyr: number,
      vis: number,
      time: number,
    ) => {
      const cam = lookCam(yaw, pitch);
      const fov = PLANETARIUM_FOV;
      const limX = (w / scale) * 0.72;
      const limY = (h / scale) * 0.72;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalCompositeOperation = "lighter";

      const coreP = projectLook(0, 0, 0, cam, fov);
      if (coreP) {
        const rad = rr((model.coreScale * scale * 2.4) / coreP.depth);
        const g = ctx.createRadialGradient(
          coreP.x * scale,
          coreP.y * scale,
          0,
          coreP.x * scale,
          coreP.y * scale,
          rad,
        );
        const [cr, cg, cb] = model.coreRgb;
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${0.55 * vis})`);
        g.addColorStop(0.35, `rgba(${cr},${cg},${cb},${0.16 * vis})`);
        g.addColorStop(1, "rgba(9,6,26,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(coreP.x * scale, coreP.y * scale, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const cl of model.clumps) {
        if (frameLite && (cl.a < 0.18)) continue;
        const p = projectLook(cl.x, cl.y, 0, cam, fov);
        if (!p || Math.abs(p.x) > limX * 1.4 || Math.abs(p.y) > limY * 1.4) continue;
        const breath = nebulaBreath(cl.x * 12 + cl.y * 7, time, reducedRef.current);
        const rad = (cl.r * scale) / p.depth;
        paintNebula(
          ctx,
          p.x * scale,
          p.y * scale,
          rad,
          rad * 0.82,
          reducedRef.current ? 0.4 : time * 0.05 + cl.x,
          cl.rgb,
          Math.min(0.55, cl.a * vis * 1.6),
          breath,
          cl.x * 12 + cl.y * 7,
          frameLite,
        );
      }

      for (const d of model.dust) {
        if (frameLite) continue;
        const p = projectLook(d.x, d.y, 0, cam, fov);
        if (!p || Math.abs(p.x) > limX * 1.5 || Math.abs(p.y) > limY * 1.5) continue;
        const breath = nebulaBreath(d.x * 9 + d.y * 5, time, reducedRef.current);
        paintNebula(
          ctx,
          p.x * scale,
          p.y * scale,
          (d.rx * scale) / p.depth,
          (d.ry * scale) / p.depth,
          d.rot + (reducedRef.current ? 0 : time * 0.04),
          d.rgb,
          Math.min(0.4, d.a * vis * 2.4),
          breath,
          d.x * 9 + d.y * 5,
          false,
        );
      }

      for (const s of model.field) {
        const p = projectLook(s.x, s.y, s.z, cam, fov);
        if (!p || Math.abs(p.x) > limX || Math.abs(p.y) > limY) continue;
        const tw = twinkleOf(s.phase, time, reducedRef.current);
        const size = Math.max(0.35, s.r * 0.26);
        ctx.globalAlpha = s.a * tw * 0.92;
        ctx.fillStyle = rgbInk(s.rgb[0], s.rgb[1], s.rgb[2]);
        ctx.fillRect(p.x * scale - size, p.y * scale - size, size * 2, size * 2);
      }
      ctx.globalAlpha = 1;

      diskBuf.length = 0;
      brightBuf.length = 0;
      for (const s of model.stars) {
        const p = projectLook(s.x, s.y, s.z, cam, fov);
        if (!p || Math.abs(p.x) > limX || Math.abs(p.y) > limY) continue;
        const near = Math.min(2.4, 0.62 / p.depth);
        diskBuf.push({ s, px: p.x * scale, py: p.y * scale, depth: p.depth, near });
      }
      if (!frameLite) diskBuf.sort((a, b) => b.depth - a.depth);
      const step = frameLite ? 2 : 1;
      for (let i = 0; i < diskBuf.length; i += step) {
        const row = diskBuf[i];
        drawStar(row.s, row.px, row.py, ageGyr, vis * row.near, time);
        if (row.s.r * row.near > 1.7 && brightBuf.length < 16) brightBuf.push({ x: row.px, y: row.py });
      }

      ctx.globalCompositeOperation = "source-over";
      if (!frameLite) {
        ctx.strokeStyle = "rgba(213,216,222,0.16)";
        ctx.lineWidth = 0.8;
        for (let i = 0; i < brightBuf.length; i++) {
          let best = -1;
          let bestD = 88;
          for (let j = i + 1; j < brightBuf.length; j++) {
            const dist = Math.hypot(brightBuf[i].x - brightBuf[j].x, brightBuf[i].y - brightBuf[j].y);
            if (dist < bestD && dist > 20) {
              bestD = dist;
              best = j;
            }
          }
          if (best >= 0 && bestD < 78) {
            ctx.beginPath();
            ctx.moveTo(brightBuf[i].x, brightBuf[i].y);
            ctx.lineTo(brightBuf[best].x, brightBuf[best].y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      const ground = ctx.createLinearGradient(0, h * 0.68, 0, h);
      ground.addColorStop(0, "rgba(9,6,26,0)");
      ground.addColorStop(1, "rgba(4,2,12,0.78)");
      ctx.fillStyle = ground;
      ctx.fillRect(0, h * 0.68, w, h * 0.32);

      if (isOurParams(paramsRef.current)) {
        const sol = planetariumScreen(cam.ox - 0.04, cam.oy - 0.008, cam.oz - 0.004, cam, cx, cy, scale);
        const tau = planetariumScreen(cam.ox - 0.02, cam.oy + 0.03, cam.oz + 0.006, cam, cx, cy, scale);
        if (sol && Math.abs(sol.x - cx) < limX * scale && Math.abs(sol.y - cy) < limY * scale) {
          const x = sol.x;
          const y = sol.y;
          ctx.fillStyle = "rgb(150, 190, 255)";
          ctx.beginPath();
          ctx.arc(x, y, 1.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(120, 170, 255, 0.35)";
          ctx.beginPath();
          ctx.arc(x, y, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        if (tau && Math.abs(tau.x - cx) < limX * scale && Math.abs(tau.y - cy) < limY * scale) {
          const hot = eggsRef.current.tau;
          drawTauBeacon(tau.x, tau.y, time, hot, tau.x < cx ? "right" : "left");
          tauHit.x = tau.x;
          tauHit.y = tau.y;
          tauHit.r = 36;
          tauHit.live = true;
        }
      } else if (eggsRef.current.tau) {
        drawTauBeacon(cx + scale * 0.16, h * 0.56, time, true, "right");
      }

      if (yawTravel > Math.PI * 2) {
        const px = w * 0.18;
        const py = h * 0.86;
        ctx.fillStyle = "rgba(212, 175, 90, 0.55)";
        ctx.fillRect(px, py, 11, 7);
        ctx.strokeStyle = "rgba(255, 224, 150, 0.7)";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(px, py, 11, 7);
        if (!voyagerSent) {
          voyagerSent = true;
          voyagerRef.current?.();
        }
      }
    };

    const paintEpoch = (
      g: CanvasRenderingContext2D,
      epoch: CosmicEpoch,
      cx: number,
      cy: number,
      scale: number,
      eternalProb: number,
      alpha = 1,
    ) => {
      g.save();
      g.globalAlpha = alpha;
      try {
        if (alpha >= 0.995) {
          g.fillStyle = "#09061a";
          g.fillRect(0, 0, w, h);
        }
        if (epoch === "inflation") {
          const glow = g.createRadialGradient(cx, cy, 0, cx, cy, scale * 1.6);
          glow.addColorStop(0, "rgb(255, 244, 214)");
          glow.addColorStop(0.28, "rgb(255, 150, 72)");
          glow.addColorStop(0.62, "rgb(140, 40, 90)");
          glow.addColorStop(1, "rgb(18, 8, 28)");
          g.fillStyle = glow;
          g.fillRect(0, 0, w, h);
          return;
        }
        if (epoch === "recombination" || epoch === "darkAges") {
          const d = acousticDossier(paramsRef.current, evRef.current);
          const ages = epoch === "darkAges";
          const rng = mulberry32((seedRef.current ^ (ages ? 0x21c0 : 0xacc0)) >>> 0);
          const skyR = Math.hypot(w, h) * 0.52;
          const qn = paramsRef.current.quantumNoise;
          const dipX = (qn - 0.1) * skyR * 0.4;
          const dipY = (qn - 0.1) * skyR * -0.14;
          const wall = g.createRadialGradient(
            cx + dipX,
            cy + dipY,
            0,
            cx,
            cy,
            skyR * 1.2,
          );
          if (ages) {
            wall.addColorStop(0, "rgb(28, 24, 36)");
            wall.addColorStop(0.5, "rgb(14, 12, 24)");
            wall.addColorStop(1, "rgb(6, 6, 14)");
          } else {
            wall.addColorStop(0, "rgb(176, 86, 62)");
            wall.addColorStop(0.42, "rgb(98, 42, 48)");
            wall.addColorStop(1, "rgb(16, 8, 22)");
          }
          g.fillStyle = wall;
          g.fillRect(0, 0, w, h);
          if (d.niche !== "silent") {
            const ellVis = Math.max(8, Math.min(32, Math.round(d.ell1 / ACOUSTIC_VISUAL)));
            const spot = skyR / ellVis;
            const n = Math.round(ellVis * ellVis * (d.niche === "damped" ? 0.22 : 0.5));
            g.save();
            if (ages) {
              for (let i = 0; i < n; i++) {
                const ang = rng() * Math.PI * 2;
                const rad = Math.sqrt(rng()) * skyR;
                const rr = spot * (0.42 + rng() * 0.75) * (d.niche === "damped" ? 1.55 : 1);
                g.fillStyle = `rgba(4, 6, 14, ${0.28 + rng() * 0.4})`;
                g.beginPath();
                g.arc(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, rr, 0, Math.PI * 2);
                g.fill();
              }
            } else {
              g.globalCompositeOperation = "lighter";
              const amp = 0.08 + d.baryonLoad * 0.07;
              for (let i = 0; i < n; i++) {
                const ang = rng() * Math.PI * 2;
                const rad = Math.sqrt(rng()) * skyR;
                const a = amp * (0.18 + rng() * 0.5);
                const rr = spot * (0.42 + rng() * 0.75) * (d.niche === "damped" ? 1.55 : 1);
                g.fillStyle = `rgba(255, 198, 148, ${a})`;
                g.beginPath();
                g.arc(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, rr, 0, Math.PI * 2);
                g.fill();
              }
            }
            g.restore();
          }
          return;
        }
        if (epoch === "heatDeath") {
          g.fillStyle = "rgb(6, 5, 12)";
          g.fillRect(0, 0, w, h);
          if (eternalProb > 0.12) {
            const ice = g.createRadialGradient(cx, cy, 0, cx, cy, scale * 1.9);
            ice.addColorStop(0, `rgba(170, 214, 255, ${0.08 + eternalProb * 0.2})`);
            ice.addColorStop(0.42, `rgba(90, 140, 210, ${0.05 + eternalProb * 0.1})`);
            ice.addColorStop(1, "rgba(6,5,12,0)");
            g.fillStyle = ice;
            g.fillRect(0, 0, w, h);
          }
          if (eggsRef.current.whale) {
            g.save();
            g.globalAlpha *= 0.18 + eternalProb * 0.22;
            g.translate(cx + scale * 0.18, cy + scale * 0.22);
            g.rotate(-0.35);
            g.fillStyle = "rgb(160, 200, 230)";
            g.beginPath();
            g.ellipse(0, 0, scale * 0.28, scale * 0.07, 0, 0, Math.PI * 2);
            g.fill();
            g.beginPath();
            g.ellipse(scale * 0.22, -scale * 0.02, scale * 0.08, scale * 0.04, 0.4, 0, Math.PI * 2);
            g.fill();
            g.fillStyle = "rgb(12, 16, 28)";
            g.beginPath();
            g.arc(-scale * 0.12, -scale * 0.01, scale * 0.012, 0, Math.PI * 2);
            g.fill();
            g.restore();
          }
          return;
        }
        const sky = g.createRadialGradient(cx, cy, scale * 0.05, cx, cy, scale * 2.2);
        if (epoch === "blackHoles") {
          sky.addColorStop(0, "rgb(28, 14, 22)");
          sky.addColorStop(1, "rgb(8, 5, 12)");
        } else if (epoch === "degeneracy") {
          sky.addColorStop(0, "rgb(40, 24, 28)");
          sky.addColorStop(1, "rgb(10, 6, 20)");
        } else {
          sky.addColorStop(0, "rgb(36, 24, 64)");
          sky.addColorStop(0.45, "rgb(18, 12, 40)");
          sky.addColorStop(1, "rgb(9, 6, 26)");
        }
        g.fillStyle = sky;
        g.fillRect(0, 0, w, h);
        if (epoch === "stellar" || epoch === "reionization") {
          g.globalCompositeOperation = "lighter";
          const wash = g.createRadialGradient(cx - scale * 0.4, cy - scale * 0.2, 0, cx, cy, scale * 1.8);
          wash.addColorStop(0, "rgba(120, 90, 255, 0.18)");
          wash.addColorStop(0.4, "rgba(70, 180, 255, 0.1)");
          wash.addColorStop(1, "rgba(9,6,26,0)");
          g.fillStyle = wash;
          g.fillRect(0, 0, w, h);
          const wash2 = g.createRadialGradient(cx + scale * 0.5, cy + scale * 0.35, 0, cx, cy, scale * 1.6);
          wash2.addColorStop(0, "rgba(255, 140, 90, 0.12)");
          wash2.addColorStop(1, "rgba(9,6,26,0)");
          g.fillStyle = wash2;
          g.fillRect(0, 0, w, h);
          if (epoch === "reionization") {
            const rng = mulberry32((seedRef.current ^ 0xda40) >>> 0);
            const n = Math.round(5 + evRef.current.structure * 16);
            const c = paramsRef.current.complexity;
            for (let i = 0; i < n; i++) {
              const ang = rng() * Math.PI * 2;
              const rad = Math.sqrt(rng()) * scale * 1.45;
              const bx = cx + Math.cos(ang) * rad;
              const by = cy + Math.sin(ang) * rad;
              const br = scale * (0.07 + rng() * 0.14) * (0.55 + c);
              const hole = g.createRadialGradient(bx, by, 0, bx, by, br);
              hole.addColorStop(0, "rgba(255, 226, 186, 0.32)");
              hole.addColorStop(0.4, "rgba(130, 180, 255, 0.14)");
              hole.addColorStop(1, "rgba(9,6,26,0)");
              g.fillStyle = hole;
              g.beginPath();
              g.arc(bx, by, br, 0, Math.PI * 2);
              g.fill();
              g.fillStyle = "rgba(255, 244, 220, 0.85)";
              g.beginPath();
              g.arc(bx, by, 1.15, 0, Math.PI * 2);
              g.fill();
            }
          }
          g.globalCompositeOperation = "source-over";
        }
      } finally {
        g.restore();
      }
    };

    const drawSurveyEnvelopes = (
      g: CanvasRenderingContext2D,
      ox: number,
      oy: number,
      scale: number,
      time: number,
      seed: number,
      quiet: boolean,
    ) => {
      const tick = quiet ? 0 : Math.floor(time * 20);
      const rng = mulberry32((seed ^ 0x5355 ^ tick) >>> 0);
      const n = quiet ? 8 : 6 + Math.floor(rng() * 8);
      g.save();
      g.translate(ox, oy);
      g.globalCompositeOperation = "lighter";
      for (let i = 0; i < n; i++) {
        const live = rng() > 0.72;
        const ang = rng() * Math.PI * 2;
        const rad = Math.sqrt(rng()) * scale * 0.92;
        const rx = scale * (0.035 + rng() * (live ? 0.16 : 0.08));
        const ry = rx * (0.45 + rng() * 0.5);
        const rot = rng() * Math.PI;
        g.save();
        g.translate(Math.cos(ang) * rad * 0.15, Math.sin(ang) * rad * 0.12);
        g.rotate(rot);
        g.strokeStyle = live
          ? `rgba(210, 230, 255, ${0.16 + rng() * 0.2})`
          : `rgba(130, 110, 150, ${0.05 + rng() * 0.07})`;
        g.lineWidth = live ? 1.2 : 0.7;
        g.beginPath();
        g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        g.stroke();
        if (live && rng() > 0.55) {
          g.strokeStyle = `rgba(255, 210, 160, ${0.1 + rng() * 0.12})`;
          g.beginPath();
          g.ellipse(0, 0, rx * 0.45, ry * 0.22, 0, 0, Math.PI * 2);
          g.stroke();
        }
        g.restore();
      }
      g.restore();
    };

    const drawRotationTracers = (
      g: CanvasRenderingContext2D,
      ox: number,
      oy: number,
      scale: number,
      time: number,
      params: UniverseParams,
      ev: Evaluation,
      vis: number,
      quiet: boolean,
    ) => {
      const rings = [0.26, 0.8];
      g.save();
      g.translate(ox, oy);
      g.globalCompositeOperation = "lighter";
      for (let k = 0; k < rings.length; k++) {
        const r = rings[k] ?? 0.26;
        const v = circularOmega(r, params, ev) * r;
        const omega = v / r;
        const px = r * scale;
        g.strokeStyle = `rgba(200, 214, 255, ${0.1 + vis * 0.14})`;
        g.lineWidth = 1;
        g.setLineDash([2, 6]);
        g.beginPath();
        g.arc(0, 0, px, 0, Math.PI * 2);
        g.stroke();
        g.setLineDash([]);
        const n = k === 0 ? 5 : 7;
        const phase = quiet ? 0 : time * omega * 0.5;
        for (let i = 0; i < n; i++) {
          const ang = phase + (i / n) * Math.PI * 2;
          g.fillStyle = `rgba(220, 230, 255, ${0.28 + vis * 0.45})`;
          g.beginPath();
          g.arc(Math.cos(ang) * px, Math.sin(ang) * px, k === 0 ? 1.55 : 1.85, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.restore();
    };

    const drawShips = (
      g: CanvasRenderingContext2D,
      ox: number,
      oy: number,
      scale: number,
      rot: number,
      time: number,
      ships: number,
      eternalProb: number,
      quiet: boolean,
    ) => {
      const n = Math.max(3, Math.min(16, Math.round(3 + ships * 22)));
      g.save();
      g.translate(ox, oy);
      g.rotate(rot * 0.22);
      g.globalCompositeOperation = "lighter";
      const gold = eternalProb > 0.2;
      if (!quiet) {
        g.strokeStyle = gold ? "rgba(180,220,255,0.14)" : "rgba(255,210,140,0.16)";
        g.lineWidth = 0.8;
        g.setLineDash([4, 9]);
        g.beginPath();
        g.ellipse(0, 0, scale * 0.36, scale * 0.13, 0.18, 0, Math.PI * 2);
        g.stroke();
        g.beginPath();
        g.ellipse(0, 0, scale * 0.5, scale * 0.18, -0.12, 0, Math.PI * 2);
        g.stroke();
        g.setLineDash([]);
      }
      for (let i = 0; i < n; i++) {
        const a = (quiet ? i * 1.31 : time * (0.11 + i * 0.017)) + i * 1.67;
        const r = scale * (0.2 + (i % 5) * 0.09);
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * 0.36;
        const tx = -Math.sin(a) * r;
        const ty = Math.cos(a) * r * 0.36;
        const len = Math.hypot(tx, ty) || 1;
        const ux = tx / len;
        const uy = ty / len;
        g.strokeStyle = gold ? "rgba(180,220,255,0.45)" : "rgba(255,210,140,0.5)";
        g.lineWidth = 1.15;
        g.beginPath();
        g.moveTo(x - ux * 10, y - uy * 10);
        g.lineTo(x, y);
        g.stroke();
        g.fillStyle = gold ? "rgba(210,230,255,0.95)" : "rgba(255,230,190,0.95)";
        g.beginPath();
        g.moveTo(x + ux * 6, y + uy * 6);
        g.lineTo(x - uy * 3.2, y + ux * 3.2);
        g.lineTo(x + uy * 3.2, y - ux * 3.2);
        g.closePath();
        g.fill();
      }
      g.restore();
    };

    const drawTide = (
      g: CanvasRenderingContext2D,
      ox: number,
      oy: number,
      scale: number,
      rot: number,
      time: number,
      swarmProb: number,
      quiet: boolean,
    ) => {
      if (swarmProb < 0.18) return;
      const bloom = swarmProb >= 0.45;
      const n = quiet ? 7 : Math.max(10, Math.min(32, Math.round(10 + swarmProb * 34)));
      g.save();
      g.translate(ox, oy);
      g.rotate(rot * 0.1);
      g.globalCompositeOperation = "lighter";
      if (bloom && !quiet) {
        g.strokeStyle = `rgba(120, 220, 230, ${0.07 + swarmProb * 0.12})`;
        g.lineWidth = 0.7;
        g.setLineDash([2, 11]);
        g.beginPath();
        g.ellipse(0, 0, scale * 0.64, scale * 0.22, 0.1, 0, Math.PI * 2);
        g.stroke();
        g.beginPath();
        g.ellipse(0, 0, scale * 0.86, scale * 0.3, -0.18, 0, Math.PI * 2);
        g.stroke();
        g.setLineDash([]);
      }
      for (let i = 0; i < n; i++) {
        const hop = quiet ? i * 0.4 : time * (0.19 + (i % 5) * 0.035) + i * 0.73;
        const a = hop + i * 2.399;
        const r = scale * (0.16 + (i % 7) * 0.1);
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * 0.38;
        const pulse = quiet ? 0.55 : 0.38 + 0.62 * (0.5 + 0.5 * Math.sin(hop * 3.05 + i));
        const alpha = (0.2 + swarmProb * 0.48) * pulse;
        const sz = bloom ? 1.85 : 1.25;
        g.fillStyle = `rgba(140, 235, 240, ${alpha})`;
        g.fillRect(x - sz * 0.5, y - sz * 0.5, sz, sz);
        if (!quiet && bloom) {
          const trail = 5 + (i % 3) * 3;
          g.strokeStyle = `rgba(120, 220, 230, ${alpha * 0.42})`;
          g.lineWidth = 0.75;
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x + Math.sin(a) * trail, y - Math.cos(a) * trail * 0.38);
          g.stroke();
        }
      }
      g.restore();
    };

    const drawHighway = (
      g: CanvasRenderingContext2D,
      ox: number,
      oy: number,
      scale: number,
      time: number,
      quiet: boolean,
    ) => {
      g.save();
      g.translate(ox, oy);
      g.rotate(-0.22);
      g.globalCompositeOperation = "lighter";
      g.strokeStyle = "rgba(255, 214, 160, 0.22)";
      g.lineWidth = 1.1;
      g.setLineDash(quiet ? [] : [7, 11]);
      g.lineDashOffset = quiet ? 0 : -time * 18;
      g.beginPath();
      g.moveTo(-scale * 1.15, scale * 0.04);
      g.lineTo(scale * 1.15, -scale * 0.05);
      g.stroke();
      g.strokeStyle = "rgba(255, 214, 160, 0.12)";
      g.lineWidth = 0.7;
      g.beginPath();
      g.moveTo(-scale * 1.15, scale * 0.09);
      g.lineTo(scale * 1.15, 0);
      g.stroke();
      g.beginPath();
      g.moveTo(-scale * 1.15, -scale * 0.01);
      g.lineTo(scale * 1.15, -scale * 0.1);
      g.stroke();
      g.setLineDash([]);
      g.restore();
    };

    const drawBelt = (
      g: CanvasRenderingContext2D,
      ox: number,
      oy: number,
      scale: number,
      rot: number,
      time: number,
      quiet: boolean,
    ) => {
      g.save();
      g.translate(ox, oy);
      g.rotate(rot * 0.08);
      g.globalCompositeOperation = "lighter";
      g.strokeStyle = "rgba(180, 220, 255, 0.16)";
      g.lineWidth = 1.2;
      g.beginPath();
      g.ellipse(0, 0, scale * 0.58, scale * 0.2, 0.18, 0, Math.PI * 2);
      g.stroke();
      const n = quiet ? 10 : 22;
      for (let i = 0; i < n; i++) {
        const a = (quiet ? 0 : time * 0.09) + i * 0.29;
        const x = Math.cos(a) * scale * 0.58;
        const y = Math.sin(a) * scale * 0.2;
        g.fillStyle = `rgba(200, 230, 255, ${0.18 + (i % 4) * 0.08})`;
        g.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
      }
      g.restore();
    };

    const drawWow = (w: number, h: number, time: number) => {
      const x0 = Math.max(16, w * 0.065);
      const y0 = Math.max(72, h * 0.12);
      const y1 = Math.min(h * 0.48, h - 220);
      if (y1 - y0 < 48) return;
      const peakY = y0 + (y1 - y0) * 0.38;
      const colW = Math.min(28, w * 0.08);
      const pulse = reducedRef.current ? 1 : 0.72 + 0.28 * Math.abs(Math.sin(time * 2.15));
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(120, 230, 220, 0.16)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0, y1);
      ctx.stroke();
      ctx.beginPath();
      const n = 32;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const y = y0 + (y1 - y0) * t;
        const d = (y - peakY) / ((y1 - y0) * 0.07);
        const amp = Math.exp(-d * d) * colW * pulse;
        const x = x0 + amp;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(150, 255, 235, ${0.55 + 0.35 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = `rgba(140, 255, 230, ${0.12 * pulse})`;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const y = y0 + (y1 - y0) * t;
        const d = (y - peakY) / ((y1 - y0) * 0.07);
        ctx.lineTo(x0 + Math.exp(-d * d) * colW * pulse, y);
      }
      ctx.lineTo(x0, y1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(150, 255, 235, ${0.7 * pulse})`;
      ctx.beginPath();
      ctx.arc(x0 + colW * pulse, peakY, 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "600 9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = "rgba(150, 255, 235, 0.55)";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("1420", x0, y1 + 6);
      ctx.restore();
    };

    const drawEncounter = (x: number, y: number, time: number, kind: EncounterKind) => {
      const pulse = reducedRef.current ? 1 : 0.72 + 0.28 * Math.abs(Math.sin(time * 1.35));
      const rgb =
        kind === "wow"
          ? "140,255,230"
          : kind === "throat"
            ? "160,200,255"
            : kind === "whale"
              ? "180,220,255"
              : "255,214,160";
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(${rgb},${0.22 + 0.18 * pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 11 + pulse * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(${rgb},${0.4 + 0.25 * pulse})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawWitness = (ox: number, oy: number, scale: number, time: number) => {
      const pulse = reducedRef.current ? 1 : 0.7 + 0.3 * Math.abs(Math.sin(time * 0.9));
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(-0.12);
      ctx.strokeStyle = `rgba(255, 214, 160, ${0.18 * pulse})`;
      ctx.lineWidth = 1;
      ctx.setLineDash(reducedRef.current ? [] : [5, 9]);
      ctx.lineDashOffset = reducedRef.current ? 0 : -time * 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, scale * 0.78, scale * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(255, 214, 160, ${0.28 * pulse})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.lineTo(-7, 0);
      ctx.moveTo(7, 0);
      ctx.lineTo(11, 0);
      ctx.moveTo(0, -6);
      ctx.lineTo(0, -4);
      ctx.stroke();
      ctx.restore();
    };

    const drawThroat = (ox: number, oy: number, scale: number, time: number) => {
      const open = reducedRef.current ? 1 : 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(time * 0.85));
      const rx = scale * (0.3 + 0.22 * open);
      const ry = scale * (0.11 + 0.1 * open);
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(-0.2);
      ctx.globalCompositeOperation = "lighter";
      const swirl = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      swirl.addColorStop(0, `rgba(12, 18, 48, ${0.55 + 0.25 * open})`);
      swirl.addColorStop(0.42, `rgba(70, 140, 255, ${0.22 + 0.18 * open})`);
      swirl.addColorStop(0.78, `rgba(190, 220, 255, ${0.38 + 0.2 * open})`);
      swirl.addColorStop(1, "rgba(180, 210, 255, 0)");
      ctx.fillStyle = swirl;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(200, 230, 255, ${0.4 + 0.3 * open})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(160, 200, 255, ${0.22 * open})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 1.18, ry * 1.18, 0, 0, Math.PI * 2);
      ctx.stroke();
      const ticks = 7;
      for (let i = 0; i < ticks; i++) {
        const a = time * 0.5 + (i * Math.PI * 2) / ticks;
        const x = Math.cos(a) * rx;
        const y = Math.sin(a) * ry;
        ctx.fillStyle = `rgba(210, 235, 255, ${0.35 + 0.35 * open})`;
        ctx.fillRect(x - 1.1, y - 1.1, 2.2, 2.2);
      }
      ctx.restore();
    };

    const drawTauBeacon = (x: number, y: number, time: number, hot: boolean, label: "left" | "right") => {
      const flicker = reducedRef.current ? 1 : 0.55 + 0.45 * Math.abs(Math.sin(time * 1.65));
      const rgb = "255,210,168";
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(${rgb},${hot ? 0.55 + 0.35 * flicker : 0.42})`;
      ctx.beginPath();
      ctx.arc(x, y, hot ? 2.4 : 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${rgb},${hot ? 0.22 * flicker : 0.16})`;
      ctx.beginPath();
      ctx.arc(x, y, hot ? 7.5 : 6, 0, Math.PI * 2);
      ctx.fill();
      if (hot) {
        for (let i = 0; i < 3; i++) {
          const span = 56;
          const r = 10 + ((time * 26 + i * 18) % span);
          const a = (1 - r / (span + 8)) * 0.42 * flicker;
          ctx.strokeStyle = `rgba(${rgb},${a})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
      ctx.save();
      ctx.font = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = `rgba(${rgb},${hot ? 0.55 + 0.35 * flicker : 0.5})`;
      ctx.textBaseline = "middle";
      if (label === "left") {
        ctx.textAlign = "right";
        ctx.fillText("τ Cet", x - 12, y);
      } else {
        ctx.textAlign = "left";
        ctx.fillText("τ Cet", x + 12, y);
      }
      ctx.restore();
    };

    const schedule = (ms: number) => {
      if (!running) return;
      window.clearTimeout(wait);
      wait = 0;
      cancelAnimationFrame(frame);
      // A short timer fires late: the disk sits, then the next paint skips the stall.
      if (ms >= 80) {
        wait = window.setTimeout(() => {
          wait = 0;
          if (running) frame = requestAnimationFrame(draw);
        }, ms);
        return;
      }
      frame = requestAnimationFrame(draw);
    };

    const draw = (t: number) => {
      if (!running) return;
      const rest = hidden || pausedRef.current;
      if (rest) {
        schedule(hidden ? 400 : 280);
        return;
      }
      const skyNow = modeRef.current;
      const skyPulse =
        skyNow === "galaxy" && !reducedRef.current && !relaxedRef.current;
      const live =
        evolvingRef.current ||
        dragging ||
        skyNow === "planetarium" ||
        (skyNow === "collision" && collisionT < 0.999) ||
        collisionKeyRef.current !== armedKey ||
        skyNow !== lastMode ||
        eggsRef.current.tau ||
        eggsRef.current.zone ||
        eggsRef.current.wow ||
        eggsRef.current.witness ||
        eggsRef.current.throat ||
        encounterRef.current ||
        (skyNow === "galaxy" && (isHighwayParams(paramsRef.current) || isBeltParams(paramsRef.current))) ||
        wakeRef.current !== lastWake ||
        seedRef.current !== lastSeed ||
        (skyNow === "galaxy" && (evRef.current.swarmProb ?? 0) >= 0.18) ||
        skyPulse ||
        keys > 0;
      if (idlePaint && painted && !live && !rest && !gateDirty.current) {
        schedule(140);
        return;
      }
      const minGap = rest
        ? 0
        : reducedRef.current
          ? 48
          : relaxedRef.current
            ? 40
            : skyNow === "planetarium" && !dragging
              ? frameLite || stress >= 3
                ? 33
                : 24
              : skyNow === "galaxy" && !evolvingRef.current
                ? frameLite || stress >= 3 || w * h > 1_400_000
                  ? 33
                  : 22
                : w * h > 2_000_000
                  ? 16
                  : 0;
      const waitLeft = lastPaint ? minGap - (t - lastPaint) : 0;
      if (minGap && waitLeft > 8) {
        schedule(waitLeft);
        return;
      }
      lastPaint = t;
      gateDirty.current = false;
      if (keys > 0) keys -= 1;
      const t0 = typeof performance !== "undefined" ? performance.now() : t;
      frameLite =
        relaxedRef.current ||
        reducedRef.current ||
        qualityRef.current.scale < 0.4 ||
        stress >= 2;
      try {
      if (!modelRef.current) {
        try {
          const built = buildGalaxyNow(
            paramsRef.current,
            evRef.current,
            seedRef.current,
            qualityRef.current.scale,
          );
          modelRef.current = built.model;
          shipsRef.current = built.ships;
          builtSeed.current = seedRef.current;
        } catch {
          /* keep a black field rather than throw */
        }
      }
      const model = modelRef.current;
      const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016;
      lastT = t;
      if (!reducedRef.current) spin += Math.min(dt, 1 / 30);
      if (!model) {
        ctx.fillStyle = "#09061a";
        ctx.fillRect(0, 0, Math.max(w, 1), Math.max(h, 1));
        painted = true;
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tauHit.live = false;
      encHit.live = false;

      if (impactKeyRef.current !== lastImpact) {
        lastImpact = impactKeyRef.current;
        trauma = Math.min(1, Math.max(trauma, impactPowerRef.current));
        hitstop = impactPowerRef.current > 0.7 ? 0.08 : 0.04;
        flash = Math.max(flash, 0.22 + impactPowerRef.current * 0.12);
      }

      const clock = timeLiveRef.current ?? cosmicRef;
      const frozen = hitstop > 0;
      if (frozen) hitstop = Math.max(0, hitstop - dt);
      if (evolvingRef.current && !reducedRef.current && !frozen) {
        const stepped = stepCosmicTime(clock.current, dt);
        const cap = evolveUntilRef.current;
        if (stepped.t >= cap || stepped.done) {
          clock.current = stepped.done && cap >= 1 ? 1 : Math.min(stepped.t, cap);
          evolvingRef.current = false;
          onEvolveEndRef.current?.();
        } else {
          clock.current = stepped.t;
        }
      }

      if (seedRef.current !== lastSeed) {
        lastSeed = seedRef.current;
        flash = 1;
      }
      lastMode = modeRef.current;
      if (wakeRef.current !== lastWake) {
        lastWake = wakeRef.current;
        flash = Math.max(flash, 0.9);
      }
      if (flash > 0) flash = Math.max(0, flash - dt * 1.7);

      if (!dragging && modeRef.current === "planetarium" && !reducedRef.current) {
        yaw += vYaw + dt * 0.028;
        pitch = Math.max(-1.15, Math.min(1.15, pitch + vPitch));
        vYaw *= Math.exp(-dt * 3.2);
        vPitch *= Math.exp(-dt * 3.2);
        if (Math.abs(vYaw) < 1e-4) vYaw = 0;
        if (Math.abs(vPitch) < 1e-4) vPitch = 0;
      }
      if (dragging || Math.abs(vYaw) > 0.05) {
        yawTravel += Math.abs(yaw - lastYaw);
      }
      lastYaw = yaw;

      if (collisionKeyRef.current !== armedKey) {
        armedKey = collisionKeyRef.current;
        collisionT = reducedRef.current ? 1 : 0;
        flash = Math.max(flash, 0.55);
      }
      if (modeRef.current === "collision" && collisionT < 1) {
        collisionT = Math.min(1, collisionT + dt * (reducedRef.current ? 8 : 0.16));
      }

      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.min(w, h) * 0.4;
      if (!Number.isFinite(scale) || scale <= 0) return;
      let shook = false;
      if (trauma > 0.01 && !reducedRef.current) {
        const s = trauma * trauma;
        ctx.save();
        ctx.translate(Math.sin(t * 0.063) * 16 * s, Math.cos(t * 0.051) * 12 * s);
        shook = true;
      }
      trauma = Math.max(0, trauma - dt * 1.85);
      const time = reducedRef.current ? 0 : spin;
      const targetT = (timeLiveRef.current ?? cosmicRef).current;
      if (reducedRef.current) visualT = targetT;
      else visualT += (targetT - visualT) * (1 - Math.exp(-2.4 * dt));
      const ev = evRef.current;
      const pms = paramsRef.current;
      const hydro = diskDossier(pms, ev);
      const blend = epochBlend(visualT);
      const epoch = epochShown(visualT);
      const vis = galaxyVisibility(visualT, ev);
      const ageGyr = cosmicAgeGyr(visualT, pms, ev);
      const skyMode = modeRef.current;
      const rot = (reducedRef.current ? 0 : time * model.rotation * 0.52) + turn;
      const late = epoch === "heatDeath" || epoch === "blackHoles";
      const eternalProb = ev.eternalProb ?? 0;

      const paintSkyEpoch = (
        epoch: CosmicEpoch,
        alpha: number,
      ) => {
        const still = alpha >= 0.995 && w * h <= 900_000;
        if (!still) {
          paintEpoch(ctx, epoch, cx, cy, scale, eternalProb, alpha);
          return;
        }
        const acoust = acousticDossier(pms, ev);
        const key = epochBackdropKey({
          epoch,
          w,
          h,
          dpr,
          seed: seedRef.current,
          quantumNoise: pms.quantumNoise,
          complexity: pms.complexity,
          structure: ev.structure,
          eternalProb,
          whale: eggsRef.current.whale,
          niche: acoust.niche,
          ell1: acoust.ell1,
          baryonLoad: acoust.baryonLoad,
        });
        let slot = backdrop.find((row) => row.key === key);
        if (!slot) {
          const layer = document.createElement("canvas");
          layer.width = Math.max(1, Math.floor(w * dpr));
          layer.height = Math.max(1, Math.floor(h * dpr));
          const layerCtx = layer.getContext("2d");
          if (!layerCtx) {
            paintEpoch(ctx, epoch, cx, cy, scale, eternalProb, alpha);
            return;
          }
          layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
          layerCtx.imageSmoothingEnabled = false;
          paintEpoch(layerCtx, epoch, cx, cy, scale, eternalProb, 1);
          slot = { key, canvas: layer };
          backdrop.push(slot);
          if (backdrop.length > 2) backdrop.shift();
        }
        ctx.drawImage(slot.canvas, 0, 0, w, h);
      };
      paintSkyEpoch(blend.from, 1);
      if (blend.mix > 0.02 && blend.to !== blend.from) {
        paintEpoch(ctx, blend.to, cx, cy, scale, eternalProb, blend.mix);
      }

      if (skyMode === "planetarium") {
        drawPlanetarium(model, cx, cy, scale, ageGyr, Math.max(vis, 0.18), time);
      } else if (scanningRef.current && skyMode === "galaxy") {
        drawSurveyEnvelopes(ctx, cx, cy, scale, time, seedRef.current, reducedRef.current);
      } else {
        ctx.save();
        ctx.translate(cx, cy);

        if (skyMode === "lensing" || (skyMode === "galaxy" && vis > 0.28 && !late)) {
          const haloR = model.haloRadius * scale;
          const strong = skyMode === "lensing";
          const washShape = haloWashShape(strong ? "nfw" : haloModel(pms, ev));
          const wash = ctx.createRadialGradient(0, 0, haloR * washShape.core, 0, 0, haloR);
          wash.addColorStop(
            0,
            `rgba(150,185,255,${(strong ? 0.1 : 0.03) + ev.darkMatterFraction * (strong ? 0.12 : 0.04)})`,
          );
          wash.addColorStop(
            washShape.shoulder,
            `rgba(110,150,230,${(strong ? 0.07 : 0.02) + ev.darkMatterFraction * (strong ? 0.09 : 0.03)})`,
          );
          wash.addColorStop(1, "rgba(9,6,26,0)");
          ctx.fillStyle = wash;
          ctx.beginPath();
          ctx.arc(0, 0, haloR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalCompositeOperation = "lighter";
        if (!(gpu && skyMode === "galaxy")) {
        for (const s of model.field) {
          const tw = twinkleOf(s.phase, time, reducedRef.current);
          const a = s.a * tw * (late ? 0.08 + vis * 0.35 + eternalProb * 0.18 : 0.7 + vis * 0.5);
          ctx.globalAlpha = a;
          ctx.fillStyle = rgbInk(s.rgb[0], s.rgb[1], s.rgb[2]);
          const fr = Math.max(0.35, s.r);
          ctx.fillRect(s.x * scale - fr * 0.5, s.y * scale - fr * 0.5, fr, fr);
        }
        ctx.globalAlpha = 1;
        }
        ctx.globalCompositeOperation = "source-over";

        const showSources = vis > 0.12;
        if ((skyMode === "lensing" || vis > 0.2) && (skyMode !== "lensing" || showSources)) {
          const rs = nfwScale(pms, ev);
          const ks = nfwKappaS(pms, ev);
          for (const bg of model.background) {
            const images =
              skyMode === "lensing" ? nfwLensImages(bg.x, bg.y, rs, ks) : [{ x: bg.x, y: bg.y, stretch: 1, parity: 1 as const }];
            for (const img of images) {
              const tangent = Math.atan2(img.y, img.x) + Math.PI / 2;
              const rx = bg.rx * scale * (skyMode === "lensing" ? img.stretch : 1);
              const ry = bg.ry * scale * (skyMode === "lensing" ? 0.55 : 1);
              const fade = img.parity < 0 ? 0.45 : 1;
              ctx.save();
              ctx.translate(img.x * scale, img.y * scale);
              ctx.rotate(skyMode === "lensing" ? tangent : bg.rot);
              ctx.fillStyle = `rgba(${bg.rgb[0]},${bg.rgb[1]},${bg.rgb[2]},${bg.a * (skyMode === "lensing" ? 0.92 : 0.55) * fade})`;
              ctx.beginPath();
              ctx.ellipse(0, 0, rr(rx), rr(ry), 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }
        ctx.restore();

        if (skyMode === "collision") {
          const p = collisionT;
          const ease = p * p * (3 - 2 * p);
          const stretch = Math.sin(p * Math.PI) * 0.35;
          const enc = model.encounter;
          const sep = 1.45 * (1 - ease);
          const rTide = Math.max(0.1, sep * Math.pow(enc.q / 3, 1 / 3));
          const pull = Math.sin(p * Math.PI);
          const x1 = -0.72 * (1 - ease) * scale;
          const x2 = 0.78 * (1 - ease) * scale;
          const y2 = 0.22 * (1 - ease) * scale;
          const qScale = 0.38 + 0.5 * Math.sqrt(enc.q);
          drawGalaxyBody(
            model,
            cx + x1,
            cy,
            rot * 0.15,
            scale * (0.72 + 0.28 * ease),
            stretch,
            model.stars,
            ageGyr,
            vis,
            time,
            1,
            late,
            eternalProb,
            { dirX: 1, dirY: 0, rTide, pull },
          );
          drawGalaxyBody(
            model,
            cx + x2,
            cy + y2,
            -rot * 0.2,
            scale * qScale,
            stretch,
            model.companion,
            ageGyr,
            vis * (1 - ease * 0.65),
            time,
            0.7,
            late,
            eternalProb,
            { dirX: -1, dirY: 0.12, rTide: rTide * Math.pow(enc.q, 1 / 3), pull },
          );
          if (enc.kind === "major" && p > 0.4 && p < 0.75) {
            const peak = 1 - Math.abs(p - 0.58) / 0.22;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.globalCompositeOperation = "lighter";
            const burst = ctx.createRadialGradient(0, 0, 0, 0, 0, scale * 0.22);
            burst.addColorStop(0, `rgba(255, 236, 200, ${peak * 0.16})`);
            burst.addColorStop(1, "rgba(9,6,26,0)");
            ctx.fillStyle = burst;
            ctx.beginPath();
            ctx.arc(0, 0, scale * 0.22, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        } else {
          const diskVis = skyMode === "lensing" ? vis * 0.7 : vis;
          drawGalaxyBody(
            model,
            cx,
            cy,
            rot,
            scale,
            0,
            model.stars,
            ageGyr,
            diskVis,
            time,
            diskVis,
            late,
            eternalProb,
            undefined,
            !!(gpu && skyMode === "galaxy" && !gateRef.current),
          );
          const mesh = hydro.mesh;
          const bad = mesh.filter((s) => s.Q < 1.05);
          const inner = bad[0];
          const outer = bad[bad.length - 1];
          if (inner && outer && vis > 0.22 && !late && hydro.niche === "fragmenting") {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.strokeStyle = `rgba(255, 168, 112, ${0.22 + vis * 0.18})`;
            ctx.setLineDash([4, 5]);
            ctx.lineWidth = 1.05;
            ctx.beginPath();
            ctx.ellipse(0, 0, outer.r * scale * 0.72, outer.r * scale * 0.56, 0, 0, Math.PI * 2);
            ctx.stroke();
            if (outer.r - inner.r > 0.12) {
              ctx.beginPath();
              ctx.ellipse(0, 0, inner.r * scale * 0.72, inner.r * scale * 0.56, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.setLineDash([]);
            ctx.restore();
          }
        }

        if (skyMode === "lensing") {
          const thetaE = einsteinRadius(ev, pms);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.strokeStyle = `rgba(180, 210, 255, ${0.45 + ev.darkMatterFraction * 0.35})`;
          ctx.lineWidth = 1.25;
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(8, thetaE * scale * 1.05), 0, Math.PI * 2);
          ctx.stroke();
          const xr = nfwRadialX(nfwKappaS(pms, ev));
          if (xr > 0.05) {
            ctx.strokeStyle = `rgba(180, 210, 255, ${0.22 + ev.darkMatterFraction * 0.15})`;
            ctx.setLineDash([2, 6]);
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(4, xr * nfwScale(pms, ev) * scale), 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.setLineDash([]);
          ctx.restore();
        }
      }

      const ships = shipsRef.current;
      const lite = frameLite || relaxedRef.current || qualityRef.current.scale < 0.45;
      if (
        skyMode === "galaxy" &&
        !late &&
        vis > 0.3 &&
        (epoch === "stellar" || epoch === "reionization")
      ) {
        drawRotationTracers(
          ctx,
          cx,
          cy,
          scale,
          time,
          pms,
          ev,
          vis,
          lite || reducedRef.current,
        );
      }
      if (
        ships >= 0.05 &&
        skyMode === "galaxy" &&
        !scanningRef.current &&
        !late &&
        vis > 0.32 &&
        (epoch === "stellar" || epoch === "reionization")
      ) {
        drawShips(ctx, cx, cy, scale, rot, time, ships, eternalProb, lite || reducedRef.current);
      }

      const swarmProb = ev.swarmProb ?? 0;
      if (
        swarmProb >= 0.18 &&
        skyMode === "galaxy" &&
        !scanningRef.current &&
        !late &&
        vis > 0.28 &&
        (epoch === "stellar" || epoch === "reionization")
      ) {
        drawTide(ctx, cx, cy, scale, rot, time, swarmProb, lite || reducedRef.current);
      }

      if (skyMode === "galaxy" && !late && vis > 0.22) {
        if (isHighwayParams(pms)) {
          drawHighway(ctx, cx, cy, scale, time, lite || reducedRef.current);
        }
        if (isBeltParams(pms)) {
          drawBelt(ctx, cx, cy, scale, rot, time, lite || reducedRef.current);
        }
      }

      if (skyMode === "galaxy") {
        if (eggsRef.current.throat) drawThroat(cx, cy, scale, time);
        if (eggsRef.current.witness) drawWitness(cx, cy, scale, time);
      }

      if (!lite && !reducedRef.current && skyMode === "galaxy" && !late && pms.quantumNoise > 0.38) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const n = 8 + Math.floor(pms.quantumNoise * 20);
        for (let i = 0; i < n; i++) {
          const a = time * (0.45 + i * 0.05) + i * 1.3;
          const r = scale * (0.12 + (i % 7) * 0.11);
          ctx.fillStyle = `rgba(255, 214, 160, ${0.1 + pms.quantumNoise * 0.25})`;
          ctx.fillRect(cx + Math.cos(a) * r - 0.7, cy + Math.sin(a) * r * 0.42 - 0.7, 1.4, 1.4);
        }
        ctx.restore();
      }

      if (skyMode !== "planetarium" && !frameLite) {
        const vg = ctx.createRadialGradient(
          cx,
          cy,
          scale * 0.75,
          cx,
          cy,
          Math.max(w, h) * 0.7,
        );
        vg.addColorStop(0, "rgba(9,6,26,0)");
        vg.addColorStop(1, "rgba(9,6,26,0.28)");
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, w, h);
      }

      if (flash > 0.02) {
        const ice = (ev.eternalProb ?? 0) > 0.4;
        const tide = (ev.swarmProb ?? 0) > 0.4;
        ctx.fillStyle = ice
          ? `rgba(180, 220, 255, ${flash * 0.34})`
          : tide
            ? `rgba(120, 230, 235, ${flash * 0.28})`
            : `rgba(255, 214, 150, ${flash * 0.3})`;
        ctx.fillRect(0, 0, w, h);
      }

      const ended = fateWash(ev.fate);
      if (ended && skyMode !== "planetarium") {
        ctx.fillStyle = `rgba(${ended.r},${ended.g},${ended.b},${ended.a})`;
        ctx.fillRect(0, 0, w, h);
      }

      if (eggsRef.current.wow) {
        drawWow(w, h, time);
      }

      if (eggsRef.current.zone && !reducedRef.current) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const drift = (time * 38) % 7;
        ctx.fillStyle = "rgba(255, 214, 150, 0.04)";
        for (let y = -2; y < h; y += 7) {
          ctx.fillRect(0, y + drift, w, 1.2);
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "rgba(255, 214, 160, 0.12)";
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, Math.max(1, w - 20), Math.max(1, h - 20));
        ctx.restore();
      }

      tauHit.live = skyMode === "planetarium" && tauHit.live;
      if (eggsRef.current.tau && skyMode !== "planetarium") {
        const bx = w * 0.78;
        const by = Math.min(h * 0.3, h * 0.22 + 48);
        drawTauBeacon(bx, by, time, true, "left");
      }

      const bait = encounterRef.current;
      if (bait && skyMode === "galaxy") {
        const ex = cx + bait.nx * scale;
        const ey = cy + bait.ny * scale;
        drawEncounter(ex, ey, time, bait.kind);
        encHit.x = ex;
        encHit.y = ey;
        encHit.r = 52;
        encHit.kind = bait.kind;
        encHit.live = true;
      }
      if (encHit.live) {
        const ex = String(Math.round(encHit.x));
        const ey = String(Math.round(encHit.y));
        if (canvas.dataset.encX !== ex) canvas.dataset.encX = ex;
        if (canvas.dataset.encY !== ey) canvas.dataset.encY = ey;
      } else if (canvas.dataset.encX || canvas.dataset.encY) {
        delete canvas.dataset.encX;
        delete canvas.dataset.encY;
      }

      const gateNow = gateRef.current;
      if (gateNow && (skyMode === "galaxy" || skyMode === "planetarium")) {
        const R = Math.max(64, Math.min(w, h) * 0.26);
        const zoom = Math.min(8, Math.max(1, gateNow.zoom));
        if (zoom > 1.05) {
          if (loupe.width !== canvas.width || loupe.height !== canvas.height) {
            loupe.width = canvas.width;
            loupe.height = canvas.height;
          }
          const lg = loupe.getContext("2d");
          if (lg) {
            lg.setTransform(1, 0, 0, 1, 0, 0);
            lg.drawImage(canvas, 0, 0);
            const src = (R / zoom) * dpr;
            const sx = gateNow.x * dpr - src;
            const sy = gateNow.y * dpr - src;
            ctx.save();
            ctx.beginPath();
            ctx.arc(gateNow.x, gateNow.y, R, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(loupe, sx, sy, src * 2, src * 2, gateNow.x - R, gateNow.y - R, R * 2, R * 2);
            ctx.restore();
          }
        }
        ctx.save();
        ctx.strokeStyle = "rgba(9, 6, 26, 0.9)";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(gateNow.x, gateNow.y, R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(240, 195, 107, 1)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gateNow.x, gateNow.y, R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(gateNow.x, gateNow.y, Math.max(8, R - 8), 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(gateNow.x + Math.cos(a) * (R - 14), gateNow.y + Math.sin(a) * (R - 14));
          ctx.lineTo(gateNow.x + Math.cos(a) * (R + 4), gateNow.y + Math.sin(a) * (R + 4));
          ctx.stroke();
        }
        ctx.restore();

        const reach = R / zoom;
        const hits: { s: Star; x: number; y: number; d: number }[] = [];
        if (skyMode === "planetarium") {
          const cam = lookCam(yaw, pitch);
          for (const s of model.stars) {
            const p = projectLook(s.x, s.y, s.z, cam, PLANETARIUM_FOV);
            if (!p) continue;
            const sx = cx + p.x * scale;
            const sy = cy + p.y * scale;
            const d = Math.hypot(sx - gateNow.x, sy - gateNow.y);
            if (d < reach) hits.push({ s, x: sx, y: sy, d });
          }
        } else {
          const c = Math.cos(rot);
          const sn = Math.sin(rot);
          for (const s of model.stars) {
            const lx = s.x * scale;
            const ly = s.y * scale;
            const sx = cx + lx * c - ly * sn;
            const sy = cy + lx * sn + ly * c;
            const d = Math.hypot(sx - gateNow.x, sy - gateNow.y);
            if (d < reach) hits.push({ s, x: sx, y: sy, d });
          }
        }
        hits.sort((a, b) => a.d - b.d);
        const shown = hits.slice(0, 12);
        const at = shown.length ? gateAtRef.current % shown.length : 0;
        const ringKey = `${Math.round(gateNow.x)}|${Math.round(gateNow.y)}|${Math.round(R)}`;
        if (ringKey !== gateRingKey.current) {
          gateRingKey.current = ringKey;
          setGateRing({ x: gateNow.x, y: gateNow.y, r: R });
        }
        const listKey = `${shown.map((h) => h.s.mass.toFixed(3)).join(",")}|${at}|${ageGyr.toFixed(1)}`;
        if (listKey !== gateListKey.current) {
          gateListKey.current = listKey;
          setGateBodies(
            shown.map((h) => {
              const st = evolveStar(h.s.mass, ageGyr - h.s.birthGyr, pms.gravity);
              const mx = gateNow.x + (h.x - gateNow.x) * zoom;
              const my = gateNow.y + (h.y - gateNow.y) * zoom;
              return {
                mass: h.s.mass,
                stage: st.stage,
                age: Math.max(0, ageGyr - h.s.birthGyr),
                x: mx,
                y: my,
              };
            }),
          );
        }
      } else if (gateRingKey.current) {
        gateRingKey.current = "";
        gateListKey.current = "";
        setGateRing(null);
        setGateBodies([]);
      }

      const cursor = dragging
        ? "grabbing"
        : encHit.live
          ? "crosshair"
          : skyMode === "planetarium" || skyMode === "galaxy"
            ? "grab"
            : "default";
      if (canvas.style.cursor !== cursor) canvas.style.cursor = cursor;

      if (shook) ctx.restore();

      if (gpu && skyMode === "galaxy" && vis > 0.08 && !late && !gateRef.current) {
        gpu.draw(model, {
          ox: cx,
          oy: cy,
          scale,
          rot,
          vis,
          w,
          h,
          dpr,
          time,
          still: reducedRef.current,
        });
      } else {
        gpu?.clear();
      }

      idlePaint =
        skyMode !== "planetarium" &&
        (skyMode !== "collision" || collisionT >= 0.999) &&
        !dragging &&
        flash < 0.02 &&
        !eggsRef.current.tau &&
        !eggsRef.current.wow &&
        !eggsRef.current.zone &&
        !eggsRef.current.witness &&
        !eggsRef.current.throat &&
        !encounterRef.current &&
        !evolvingRef.current &&
        Math.abs(visualT - targetT) < 0.0008 &&
        swarmProb < 0.18 &&
        (reducedRef.current || relaxedRef.current);
      painted = true;
      if (canvas.dataset.skyPainted !== "1") canvas.dataset.skyPainted = "1";
      } catch {
        /* one bad frame must not kill the sky */
      } finally {
        const cost = (typeof performance !== "undefined" ? performance.now() : t) - t0;
        if (cost > 20) stress = Math.min(8, stress + 1);
        else if (cost < 9) stress = Math.max(0, stress - 1);
        if (running) schedule(hidden || pausedRef.current ? 280 : 0);
      }
    };

    draw(typeof performance !== "undefined" ? performance.now() : 0);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.clearTimeout(wait);
      window.clearTimeout(resizeWait);
      ro.disconnect();
      gpu?.destroy();
      reducedMq?.removeEventListener("change", onReduce);
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("keydown", onKey);
    };
  }, [SKY_CLOCK]);

  return (
    <div
      ref={wrapRef}
      className={["sky-canvas", className].filter(Boolean).join(" ")}
      data-sky-gpu="0"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <canvas
        ref={gpuCanvasRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <canvas
      ref={canvasRef}
      role="application"
      tabIndex={0}
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
      data-sky-mode={mode}
      data-paused={paused ? "1" : "0"}
      aria-label={ariaLabel ?? "Galaxy"}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        touchAction: "none",
        cursor: mode === "planetarium" || mode === "galaxy" ? "grab" : encounter ? "crosshair" : "default",
        pointerEvents: "auto",
        zIndex: 0,
      }}
    />
      <div className="pointer-events-none absolute bottom-2 left-2 z-[4] flex w-[calc(100%-1rem)] max-w-full flex-col items-start gap-1 overflow-x-clip">
        <div className="pointer-events-auto flex max-w-full flex-wrap gap-1">
          <button
            type="button"
            className="min-h-11 rounded-[var(--radius-sm)] bg-bg/80 px-3 text-sm text-fg shadow-[var(--shadow-border)]"
            aria-pressed={gateOn}
            onClick={() => {
              setGateOn((on) => {
                const next = !on;
                if (!next) {
                  gateRef.current = null;
                  gateListKey.current = "";
                  gateRingKey.current = "";
                  gateAtRef.current = 0;
                  setGatePlaced(false);
                  setGateZoom(1);
                  setGateAt(0);
                  setGateBodies([]);
                  setGateRing(null);
                }
                gateDirty.current = true;
                return next;
              });
            }}
          >
            {gateOn ? (gate?.shut ?? "Leave") : (gate?.arm ?? "Gate")}
          </button>
          {gateOn && gatePlaced ? (
            <>
              <button
                type="button"
                className="min-h-11 min-w-11 rounded-[var(--radius-sm)] bg-bg/80 px-2.5 text-sm text-fg shadow-[var(--shadow-border)]"
                onClick={() => {
                  setGateZoom((z) => {
                    const next = Math.max(1, z / 1.35);
                    if (gateRef.current) gateRef.current.zoom = next;
                    gateDirty.current = true;
                    return next;
                  });
                }}
              >
                {gate?.farther ?? "Farther"}
              </button>
              <button
                type="button"
                className="min-h-11 min-w-11 rounded-[var(--radius-sm)] bg-bg/80 px-2.5 text-sm text-fg shadow-[var(--shadow-border)]"
                onClick={() => {
                  setGateZoom((z) => {
                    const next = Math.min(8, z * 1.35);
                    if (gateRef.current) gateRef.current.zoom = next;
                    gateDirty.current = true;
                    return next;
                  });
                }}
              >
                {gate?.closer ?? "Closer"}
              </button>
              <button
                type="button"
                className="min-h-11 rounded-[var(--radius-sm)] bg-bg/80 px-2.5 text-sm text-fg shadow-[var(--shadow-border)]"
                onClick={() => onStepTimeRef.current?.(-1)}
              >
                {gate?.earlier ?? "Earlier"}
              </button>
              <button
                type="button"
                className="min-h-11 rounded-[var(--radius-sm)] bg-bg/80 px-2.5 text-sm text-fg shadow-[var(--shadow-border)]"
                onClick={() => onStepTimeRef.current?.(1)}
              >
                {gate?.later ?? "Later"}
              </button>
              {gateBodies.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="min-h-11 min-w-11 rounded-[var(--radius-sm)] bg-bg/80 px-2.5 text-sm text-fg shadow-[var(--shadow-border)]"
                    aria-label={gate?.prev ?? "Previous"}
                    onClick={() => {
                      gateDirty.current = true;
                      setGateAt((i) => (gateBodies.length ? (i - 1 + gateBodies.length) % gateBodies.length : 0));
                    }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="min-h-11 min-w-11 rounded-[var(--radius-sm)] bg-bg/80 px-2.5 text-sm text-fg shadow-[var(--shadow-border)]"
                    aria-label={gate?.next ?? "Next"}
                    onClick={() => {
                      gateDirty.current = true;
                      setGateAt((i) => (gateBodies.length ? (i + 1) % gateBodies.length : 0));
                    }}
                  >
                    ›
                  </button>
                </>
              ) : null}
            </>
          ) : null}
        </div>
        {gateOn ? (
          <p
            key={gatePlaced ? gateAt : "wait"}
            className="view-swap pointer-events-none line-clamp-2 max-w-sm text-sm text-pretty text-fg [text-shadow:0_1px_2px_#09061a,0_0_14px_#09061a]"
          >
            {!gatePlaced
              ? (gate?.wait ?? "Tap a place on the sky.")
              : gateBodies.length
                ? `${(gateAt % gateBodies.length) + 1} / ${gateBodies.length}. ${gate?.stages[gateBodies[gateAt % gateBodies.length].stage] ?? gateBodies[gateAt % gateBodies.length].stage}. ${gateBodies[gateAt % gateBodies.length].mass.toFixed(2)} M☉. ${gateBodies[gateAt % gateBodies.length].age.toFixed(1)} ${gate?.year ?? "Gyr"}. ${gate?.note ?? ""}`
                : (gate?.empty ?? "Nothing bright in this circle.")}
          </p>
        ) : null}
      </div>
      {gateOn && gateRing ? (
        <div
          className="gate-ring pointer-events-none absolute z-[5] rounded-full"
          style={{
            left: gateRing.x - gateRing.r,
            top: gateRing.y - gateRing.r,
            width: gateRing.r * 2,
            height: gateRing.r * 2,
            border: "3px solid #f0c36b",
            boxShadow: "0 0 0 3px rgba(9,6,26,0.9), inset 0 0 0 3px rgba(9,6,26,0.75), inset 0 0 0 6px #f0c36b",
          }}
        />
      ) : null}
      {gateOn && gateBodies.length ? (
        <div
          className="gate-mark pointer-events-none absolute z-[5] rounded-full"
          style={{
            left: gateBodies[gateAt % gateBodies.length].x - 9,
            top: gateBodies[gateAt % gateBodies.length].y - 9,
            width: 18,
            height: 18,
            border: "2px solid #fff6e0",
            boxShadow: "0 0 0 2px #f0c36b",
          }}
        />
      ) : null}
    </div>
  );
}
