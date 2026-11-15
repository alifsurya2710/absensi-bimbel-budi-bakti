import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import MobileSplashScreen from '@/components/MobileSplashScreen';

export const metadata: Metadata = {
  title: 'FORSIREMIS - Absensi',
  description: 'Sistem Informasi Absensi FORSIREMIS - Bimbingan Latihan Persiapan Menuju PTN',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo-forsiremis.png',
    shortcut: '/logo-forsiremis.png',
    apple: '/logo-forsiremis.png',
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
