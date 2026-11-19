import { useEffect, useRef } from "react";
import { threeForest } from "@/lib/universe/three-body";

export function ThreeForest({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const forest = threeForest();
    let maxR = 1;
    for (const braid of forest) {
      for (const path of braid.paths) {
        for (const pt of path) maxR = Math.max(maxR, Math.hypot(pt.x, pt.y));
      }
    }
    maxR = Math.min(maxR, 4.2);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let running = true;
    let frame = 0;

    const paint = (now: number) => {
      if (!running) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w > 0 && h > 0 && (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr))) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#09061a";
      ctx.fillRect(0, 0, w, h);
      const scale = (Math.min(w, h) * 0.42) / maxR;
      const cx = w / 2;
      const cy = h / 2;
      const drawPath = (pts: { x: number; y: number }[], color: string, width: number, upto: number) => {
        if (pts.length < 2) return;
        const n = Math.max(2, Math.min(pts.length, upto));
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.moveTo(cx + pts[0].x * scale, cy - pts[0].y * scale);
        for (let i = 1; i < n; i++) ctx.lineTo(cx + pts[i].x * scale, cy - pts[i].y * scale);
        ctx.stroke();
      };
      const reveal = reduced ? 1 : (now / 9000) % 1;
      for (const braid of forest) {
        const n = braid.exact ? braid.paths[0].length : Math.floor(braid.paths[0].length * Math.min(1, reveal + 0.15));
        const color = braid.exact ? "rgba(232, 206, 160, 0.9)" : "rgba(150, 176, 210, 0.22)";
        const width = braid.exact ? 1.4 : 0.7;
        for (const path of braid.paths) drawPath(path, color, width, n);
      }
      if (!reduced) {
        const exact = forest.find((b) => b.exact);
        if (exact) {
          const path = exact.paths[0];
          const i = Math.floor(reveal * (path.length - 1));
          const p = path[i];
          ctx.fillStyle = "rgba(255, 236, 200, 0.95)";
          ctx.beginPath();
          ctx.arc(cx + p.x * scale, cy - p.y * scale, 2.2, 0, Math.PI * 2);
          ctx.fill();
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
