import { describe, it, expect } from 'vitest';
import { cifrarTexto, descifrarTexto, generarIndiceCiego, hashPassword, verificarPassword } from '@/lib/crypto';

describe('Motor Criptográfico (@/lib/crypto.ts)', () => {
  it('cifrarTexto debe generar un string con formato IV:AuthTag:Encrypted', () => {
    const original = "Secreto123";
    const cifrado = cifrarTexto(original);
    
    expect(cifrado).toBeDefined();
    expect(typeof cifrado).toBe('string');
    
    const partes = cifrado.split(':');
    expect(partes.length).toBe(3); // IV, AuthTag, Encrypted
    expect(partes[0].length).toBe(24); // IV de 12 bytes en hex = 24 caracteres
    expect(partes[1].length).toBe(32); // Auth tag de 16 bytes = 32 caracteres
  });

  it('descifrarTexto debe retornar el texto original exacto', () => {
    const original = "Este es un mensaje súper secreto con símbolos: #@! y números 12345";
    const cifrado = cifrarTexto(original);
    
    // Asegurar que el cifrado es distinto al original
    expect(cifrado).not.toBe(original);
    
    const descifrado = descifrarTexto(cifrado);
    expect(descifrado).toBe(original);
  });

  it('generarIndiceCiego debe generar el mismo hash ignorando espacios extras y mayúsculas', () => {
    const hash1 = generarIndiceCiego(' Bujía ');
    const hash2 = generarIndiceCiego('bujía');
    const hash3 = generarIndiceCiego('BUJÍA  ');
    
    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });

  it('hashPassword y verificarPassword deben funcionar como un flujo de login inverso correcto', () => {
    const passwordOriginal = "MiSuperPasswordSeguro";
    
    // Simula creación (registro)
    const { salt, hash } = hashPassword(passwordOriginal);
    
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
    
    // Simula login correcto
    const loginValido = verificarPassword(passwordOriginal, salt, hash);
    expect(loginValido).toBe(true);
    
    // Simula login incorrecto
    const loginInvalido = verificarPassword("OtraPassword", salt, hash);
    expect(loginInvalido).toBe(false);
  });
});
