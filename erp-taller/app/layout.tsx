import type { Metadata } from 'next';
import { Inter, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

import { siteConfig } from '@/lib/config';
import { AppLayout } from '@/components/layout/AppLayout';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { LoadingProvider } from '@/components/providers/LoadingProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Configuración de las fuentes de Google
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const hankenGrotesk = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-headline' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-label' });

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'DuhviaERP_Super_Secret_JWT_Key!');

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  let permisos: string[] = [];

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      user = { 
        id: payload.usuarioId as string, 
        rolId: payload.rolId as string,
        rolNombre: payload.rolNombre as string || 'Usuario',
        nombre: payload.nombre as string || 'Usuario' 
      };
      permisos = (payload.permisos as string[]) || [];
    } catch (e) {
      // Token inválido o expirado
    }
  }

  return (
    <html lang="es" className={`${inter.variable} ${hankenGrotesk.variable} ${jetBrainsMono.variable}`}>
      <body className="font-body antialiased transition-colors duration-300 flex min-h-screen bg-transparent">
        <ToastProvider>
          <LoadingProvider>
            <AuthProvider user={user} permisos={permisos}>
              <AppLayout>
                {children}
              </AppLayout>
            </AuthProvider>
          </LoadingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
