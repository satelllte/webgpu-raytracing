import clsx from 'clsx';
import {forwardRef} from 'react';

type NativeButtonProps = React.ComponentProps<'button'>;
type NativeButtonPropsToExtend = Omit<
  NativeButtonProps,
  'type' | 'className' | 'children'
>;
type ButtonProps = NativeButtonPropsToExtend & {
  readonly children: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({disabled, ...rest}, forwardedRef) => (
    <button
      ref={forwardedRef}
      type='button'
      className={clsx(
        'border px-4 py-1 hover:bg-zinc-900 active:bg-zinc-800',
        disabled && 'opacity-50',
      )}
      disabled={disabled}
      {...rest}
    />
  ),
);
