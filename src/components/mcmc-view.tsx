import { useEffect, useRef } from "react";
import type { Copy } from "@/lib/universe/i18n";
import type { McmcResult } from "@/lib/universe/mcmc";
import { PARAM_META } from "@/lib/universe/physics";
import { cn } from "@/lib/utils";

type Props = {
  copy: Copy;
  result: McmcResult;
  className?: string;
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function colorAt(t: number): [number, number, number] {
  const u = Math.max(0, Math.min(1, t));
  if (u < 0.5) {
    const k = u / 0.5;
    return [lerp(0.63, 0.84, k), lerp(0.54, 0.85, k), lerp(0.49, 0.87, k)];
  }
  const k = (u - 0.5) / 0.5;
  return [lerp(0.84, 0.54, k), lerp(0.85, 0.64, k), lerp(0.87, 0.56, k)];
}

export function McmcView({ copy, result, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const samples = result.samples;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || samples.length === 0) return;
    let dead = false;
    let renderer: { dispose: () => void; domElement: HTMLCanvasElement; forceContextLoss?: () => void } | null = null;
    const trash: { dispose: () => void }[] = [];
    let raf = 0;
    let onResize: (() => void) | null = null;

    const boot = async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
      if (dead || !hostRef.current) return;

      const gMeta = PARAM_META.find((m) => m.key === "gravity")!;
      const mMeta = PARAM_META.find((m) => m.key === "matter")!;
      const lo = result.logLMin;
      const span = Math.max(1e-6, result.logLMax - result.logLMin);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x08090b, 0.22);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 20);
      camera.position.set(1.65, 1.15, 1.7);

      const webgl = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
      if (dead) {
        webgl.dispose();
        return;
      }
      webgl.setClearColor(0x08090b, 1);
      webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      host.appendChild(webgl.domElement);
      renderer = webgl;

      const orbit = new OrbitControls(camera, webgl.domElement);
      orbit.enableDamping = true;
      orbit.dampingFactor = 0.08;
      orbit.target.set(0.5, 0.42, 0.5);
      orbit.minDistance = 0.7;
      orbit.maxDistance = 4.2;
      orbit.enablePan = false;
      trash.push(orbit);

      const n = samples.length;
      const positions = new Float32Array(n * 3);
      const colors = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const s = samples[i]!;
        const gx = (s.params.gravity - gMeta.min) / (gMeta.max - gMeta.min);
        const my = (s.params.matter - mMeta.min) / (mMeta.max - mMeta.min);
        const lz = (s.logL - lo) / span;
        positions[i * 3] = gx;
        positions[i * 3 + 1] = lz;
        positions[i * 3 + 2] = my;
        const [r, g, b] = colorAt(lz);
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.028,
        vertexColors: true,
        transparent: true,
        opacity: 0.88,
        sizeAttenuation: true,
        depthWrite: false,
      });
      const cloud = new THREE.Points(geo, mat);
      scene.add(cloud);
      trash.push(geo, mat);

      const boxSrc = new THREE.BoxGeometry(1, 1, 1);
      const edges = new THREE.EdgesGeometry(boxSrc);
      boxSrc.dispose();
      const boxMat = new THREE.LineBasicMaterial({ color: 0x2a2e34 });
      const box = new THREE.LineSegments(edges, boxMat);
      box.position.set(0.5, 0.5, 0.5);
      scene.add(box);
      trash.push(edges, boxMat);

      const map = result.map;
      const mapGx = (map.params.gravity - gMeta.min) / (gMeta.max - gMeta.min);
      const mapMy = (map.params.matter - mMeta.min) / (mMeta.max - mMeta.min);
      const mapLz = (map.logL - lo) / span;
      const markGeo = new THREE.SphereGeometry(0.018, 12, 12);
      const markMat = new THREE.MeshBasicMaterial({ color: 0xecece8 });
      const mark = new THREE.Mesh(markGeo, markMat);
      mark.position.set(mapGx, mapLz, mapMy);
      scene.add(mark);
      trash.push(markGeo, markMat);

      const resize = () => {
        const w = host.clientWidth || 320;
        const h = host.clientHeight || 220;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        webgl.setSize(w, h, false);
      };
      onResize = resize;
      resize();
      window.addEventListener("resize", resize);

      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const tick = () => {
        if (dead) return;
        const dt = Math.min(0.05, 0.016);
        orbit.update();
        if (!reduced) cloud.rotation.y += dt * 0.04;
        webgl.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    void boot().catch(() => {
      /* WebGL unavailable — SVG fallback stays */
    });

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      if (onResize) window.removeEventListener("resize", onResize);
      for (const item of trash) item.dispose();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [result.logLMax, result.logLMin, result.map, samples]);

  return (
    <div className={cn("relative overflow-hidden rounded-[var(--radius-sm)] bg-bg", className)}>
      <div ref={hostRef} className="h-56 w-full sm:h-64" />
      <p className="pointer-events-none absolute bottom-2 left-3 font-mono text-[0.625rem] tracking-wide text-fg-subtle uppercase">
        {copy.desk.axes}
      </p>
    </div>
  );
}
