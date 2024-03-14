import {useEffect, useState} from 'react';
import {Stat} from './Stat';

export function StatFPS({
  running,
  frameTimeMsRef,
}: {
  readonly running: boolean;
  readonly frameTimeMsRef: React.MutableRefObject<number | undefined>;
}) {
  const [frameTimeMs, setFrameTimeMs] = useState<number | undefined>();

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFrameTimeMs(frameTimeMsRef.current);
    }, 200);

    return () => {
      clearInterval(intervalId);
    };
  }, [frameTimeMsRef]);

  if (!running || frameTimeMs === undefined) {
    return <Stat variant='muted'>FPS: -</Stat>;
  }

  return (
    <Stat variant='neutral'>{`FPS: ${Math.ceil(1000 / frameTimeMs)}`}</Stat>
  );
}
