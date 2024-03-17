import {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';

type NativeCanvasProps = React.ComponentProps<'canvas'>;
type NativeCanvasPropsToExtend = Omit<
  NativeCanvasProps,
  'className' | 'children'
>;
type CanvasProps = NativeCanvasPropsToExtend & {
  readonly resolutionScale: number;
};

export const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
  ({resolutionScale, ...rest}, forwardedRef) => {
    const innerRef = useRef<React.ElementRef<'canvas'>>(null);

    useImperativeHandle(forwardedRef, () => {
      if (!innerRef.current) throw new Error('innerRef is not set');
      return innerRef.current;
    });

    useEffect(() => {
      const canvas = innerRef.current;
      if (!canvas) return;

      const resizeCanvas = () => {
        const {width, height} = canvas.getBoundingClientRect();
        const scale = Math.max(window.devicePixelRatio, 1) * resolutionScale;
        canvas.width = Math.floor(width * scale);
        canvas.height = Math.floor(height * scale);
      };

      resizeCanvas();

      // Using some hook like `useElementSize` based on ResizeObserver API would be actually better
      // instead of listening for window resize.
      // But it's still just fine for our particular use case.
      window.addEventListener('resize', resizeCanvas);

      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }, [resolutionScale]);

    return (
      <canvas ref={innerRef} className='absolute h-full w-full' {...rest}>
        HTML canvas is not supported in this browser
      </canvas>
    );
  },
);
