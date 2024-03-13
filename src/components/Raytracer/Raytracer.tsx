'use client';
import {useEffect, useRef} from 'react';
import {Button} from './Button';
import shaderWgsl from './shader.wgsl';

export function Raytracer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const {width, height} = canvas.getBoundingClientRect();
      const scale = Math.max(window.devicePixelRatio, 1);
      canvas.width = Math.floor(width * scale);
      canvas.height = Math.floor(height * scale);
    };

    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const render = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const {gpu} = navigator;
    if (!gpu) {
      showAlert('WebGPU is not supported in this browser');
      return;
    }

    const context = canvas.getContext('webgpu');
    if (!context) {
      showAlert('Failed to get WebGPU context');
      return;
    }

    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      showAlert('Failed to request WebGPU adapter');
      return;
    }

    const device = await adapter.requestDevice();

    const start = performance.now();
    draw({gpu, context, device});

    const diff = performance.now() - start;
    console.info('render time (ms): ', diff);
  };

  return (
    <div className='absolute inset-0 flex flex-col gap-4 p-6'>
      <div className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
        <h1 className='text-2xl sm:text-3xl'>WebGPU raytracer</h1>
        <Button onClick={render}>Render</Button>
      </div>
      <div className='relative flex-1 border border-white'>
        <canvas ref={canvasRef} className='absolute h-full w-full' />
      </div>
    </div>
  );
}

const draw = ({
  gpu,
  context,
  device,
}: {
  gpu: GPU;
  context: GPUCanvasContext;
  device: GPUDevice;
}): void => {
  const preferredCanvasFormat = gpu.getPreferredCanvasFormat();

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
};

const showAlert = (message: string): void => {
  alert(message); // eslint-disable-line no-alert
};
