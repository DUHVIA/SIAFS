import { descifrarTexto } from '../lib/crypto';

/**
 * Script para descifrar rápidamente una cadena desde la terminal
 * 
 * Uso:
 *   npx tsx scripts/decrypt-text.ts "ivHex:authTagHex:encryptedHex"
 */

function main() {
  const ciphertext = process.argv[2];

  if (!ciphertext) {
    console.log(`
Uso:
  npx tsx scripts/decrypt-text.ts "<cadena_cifrada>"

Ejemplo:
  npx tsx scripts/decrypt-text.ts "a1b2...:c3d4...:e5f6..."
    `);
    process.exit(1);
  }

  try {
    const textoPlano = descifrarTexto(ciphertext);
    console.log('\n======================================================');
    console.log('🔓 TEXTO DESCIFRADO:');
    console.log(textoPlano);
    console.log('======================================================\n');
  } catch (error: any) {
    console.error('\n❌ ERROR AL DESCIFRAR:');
    console.error(error?.message || error);
    console.error('\nCausas probables:');
    console.error(' 1. La clave ENCRYPTION_KEY en .env no coincide con la llave con la que fue cifrado.');
    console.error(' 2. El texto en la base de datos se alteró o truncó.');
    console.error(' 3. El formato de la cadena no contiene las 3 partes (iv:tag:ciphertext).\n');
  }
}

main();
