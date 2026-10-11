import type { GalaxyModel, Star } from "./galaxy.ts";
import { faceOnLocal } from "./sky-place.ts";

export { faceOnLocal, gpuOffered, skyGpuMark } from "./sky-place.ts";

/** 8 floats per instance: x y z r  R G B a. Quad corners live in a static vertex buffer. */
export const STAR_FLOATS = 8;
export const QUAD_VERTS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
export const QUAD_INDEX = new Uint16Array([0, 1, 2, 2, 1, 3]);

export function packStars(stars: Star[], into: Float32Array, offset = 0, alphaMul = 1): number {
  const room = Math.floor((into.length - offset) / STAR_FLOATS);
  const n = Math.min(stars.length, room);
  for (let i = 0; i < n; i++) {
    const s = stars[i]!;
    const o = offset + i * STAR_FLOATS;
    into[o] = s.x;
    into[o + 1] = s.y;
    into[o + 2] = s.z;
    into[o + 3] = s.r;
    into[o + 4] = s.rgb[0] / 255;
    into[o + 5] = s.rgb[1] / 255;
    into[o + 6] = s.rgb[2] / 255;
    into[o + 7] = Math.min(1, s.a * alphaMul);
  }
  return n;
}

export function packGalaxyInstances(model: GalaxyModel, into: Float32Array): number {
  const disk = packStars(model.stars, into, 0, 1);
  return disk + packStars(model.field, into, disk * STAR_FLOATS, 0.85);
}

/**
 * Face-on disk at t = 0, no differential rotation: translate, rotate, faceOnLocal.
 * The GPU vertex shader copies this multiply. Anisotropic stretch is not this path.
 */
export function diskPlace(
  x: number,
  y: number,
  view: { ox: number; oy: number; scale: number; rot: number },
): { x: number; y: number } {
  const local = faceOnLocal(x, y, view.scale);
  const c = Math.cos(view.rot);
  const s = Math.sin(view.rot);
  return {
    x: view.ox + local.x * c - local.y * s,
    y: view.oy + local.y * c + local.x * s,
  };
}

/** Shader order: rotate the world point, then scale. Uniform scale commutes with diskPlace. */
export function shaderDiskPlace(
  x: number,
  y: number,
  view: { ox: number; oy: number; scale: number; rot: number },
): { x: number; y: number } {
  const c = Math.cos(view.rot);
  const s = Math.sin(view.rot);
  const rx = x * c - y * s;
  const ry = x * s + y * c;
  return { x: view.ox + rx * view.scale, y: view.oy + ry * view.scale };
}

/** Homology of the compute cull: after 2D rotation, is the sprite on the canvas? */
export function instanceOnScreen(
  x: number,
  y: number,
  r: number,
  view: { ox: number; oy: number; w: number; h: number; scale: number; rot: number; point: number },
): boolean {
  const p = diskPlace(x, y, view);
  const size = Math.max(r, 0.45) * view.point;
  return p.x + size >= 0 && p.x - size <= view.w && p.y + size >= 0 && p.y - size <= view.h;
}

const DISK_PLACE_FN = `fn placeDisk(wx: f32, wy: f32) -> vec2f {
  let c = cos(u.rot);
  let s = sin(u.rot);
  let rx = wx * c - wy * s;
  let ry = wx * s + wy * c;
  return vec2f(u.origin.x + rx * u.scale, u.origin.y + ry * u.scale);
}`;

const WGSL = /* wgsl */ `
struct Uniforms {
  origin: vec2f,
  res: vec2f,
  scale: f32,
  rot: f32,
  point: f32,
  vis: f32,
  count: u32,
  time: f32,
  live: u32,
  pad2: u32,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

${DISK_PLACE_FN}

struct VertOut {
  @builtin(position) clip: vec4f,
  @location(0) col: vec4f,
  @location(1) local: vec2f,
};

@vertex
fn vs(
  @location(0) corner: vec2f,
  @location(1) pos: vec4f,
  @location(2) col: vec4f,
) -> VertOut {
  let p = placeDisk(pos.x, pos.y);
  let size = max(pos.w, 0.45) * u.point;
  let q = corner * size;
  let phase = pos.x * 17.0 + pos.y * 13.0;
  let pulse = 0.62 + 0.24 * sin(u.time * 2.4 + phase) + 0.14 * sin(u.time * 0.7 + phase * 1.7);
  let tw = select(1.0, pulse, u.live == 1u);
  var out: VertOut;
  out.clip = vec4f(((p.x + q.x) / u.res.x) * 2.0 - 1.0, 1.0 - ((p.y + q.y) / u.res.y) * 2.0, 0.0, 1.0);
  out.col = vec4f(col.rgb, col.a * u.vis * tw);
  out.local = corner;
  return out;
}

@fragment
fn fs(v: VertOut) -> @location(0) vec4f {
  let d = dot(v.local, v.local);
  if (d > 1.0) { discard; }
  let w = 1.0 - d;
  let a = v.col.a * w;
  return vec4f(v.col.rgb * a, a);
}
`;

const CULL_WGSL = /* wgsl */ `
struct Uniforms {
  origin: vec2f,
  res: vec2f,
  scale: f32,
  rot: f32,
  point: f32,
  vis: f32,
  count: u32,
  time: f32,
  live: u32,
  pad2: u32,
};
struct Star { pos: vec4f, col: vec4f }
struct Counter { n: atomic<u32> }

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> src: array<Star>;
@group(0) @binding(2) var<storage, read_write> dst: array<Star>;
@group(0) @binding(3) var<storage, read_write> counter: Counter;
@group(0) @binding(4) var<storage, read_write> indirect: array<u32>;

${DISK_PLACE_FN}

@compute @workgroup_size(64)
fn cull(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= u.count) { return; }
  let star = src[i];
  if (star.col.a * u.vis < 0.012) { return; }
  let p = placeDisk(star.pos.x, star.pos.y);
  let size = max(star.pos.w, 0.45) * u.point;
  if (p.x + size < 0.0 || p.x - size > u.res.x || p.y + size < 0.0 || p.y - size > u.res.y) {
    return;
  }
  let slot = atomicAdd(&counter.n, 1u);
  dst[slot] = star;
}

@compute @workgroup_size(1)
fn fin() {
  indirect[0] = 6u;
  indirect[1] = atomicLoad(&counter.n);
  indirect[2] = 0u;
  indirect[3] = 0u;
  indirect[4] = 0u;
}
`;

type GpuBag = {
  device: GPUDevice;
  context: GPUCanvasContext;
  pipeline: GPURenderPipeline;
  uniform: GPUBuffer;
  stars: GPUBuffer;
  quad: GPUBuffer;
  index: GPUBuffer;
  bind: GPUBindGroup;
  cap: number;
};

export type SkyView = {
  ox: number;
  oy: number;
  w: number;
  h: number;
  scale: number;
  rot: number;
  vis: number;
  dpr: number;
  /** Seconds. Zero freezes the scintillation. */
  time?: number;
  still?: boolean;
};

/** Same pulse as the canvas twinkle. Still skies stay at 1. Does not move the star. */
export function starTwinkle(time: number, x: number, y: number, live: boolean): number {
  if (!live) return 1;
  const phase = x * 17 + y * 13;
  return 0.62 + 0.24 * Math.sin(time * 2.4 + phase) + 0.14 * Math.sin(time * 0.7 + phase * 1.7);
}

/** WebGPU framebuffer is device pixels. 2D canvas setTransform(dpr) hid this. */
export function deviceView(view: SkyView): {
  ox: number;
  oy: number;
  w: number;
  h: number;
  scale: number;
  rot: number;
  point: number;
  vis: number;
} {
  const dpr = Math.max(view.dpr, 1);
  return {
    ox: view.ox * dpr,
    oy: view.oy * dpr,
    w: view.w * dpr,
    h: view.h * dpr,
    scale: view.scale * dpr,
    rot: view.rot,
    point: dpr,
    vis: view.vis,
  };
}

export type SkyGpu = {
  draw: (model: GalaxyModel, view: SkyView) => void;
  clear: () => void;
  destroy: () => void;
};

function grow(device: GPUDevice, bytes: number, usage: GPUBufferUsageFlags): GPUBuffer {
  return device.createBuffer({ size: Math.max(256, bytes), usage });
}

export async function createSkyGpu(canvas: HTMLCanvasElement): Promise<SkyGpu | null> {
  const nav = navigator as Navigator & { gpu?: GPU };
  if (!nav.gpu) return null;
  try {
    const adapter = await nav.gpu.requestAdapter();
    if (!adapter) return null;
    const device = await adapter.requestDevice();
    const context = canvas.getContext("webgpu");
    if (!context) return null;
    const format = nav.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: "premultiplied" });
    const shader = device.createShaderModule({ code: WGSL });
    const bindLayout = device.createBindGroupLayout({
      entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }],
    });
    const pipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [bindLayout] }),
      vertex: {
        module: shader,
        entryPoint: "vs",
        buffers: [
          {
            arrayStride: 8,
            stepMode: "vertex",
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
          },
          {
            arrayStride: STAR_FLOATS * 4,
            stepMode: "instance",
            attributes: [
              { shaderLocation: 1, offset: 0, format: "float32x4" },
              { shaderLocation: 2, offset: 16, format: "float32x4" },
            ],
          },
        ],
      },
      fragment: {
        module: shader,
        entryPoint: "fs",
        targets: [{ format, blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } } }],
      },
      primitive: { topology: "triangle-list" },
    });
    const uniform = grow(device, 256, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    const quad = grow(device, QUAD_VERTS.byteLength, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
    const index = grow(device, QUAD_INDEX.byteLength, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST);
    device.queue.writeBuffer(quad, 0, QUAD_VERTS);
    device.queue.writeBuffer(index, 0, QUAD_INDEX);
    const starUsage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE;
    let stars = grow(device, 4096 * STAR_FLOATS * 4, starUsage);
    let compact = grow(device, 4096 * STAR_FLOATS * 4, starUsage);
    const cap = 4096;
    const counter = grow(device, 256, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
    const indirect = grow(device, 256, GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
    const bind = device.createBindGroup({
      layout: bindLayout,
      entries: [{ binding: 0, resource: { buffer: uniform } }],
    });
    let cullPipe: GPUComputePipeline | null = null;
    let finPipe: GPUComputePipeline | null = null;
    let cullLayout: GPUBindGroupLayout | null = null;
    try {
      const cullMod = device.createShaderModule({ code: CULL_WGSL });
      cullLayout = device.createBindGroupLayout({
        entries: [
          { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
          { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
          { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
          { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
          { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
        ],
      });
      const cullPl = device.createPipelineLayout({ bindGroupLayouts: [cullLayout] });
      cullPipe = device.createComputePipeline({ layout: cullPl, compute: { module: cullMod, entryPoint: "cull" } });
      finPipe = device.createComputePipeline({ layout: cullPl, compute: { module: cullMod, entryPoint: "fin" } });
    } catch {
      cullPipe = null;
      finPipe = null;
      cullLayout = null;
    }
    const bag: GpuBag = { device, context, pipeline, uniform, stars, quad, index, bind, cap };
    let scratch = new Float32Array(4096 * STAR_FLOATS);
    let lastModel: GalaxyModel | null = null;
    let packed = 0;
    const uboBytes = new ArrayBuffer(256);
    const uboF = new Float32Array(uboBytes);
    const uboU = new Uint32Array(uboBytes);
    const zero = new Uint32Array([0]);

    const bindCull = () => {
      if (!cullLayout) return null;
      return device.createBindGroup({
        layout: cullLayout,
        entries: [
          { binding: 0, resource: { buffer: uniform } },
          { binding: 1, resource: { buffer: stars } },
          { binding: 2, resource: { buffer: compact } },
          { binding: 3, resource: { buffer: counter } },
          { binding: 4, resource: { buffer: indirect } },
        ],
      });
    };
    let cullBind = bindCull();

    return {
      draw(model, view) {
        const list = model.stars.length + model.field.length;
        if (model !== lastModel) {
          if (list * STAR_FLOATS > scratch.length) scratch = new Float32Array(list * STAR_FLOATS);
          if (list > bag.cap) {
            bag.cap = list;
            stars.destroy();
            compact.destroy();
            stars = grow(device, list * STAR_FLOATS * 4, starUsage);
            compact = grow(device, list * STAR_FLOATS * 4, starUsage);
            bag.stars = stars;
            cullBind = bindCull();
          }
          packed = packGalaxyInstances(model, scratch);
          device.queue.writeBuffer(stars, 0, scratch.subarray(0, packed * STAR_FLOATS));
          lastModel = model;
        }
        const gpu = deviceView(view);
        uboF[0] = gpu.ox;
        uboF[1] = gpu.oy;
        uboF[2] = gpu.w;
        uboF[3] = gpu.h;
        uboF[4] = gpu.scale;
        uboF[5] = gpu.rot;
        uboF[6] = gpu.point;
        uboF[7] = gpu.vis;
        uboU[8] = packed;
        uboF[9] = view.still ? 0 : (view.time ?? 0);
        uboU[10] = view.still ? 0 : 1;
        device.queue.writeBuffer(uniform, 0, uboBytes);
        const encoder = device.createCommandEncoder();
        const useCull = !!(cullPipe && finPipe && cullBind && packed > 0);
        if (useCull) {
          device.queue.writeBuffer(counter, 0, zero);
          const cpass = encoder.beginComputePass();
          cpass.setPipeline(cullPipe!);
          cpass.setBindGroup(0, cullBind!);
          cpass.dispatchWorkgroups(Math.ceil(packed / 64));
          cpass.setPipeline(finPipe!);
          cpass.setBindGroup(0, cullBind!);
          cpass.dispatchWorkgroups(1);
          cpass.end();
        }
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: context.getCurrentTexture().createView(),
              clearValue: { r: 0, g: 0, b: 0, a: 0 },
              loadOp: "clear",
              storeOp: "store",
            },
          ],
        });
        if (packed > 0) {
          pass.setPipeline(pipeline);
          pass.setBindGroup(0, bag.bind);
          pass.setVertexBuffer(0, bag.quad);
          pass.setVertexBuffer(1, useCull ? compact : stars);
          pass.setIndexBuffer(bag.index, "uint16");
          if (useCull) pass.drawIndexedIndirect(indirect, 0);
          else pass.drawIndexed(6, packed);
        }
        pass.end();
        device.queue.submit([encoder.finish()]);
      },
      clear() {
        lastModel = null;
        packed = 0;
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: context.getCurrentTexture().createView(),
              clearValue: { r: 0, g: 0, b: 0, a: 0 },
              loadOp: "clear",
              storeOp: "store",
            },
          ],
        });
        pass.end();
        device.queue.submit([encoder.finish()]);
      },
      destroy() {
        bag.stars.destroy();
        compact.destroy();
        counter.destroy();
        indirect.destroy();
        bag.quad.destroy();
        bag.index.destroy();
        bag.uniform.destroy();
        device.destroy();
      },
    };
  } catch {
    return null;
  }
}
