'use client';
import {useEffect, useRef, useState} from 'react';
import {useEffectEvent} from './useEffectEvent';
import {useVariables} from './useVariables';
import {useWebGPUSupport} from './useWebGPUSupport';
import {Button} from './Button';
import {Canvas} from './Canvas';
import {Renderer} from './Renderer';
import {StatsPerformance} from './StatsPerformance';
import {StatWebGPUSupport} from './StatWebGPUSupport';

export function Raytracer() {
  const webGPUSupported = useWebGPUSupport();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRendererRef(canvasRef);
  const frameTimeMsRef = useRef<number | undefined>();

  const [running, setRunning] = useState<boolean>(false);

  const {light, materials, spheres} = useVariables();

  useFrame(running, ({timeMs, deltaTimeMs}) => {
    frameTimeMsRef.current = deltaTimeMs;

    const renderer = rendererRef.current;
    if (!renderer) throw new Error('renderer ref is not set');

    renderer.setLight(light);
    renderer.setMaterials(materials);
    renderer.setSpheres(spheres);
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
          <StatsPerformance running={running} frameTimeMsRef={frameTimeMsRef} />
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
