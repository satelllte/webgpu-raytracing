type ButtonProps = {
  readonly onClick: () => void;
  readonly children: string;
};

export function Button(props: ButtonProps) {
  return (
    <button
      type='button'
      className='border px-4 py-1 hover:bg-zinc-900 active:bg-zinc-800'
      {...props}
    />
  );
}
