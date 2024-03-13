import {Stat} from './Stat';

export function StatWebGPUSupport({
  supported,
}: {
  readonly supported: boolean | undefined;
}) {
  if (supported === true) {
    return <Stat variant='positive'>WebGPU supported</Stat>;
  }

  if (supported === false) {
    return <Stat variant='negative'>WebGPU is not supported</Stat>;
  }

  return <Stat variant='muted'>Calculating WebGPU support status...</Stat>;
}
