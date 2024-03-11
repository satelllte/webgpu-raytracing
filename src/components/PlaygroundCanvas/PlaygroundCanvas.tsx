'use client';
import {useEffect, useRef} from 'react';
import {useWindowSize} from 'usehooks-ts';
import shaderWgsl from './shader.wgsl';

export function PlaygroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {width, height} = useWindowSize();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = Math.max(devicePixelRatio, 1);
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
  }, [width, height]);

  useEffect(() => {
    const run = async () => {
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

      const gpuPreferredCanvasFormat = gpu.getPreferredCanvasFormat();

      context.configure({
        device,
        format: gpuPreferredCanvasFormat,
        alphaMode: 'premultiplied',
      });

      const shaderModule = device.createShaderModule({code: shaderWgsl});

      // prettier-ignore
      const vertices = new Float32Array([
        // Position<vec4f> (XYZW) + Color<vec4f> (RGBA)
         0.0,  0.0, 0.0, 1.0, 0.4, 0.2, 0.7, 1.0,
        -1.0, -1.0, 0.0, 1.0, 0.2, 0.0, 0.4, 1.0,
         1.0, -0.5, 0.0, 1.0, 0.0, 0.4, 0.4, 1.0,
      ]);

      const verticesBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, // eslint-disable-line no-bitwise
      });

      device.queue.writeBuffer(verticesBuffer, 0, vertices, 0, vertices.length);

      const renderPipeline = device.createRenderPipeline({
        layout: 'auto',
        primitive: {topology: 'triangle-list'},
        vertex: {
          module: shaderModule,
          entryPoint: 'vertex_main',
          buffers: [
            {
              arrayStride: 32,
              stepMode: 'vertex',
              attributes: [
                {shaderLocation: 0, offset: 0, format: 'float32x4'}, // Position
                {shaderLocation: 1, offset: 16, format: 'float32x4'}, // Color
              ],
            },
          ] as const satisfies Iterable<GPUVertexBufferLayout>,
        },
        fragment: {
          module: shaderModule,
          entryPoint: 'fragment_main',
          targets: [
            {format: gpuPreferredCanvasFormat},
          ] as const satisfies Iterable<GPUColorTargetState>,
        },
      });

      const commandEncoder = device.createCommandEncoder();
      const passEncoder = commandEncoder.beginRenderPass({
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
      passEncoder.draw(3);
      passEncoder.end();

      device.queue.submit([commandEncoder.finish()]);
    };

    void run();
  }, []);

  return <canvas ref={canvasRef} className='absolute h-full w-full' />;
}

const showAlert = (message: string): void => {
  alert(message); // eslint-disable-line no-alert
};
