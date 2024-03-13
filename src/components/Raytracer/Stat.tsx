import clsx from 'clsx';

type StatProps = {
  readonly children: string;
  readonly variant?: 'neutral' | 'negative' | 'positive' | 'muted';
};

export function Stat({children, variant = 'neutral'}: StatProps) {
  return (
    <p
      className={clsx(
        'text-sm',
        variant === 'neutral' && 'text-white',
        variant === 'positive' && 'text-green-500',
        variant === 'negative' && 'text-red-500',
        variant === 'muted' && 'text-zinc-500',
      )}
    >
      {children}
    </p>
  );
}
