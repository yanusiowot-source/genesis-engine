import { useEffect, useRef } from "react";
import { integrateThree, threeKicks, type Braid } from "@/lib/universe/three-body";

export function ThreeForest({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const forest: Braid[] = [];
    const plate = document.createElement("canvas");
    const pen = plate.getContext("2d");
    let baked = "";
    let maxR = 1.2;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let running = true;
    let frame = 0;
    let kickAt = 0;
    const kicks = threeKicks();

    const addNext = () => {
      if (!running || kickAt >= kicks.length) return;
      const kick = kicks[kickAt];
      kickAt += 1;
      const paths = integrateThree(kick);
      forest.push({ exact: kick === 0, paths });
      for (const path of paths) {
        for (const pt of path) maxR = Math.max(maxR, Math.hypot(pt.x, pt.y));
      }
      maxR = Math.min(maxR, 4.2);
      baked = "";
      if (kickAt < kicks.length) window.setTimeout(addNext, 0);
    };
    addNext();

    const bake = (w: number, h: number, dpr: number) => {
      if (!pen) return;
      const key = `${w}x${h}x${forest.length}`;
      if (key === baked) return;
      baked = key;
      plate.width = Math.max(1, Math.floor(w * dpr));
      plate.height = Math.max(1, Math.floor(h * dpr));
      pen.setTransform(dpr, 0, 0, dpr, 0, 0);
      pen.clearRect(0, 0, w, h);
      const scale = (Math.min(w, h) * 0.42) / maxR;
      const cx = w / 2;
      const cy = h / 2;
      for (const braid of forest) {
        pen.strokeStyle = braid.exact ? "rgba(232, 206, 160, 0.9)" : "rgba(150, 176, 210, 0.28)";
        pen.lineWidth = braid.exact ? 1.4 : 0.7;
        for (const path of braid.paths) {
          if (path.length < 2) continue;
          pen.beginPath();
          pen.moveTo(cx + path[0].x * scale, cy - path[0].y * scale);
          for (let i = 1; i < path.length; i++) pen.lineTo(cx + path[i].x * scale, cy - path[i].y * scale);
          pen.stroke();
        }
      }
    };

    const paint = (now: number) => {
      if (!running) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w > 0 && h > 0) {
        const pw = Math.floor(w * dpr);
        const ph = Math.floor(h * dpr);
        if (canvas.width !== pw || canvas.height !== ph) {
          canvas.width = pw;
          canvas.height = ph;
          baked = "";
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = "#09061a";
        ctx.fillRect(0, 0, w, h);
        bake(w, h, dpr);
        ctx.drawImage(plate, 0, 0, w, h);
        if (!reduced) {
          const exact = forest.find((b) => b.exact);
          const path = exact?.paths[0];
          if (path && path.length > 1) {
            const scale = (Math.min(w, h) * 0.42) / maxR;
            const p = path[Math.floor(((now / 9000) % 1) * (path.length - 1))];
            ctx.fillStyle = "rgba(255, 236, 200, 0.95)";
            ctx.beginPath();
            ctx.arc(w / 2 + p.x * scale, h / 2 - p.y * scale, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      frame = requestAnimationFrame(paint);
    };

    frame = requestAnimationFrame(paint);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
