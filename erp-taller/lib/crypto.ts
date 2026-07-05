import crypto from 'crypto';

// Algoritmo estándar de grado militar
const ALGORITHM = 'aes-256-gcm';

// IMPORTANTE: Esta llave debe tener exactamente 32 caracteres (256 bits).
// En producción, esto se lee desde process.env.ENCRYPTION_KEY
const SECRET_KEY = Buffer.from(
  process.env.ENCRYPTION_KEY || 'DuhviaERP_Secreta_32_Caracteres!' 
);

/**
 * Cifra un texto y devuelve una cadena que incluye el Vector de Inicialización (IV)
 * y el Auth Tag para garantizar que nadie alteró el texto cifrado.
 */
export function cifrarTexto(texto: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  
  let encrypted = cipher.update(texto, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Guardamos todo junto separado por dos puntos (:)
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Descifra el texto previamente encriptado.
 */
export function descifrarTexto(textoCifrado: string): string {
  const [ivHex, authTagHex, encryptedHex] = textoCifrado.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Genera el Índice Ciego (Blind Index) usando SHA-256.
 * Convierte a minúsculas y quita espacios para que " Motor " y "motor" generen el mismo hash.
 */
export function generarIndiceCiego(texto: string): string {
  return crypto
    .createHash('sha256')
    .update(texto.toLowerCase().trim())
    .digest('hex');
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}