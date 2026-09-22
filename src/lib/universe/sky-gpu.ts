import type { GalaxyModel, Star } from "./galaxy.ts";

/** 8 floats: x y z r  R G B a. Matches the WGSL vertex stride. */
export const STAR_FLOATS = 8;

export function gpuOffered(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export function packStars(stars: Star[], into: Float32Array, vis: number): number {
  const n = Math.min(stars.length, Math.floor(into.length / STAR_FLOATS));
  for (let i = 0; i < n; i++) {
    const s = stars[i]!;
    const o = i * STAR_FLOATS;
    into[o] = s.x;
    into[o + 1] = s.y;
    into[o + 2] = s.z;
    into[o + 3] = s.r;
    into[o + 4] = s.rgb[0] / 255;
    into[o + 5] = s.rgb[1] / 255;
    into[o + 6] = s.rgb[2] / 255;
    into[o + 7] = Math.min(1, s.a * vis);
  }
  return n;
}

const WGSL = /* wgsl */ `
struct Uniforms {
  origin: vec2f,
  res: vec2f,
  scale: f32,
  rot: f32,
  point: f32,
  pad: f32,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VertIn {
  @location(0) pos: vec4f,
  @location(1) col: vec4f,
};

struct VertOut {
  @builtin(position) clip: vec4f,
  @location(0) col: vec4f,
  @location(1) local: vec2f,
};

@vertex
fn vs(v: VertIn, @builtin(vertex_index) vid: u32) -> VertOut {
  let corner = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
  );
  let c = cos(u.rot);
  let s = sin(u.rot);
  let x = v.pos.x * c - v.pos.y * s;
  let y = v.pos.x * s + v.pos.y * c;
  let px = u.origin.x + x * u.scale;
  let py = u.origin.y + y * u.scale;
  let size = max(v.pos.w, 0.45) * u.point;
  let q = corner[vid % 6u] * size;
  var out: VertOut;
  out.clip = vec4f(((px + q.x) / u.res.x) * 2.0 - 1.0, 1.0 - ((py + q.y) / u.res.y) * 2.0, 0.0, 1.0);
  out.col = v.col;
  out.local = corner[vid % 6u];
  return out;
}

@fragment
fn fs(v: VertOut) -> @location(0) vec4f {
  let d = dot(v.local, v.local);
  if (d > 1.0) { discard; }
  let w = 1.0 - d;
  return vec4f(v.col.rgb * v.col.a * w, v.col.a * w);
}
`;

type GpuBag = {
  device: GPUDevice;
  context: GPUCanvasContext;
  pipeline: GPURenderPipeline;
  uniform: GPUBuffer;
  stars: GPUBuffer;
  bind: GPUBindGroup;
  cap: number;
};

export type SkyGpu = {
  draw: (model: GalaxyModel, view: { ox: number; oy: number; scale: number; rot: number; vis: number; w: number; h: number; dpr: number }) => void;
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
            arrayStride: STAR_FLOATS * 4,
            stepMode: "instance",
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x4" },
              { shaderLocation: 1, offset: 16, format: "float32x4" },
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
    const uniform = grow(device, 32, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    let stars = grow(device, 4096 * STAR_FLOATS * 4, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
    let cap = 4096;
    const bind = device.createBindGroup({
      layout: bindLayout,
      entries: [{ binding: 0, resource: { buffer: uniform } }],
    });
    const bag: GpuBag = { device, context, pipeline, uniform, stars, bind, cap };
    let scratch = new Float32Array(4096 * STAR_FLOATS);

    return {
      draw(model, view) {
        const list = model.stars.length + model.field.length;
        if (list * STAR_FLOATS > scratch.length) {
          scratch = new Float32Array(list * STAR_FLOATS);
        }
        if (list > bag.cap) {
          bag.cap = list;
          bag.stars.destroy();
          bag.stars = grow(device, list * STAR_FLOATS * 4, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
        }
        let packed = packStars(model.stars, scratch, view.vis);
        if (packed + model.field.length <= scratch.length / STAR_FLOATS) {
          const rest = scratch.subarray(packed * STAR_FLOATS);
          packed += packStars(model.field, rest, view.vis * 0.85);
        }
        device.queue.writeBuffer(bag.stars, 0, scratch.subarray(0, packed * STAR_FLOATS));
        const u = new Float32Array([
          view.ox,
          view.oy,
          view.w,
          view.h,
          view.scale,
          view.rot,
          Math.max(view.dpr, 1),
          0,
        ]);
        device.queue.writeBuffer(bag.uniform, 0, u);
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
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bag.bind);
        pass.setVertexBuffer(0, bag.stars);
        pass.draw(6, packed);
        pass.end();
        device.queue.submit([encoder.finish()]);
      },
      clear() {
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
        bag.uniform.destroy();
        device.destroy();
      },
    };
  } catch {
    return null;
  }
}
