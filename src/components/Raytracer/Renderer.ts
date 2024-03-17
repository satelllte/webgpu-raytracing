import shaderCode from './Renderer.wgsl';

export class Renderer {
  private static get _RENDERER_NOT_INITIALIZED() {
    return 'Renderer was not initialized properly';
  }

  private static get _verticesData(): Float32Array {
    // prettier-ignore
    return new Float32Array([
      /// position<vec4f> (xyzw)
      -1.0,  1.0, 0.0, 1.0,
      -1.0, -1.0, 0.0, 1.0,
       1.0,  1.0, 0.0, 1.0,
       1.0,  1.0, 0.0, 1.0,
      -1.0, -1.0, 0.0, 1.0,
       1.0, -1.0, 0.0, 1.0,
    ]);
  }

  private _adapter: GPUAdapter | undefined;
  private _context: GPUCanvasContext | undefined;
  private _device: GPUDevice | undefined;
  private _preferredCanvasFormat: GPUTextureFormat | undefined;

  private _settings: Settings | undefined;
  private _light: Light | undefined;
  private _skyColor: ColorRGB | undefined;
  private _materials: Material[] = [];
  private _spheres: Sphere[] = [];

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

  public setSettings(settings: Settings): void {
    this._settings = settings;
  }

  private get _settingsData(): Float32Array {
    return new Float32Array([
      this._settings ? this._settings.bounces : 0, /// bounces: f32 || TODO: figure out how to pass u32 properly instead
      this._settings ? this._settings.samplesPerFrame : 1, /// samples_per_frame: f32 || TODO: figure out how to pass u32 properly instead
      this._settings ? this._settings.seed : 0.1, /// seed: f32
      0.0, /// 4 bytes padding
    ]);
  }

  public setLight(light: Light): void {
    this._light = light;
  }

  private get _lightData(): Float32Array {
    if (!this._light) {
      return new Float32Array([0.0, 0.0, 0.0, 0.0]); // Minimum binding size is 16 bytes, so passing a single "void" one
    }

    return new Float32Array([
      this._light.position[0], /// position: vec3f (0)
      this._light.position[1], /// position: vec3f (1)
      this._light.position[2], /// position: vec3f (2)
      0.0, /// 4 bytes padding
    ]);
  }

  public setSkyColor(skyColor: ColorRGB): void {
    this._skyColor = skyColor;
  }

  private get _skyColorData(): Float32Array {
    if (!this._skyColor) {
      return new Float32Array([0.0, 0.0, 0.0, 0.0]); // Minimum binding size is 16 bytes, so passing a single "void" one
    }

    return new Float32Array([
      this._skyColor[0], /// ColorRGB (0)
      this._skyColor[1], /// ColorRGB (1)
      this._skyColor[2], /// ColorRGB (2)
      0.0, /// 4 bytes padding
    ]);
  }

  public setMaterials(materials: Material[]): void {
    this._materials = materials;
  }

  private get _materialsData(): Float32Array {
    if (!this._materials.length) {
      return new Float32Array([0.0, 0.0, 0.0, 0.0]); // Minimum binding size is 16 bytes, so passing a single "void" one
    }

    return new Float32Array(
      this._materials.flatMap((material) => [
        ...material.albedo, /// albedo: ColorRGB
        material.roughness, /// roughness: f32
      ]),
    );
  }

  public setSpheres(spheres: Sphere[]): void {
    this._spheres = spheres;
  }

  private get _spheresData(): Float32Array {
    if (!this._spheres.length) {
      return new Float32Array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]); // Minimum binding size is 32 bytes, so passing a single "void" one
    }

    return new Float32Array(
      this._spheres.flatMap((sphere) => [
        ...sphere.position, /// position: vec3f
        sphere.radius, /// radius: f32
        sphere.materialIndex, /// material_index: f32 || TODO: figure out how to pass u32 properly instead
        0.0, /// 4 bytes padding
        0.0, /// 4 bytes padding
        0.0, /// 4 bytes padding
      ]),
    );
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

    const shaderModule = device.createShaderModule({
      label: 'shader module',
      code: shaderCode,
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

    const usageVertex = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST; // eslint-disable-line no-bitwise
    const usageUniform = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST; // eslint-disable-line no-bitwise
    const usageStorage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST; // eslint-disable-line no-bitwise

    const verticesData = Renderer._verticesData;
    const verticesBuffer = device.createBuffer({
      label: 'vertices buffer',
      size: verticesData.byteLength,
      usage: usageVertex,
    });

    const dimensionsData = new Float32Array([
      context.canvas.width, /// width: f32
      context.canvas.height, /// height: f32
    ]);
    const dimensionsBuffer = device.createBuffer({
      label: 'dimensions buffer',
      size: dimensionsData.byteLength,
      usage: usageUniform,
    });

    const settingsData = this._settingsData;
    const settingsBuffer = device.createBuffer({
      label: 'settings buffer',
      size: settingsData.byteLength,
      usage: usageUniform,
    });

    const lightData = this._lightData;
    const lightBuffer = device.createBuffer({
      label: 'light buffer',
      size: lightData.byteLength,
      usage: usageUniform,
    });

    const skyColorData = this._skyColorData;
    const skyColorBuffer = device.createBuffer({
      label: 'sky color buffer',
      size: skyColorData.byteLength,
      usage: usageUniform,
    });

    const materialsData = this._materialsData;
    const materialsBuffer = device.createBuffer({
      label: 'materials buffer',
      size: materialsData.byteLength,
      usage: usageStorage,
    });

    const spheresData = this._spheresData;
    const spheresBuffer = device.createBuffer({
      label: 'spheres buffer',
      size: spheresData.byteLength,
      usage: usageStorage,
    });

    const uniformsBindGroup = device.createBindGroup({
      label: 'uniforms bind group',
      layout: renderPipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: dimensionsBuffer}},
        {binding: 1, resource: {buffer: settingsBuffer}},
        {binding: 2, resource: {buffer: lightBuffer}},
        {binding: 3, resource: {buffer: skyColorBuffer}},
        {binding: 4, resource: {buffer: materialsBuffer}},
        {binding: 5, resource: {buffer: spheresBuffer}},
      ],
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
    passEncoder.setVertexBuffer(0, verticesBuffer);
    passEncoder.setBindGroup(0, uniformsBindGroup);
    passEncoder.draw(verticesData.length / 4);
    passEncoder.end();

    device.queue.writeBuffer(verticesBuffer, 0, verticesData);
    device.queue.writeBuffer(dimensionsBuffer, 0, dimensionsData);
    device.queue.writeBuffer(settingsBuffer, 0, settingsData);
    device.queue.writeBuffer(lightBuffer, 0, lightData);
    device.queue.writeBuffer(skyColorBuffer, 0, skyColorData);
    device.queue.writeBuffer(materialsBuffer, 0, materialsData);
    device.queue.writeBuffer(spheresBuffer, 0, spheresData);

    device.queue.submit([commandEncoder.finish()]);
  }
}

export type Vector3 = [number, number, number];
export type ColorRGB = Vector3;
export type Settings = {bounces: number; samplesPerFrame: number; seed: number};
export type Light = {position: Vector3};
export type Material = {albedo: ColorRGB; roughness: number};
export type Sphere = {position: Vector3; radius: number; materialIndex: number};
