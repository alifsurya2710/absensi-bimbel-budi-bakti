import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import MobileSplashScreen from '@/components/MobileSplashScreen';

export const metadata: Metadata = {
  title: 'Absensi Bimbel BUDI BAKTI',
  description: 'Sistem Informasi Presensi & Akademik Bimbel BUDI BAKTI',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <SessionProvider>
          <MobileSplashScreen />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}