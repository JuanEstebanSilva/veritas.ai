import { prisma } from '../config/prisma';

/**
 * Servicio de Integridad Referencial (Lab 5 — BLOQUE 1)
 *
 * Equivalente lógico de:
 *   FOREIGN KEY (...) REFERENCES ... ON DELETE RESTRICT
 *
 * Centraliza las preguntas "¿este recurso tiene registros dependientes?" que
 * los controladores deben hacer ANTES de ejecutar un DELETE, para no dejar
 * registros huérfanos en el sistema.
 *
 * Mapa de relaciones de Plagelio:
 *   User  1—N  Analysis   -> RESTRICT (un análisis es un informe histórico del usuario)
 *   User  1—N  Payment    -> RESTRICT (un pago es un registro financiero histórico)
 *   Analysis 1—N AnalysisResult / AnalysisSource -> CASCADE (composición: no existen sin su análisis)
 */

/** ¿Existen análisis asociados a este usuario? (incluye los ya archivados) */
export const usuarioTieneAnalisis = async (usuarioId: string): Promise<boolean> => {
  const encontrado = await prisma.analysis.findFirst({
    where: { user_id: usuarioId },
    select: { id: true },
  });
  return encontrado !== null;
};

/** ¿Existen pagos asociados a este usuario? (incluye PENDING, FAILED y COMPLETED) */
export const usuarioTienePagos = async (usuarioId: string): Promise<boolean> => {
  const encontrado = await prisma.payment.findFirst({
    where: { user_id: usuarioId },
    select: { id: true },
  });
  return encontrado !== null;
};

/**
 * Conteo de dependencias de un usuario, para poder explicar en la respuesta
 * 409 exactamente qué impide la eliminación.
 */
export const contarDependenciasUsuario = async (usuarioId: string) => {
  const [analisis, pagos] = await Promise.all([
    prisma.analysis.count({ where: { user_id: usuarioId } }),
    prisma.payment.count({ where: { user_id: usuarioId } }),
  ]);
  return { analisis, pagos, tieneDependencias: analisis > 0 || pagos > 0 };
};
