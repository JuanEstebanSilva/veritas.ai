import { consultar } from '../config/database';

export interface Laboratorio {
  id: number;
  numero: string;
  piso: string;
  activo?: boolean;
}

/**
 * Veritas AI — Servicio de Laboratorios y Nodos de Cómputo e Inferencia
 * Migrado a persistencia PostgreSQL / Supabase
 */
export const obtenerLaboratorios = async (): Promise<Laboratorio[]> => {
  const query = `
    SELECT
      id,
      numero,
      piso,
      activo
    FROM laboratorios
    ORDER BY id ASC
  `;
  const res = await consultar(query);
  return res.rows;
};

export const obtenerLaboratorioPorId = async (
  id: number | string
): Promise<Laboratorio | undefined> => {
  const query = `
    SELECT
      id,
      numero,
      piso,
      activo
    FROM laboratorios
    WHERE id = $1
    LIMIT 1
  `;
  const res = await consultar(query, [Number(id)]);
  return res.rows[0] || undefined;
};

export default {
  obtenerLaboratorios,
  obtenerLaboratorioPorId,
  // Alias de compatibilidad
  obtenerConsultorios: obtenerLaboratorios,
  obtenerConsultorioPorId: obtenerLaboratorioPorId,
};
