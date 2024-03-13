import clsx from 'clsx';

type WebGPUSupportStatusProps = {
  readonly supported: boolean | undefined;
};

export function WebGPUSupportStatus({supported}: WebGPUSupportStatusProps) {
  let className = clsx('text-sm');
  let text = '';

  if (supported === undefined) {
    className = clsx(className, 'text-zinc-500');
    text = 'Calculating WebGPU support status...';
  }

  if (supported === true) {
    className = clsx(className, 'text-green-500');
    text = 'WebGPU supported';
  }

  if (supported === false) {
    className = clsx(className, 'text-red-500');
    text = 'WebGPU is not supported';
  }

  return <p className={className}>{text}</p>;
}
