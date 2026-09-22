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
  createComputePipeline(desc: unknown): GPUComputePipeline;
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
  beginComputePass(): GPUComputePassEncoder;
  finish(): GPUCommandBuffer;
}
interface GPURenderPassEncoder {
  setPipeline(p: GPURenderPipeline): void;
  setBindGroup(i: number, g: GPUBindGroup): void;
  setVertexBuffer(i: number, b: GPUBuffer): void;
  setIndexBuffer(b: GPUBuffer, format: string): void;
  draw(v: number, i?: number): void;
  drawIndexed(indices: number, instances?: number): void;
  drawIndexedIndirect(buffer: GPUBuffer, offset: number): void;
  end(): void;
}
interface GPUComputePassEncoder {
  setPipeline(p: GPUComputePipeline): void;
  setBindGroup(i: number, g: GPUBindGroup): void;
  dispatchWorkgroups(x: number, y?: number, z?: number): void;
  end(): void;
}
type GPUTextureFormat = string;
type GPUBufferUsageFlags = number;
declare const GPUBufferUsage: {
  UNIFORM: number;
  COPY_DST: number;
  VERTEX: number;
  INDEX: number;
  STORAGE: number;
  INDIRECT: number;
};
declare const GPUShaderStage: { VERTEX: number; FRAGMENT: number; COMPUTE: number };
interface GPUShaderModule {}
interface GPUBindGroupLayout {}
interface GPUPipelineLayout {}
interface GPURenderPipeline {}
interface GPUComputePipeline {}
interface GPUBindGroup {}
interface GPUCommandBuffer {}
interface GPUTextureView {}
interface HTMLCanvasElement {
  getContext(contextId: "webgpu"): GPUCanvasContext | null;
}
