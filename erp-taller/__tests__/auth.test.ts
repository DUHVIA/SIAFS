import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '@/modules/auth/auth.service';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/crypto';

vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    usuario: { findUnique: vi.fn() }
  };
  return { PrismaClient: class { constructor() { return mPrismaClient; } } };
});

describe('AuthService', () => {
  let prismaMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock = new PrismaClient();
  });

  it('login debe rechazar si la contraseña es incorrecta', async () => {
    const { salt, hash } = hashPassword('MiPass123');

    prismaMock.usuario.findUnique.mockResolvedValue({
      id: 'uuid-user',
      isActive: true,
      accesoSistema: true,
      salt: salt,
      passwordHash: hash,
      rolId: 'uuid-rol',
      rol: { permisos: [] },
      permisos: []
    });

    await expect(AuthService.login('test@test.com', 'PassINCORRECTA')).rejects.toThrow('Credenciales inválidas');
  });
});
