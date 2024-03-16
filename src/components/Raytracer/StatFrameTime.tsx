import {useEffect, useState} from 'react';
import {Stat} from './Stat';

export function StatFrameTime({
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
    return <Stat variant='muted'>Frame time: -</Stat>;
  }

  return (
    <Stat variant='neutral'>{`Frame time: ${frameTimeMs.toFixed(1)}ms`}</Stat>
  );
}
