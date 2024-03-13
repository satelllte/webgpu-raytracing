import shaderWgsl from './shader.wgsl';

export class Renderer {
  private static get _RENDERER_NOT_INITIALIZED() {
    return 'Renderer was not initialized properly';
  }

  private _adapter: GPUAdapter | undefined;
  private _context: GPUCanvasContext | undefined;
  private _device: GPUDevice | undefined;
  private _preferredCanvasFormat: GPUTextureFormat | undefined;

  public async init(canvas: HTMLCanvasElement): Promise<void> {
    const context = canvas.getContext('webgpu');
    if (!context) throw new Error('Failed to get WebGPU context');

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('Failed to request WebGPU adapter');

    const device = await adapter.requestDevice();

    this._adapter = adapter;
    this._context = context;
    this._device = device;
    this._preferredCanvasFormat = navigator.gpu.getPreferredCanvasFormat();
  }

  public dispose(): void {
    this._adapter = undefined;
    this._context = undefined;
    this._device = undefined;
    this._preferredCanvasFormat = undefined;
  }

  public draw(): void {
    if (!this._adapter) throw new Error(Renderer._RENDERER_NOT_INITIALIZED);
    if (!this._context) throw new Error(Renderer._RENDERER_NOT_INITIALIZED);
    if (!this._device) throw new Error(Renderer._RENDERER_NOT_INITIALIZED);
    if (!this._preferredCanvasFormat)
      throw new Error(Renderer._RENDERER_NOT_INITIALIZED);

    const adapter = this._adapter;
    const context = this._context;
    const device = this._device;
    const preferredCanvasFormat = this._preferredCanvasFormat;

    context.configure({
      device,
      format: preferredCanvasFormat,
      alphaMode: 'premultiplied',
    });

    // prettier-ignore
    const vertices = new Float32Array([
    /// position<vec4f> (xyzw)
    -1.0,  1.0, 0.0, 1.0,
    -1.0, -1.0, 0.0, 1.0,
     1.0,  1.0, 0.0, 1.0,
     1.0,  1.0, 0.0, 1.0,
    -1.0, -1.0, 0.0, 1.0,
     1.0, -1.0, 0.0, 1.0,
  ]);

    const verticesBuffer = device.createBuffer({
      label: 'vertices buffer',
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, // eslint-disable-line no-bitwise
    });

    const uniforms = new Int32Array([
      context.canvas.width, /// width: u32
      context.canvas.height, /// height: u32
    ]);

    const uniformsBuffer = device.createBuffer({
      label: 'uniforms buffer',
      size: uniforms.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, // eslint-disable-line no-bitwise
    });

    const shaderModule = device.createShaderModule({
      label: 'shader module',
      code: shaderWgsl,
    });

    const renderPipeline = device.createRenderPipeline({
      label: 'render pipeline',
      layout: 'auto',
      primitive: {topology: 'triangle-list'},
      vertex: {
        module: shaderModule,
        entryPoint: 'vertex_main',
        buffers: [
          {
            arrayStride: 16,
            stepMode: 'vertex',
            attributes: [
              {shaderLocation: 0, offset: 0, format: 'float32x4'}, // Position
            ],
          },
        ] as const satisfies Iterable<GPUVertexBufferLayout>,
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragment_main',
        targets: [
          {format: preferredCanvasFormat},
        ] as const satisfies Iterable<GPUColorTargetState>,
      },
    });

    const uniformsBindGroup = device.createBindGroup({
      label: 'uniforms bind group',
      layout: renderPipeline.getBindGroupLayout(0),
      entries: [{binding: 0, resource: {buffer: uniformsBuffer}}],
    });

    const commandEncoder = device.createCommandEncoder({
      label: 'command encoder',
    });
    const passEncoder = commandEncoder.beginRenderPass({
      label: 'pass encoder',
      colorAttachments: [
        {
          clearValue: [0.0, 0.0, 0.0, 1.0],
          view: context.getCurrentTexture().createView(),
          loadOp: 'clear',
          storeOp: 'store',
        },
      ] as const satisfies Iterable<GPURenderPassColorAttachment>,
    });

    passEncoder.setPipeline(renderPipeline);
    passEncoder.setBindGroup(0, uniformsBindGroup);
    passEncoder.setVertexBuffer(0, verticesBuffer);
    passEncoder.draw(vertices.length / 4);
    passEncoder.end();

    device.queue.writeBuffer(verticesBuffer, 0, vertices);
    device.queue.writeBuffer(uniformsBuffer, 0, uniforms);

    device.queue.submit([commandEncoder.finish()]);
  }
}
