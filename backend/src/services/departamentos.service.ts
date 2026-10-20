import { consultar } from '../config/database';

export interface Departamento {
  id: number;
  nombre: string;
  descripcion: string;
  activo?: boolean;
}

/**
 * Veritas AI — Servicio de Departamentos y Facultades Académicas
 * Migrado a persistencia PostgreSQL / Supabase
 */
export const obtenerDepartamentos = async (): Promise<Departamento[]> => {
  const query = `
    SELECT
      id,
      nombre,
      descripcion,
      activo
    FROM departamentos
    ORDER BY id ASC
  `;
  const res = await consultar(query);
  return res.rows;
};

export const obtenerDepartamentoPorId = async (
  id: number | string
): Promise<Departamento | undefined> => {
  const query = `
    SELECT
      id,
      nombre,
      descripcion,
      activo
    FROM departamentos
    WHERE id = $1
    LIMIT 1
  `;
  const res = await consultar(query, [Number(id)]);
  return res.rows[0] || undefined;
};

export default {
  obtenerDepartamentos,
  obtenerDepartamentoPorId,
  // Alias de compatibilidad
  obtenerEspecialidades: obtenerDepartamentos,
  obtenerEspecialidadPorId: obtenerDepartamentoPorId,
};
