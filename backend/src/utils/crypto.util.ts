import crypto from 'crypto';

/**
 * Utilidades criptográficas para Veritas AI (Fase 2 del Plan de Seguridad)
 * Hashing SHA-256 para tokens temporales y generación de códigos de respaldo XXXX-XXXX.
 */

// ========================================
// Generar token seguro de 32 bytes (64 caracteres hex)
// ========================================
export const generarTokenAleatorio = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// ========================================
// Hash SHA-256 para guardar en base de datos
// ========================================
export const generarHash = (valor: string): string => {
  return crypto.createHash('sha256').update(valor, 'utf8').digest('hex');
};

export const sha256Hex = (texto: string): string => {
  return generarHash(texto);
};

// ========================================
// Generar lote de códigos de respaldo en formato XXXX-XXXX
// ========================================
export const generarLoteCodigos = (cantidad: number = 8): string[] => {
  const caracteres = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Caracteres sin confusión visual (sin 0, O, 1, I, L)
  const codigos: string[] = [];
  for (let i = 0; i < cantidad; i++) {
    const bytes = crypto.randomBytes(8);
    let codigo = '';
    for (let j = 0; j < 8; j++) {
      codigo += caracteres[bytes[j] % caracteres.length];
      if (j === 3) codigo += '-';
    }
    codigos.push(codigo);
  }
  return codigos;
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
  generarTokenAleatorio,
  generarHash,
  sha256Hex,
  generarLoteCodigos,
  compararSeguro,
};
