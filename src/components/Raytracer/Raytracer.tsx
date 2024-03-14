'use client';
import {useEffect, useRef, useState} from 'react';
import {useEffectEvent} from './useEffectEvent';
import {useWebGPUSupport} from './useWebGPUSupport';
import {Button} from './Button';
import {Canvas} from './Canvas';
import {Renderer, type Material, type Sphere} from './Renderer';
import {StatFPS} from './StatFPS';
import {StatWebGPUSupport} from './StatWebGPUSupport';

export function Raytracer() {
  const webGPUSupported = useWebGPUSupport();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRendererRef(canvasRef);
  const frameTimeMsRef = useRef<number | undefined>();

  const [running, setRunning] = useState<boolean>(false);

  useFrame(running, ({timeMs, deltaTimeMs}) => {
    frameTimeMsRef.current = deltaTimeMs;

    const renderer = rendererRef.current;
    if (!renderer) throw new Error('renderer ref is not set');

    renderer.setMaterials(getFrameMaterials());
    renderer.setSpheres(getFrameSpheres(timeMs));
    renderer.draw();
  });

  const toggleRun = () => {
    setRunning((running) => !running);
  };

  return (
    <div className='absolute inset-0 flex flex-col sm:flex-row'>
      <div className='flex flex-1 flex-col gap-2 p-4 sm:max-w-xs'>
        <div className='flex flex-1 flex-col gap-2'>
          <h1 className='text-2xl underline'>WebGPU raytracer</h1>
          <StatWebGPUSupport supported={webGPUSupported} />
          <StatFPS running={running} frameTimeMsRef={frameTimeMsRef} />
        </div>
        <Button disabled={!webGPUSupported} onClick={toggleRun}>
          {running ? 'Stop' : 'Run'}
        </Button>
      </div>
      <div className='relative flex-1 border-zinc-500 max-sm:border-t sm:border-l'>
        <Canvas ref={canvasRef} />
      </div>
    </div>
  );
}

const getFrameMaterials = (): Material[] => [
  {color: [0.5, 0.1, 0.2]},
  {color: [0.1, 0.5, 0.2]},
  {color: [0.1, 0.2, 0.5]},
];

const getFrameSpheres = (timeMs: number): Sphere[] => [
  {
    materialIndex: 0,
    radius: 0.75 + 0.25 * Math.sin(timeMs * 0.0009),
    center: [-4.5, 0.5, -5.5],
  },
  {
    materialIndex: 1,
    radius: 0.75,
    center: [2.2, 0.0 + Math.sin(timeMs * 0.001), -4.0],
  },
  {
    materialIndex: 2,
    radius: 1.0,
    center: [
      0.3 + 3.0 * Math.sin(timeMs * 0.00025),
      0.0 + Math.sin(timeMs * 0.0011),
      -9.0,
    ],
  },
];

const useRendererRef = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const rendererRef = useRef<Renderer>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas ref is not set');

    rendererRef.current = new Renderer();
    void rendererRef.current.init(canvas);

    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = undefined;
    };
  }, [canvasRef]);

  return rendererRef;
};

const useFrame = (
  running: boolean,
  callback: (frameData: {timeMs: number; deltaTimeMs: number}) => void,
): void => {
  const innerCallback = useEffectEvent(callback);

  useEffect(() => {
    if (!running) return;

    let frameId: number;
    let prevTimeMs = performance.now();
    const drawLoop: FrameRequestCallback = (timeMs) => {
      const deltaTimeMs = timeMs - prevTimeMs;
      prevTimeMs = timeMs;
      innerCallback({timeMs, deltaTimeMs});
      frameId = requestAnimationFrame(drawLoop);
    };

    frameId = requestAnimationFrame(drawLoop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [running, innerCallback]);
};
