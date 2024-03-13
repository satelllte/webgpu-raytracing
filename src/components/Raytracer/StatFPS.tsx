import {Stat} from './Stat';

export function StatFPS({
  frameTimeMs,
}: {
  readonly frameTimeMs: number | undefined;
}) {
  if (frameTimeMs === undefined) {
    return <Stat variant='muted'>FPS: -</Stat>;
  }

  return (
    <Stat variant='neutral'>{`FPS: ${Math.ceil(1000 / frameTimeMs)}`}</Stat>
  );
}
