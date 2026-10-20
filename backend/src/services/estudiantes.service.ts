import { consultar } from '../config/database';
import { obtenerAliasesEmail, obtenerUsuarioPorId } from './usuarios.service';

export interface Estudiante {
  id: number;
  usuarioId: number | string | null;
  nombre: string;
  documento: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
}

export interface DatosEstudiante {
  nombre: string;
  documento: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  usuarioId?: number | string | null;
}

const sanitizarUsuarioId = (uId: any): string | null => {
  if (uId === undefined || uId === null) return null;
  const str = String(uId).trim();
  return str.length > 0 ? str : null;
};

const mapearEstudiante = (row: any): Estudiante => {
  return {
    id: Number(row.id),
    usuarioId: row.usuarioId !== null ? String(row.usuarioId) : null,
    nombre: row.nombre,
    documento: row.documento,
    email: row.email,
    telefono: row.telefono,
    fechaNacimiento: row.fechaNacimiento,
  };
};

/**
 * Veritas AI — Servicio de Estudiantes / Autores Académicos
 * Migrado a persistencia PostgreSQL / Supabase
 */
export const obtenerEstudiantes = async (): Promise<Estudiante[]> => {
  const query = `
    SELECT
      id,
      usuario_id AS "usuarioId",
      nombre,
      documento,
      email,
      telefono,
      TO_CHAR(fecha_nacimiento, 'YYYY-MM-DD') AS "fechaNacimiento"
    FROM estudiantes
    ORDER BY id ASC
  `;
  const res = await consultar(query);
  return res.rows.map(mapearEstudiante);
};

export const obtenerEstudiantePorId = async (
  id: number | string
): Promise<Estudiante | undefined> => {
  const query = `
    SELECT
      id,
      usuario_id AS "usuarioId",
      nombre,
      documento,
      email,
      telefono,
      TO_CHAR(fecha_nacimiento, 'YYYY-MM-DD') AS "fechaNacimiento"
    FROM estudiantes
    WHERE id = $1
    LIMIT 1
  `;
  const res = await consultar(query, [Number(id)]);
  if (res.rows.length === 0) return undefined;
  return mapearEstudiante(res.rows[0]);
};

export const obtenerEstudiantePorUsuarioId = async (
  usuarioId: number | string,
  email?: string
): Promise<Estudiante | undefined> => {
  const strId = String(usuarioId).trim();

  // 1. Coincidencia directa por usuario_id
  const queryDirecta = `
    SELECT
      id,
      usuario_id AS "usuarioId",
      nombre,
      documento,
      email,
      telefono,
      TO_CHAR(fecha_nacimiento, 'YYYY-MM-DD') AS "fechaNacimiento"
    FROM estudiantes
    WHERE usuario_id = $1
    LIMIT 1
  `;
  const resDirecta = await consultar(queryDirecta, [strId]);
  if (resDirecta.rows.length > 0) {
    return mapearEstudiante(resDirecta.rows[0]);
  }

  // 2. Coincidencia por correo y aliases
  let aliases: string[] = [];
  if (email) {
    aliases = obtenerAliasesEmail(email);
  } else {
    try {
      const u = await obtenerUsuarioPorId(strId);
      if (u && u.email) {
        aliases = obtenerAliasesEmail(u.email);
      }
    } catch {}
  }

  if (aliases.length > 0) {
    const queryEmail = `
      SELECT
        id,
        usuario_id AS "usuarioId",
        nombre,
        documento,
        email,
        telefono,
        TO_CHAR(fecha_nacimiento, 'YYYY-MM-DD') AS "fechaNacimiento"
      FROM estudiantes
      WHERE LOWER(TRIM(email)) = ANY($1::text[])
      LIMIT 1
    `;
    const resEmail = await consultar(queryEmail, [aliases]);
    if (resEmail.rows.length > 0) {
      const est = resEmail.rows[0];
      if (!est.usuarioId && strId) {
        try {
          await consultar('UPDATE estudiantes SET usuario_id = $1 WHERE id = $2', [strId, est.id]);
          est.usuarioId = strId;
        } catch {}
      }
      return mapearEstudiante(est);
    }
  }

  return undefined;
};

export const crearEstudiante = async (datos: DatosEstudiante): Promise<Estudiante> => {
  const uId = sanitizarUsuarioId(datos.usuarioId);

  const query = `
    INSERT INTO estudiantes (
      usuario_id,
      nombre,
      documento,
      email,
      telefono,
      fecha_nacimiento
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      usuario_id AS "usuarioId",
      nombre,
      documento,
      email,
      telefono,
      TO_CHAR(fecha_nacimiento, 'YYYY-MM-DD') AS "fechaNacimiento"
  `;
  const res = await consultar(query, [
    uId,
    datos.nombre.trim(),
    datos.documento.trim(),
    datos.email.toLowerCase().trim(),
    datos.telefono.trim(),
    datos.fechaNacimiento,
  ]);

  return mapearEstudiante(res.rows[0]);
};

export const actualizarEstudiante = async (
  id: number | string,
  datos: DatosEstudiante
): Promise<Estudiante | null> => {
  const actual = await obtenerEstudiantePorId(id);
  if (!actual) return null;

  const uId = datos.usuarioId !== undefined ? sanitizarUsuarioId(datos.usuarioId) : actual.usuarioId;

  const query = `
    UPDATE estudiantes
    SET
      nombre = $2,
      documento = $3,
      email = $4,
      telefono = $5,
      fecha_nacimiento = $6,
      usuario_id = $7
    WHERE id = $1
    RETURNING
      id,
      usuario_id AS "usuarioId",
      nombre,
      documento,
      email,
      telefono,
      TO_CHAR(fecha_nacimiento, 'YYYY-MM-DD') AS "fechaNacimiento"
  `;
  const res = await consultar(query, [
    Number(id),
    datos.nombre.trim(),
    datos.documento.trim(),
    datos.email.toLowerCase().trim(),
    datos.telefono.trim(),
    datos.fechaNacimiento,
    uId,
  ]);

  return mapearEstudiante(res.rows[0]);
};

export const actualizarEstudianteParcial = async (
  id: number | string,
  datos: Partial<DatosEstudiante>
): Promise<Estudiante | null> => {
  const actual = await obtenerEstudiantePorId(id);
  if (!actual) return null;

  const nombre = datos.nombre !== undefined ? datos.nombre.trim() : actual.nombre;
  const documento = datos.documento !== undefined ? datos.documento.trim() : actual.documento;
  const email = datos.email !== undefined ? datos.email.toLowerCase().trim() : actual.email;
  const telefono = datos.telefono !== undefined ? datos.telefono.trim() : actual.telefono;
  const fechaNacimiento = datos.fechaNacimiento !== undefined ? datos.fechaNacimiento : actual.fechaNacimiento;
  const uId = datos.usuarioId !== undefined ? sanitizarUsuarioId(datos.usuarioId) : actual.usuarioId;

  const query = `
    UPDATE estudiantes
    SET
      nombre = $2,
      documento = $3,
      email = $4,
      telefono = $5,
      fecha_nacimiento = $6,
      usuario_id = $7
    WHERE id = $1
    RETURNING
      id,
      usuario_id AS "usuarioId",
      nombre,
      documento,
      email,
      telefono,
      TO_CHAR(fecha_nacimiento, 'YYYY-MM-DD') AS "fechaNacimiento"
  `;
  const res = await consultar(query, [
    Number(id),
    nombre,
    documento,
    email,
    telefono,
    fechaNacimiento,
    uId,
  ]);

  return mapearEstudiante(res.rows[0]);
};

export const eliminarEstudiante = async (id: number | string): Promise<boolean> => {
  const query = `DELETE FROM estudiantes WHERE id = $1 RETURNING id`;
  const res = await consultar(query, [Number(id)]);
  return (res.rowCount ?? 0) > 0;
};

export default {
  obtenerEstudiantes,
  obtenerEstudiantePorId,
  obtenerEstudiantePorUsuarioId,
  crearEstudiante,
  actualizarEstudiante,
  actualizarEstudianteParcial,
  eliminarEstudiante,
  // Alias de compatibilidad
  obtenerPacientes: obtenerEstudiantes,
  obtenerPacientePorId: obtenerEstudiantePorId,
  obtenerPacientePorUsuarioId: obtenerEstudiantePorUsuarioId,
  crearPaciente: crearEstudiante,
  actualizarPaciente: actualizarEstudiante,
  actualizarPacienteParcial: actualizarEstudianteParcial,
  eliminarPaciente: eliminarEstudiante,
};
