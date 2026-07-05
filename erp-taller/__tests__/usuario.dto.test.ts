import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { CrearUsuarioSchema } from '@/modules/usuarios/usuario.dto';

describe('Usuario DTO', () => {
  const validData = {
    nombre: 'Juan Perez',
    email: 'juan@test.com',
    password: 'Password123!',
    rolId: '123e4567-e89b-12d3-a456-426614174000'
  };

  it('debe rechazar correos inválidos', () => {
    const invalid = { ...validData, email: 'correo-sin-arroba' };
    expect(() => CrearUsuarioSchema.parse(invalid)).toThrow();
  });

  it('debe rechazar passwords cortos', () => {
    const invalid = { ...validData, password: 'corto' };
    expect(() => CrearUsuarioSchema.parse(invalid)).toThrow();
  });

  it('debe rechazar roles con UUID malformados', () => {
    const invalid = { ...validData, rolId: 'no-uuid' };
    expect(() => CrearUsuarioSchema.parse(invalid)).toThrow();
  });
});
