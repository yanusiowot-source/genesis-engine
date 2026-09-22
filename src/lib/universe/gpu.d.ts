/** Minimal WebGPU names so the lab types without @webgpu/types. */
interface GPU {
  requestAdapter(): Promise<GPUAdapter | null>;
  getPreferredCanvasFormat(): GPUTextureFormat;
}
interface GPUAdapter {
  requestDevice(): Promise<GPUDevice>;
}
interface GPUDevice {
  createBuffer(desc: unknown): GPUBuffer;
  createShaderModule(desc: { code: string }): GPUShaderModule;
  createBindGroupLayout(desc: unknown): GPUBindGroupLayout;
  createPipelineLayout(desc: unknown): GPUPipelineLayout;
  createRenderPipeline(desc: unknown): GPURenderPipeline;
  createBindGroup(desc: unknown): GPUBindGroup;
  createCommandEncoder(): GPUCommandEncoder;
  queue: GPUQueue;
  destroy(): void;
}
interface GPUBuffer {
  destroy(): void;
}
interface GPUQueue {
  writeBuffer(buffer: GPUBuffer, offset: number, data: BufferSource): void;
  submit(bufs: GPUCommandBuffer[]): void;
}
interface GPUCanvasContext {
  configure(desc: unknown): void;
  getCurrentTexture(): { createView(): GPUTextureView };
}
interface GPUCommandEncoder {
  beginRenderPass(desc: unknown): GPURenderPassEncoder;
  finish(): GPUCommandBuffer;
}
interface GPURenderPassEncoder {
  setPipeline(p: GPURenderPipeline): void;
  setBindGroup(i: number, g: GPUBindGroup): void;
  setVertexBuffer(i: number, b: GPUBuffer): void;
  draw(v: number, i?: number): void;
  end(): void;
}
type GPUTextureFormat = string;
type GPUBufferUsageFlags = number;
declare const GPUBufferUsage: { UNIFORM: number; COPY_DST: number; VERTEX: number };
declare const GPUShaderStage: { VERTEX: number; FRAGMENT: number };
interface GPUShaderModule {}
interface GPUBindGroupLayout {}
interface GPUPipelineLayout {}
interface GPURenderPipeline {}
interface GPUBindGroup {}
interface GPUCommandBuffer {}
interface GPUTextureView {}
interface HTMLCanvasElement {
  getContext(contextId: "webgpu"): GPUCanvasContext | null;
}
