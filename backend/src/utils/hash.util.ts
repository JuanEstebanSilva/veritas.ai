import crypto from 'crypto';

/**
 * SHA-256 en hexadecimal (64 caracteres).
 *
 * Adecuado para API Keys porque son aleatorias y de alta entropía (32 bytes de
 * crypto.randomBytes): no hay diccionario posible contra 2^256 valores. Para
 * contraseñas elegidas por personas se usa bcrypt (ver passwordPolicy).
 */
export const generarHash = (valor: string): string =>
  crypto.createHash('sha256').update(valor, 'utf8').digest('hex');

/**
 * Comparación en tiempo constante. timingSafeEqual exige buffers del mismo
 * tamaño; como aquí siempre se comparan dos hashes SHA-256 (64 caracteres),
 * la comprobación de longitud no revela nada sobre la clave real.
 */
export const compararSeguro = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};
