import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsuarioService } from '@/modules/usuarios/usuario.service';
import { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    usuario: { create: vi.fn(), findUnique: vi.fn() }
  };
  return { PrismaClient: class { constructor() { return mPrismaClient; } } };
});

describe('UsuarioService', () => {
  let prismaMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock = new PrismaClient();
  });

  it('debe crear un usuario asegurando que el password plano NO llegue a Prisma', async () => {
    const dto = { nombre: 'Test', email: 'test@t.com', password: 'PlanoPassword', rolId: 'uuid-rol' };
    prismaMock.usuario.create.mockResolvedValue({ id: 'uuid-user' });

    await UsuarioService.crear(dto);

    expect(prismaMock.usuario.create).toHaveBeenCalledTimes(1);
    const args = prismaMock.usuario.create.mock.calls[0][0];
    
    expect(args.data.password).toBeUndefined();
    expect(args.data.passwordHash).toBeDefined();
    expect(args.data.salt).toBeDefined();
  });

  it('debe manejar error Unique Constraint por email duplicado', async () => {
    prismaMock.usuario.create.mockRejectedValue(new Error('Unique Constraint (P2002)'));
    
    await expect(UsuarioService.crear({ nombre: 'X', email: 'x@x.com', password: 'X12345678', rolId: 'x' }))
      .rejects.toThrow('Unique Constraint (P2002)');
  });
});
