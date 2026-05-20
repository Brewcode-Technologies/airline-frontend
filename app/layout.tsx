import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/providers/ReduxProvider';

export const metadata: Metadata = {
  title: 'Airport Relief Logistics',
  description: 'When Disruptions Hit, Relief Takes Off',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
