import { useEffect, useRef } from "react";
import {
  adaptiveQuality,
  buildGalaxy,
  lookCam,
  projectLook,
  type GalaxyModel,
  type Star,
} from "@/lib/universe/galaxy";
import {
  cosmicAgeGyr,
  einsteinRadius,
  epochAt,
  epochBlend,
  evolveStar,
  galaxyVisibility,
  lensDeflect,
} from "@/lib/universe/observatory";
import type { Evaluation, SkyMode, UniverseParams } from "@/lib/universe/types";
import { isOurParams } from "@/lib/universe/physics";
import type { EggFlags } from "@/lib/universe/eggs";

type Props = {
  params: UniverseParams;
  evaluation: Evaluation;
  visualSeed: number;
  cosmicTime: number;
  mode: SkyMode;
  collisionKey: number;
  eggs?: EggFlags;
  onVoyager?: () => void;
  className?: string;
  relaxed?: boolean;
  wakeKey?: number;
};

export function GalaxyCanvas({
  params,
  evaluation,
  visualSeed,
  cosmicTime,
  mode,
  collisionKey,
  eggs,
  onVoyager,
  className,
  relaxed,
  wakeKey,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<GalaxyModel | null>(null);
  const cosmicRef = useRef(cosmicTime);
  const modeRef = useRef(mode);
  const paramsRef = useRef(params);
  const evRef = useRef(evaluation);
  const collisionKeyRef = useRef(collisionKey);
  const seedRef = useRef(visualSeed);
  const eggsRef = useRef<EggFlags>(eggs ?? { whale: false });
  const voyagerRef = useRef(onVoyager);
  const relaxedRef = useRef(!!relaxed);
  const wakeRef = useRef(wakeKey ?? 0);
  const builtSeed = useRef<number | null>(null);
  cosmicRef.current = cosmicTime;
  modeRef.current = mode;
  paramsRef.current = params;
  evRef.current = evaluation;
  collisionKeyRef.current = collisionKey;
  seedRef.current = visualSeed;
  eggsRef.current = eggs ?? { whale: false };
  voyagerRef.current = onVoyager;
  relaxedRef.current = !!relaxed;
  wakeRef.current = wakeKey ?? 0;

  useEffect(() => {
    const q = adaptiveQuality();
    const rebuild = () => {
      try {
        modelRef.current = buildGalaxy(params, evaluation, visualSeed, q.scale);
        builtSeed.current = visualSeed;
      } catch {
        /* keep the last intact sky rather than blank the canvas */
      }
    };
    if (builtSeed.current !== visualSeed) {
      rebuild();
      return;
    }
    const id = window.setTimeout(rebuild, 90);
    return () => window.clearTimeout(id);
  }, [params, evaluation, visualSeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let frame = 0;
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
    let hidden = typeof document !== "undefined" && document.hidden;
    let flash = 0;
    let lastSeed = seedRef.current;
    let lastWake = wakeRef.current;
    let lastPaint = 0;
    let visualT = cosmicRef.current;
    let idlePaint = false;
    const quality = adaptiveQuality();
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rr = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0.01);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const q = adaptiveQuality();
      dpr = Math.min(window.devicePixelRatio || 1, q.dprCap);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = q.scale < 0.6 ? "medium" : "high";
    };

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    const onDown = (event: PointerEvent) => {
      if (modeRef.current !== "planetarium") return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      vYaw = -dx * 0.0045;
      vPitch = dy * 0.0032;
      yaw += vYaw;
      pitch = Math.max(-1.15, Math.min(1.15, pitch + vPitch));
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onUp = () => {
      dragging = false;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    const onVis = () => {
      hidden = document.hidden;
      if (!hidden && running) {
        lastT = 0;
        frame = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const drawStar = (s: Star, x: number, y: number, ageGyr: number, vis: number, time: number) => {
      const st = evolveStar(s.mass, ageGyr - s.birthGyr, paramsRef.current.gravity);
      if (st.stage === "unborn") return;
      const tw = reduced ? 1 : 0.75 + 0.25 * Math.sin(time * 2.2 + s.phase);
      let a = Math.min(1, s.a * vis * tw * 1.25);
      if (st.stage === "blackHole") a *= 0.4;
      if (st.stage === "whiteDwarf" || st.stage === "neutronStar") a *= 0.85;
      if (st.stage === "supernova") a = Math.min(1, 0.55 + st.flash);
      const size =
        st.stage === "supernova"
          ? s.r * (1.2 + st.flash * 7)
          : Math.max(0.35, s.r * Math.pow(Math.max(st.radiusScale, 0.05), 0.22));
      if (size < 0.75 && st.stage !== "supernova" && st.stage !== "blackHole") {
        ctx.fillStyle = `rgba(${st.rgb[0]},${st.rgb[1]},${st.rgb[2]},${Math.min(1, a)})`;
        ctx.fillRect(x - size * 0.5, y - size * 0.5, size, size);
        return;
      }
      if (size > 0.9 && a > 0.28 && !relaxedRef.current) {
        ctx.fillStyle = `rgba(${st.rgb[0]},${st.rgb[1]},${st.rgb[2]},${Math.min(0.5, a * 0.42)})`;
        ctx.beginPath();
        ctx.arc(x, y, rr(size * 4.4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(${st.rgb[0]},${st.rgb[1]},${st.rgb[2]},${Math.min(1, a)})`;
      ctx.beginPath();
      ctx.arc(x, y, rr(size), 0, Math.PI * 2);
      ctx.fill();
      if (size > 1.35 && a > 0.42) {
        ctx.fillStyle = `rgba(255,250,240,${Math.min(0.7, a * 0.48)})`;
        ctx.beginPath();
        ctx.arc(x, y, rr(size * 0.32), 0, Math.PI * 2);
        ctx.fill();
      }
      if (st.stage === "supernova" && st.flash > 0.15) {
        ctx.strokeStyle = `rgba(255,244,220,${st.flash * 0.45})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, rr(size * 2.4), 0, Math.PI * 2);
        ctx.stroke();
      }
      if (st.stage === "blackHole") {
        ctx.strokeStyle = `rgba(180,160,120,${0.35 * vis})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(x, y, size * 2.8, size * 0.7, 0.4, 0, Math.PI * 2);
        ctx.stroke();
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
    ) => {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(rot);
      ctx.scale(1 + stretch * 0.35, 1 - stretch * 0.2);

      ctx.globalCompositeOperation = "lighter";
      if (!late) {
        for (const cl of model.clumps) {
          const g = ctx.createRadialGradient(
            cl.x * scale,
            cl.y * scale,
            0,
            cl.x * scale,
            cl.y * scale,
            cl.r * scale,
          );
          const [r, gch, b] = cl.rgb;
          g.addColorStop(0, `rgba(${r},${gch},${b},${Math.min(0.38, cl.a * vis * 1.25)})`);
          g.addColorStop(0.45, `rgba(${r},${gch},${b},${cl.a * vis * 0.22})`);
          g.addColorStop(1, "rgba(9,6,26,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cl.x * scale, cl.y * scale, cl.r * scale, 0, Math.PI * 2);
          ctx.fill();
        }

        for (const d of model.dust) {
          ctx.save();
          ctx.translate(d.x * scale, d.y * scale);
          ctx.rotate(d.rot);
          const [dr, dg, db] = d.rgb;
          ctx.fillStyle = `rgba(${dr}, ${dg}, ${db}, ${Math.min(0.28, d.a * dustMul * 1.8)})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, rr(d.rx * scale), rr(d.ry * scale), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      const coreR = model.coreScale * scale * (0.85 + vis * 0.4);
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
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
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      ctx.globalCompositeOperation = "lighter";
      for (const s of stars) {
        drawStar(s, s.x * scale, s.y * scale, ageGyr, vis, time);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
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
      const fov = 1.22;
      const limX = (w / scale) * 0.72;
      const limY = (h / scale) * 0.72;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalCompositeOperation = "lighter";

      const coreP = projectLook(0, 0, 0, cam, fov);
      if (coreP) {
        const rad = (model.coreScale * scale * 2.4) / coreP.depth;
        const g = ctx.createRadialGradient(
          coreP.x * scale,
          coreP.y * scale,
          0,
          coreP.x * scale,
          coreP.y * scale,
          rad,
        );
        const [rr, gg, bb] = model.coreRgb;
        g.addColorStop(0, `rgba(${rr},${gg},${bb},${0.55 * vis})`);
        g.addColorStop(0.35, `rgba(${rr},${gg},${bb},${0.16 * vis})`);
        g.addColorStop(1, "rgba(9,6,26,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(coreP.x * scale, coreP.y * scale, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const cl of model.clumps) {
        const p = projectLook(cl.x, cl.y, 0, cam, fov);
        if (!p || Math.abs(p.x) > limX * 1.4 || Math.abs(p.y) > limY * 1.4) continue;
        const rad = (cl.r * scale) / p.depth;
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
        const p = projectLook(d.x, d.y, 0, cam, fov);
        if (!p || Math.abs(p.x) > limX * 1.5 || Math.abs(p.y) > limY * 1.5) continue;
        const [dr, dg, db] = d.rgb;
        ctx.save();
        ctx.translate(p.x * scale, p.y * scale);
        ctx.fillStyle = `rgba(${dr},${dg},${db},${Math.min(0.3, d.a * vis * 2.1)})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, (d.rx * scale) / p.depth, (d.ry * scale) / p.depth, d.rot, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (const s of model.field) {
        const p = projectLook(s.x, s.y, s.z, cam, fov);
        if (!p || Math.abs(p.x) > limX || Math.abs(p.y) > limY) continue;
        const tw = reduced ? 1 : 0.7 + 0.3 * Math.sin(time * 1.8 + s.phase);
        const size = Math.max(0.4, s.r * 0.48);
        ctx.fillStyle = `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},${s.a * tw * 0.92})`;
        ctx.beginPath();
        ctx.arc(p.x * scale, p.y * scale, size * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }

      const bright: { x: number; y: number }[] = [];
      for (const s of model.stars) {
        const p = projectLook(s.x, s.y, s.z, cam, fov);
        if (!p || Math.abs(p.x) > limX || Math.abs(p.y) > limY) continue;
        const near = Math.min(2.4, 0.62 / p.depth);
        const px = p.x * scale;
        const py = p.y * scale;
        drawStar(s, px, py, ageGyr, vis * near, time);
        if (s.r * near > 1.7 && bright.length < 16) bright.push({ x: px, y: py });
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(213,216,222,0.16)";
      ctx.lineWidth = 0.8;
      for (let i = 0; i < bright.length; i++) {
        let best = -1;
        let bestD = 88;
        for (let j = i + 1; j < bright.length; j++) {
          const dist = Math.hypot(bright[i].x - bright[j].x, bright[i].y - bright[j].y);
          if (dist < bestD && dist > 20) {
            bestD = dist;
            best = j;
          }
        }
        if (best >= 0 && bestD < 78) {
          ctx.beginPath();
          ctx.moveTo(bright[i].x, bright[i].y);
          ctx.lineTo(bright[best].x, bright[best].y);
          ctx.stroke();
        }
      }
      ctx.restore();

      const ground = ctx.createLinearGradient(0, h * 0.68, 0, h);
      ground.addColorStop(0, "rgba(9,6,26,0)");
      ground.addColorStop(1, "rgba(4,2,12,0.78)");
      ctx.fillStyle = ground;
      ctx.fillRect(0, h * 0.68, w, h * 0.32);

      if (isOurParams(paramsRef.current)) {
        const x = cx + scale * 0.08;
        const y = h * 0.62;
        ctx.fillStyle = "rgb(150, 190, 255)";
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(120, 170, 255, 0.35)";
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
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
      epoch: ReturnType<typeof epochAt>,
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
        if (epoch === "recombination") {
          const g = ctx.createRadialGradient(cx, cy, scale * 0.1, cx, cy, scale * 2);
          g.addColorStop(0, "rgb(120, 58, 48)");
          g.addColorStop(0.5, "rgb(48, 22, 36)");
          g.addColorStop(1, "rgb(10, 6, 22)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
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
        if (epoch === "darkAges") {
          g.addColorStop(0, "rgb(18, 16, 40)");
          g.addColorStop(1, "rgb(8, 6, 18)");
        } else if (epoch === "blackHoles") {
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
          ctx.globalCompositeOperation = "source-over";
        }
      } finally {
        ctx.restore();
      }
    };

    const drawShips = (
      g: CanvasRenderingContext2D,
      ox: number,
      oy: number,
      scale: number,
      rot: number,
      time: number,
      host: number,
      eternalProb: number,
      quiet: boolean,
    ) => {
      const n = 3 + Math.floor(host * 7);
      g.save();
      g.translate(ox, oy);
      g.rotate(rot * 0.22);
      g.globalCompositeOperation = "lighter";
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
        const gold = eternalProb > 0.2;
        g.strokeStyle = gold ? "rgba(180,220,255,0.35)" : "rgba(255,210,140,0.4)";
        g.lineWidth = 1;
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

    const draw = (t: number) => {
      if (!running) return;
      if (hidden) return;
      const minGap = relaxedRef.current ? 33 : idlePaint ? 45 : 0;
      if (minGap && lastPaint && t - lastPaint < minGap) {
        frame = requestAnimationFrame(draw);
        return;
      }
      lastPaint = t;
      try {
      const model = modelRef.current;
      const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016;
      lastT = t;
      if (!model) return;

      if (seedRef.current !== lastSeed) {
        lastSeed = seedRef.current;
        flash = 1;
      }
      if (wakeRef.current !== lastWake) {
        lastWake = wakeRef.current;
        flash = Math.max(flash, 0.9);
      }
      if (flash > 0) flash = Math.max(0, flash - dt * 1.7);

      if (!dragging && modeRef.current === "planetarium" && !reduced) {
        yaw += vYaw + dt * 0.028;
        pitch = Math.max(-1.15, Math.min(1.15, pitch + vPitch));
        vYaw *= Math.exp(-dt * 3.2);
        vPitch *= Math.exp(-dt * 3.2);
        if (Math.abs(vYaw) < 1e-4) vYaw = 0;
        if (Math.abs(vPitch) < 1e-4) vPitch = 0;
      }
      yawTravel += Math.abs(yaw - lastYaw);
      lastYaw = yaw;

      if (collisionKeyRef.current !== armedKey) {
        armedKey = collisionKeyRef.current;
        collisionT = reduced ? 1 : 0;
        flash = Math.max(flash, 0.55);
      }
      if (modeRef.current === "collision" && collisionT < 1) {
        collisionT = Math.min(1, collisionT + dt * (reduced ? 8 : 0.13));
      }

      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.min(w, h) * 0.46;
      if (!Number.isFinite(scale) || scale <= 0) return;
      const time = reduced ? 0 : t / 1000;
      const targetT = cosmicRef.current;
      if (reduced) visualT = targetT;
      else visualT += (targetT - visualT) * (1 - Math.exp(-5.5 * dt));
      const ev = evRef.current;
      const pms = paramsRef.current;
      const blend = epochBlend(visualT);
      const epoch = blend.mix >= 0.5 ? blend.to : blend.from;
      const vis = galaxyVisibility(visualT, ev);
      const ageGyr = cosmicAgeGyr(visualT, pms, ev);
      const skyMode = modeRef.current;
      const rot = time * model.rotation * 0.35;
      const late = epoch === "heatDeath" || epoch === "blackHoles";
      const eternalProb = ev.eternalProb ?? 0;

      paintEpoch(blend.from, cx, cy, scale, eternalProb, 1);
      if (blend.mix > 0.02 && blend.to !== blend.from) {
        paintEpoch(blend.to, cx, cy, scale, eternalProb, blend.mix);
      }

      if (skyMode === "planetarium") {
        drawPlanetarium(model, cx, cy, scale, ageGyr, Math.max(vis, 0.18), time);
      } else {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalCompositeOperation = "lighter";
        for (const s of model.field) {
          let fx = s.x;
          let fy = s.y;
          if (skyMode === "lensing") {
            const def = lensDeflect(fx, fy, einsteinRadius(ev, pms));
            fx = def.x;
            fy = def.y;
          }
          ctx.fillStyle = `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},${s.a * (late ? 0.08 + vis * 0.35 + eternalProb * 0.18 : 0.7 + vis * 0.5)})`;
          ctx.beginPath();
          ctx.arc(fx * scale, fy * scale, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";

        if (skyMode === "lensing" || vis > 0.2) {
          const thetaE = einsteinRadius(ev, pms);
          for (const bg of model.background) {
            const def = skyMode === "lensing" ? lensDeflect(bg.x, bg.y, thetaE) : { x: bg.x, y: bg.y, stretch: 1 };
            ctx.save();
            ctx.translate(def.x * scale, def.y * scale);
            ctx.rotate(bg.rot);
            const rx = bg.rx * scale * (skyMode === "lensing" ? def.stretch : 1);
            const ry = bg.ry * scale / Math.sqrt(skyMode === "lensing" ? def.stretch : 1);
            ctx.fillStyle = `rgba(${bg.rgb[0]},${bg.rgb[1]},${bg.rgb[2]},${bg.a * (skyMode === "lensing" ? 0.95 : 0.55)})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, rr(rx), rr(ry), 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        if (skyMode === "lensing") {
          const thetaE = einsteinRadius(ev, pms);
          ctx.strokeStyle = `rgba(180, 210, 255, ${0.28 + ev.darkMatterFraction * 0.28})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.arc(0, 0, thetaE * scale * 1.05, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          const halo = ctx.createRadialGradient(0, 0, scale * 0.08, 0, 0, model.haloRadius * scale);
          halo.addColorStop(0, "rgba(140,170,255,0.12)");
          halo.addColorStop(1, "rgba(9,6,26,0)");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(0, 0, model.haloRadius * scale, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        if (skyMode === "collision") {
          const p = collisionT;
          const ease = p * p * (3 - 2 * p);
          const stretch = Math.sin(p * Math.PI) * 0.7;
          const x1 = -0.72 * (1 - ease) * scale;
          const x2 = 0.78 * (1 - ease) * scale;
          const y2 = 0.28 * (1 - ease) * scale;
          drawGalaxyBody(
            model,
            cx + x1,
            cy,
            rot,
            scale * (0.72 + 0.28 * ease),
            stretch,
            model.stars,
            ageGyr,
            vis,
            time,
            1,
            late,
            eternalProb,
          );
          drawGalaxyBody(
            model,
            cx + x2,
            cy + y2,
            -rot * 1.15,
            scale * 0.48,
            stretch,
            model.companion,
            ageGyr,
            vis,
            time,
            0.7,
            late,
            eternalProb,
          );
          if (p > 0.35 && p < 0.85) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.globalCompositeOperation = "lighter";
            ctx.strokeStyle = `rgba(255,210,160,${(1 - Math.abs(p - 0.6) / 0.25) * 0.55})`;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(-scale * 0.9, scale * 0.08);
            ctx.quadraticCurveTo(0, -scale * 0.35 * stretch, scale * 0.85, -scale * 0.12);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-scale * 0.7, -scale * 0.18);
            ctx.quadraticCurveTo(0, scale * 0.4 * stretch, scale * 0.7, scale * 0.22);
            ctx.stroke();
            ctx.restore();
          }
        } else {
          drawGalaxyBody(model, cx, cy, rot, scale, 0, model.stars, ageGyr, vis, time, vis, late, eternalProb);
        }
      }

      const host = Math.max(ev.lifeProb, ev.siliconProb, eternalProb);
      const lite = relaxedRef.current || quality.scale < 0.55 || reduced;
      if (
        !lite &&
        skyMode === "galaxy" &&
        !late &&
        vis > 0.32 &&
        host > 0.12 &&
        (epoch === "stellar" || epoch === "reionization")
      ) {
        drawShips(ctx, cx, cy, scale, rot, time, host, eternalProb, reduced);
      }

      if (!lite && skyMode === "galaxy" && !late && pms.quantumNoise > 0.38) {
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

      if (skyMode !== "planetarium") {
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
        ctx.fillStyle = ice
          ? `rgba(180, 220, 255, ${flash * 0.34})`
          : `rgba(255, 214, 150, ${flash * 0.3})`;
        ctx.fillRect(0, 0, w, h);
      }
      idlePaint =
        skyMode !== "planetarium" &&
        (skyMode !== "collision" || collisionT >= 0.999) &&
        !dragging &&
        flash < 0.02 &&
        Math.abs(visualT - targetT) < 0.0008;
      } catch {
        /* one bad frame must not kill the sky */
      } finally {
        if (running) frame = requestAnimationFrame(draw);
      }
    };

    frame = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label="Simulated galaxy"
      style={{
        touchAction: mode === "planetarium" ? "none" : undefined,
        cursor: mode === "planetarium" ? "grab" : undefined,
        pointerEvents: mode === "planetarium" ? "auto" : "none",
      }}
    />
  );
}
