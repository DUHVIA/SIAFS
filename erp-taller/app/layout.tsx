import type { Metadata } from 'next';
import { Inter, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

import { siteConfig } from '@/lib/config';
import { AppLayout } from '@/components/layout/AppLayout';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { LoadingProvider } from '@/components/providers/LoadingProvider';

// Configuración de las fuentes de Google
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const hankenGrotesk = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-headline' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-label' });

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${hankenGrotesk.variable} ${jetBrainsMono.variable}`}>
      <body className="font-body antialiased transition-colors duration-300 flex min-h-screen bg-transparent">
        <ToastProvider>
          <LoadingProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </LoadingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
