'use client';
import {useEffect, useRef, useState} from 'react';
import {useWebGPUSupport} from './useWebGPUSupport';
import {Button} from './Button';
import {Canvas} from './Canvas';
import {StatFPS} from './StatFPS';
import {StatWebGPUSupport} from './StatWebGPUSupport';
import shaderWgsl from './shader.wgsl';

export function Raytracer() {
  const webGPUSupported = useWebGPUSupport();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [running, setRunning] = useState<boolean>(false);
  const animationFrameIdRef = useRef<number | undefined>();

  const lastFrameTimeMsRef = useRef<number | undefined>();
  const [lastFrameTimeMs, setLastFrameTimeMs] = useState<number | undefined>();

  useEffect(() => {
    const intervalId = setInterval(() => {
      setLastFrameTimeMs(lastFrameTimeMsRef.current);
    }, 200);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const run = async () => {
    if (running) return;
    setRunning(true);

    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas ref is not set');

    const {gpu} = navigator;
    if (!gpu) throw new Error('WebGPU is not supported in this browser');

    const context = canvas.getContext('webgpu');
    if (!context) throw new Error('Failed to get WebGPU context');

    const adapter = await gpu.requestAdapter();
    if (!adapter) throw new Error('Failed to request WebGPU adapter');

    const device = await adapter.requestDevice();

    let prevTime = performance.now();
    const drawLoop: FrameRequestCallback = (time) => {
      lastFrameTimeMsRef.current = time - prevTime;
      prevTime = time;

      animationFrameIdRef.current = requestAnimationFrame(drawLoop);
      draw({gpu, context, device});
    };

    animationFrameIdRef.current = requestAnimationFrame(drawLoop);
  };

  const stop = () => {
    if (!running) return;
    setRunning(false);

    if (!animationFrameIdRef.current) return;
    cancelAnimationFrame(animationFrameIdRef.current);
    animationFrameIdRef.current = undefined;
    lastFrameTimeMsRef.current = undefined;
  };

  return (
    <div className='absolute inset-0 flex flex-col sm:flex-row'>
      <div className='flex flex-1 flex-col gap-2 p-4 sm:max-w-xs'>
        <div className='flex flex-1 flex-col gap-2'>
          <h1 className='text-2xl underline'>WebGPU raytracer</h1>
          <StatWebGPUSupport supported={webGPUSupported} />
          <StatFPS frameTimeMs={lastFrameTimeMs} />
        </div>
        <Button disabled={!webGPUSupported} onClick={running ? stop : run}>
          {running ? 'Stop' : 'Run'}
        </Button>
      </div>
      <div className='relative flex-1 border-zinc-500 max-sm:border-t sm:border-l'>
        <Canvas ref={canvasRef} />
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
