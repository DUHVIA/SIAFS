import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LoginSchema } from '@/modules/auth/auth.dto';
import { AuthService } from '@/modules/auth/auth.service';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = LoginSchema.parse(json);
    
    const { token, usuario } = await AuthService.login(data.email, data.password);
    
    const response = NextResponse.json(usuario, { status: 200 });
    
    // Cookie HTTP-Only
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 12, // 12 hours
      path: '/',
    });
    
    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    if (error.message !== 'Credenciales inválidas o usuario inactivo') {
      console.error('Error en POST /api/auth/login:', error);
    }
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 401 });
  }
}
