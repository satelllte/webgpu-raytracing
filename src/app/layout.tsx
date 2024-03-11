import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WebGPU raytracer',
  description: 'WebGPU based raytracer, which follows "Ray Tracing in One Weekend" series',
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <head>
        <link rel='preconnect' href='https://rsms.me/' />
        <link rel='stylesheet' href='https://rsms.me/inter/inter.css' />
      </head>
      <body className='bg-black text-white'>{children}</body>
    </html>
  );
}
