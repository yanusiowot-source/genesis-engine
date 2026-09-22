import type { GalaxyModel, Star } from "./galaxy.ts";

/** 8 floats per instance: x y z r  R G B a. Quad corners live in a static vertex buffer. */
export const STAR_FLOATS = 8;
export const QUAD_VERTS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
export const QUAD_INDEX = new Uint16Array([0, 1, 2, 2, 1, 3]);

export function gpuOffered(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

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

const WGSL = /* wgsl */ `
struct Uniforms {
  origin: vec2f,
  res: vec2f,
  scale: f32,
  rot: f32,
  point: f32,
  vis: f32,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

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
  let c = cos(u.rot);
  let s = sin(u.rot);
  let x = pos.x * c - pos.y * s;
  let y = pos.x * s + pos.y * c;
  let px = u.origin.x + x * u.scale;
  let py = u.origin.y + y * u.scale;
  let size = max(pos.w, 0.45) * u.point;
  let q = corner * size;
  var out: VertOut;
  out.clip = vec4f(((px + q.x) / u.res.x) * 2.0 - 1.0, 1.0 - ((py + q.y) / u.res.y) * 2.0, 0.0, 1.0);
  out.col = vec4f(col.rgb, col.a * u.vis);
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
    let stars = grow(device, 4096 * STAR_FLOATS * 4, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
    let cap = 4096;
    const bind = device.createBindGroup({
      layout: bindLayout,
      entries: [{ binding: 0, resource: { buffer: uniform } }],
    });
    const bag: GpuBag = { device, context, pipeline, uniform, stars, quad, index, bind, cap };
    let scratch = new Float32Array(4096 * STAR_FLOATS);
    let lastModel: GalaxyModel | null = null;
    let packed = 0;
    const ubo = new Float32Array(16);

    return {
      draw(model, view) {
        const list = model.stars.length + model.field.length;
        if (model !== lastModel) {
          if (list * STAR_FLOATS > scratch.length) scratch = new Float32Array(list * STAR_FLOATS);
          if (list > bag.cap) {
            bag.cap = list;
            bag.stars.destroy();
            bag.stars = grow(device, list * STAR_FLOATS * 4, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
          }
          packed = packGalaxyInstances(model, scratch);
          device.queue.writeBuffer(bag.stars, 0, scratch.subarray(0, packed * STAR_FLOATS));
          lastModel = model;
        }
        ubo[0] = view.ox;
        ubo[1] = view.oy;
        ubo[2] = view.w;
        ubo[3] = view.h;
        ubo[4] = view.scale;
        ubo[5] = view.rot;
        ubo[6] = Math.max(view.dpr, 1);
        ubo[7] = view.vis;
        device.queue.writeBuffer(bag.uniform, 0, ubo);
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
        if (packed > 0) {
          pass.setPipeline(pipeline);
          pass.setBindGroup(0, bag.bind);
          pass.setVertexBuffer(0, bag.quad);
          pass.setVertexBuffer(1, bag.stars);
          pass.setIndexBuffer(bag.index, "uint16");
          pass.drawIndexed(6, packed);
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
