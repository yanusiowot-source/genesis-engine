import { useEffect, useRef } from "react";
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
import { faceOnLocal, gpuOffered, skyGpuMark } from "@/lib/universe/sky-place";
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
  onSkyH0?: (h0Long: number) => void;
};

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
  onSkyH0,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

    let frame = 0;
    let wait = 0;
    let running = true;
    let dpr = 1;
    let w = 0;
    let h = 0;
    let lastT = 0;
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
    let starTarget: CanvasRenderingContext2D = ctx;
    const gpuEl = gpuCanvasRef.current;
    const wrap = wrapRef.current;
    let gpu: {
      draw: (
        model: GalaxyModel,
        view: { ox: number; oy: number; scale: number; rot: number; vis: number; w: number; h: number; dpr: number },
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
    let stress = 0;
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
        canvas.setPointerCapture(event.pointerId);
      }
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      dragTravel += Math.hypot(dx, dy);
      vYaw = -dx * 0.0045;
      vPitch = dy * 0.0032;
      yaw += vYaw;
      pitch = Math.max(-1.15, Math.min(1.15, pitch + vPitch));
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onUp = (event: PointerEvent) => {
      const tap =
        dragTravel < 12 &&
        Math.hypot((event.clientX ?? downX) - downX, (event.clientY ?? downY) - downY) < 16;
      dragging = false;
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
      if (tauHit.live && Math.hypot(px - tauHit.x, py - tauHit.y) <= tauHit.r) {
        tauRef.current?.();
      }
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    const onVis = () => {
      hidden = document.hidden;
      window.clearTimeout(wait);
      wait = 0;
      cancelAnimationFrame(frame);
      if (running) frame = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVis);

    const drawStar = (s: Star, x: number, y: number, ageGyr: number, vis: number, time: number) => {
      const g = starTarget;
      if (frameLite) {
        const size = Math.max(1.35, s.r * 0.95);
        const a = Math.min(1, s.a * vis * 1.45);
        if (size > 1.6) {
          g.fillStyle = `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},${a * 0.32})`;
          g.fillRect(x - size * 1.4, y - size * 1.4, size * 2.8, size * 2.8);
        }
        g.fillStyle = `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},${a})`;
        g.fillRect(x - size * 0.5, y - size * 0.5, size, size);
        return;
      }
      const key = (Math.round(ageGyr * 48) << 8) ^ Math.round(paramsRef.current.gravity * 50);
      let hit = evoCache.get(s);
      if (!hit || hit.k !== key) {
        hit = { k: key, st: evolveStar(s.mass, ageGyr - s.birthGyr, paramsRef.current.gravity) };
        evoCache.set(s, hit);
      }
      const st = hit.st;
      if (st.stage === "unborn") return;
      const tw = reducedRef.current || idlePaint ? 1 : 0.75 + 0.25 * Math.sin(time * 2.2 + s.phase);
      let a = Math.min(1, s.a * vis * tw * 1.25);
      if (st.stage === "blackHole") a *= 0.4;
      if (st.stage === "whiteDwarf" || st.stage === "neutronStar") a *= 0.85;
      if (st.stage === "supernova") a = Math.min(1, 0.55 + st.flash);
      const size =
        st.stage === "supernova"
          ? s.r * (1.2 + st.flash * 7)
          : Math.max(0.35, s.r * Math.pow(Math.max(st.radiusScale, 0.05), 0.22));
      if (size < 0.75 && st.stage !== "supernova" && st.stage !== "blackHole") {
        g.fillStyle = `rgba(${st.rgb[0]},${st.rgb[1]},${st.rgb[2]},${Math.min(1, a)})`;
        g.fillRect(x - size * 0.5, y - size * 0.5, size, size);
        return;
      }
      if (size > 0.9 && a > 0.28 && !relaxedRef.current) {
        g.fillStyle = `rgba(${st.rgb[0]},${st.rgb[1]},${st.rgb[2]},${Math.min(0.5, a * 0.42)})`;
        g.beginPath();
        g.arc(x, y, rr(size * 4.4), 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = `rgba(${st.rgb[0]},${st.rgb[1]},${st.rgb[2]},${Math.min(1, a)})`;
      g.beginPath();
      g.arc(x, y, rr(size), 0, Math.PI * 2);
      g.fill();
      if (size > 1.35 && a > 0.42) {
        g.fillStyle = `rgba(255,250,240,${Math.min(0.7, a * 0.48)})`;
        g.beginPath();
        g.arc(x, y, rr(size * 0.32), 0, Math.PI * 2);
        g.fill();
      }
      if (st.stage === "supernova" && st.flash > 0.15) {
        g.strokeStyle = `rgba(255,244,220,${st.flash * 0.45})`;
        g.lineWidth = 1.2;
        g.beginPath();
        g.arc(x, y, rr(size * 2.4), 0, Math.PI * 2);
        g.stroke();
      }
      if (st.stage === "blackHole") {
        g.strokeStyle = `rgba(180,160,120,${0.35 * vis})`;
        g.lineWidth = 0.8;
        g.beginPath();
        g.ellipse(x, y, size * 2.8, size * 0.7, 0.4, 0, Math.PI * 2);
        g.stroke();
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
        for (const cl of clumps) {
          const p = orbit(cl.x, cl.y, 0.12);
          const grad = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr(cl.r * scale));
          const [r, gch, b] = cl.rgb;
          grad.addColorStop(0, `rgba(${r},${gch},${b},${Math.min(0.38, cl.a * vis * 1.25)})`);
          grad.addColorStop(0.45, `rgba(${r},${gch},${b},${cl.a * vis * 0.22})`);
          grad.addColorStop(1, "rgba(9,6,26,0)");
          g.fillStyle = grad;
          g.beginPath();
          g.arc(p.x, p.y, rr(cl.r * scale), 0, Math.PI * 2);
          g.fill();
        }

        if (!frameLite) {
          for (const d of model.dust) {
            const p = orbit(d.x, d.y, 0.08);
            g.save();
            g.translate(p.x, p.y);
            g.rotate(d.rot);
            const [dr, dg, db] = d.rgb;
            g.fillStyle = `rgba(${dr}, ${dg}, ${db}, ${Math.min(0.28, d.a * dustMul * 1.8)})`;
            g.beginPath();
            g.ellipse(0, 0, rr(d.rx * scale), rr(d.ry * scale), 0, 0, Math.PI * 2);
            g.fill();
            g.restore();
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
        const rad = rr((cl.r * scale) / p.depth);
        const g = ctx.createRadialGradient(p.x * scale, p.y * scale, 0, p.x * scale, p.y * scale, rad);
        const [r, gch, b] = cl.rgb;
        g.addColorStop(0, `rgba(${r},${gch},${b},${Math.min(0.42, cl.a * vis * 1.4)})`);
        g.addColorStop(1, "rgba(9,6,26,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x * scale, p.y * scale, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const d of model.dust) {
        if (frameLite) continue;
        const p = projectLook(d.x, d.y, 0, cam, fov);
        if (!p || Math.abs(p.x) > limX * 1.5 || Math.abs(p.y) > limY * 1.5) continue;
        const [dr, dg, db] = d.rgb;
        ctx.save();
        ctx.translate(p.x * scale, p.y * scale);
        ctx.fillStyle = `rgba(${dr},${dg},${db},${Math.min(0.3, d.a * vis * 2.1)})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, rr((d.rx * scale) / p.depth), rr((d.ry * scale) / p.depth), d.rot, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (const s of model.field) {
        const p = projectLook(s.x, s.y, s.z, cam, fov);
        if (!p || Math.abs(p.x) > limX || Math.abs(p.y) > limY) continue;
        const tw = reducedRef.current ? 1 : 0.7 + 0.3 * Math.sin(time * 1.8 + s.phase);
        const size = Math.max(0.35, s.r * 0.26);
        ctx.fillStyle = `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},${s.a * tw * 0.92})`;
        ctx.fillRect(p.x * scale - size, p.y * scale - size, size * 2, size * 2);
      }

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

      if (eggsRef.current.classified) {
        const px = w * 0.62;
        const py = Math.min(h * 0.28, h * 0.22 + 36);
        ctx.save();
        ctx.fillStyle = "rgba(8, 6, 18, 0.82)";
        ctx.fillRect(px - 34, py - 10, 68, 20);
        ctx.strokeStyle = "rgba(255, 214, 160, 0.45)";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(px - 34, py - 10, 68, 20);
        ctx.fillStyle = "rgba(255, 214, 160, 0.7)";
        ctx.font = "600 9px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("— — —", px, py);
        ctx.restore();
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
      epoch: CosmicEpoch,
      cx: number,
      cy: number,
      scale: number,
      eternalProb: number,
      alpha = 1,
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      try {
        if (alpha >= 0.995) {
          ctx.fillStyle = "#09061a";
          ctx.fillRect(0, 0, w, h);
        }
        if (epoch === "inflation") {
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 1.6);
          g.addColorStop(0, "rgb(255, 244, 214)");
          g.addColorStop(0.28, "rgb(255, 150, 72)");
          g.addColorStop(0.62, "rgb(140, 40, 90)");
          g.addColorStop(1, "rgb(18, 8, 28)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
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
          const wall = ctx.createRadialGradient(
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
          ctx.fillStyle = wall;
          ctx.fillRect(0, 0, w, h);
          if (d.niche !== "silent") {
            const ellVis = Math.max(8, Math.min(32, Math.round(d.ell1 / ACOUSTIC_VISUAL)));
            const spot = skyR / ellVis;
            const n = Math.round(ellVis * ellVis * (d.niche === "damped" ? 0.22 : 0.5));
            ctx.save();
            if (ages) {
              for (let i = 0; i < n; i++) {
                const ang = rng() * Math.PI * 2;
                const rad = Math.sqrt(rng()) * skyR;
                const rr = spot * (0.42 + rng() * 0.75) * (d.niche === "damped" ? 1.55 : 1);
                ctx.fillStyle = `rgba(4, 6, 14, ${0.28 + rng() * 0.4})`;
                ctx.beginPath();
                ctx.arc(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, rr, 0, Math.PI * 2);
                ctx.fill();
              }
            } else {
              ctx.globalCompositeOperation = "lighter";
              const amp = 0.08 + d.baryonLoad * 0.07;
              for (let i = 0; i < n; i++) {
                const ang = rng() * Math.PI * 2;
                const rad = Math.sqrt(rng()) * skyR;
                const a = amp * (0.18 + rng() * 0.5);
                const rr = spot * (0.42 + rng() * 0.75) * (d.niche === "damped" ? 1.55 : 1);
                ctx.fillStyle = `rgba(255, 198, 148, ${a})`;
                ctx.beginPath();
                ctx.arc(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, rr, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            ctx.restore();
          }
          return;
        }
        if (epoch === "heatDeath") {
          ctx.fillStyle = "rgb(6, 5, 12)";
          ctx.fillRect(0, 0, w, h);
          if (eternalProb > 0.12) {
            const ice = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 1.9);
            ice.addColorStop(0, `rgba(170, 214, 255, ${0.08 + eternalProb * 0.2})`);
            ice.addColorStop(0.42, `rgba(90, 140, 210, ${0.05 + eternalProb * 0.1})`);
            ice.addColorStop(1, "rgba(6,5,12,0)");
            ctx.fillStyle = ice;
            ctx.fillRect(0, 0, w, h);
          }
          if (eggsRef.current.whale) {
            ctx.save();
            ctx.globalAlpha *= 0.18 + eternalProb * 0.22;
            ctx.translate(cx + scale * 0.18, cy + scale * 0.22);
            ctx.rotate(-0.35);
            ctx.fillStyle = "rgb(160, 200, 230)";
            ctx.beginPath();
            ctx.ellipse(0, 0, scale * 0.28, scale * 0.07, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(scale * 0.22, -scale * 0.02, scale * 0.08, scale * 0.04, 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgb(12, 16, 28)";
            ctx.beginPath();
            ctx.arc(-scale * 0.12, -scale * 0.01, scale * 0.012, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          return;
        }
        const g = ctx.createRadialGradient(cx, cy, scale * 0.05, cx, cy, scale * 2.2);
        if (epoch === "blackHoles") {
          g.addColorStop(0, "rgb(28, 14, 22)");
          g.addColorStop(1, "rgb(8, 5, 12)");
        } else if (epoch === "degeneracy") {
          g.addColorStop(0, "rgb(40, 24, 28)");
          g.addColorStop(1, "rgb(10, 6, 20)");
        } else {
          g.addColorStop(0, "rgb(36, 24, 64)");
          g.addColorStop(0.45, "rgb(18, 12, 40)");
          g.addColorStop(1, "rgb(9, 6, 26)");
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        if (epoch === "stellar" || epoch === "reionization") {
          ctx.globalCompositeOperation = "lighter";
          const wash = ctx.createRadialGradient(cx - scale * 0.4, cy - scale * 0.2, 0, cx, cy, scale * 1.8);
          wash.addColorStop(0, "rgba(120, 90, 255, 0.18)");
          wash.addColorStop(0.4, "rgba(70, 180, 255, 0.1)");
          wash.addColorStop(1, "rgba(9,6,26,0)");
          ctx.fillStyle = wash;
          ctx.fillRect(0, 0, w, h);
          const wash2 = ctx.createRadialGradient(cx + scale * 0.5, cy + scale * 0.35, 0, cx, cy, scale * 1.6);
          wash2.addColorStop(0, "rgba(255, 140, 90, 0.12)");
          wash2.addColorStop(1, "rgba(9,6,26,0)");
          ctx.fillStyle = wash2;
          ctx.fillRect(0, 0, w, h);
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
              const hole = ctx.createRadialGradient(bx, by, 0, bx, by, br);
              hole.addColorStop(0, "rgba(255, 226, 186, 0.32)");
              hole.addColorStop(0.4, "rgba(130, 180, 255, 0.14)");
              hole.addColorStop(1, "rgba(9,6,26,0)");
              ctx.fillStyle = hole;
              ctx.beginPath();
              ctx.arc(bx, by, br, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "rgba(255, 244, 220, 0.85)";
              ctx.beginPath();
              ctx.arc(bx, by, 1.15, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.globalCompositeOperation = "source-over";
        }
      } finally {
        ctx.restore();
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
      if (ms > 0) {
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
      if (rest && painted) {
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
        skyPulse;
      if (idlePaint && painted && !live && !rest) {
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
      if (minGap && lastPaint && t - lastPaint < minGap) {
        schedule(0);
        return;
      }
      lastPaint = t;
      const t0 = typeof performance !== "undefined" ? performance.now() : t;
      frameLite =
        relaxedRef.current ||
        reducedRef.current ||
        qualityRef.current.scale < 0.4 ||
        stress >= 5;
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
      const scale = Math.min(w, h) * 0.46;
      if (!Number.isFinite(scale) || scale <= 0) return;
      let shook = false;
      if (trauma > 0.01 && !reducedRef.current) {
        const s = trauma * trauma;
        ctx.save();
        ctx.translate(Math.sin(t * 0.063) * 16 * s, Math.cos(t * 0.051) * 12 * s);
        shook = true;
      }
      trauma = Math.max(0, trauma - dt * 1.85);
      const time = reducedRef.current ? 0 : t / 1000;
      const targetT = (timeLiveRef.current ?? cosmicRef).current;
      if (reducedRef.current) visualT = targetT;
      else visualT += (targetT - visualT) * (1 - Math.exp(-5.5 * dt));
      const ev = evRef.current;
      const pms = paramsRef.current;
      const hydro = diskDossier(pms, ev);
      const blend = epochBlend(visualT);
      const epoch = epochShown(visualT);
      const vis = galaxyVisibility(visualT, ev);
      const ageGyr = cosmicAgeGyr(visualT, pms, ev);
      const skyMode = modeRef.current;
      const rot = time * model.rotation * (reducedRef.current ? 0 : 0.52);
      const late = epoch === "heatDeath" || epoch === "blackHoles";
      const eternalProb = ev.eternalProb ?? 0;

      paintEpoch(blend.from, cx, cy, scale, eternalProb, 1);
      if (blend.mix > 0.02 && blend.to !== blend.from) {
        paintEpoch(blend.to, cx, cy, scale, eternalProb, blend.mix);
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
          ctx.fillStyle = `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},${s.a * (late ? 0.08 + vis * 0.35 + eternalProb * 0.18 : 0.7 + vis * 0.5)})`;
          const fr = Math.max(0.35, s.r);
          ctx.fillRect(s.x * scale - fr * 0.5, s.y * scale - fr * 0.5, fr, fr);
        }
        }
        ctx.globalCompositeOperation = "source-over";

        const showSources = vis > 0.12;
        if ((skyMode === "lensing" || vis > 0.2) && (skyMode !== "lensing" || showSources)) {
          const thetaE = einsteinRadius(ev, pms);
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
            !!(gpu && skyMode === "galaxy"),
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
        canvas.dataset.encX = String(Math.round(encHit.x));
        canvas.dataset.encY = String(Math.round(encHit.y));
      } else {
        delete canvas.dataset.encX;
        delete canvas.dataset.encY;
      }
      canvas.style.cursor = dragging
        ? "grabbing"
        : encHit.live
          ? "crosshair"
          : skyMode === "planetarium"
            ? "grab"
            : "default";

      if (shook) ctx.restore();

      if (gpu && skyMode === "galaxy" && vis > 0.08 && !late) {
        gpu.draw(model, { ox: cx, oy: cy, scale, rot, vis, w, h, dpr });
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
      canvas.dataset.skyPainted = "1";
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
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={["sky-canvas", className].filter(Boolean).join(" ")}
      data-sky-gpu={skyGpuMark(gpuOffered(), null)}
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
      role="img"
      data-sky-mode={mode}
      data-paused={paused ? "1" : "0"}
      aria-label={ariaLabel ?? "Galaxy"}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        touchAction: "none",
        cursor: mode === "planetarium" ? "grab" : encounter ? "crosshair" : "default",
        pointerEvents: "auto",
        zIndex: 0,
      }}
    />
    </div>
  );
}
