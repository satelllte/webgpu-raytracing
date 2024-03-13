'use client';
import {useEffect, useRef, useState} from 'react';
import {useWebGPUSupport} from './useWebGPUSupport';
import {Button} from './Button';
import {Canvas} from './Canvas';
import {Renderer} from './Renderer';
import {StatFPS} from './StatFPS';
import {StatWebGPUSupport} from './StatWebGPUSupport';

export function Raytracer() {
  const webGPUSupported = useWebGPUSupport();

  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  }, []);

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

  const run = () => {
    if (running) return;
    setRunning(true);

    const renderer = rendererRef.current;
    if (!renderer) throw new Error('Renderer is not set');

    let prevTime = performance.now();
    const drawLoop: FrameRequestCallback = (time) => {
      lastFrameTimeMsRef.current = time - prevTime;
      prevTime = time;

      animationFrameIdRef.current = requestAnimationFrame(drawLoop);
      renderer.draw();
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
