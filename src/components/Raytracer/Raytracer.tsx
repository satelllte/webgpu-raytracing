'use client';
import {useEffect, useRef, useState} from 'react';
import {useEffectEvent} from './useEffectEvent';
import {useWebGPUSupport} from './useWebGPUSupport';
import {Button} from './Button';
import {Canvas} from './Canvas';
import {Renderer} from './Renderer';
import {StatResolution} from './StatResolution';
import {StatsPerformance} from './StatsPerformance';
import {StatWebGPUSupport} from './StatWebGPUSupport';
import {Controls, type Variables} from './Controls';

export function Raytracer() {
  const webGPUSupported = useWebGPUSupport();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRendererRef(canvasRef);
  const variablesRef = useRef<Variables>();
  const frameTimeMsRef = useRef<number | undefined>();

  const [running, setRunning] = useState<boolean>(false);

  useFrame(running, ({timeMs, deltaTimeMs}) => {
    frameTimeMsRef.current = deltaTimeMs;

    const renderer = rendererRef.current;
    if (!renderer) throw new Error('renderer ref is not set');

    const variables = variablesRef.current;
    if (!variables) throw new Error('variables ref is not set');

    const {settings, light, skyColor, materials, spheres} = variables;
    renderer.setSettings({
      ...settings,
      seed: settings.seedAuto ? timeMs : settings.seed,
    });
    renderer.setLight(light);
    renderer.setSkyColor(skyColor);
    renderer.setMaterials(materials);
    renderer.setSpheres(spheres);
    renderer.draw();
  });

  const toggleRun = () => {
    setRunning((running) => !running);
  };

  return (
    <div className='absolute inset-0 flex flex-row'>
      <Canvas ref={canvasRef} />
      <Controls variablesRef={variablesRef} />
      <div className='relative flex max-w-xs flex-1 flex-col gap-2 bg-black/50 p-4'>
        <div className='flex flex-1 flex-col gap-2'>
          <h1 className='text-2xl underline'>WebGPU raytracer</h1>
          <StatWebGPUSupport supported={webGPUSupported} />
          <StatResolution canvasRef={canvasRef} />
          <StatsPerformance running={running} frameTimeMsRef={frameTimeMsRef} />
        </div>
        <Button disabled={!webGPUSupported} onClick={toggleRun}>
          {running ? 'Stop' : 'Run'}
        </Button>
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
