import crypto from 'crypto';

/**
 * Utilidades criptográficas para Veritas AI (Laboratorio / Bloque 11)
 * Hashing SHA-256 para tokens temporales y códigos de respaldo de un solo uso.
 */

// ========================================
// Generar hash SHA-256
// ========================================
export const generarHash = (valor: string): string => {
  return crypto.createHash('sha256').update(valor, 'utf8').digest('hex');
};

// ========================================
// Comparación segura en tiempo constante
// ========================================
export const compararSeguro = (valorA: string, valorB: string): boolean => {
  const bufferA = Buffer.from(valorA, 'utf8');
  const bufferB = Buffer.from(valorB, 'utf8');

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
};

export default {
  generarHash,
  compararSeguro,
};
