import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/providers/ReduxProvider';

export const metadata: Metadata = {
  title: 'Airline Logistics',
  description: 'Airline logistics management platform',
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
