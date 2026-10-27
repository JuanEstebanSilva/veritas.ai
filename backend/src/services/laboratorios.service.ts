import { consultar } from '../config/database';

export interface Laboratorio {
  id: number;
  numero: string;
  piso: string;
  activo?: boolean;
  // Aliases de compatibilidad
  codigo?: string;
  nombre?: string;
  ubicacion?: string;
}

export interface DatosLaboratorio {
  numero?: string;
  codigo?: string;
  nombre?: string;
  piso: string | number;
  ubicacion?: string;
  activo?: boolean;
}

const mapearLaboratorio = (row: any): Laboratorio => {
  return {
    id: Number(row.id),
    numero: row.numero,
    codigo: row.numero,
    nombre: `Laboratorio ${row.numero}`,
    piso: String(row.piso),
    ubicacion: String(row.piso),
    activo: Boolean(row.activo),
  };
};

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
  return res.rows.map(mapearLaboratorio);
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
  if (res.rows.length === 0) return undefined;
  return mapearLaboratorio(res.rows[0]);
};

export const crearLaboratorio = async (
  datos: DatosLaboratorio
): Promise<Laboratorio> => {
  const num = (datos.numero || datos.codigo || datos.nombre || `LAB-${Date.now()}`).trim();
  const pisoVal = String(datos.piso || datos.ubicacion || 'Piso 1').trim();
  const activo = datos.activo !== undefined ? Boolean(datos.activo) : true;

  const query = `
    INSERT INTO laboratorios (numero, piso, activo)
    VALUES ($1, $2, $3)
    RETURNING id, numero, piso, activo
  `;
  const res = await consultar(query, [num, pisoVal, activo]);
  return mapearLaboratorio(res.rows[0]);
};

export const actualizarLaboratorio = async (
  id: number | string,
  datos: Partial<DatosLaboratorio>
): Promise<Laboratorio | null> => {
  const actual = await obtenerLaboratorioPorId(id);
  if (!actual) return null;

  const num = (datos.numero || datos.codigo || datos.nombre || actual.numero).trim();
  const pisoVal = String(
    datos.piso !== undefined ? datos.piso : datos.ubicacion !== undefined ? datos.ubicacion : actual.piso
  ).trim();
  const activo = datos.activo !== undefined ? Boolean(datos.activo) : actual.activo;

  const query = `
    UPDATE laboratorios
    SET numero = $1, piso = $2, activo = $3
    WHERE id = $4
    RETURNING id, numero, piso, activo
  `;
  const res = await consultar(query, [num, pisoVal, activo, Number(id)]);
  return mapearLaboratorio(res.rows[0]);
};

export const eliminarLaboratorio = async (
  id: number | string
): Promise<{ eliminado: boolean; tieneRevisiones?: boolean }> => {
  const labId = Number(id);
  // Verificar si tiene revisiones o citas asociadas
  const check = await consultar('SELECT COUNT(*) as count FROM revisiones WHERE laboratorio_id = $1', [labId]);
  if (parseInt(check.rows[0]?.count || '0', 10) > 0) {
    return { eliminado: false, tieneRevisiones: true };
  }

  const res = await consultar('DELETE FROM laboratorios WHERE id = $1 RETURNING id', [labId]);
  return { eliminado: res.rows.length > 0 };
};

export default {
  obtenerLaboratorios,
  obtenerLaboratorioPorId,
  crearLaboratorio,
  actualizarLaboratorio,
  actualizarLaboratorioParcial: actualizarLaboratorio,
  eliminarLaboratorio,
  // Alias de compatibilidad (Consultorios - Rúbrica Hospitalaria)
  obtenerConsultorios: obtenerLaboratorios,
  obtenerConsultorioPorId: obtenerLaboratorioPorId,
  crearConsultorio: crearLaboratorio,
  actualizarConsultorio: actualizarLaboratorio,
  eliminarConsultorio: eliminarLaboratorio,
};
