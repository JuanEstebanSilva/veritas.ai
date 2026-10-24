import { consultar } from '../config/database';

export interface Departamento {
  id: number;
  nombre: string;
  descripcion: string;
  activo?: boolean;
}

export interface DatosDepartamento {
  nombre: string;
  descripcion: string;
  activo?: boolean;
}

/**
 * Veritas AI — Servicio de Departamentos y Facultades Académicas (Especialidades)
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

export const obtenerDepartamentoPorNombre = async (
  nombre: string
): Promise<Departamento | undefined> => {
  const query = `
    SELECT id, nombre, descripcion, activo
    FROM departamentos
    WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))
    LIMIT 1
  `;
  const res = await consultar(query, [nombre]);
  return res.rows[0] || undefined;
};

export const crearDepartamento = async (
  datos: DatosDepartamento
): Promise<Departamento> => {
  const existente = await obtenerDepartamentoPorNombre(datos.nombre);
  if (existente) {
    const error: any = new Error('Ya existe un departamento con ese nombre.');
    error.code = '23505';
    throw error;
  }

  const activo = datos.activo !== undefined ? Boolean(datos.activo) : true;
  const query = `
    INSERT INTO departamentos (nombre, descripcion, activo)
    VALUES ($1, $2, $3)
    RETURNING id, nombre, descripcion, activo
  `;
  const res = await consultar(query, [
    datos.nombre.trim(),
    datos.descripcion.trim(),
    activo,
  ]);
  return res.rows[0];
};

export const actualizarDepartamento = async (
  id: number | string,
  datos: DatosDepartamento
): Promise<Departamento | null> => {
  const depActual = await obtenerDepartamentoPorId(id);
  if (!depActual) return null;

  const activo = datos.activo !== undefined ? Boolean(datos.activo) : depActual.activo;
  const query = `
    UPDATE departamentos
    SET
      nombre = $2,
      descripcion = $3,
      activo = $4
    WHERE id = $1
    RETURNING id, nombre, descripcion, activo
  `;
  const res = await consultar(query, [
    Number(id),
    datos.nombre.trim(),
    datos.descripcion.trim(),
    activo,
  ]);
  return res.rows[0] || null;
};

export const actualizarDepartamentoParcial = async (
  id: number | string,
  datos: Partial<DatosDepartamento>
): Promise<Departamento | null> => {
  const depActual = await obtenerDepartamentoPorId(id);
  if (!depActual) return null;

  const nombre = datos.nombre !== undefined ? datos.nombre.trim() : depActual.nombre;
  const descripcion = datos.descripcion !== undefined ? datos.descripcion.trim() : depActual.descripcion;
  const activo = datos.activo !== undefined ? Boolean(datos.activo) : depActual.activo;

  const query = `
    UPDATE departamentos
    SET
      nombre = $2,
      descripcion = $3,
      activo = $4
    WHERE id = $1
    RETURNING id, nombre, descripcion, activo
  `;
  const res = await consultar(query, [Number(id), nombre, descripcion, activo]);
  return res.rows[0] || null;
};

export const eliminarDepartamento = async (
  id: number | string
): Promise<{ eliminado: boolean; motivo?: string }> => {
  const numId = Number(id);

  // Verificar si hay docentes adscritos a este departamento (Integridad referencial)
  const checkDocentes = await consultar(
    'SELECT COUNT(*)::int AS count FROM docentes WHERE departamento_id = $1',
    [numId]
  );
  if (checkDocentes.rows[0]?.count > 0) {
    return {
      eliminado: false,
      motivo: `No se puede eliminar el departamento porque tiene ${checkDocentes.rows[0].count} docente(s) asociado(s).`,
    };
  }

  const res = await consultar(
    'DELETE FROM departamentos WHERE id = $1 RETURNING id',
    [numId]
  );

  return { eliminado: (res.rowCount ?? 0) > 0 };
};

export default {
  obtenerDepartamentos,
  obtenerDepartamentoPorId,
  crearDepartamento,
  actualizarDepartamento,
  actualizarDepartamentoParcial,
  eliminarDepartamento,
  // Aliases de compatibilidad (Especialidades - Rúbrica Hospitalaria)
  obtenerEspecialidades: obtenerDepartamentos,
  obtenerEspecialidadPorId: obtenerDepartamentoPorId,
  crearEspecialidad: crearDepartamento,
  actualizarEspecialidad: actualizarDepartamento,
  actualizarEspecialidadParcial: actualizarDepartamentoParcial,
  eliminarEspecialidad: eliminarDepartamento,
};
