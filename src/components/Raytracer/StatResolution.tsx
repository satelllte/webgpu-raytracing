import {useEffect, useState} from 'react';
import {Stat} from './Stat';

export function StatResolution({
  canvasRef,
}: {
  readonly canvasRef: React.RefObject<React.ElementRef<'canvas'>>;
}) {
  const [resolution, setResolution] = useState<[number, number] | undefined>();

  useEffect(() => {
    const intervalId = setInterval(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setResolution([canvas.width, canvas.height]);
    }, 200);

    return () => {
      clearInterval(intervalId);
    };
  }, [canvasRef]);

  if (!resolution) {
    return <Stat variant='muted'>Resolution: -</Stat>;
  }

  return (
    <Stat variant='neutral'>{`Resolution: ${resolution[0]}x${resolution[1]}`}</Stat>
  );
}
