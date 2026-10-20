import { consultar } from '../config/database';
import { obtenerAliasesEmail, obtenerUsuarioPorId } from './usuarios.service';

export interface Docente {
  id: number;
  usuarioId: number | string | null;
  nombre: string;
  registroAcademico: string;
  email: string;
  telefono: string;
  departamentoId: number;
  activo: boolean;
  // Aliases de compatibilidad para contratos legacy
  especialidadId?: number;
  registroMedico?: string;
}

export interface DatosDocente {
  nombre: string;
  registroAcademico?: string;
  registroMedico?: string;
  email: string;
  telefono: string;
  departamentoId?: number;
  especialidadId?: number;
  usuarioId?: number | string | null;
  activo?: boolean;
}

const sanitizarUsuarioId = (uId: any): string | null => {
  if (uId === undefined || uId === null) return null;
  const str = String(uId).trim();
  return str.length > 0 ? str : null;
};

const mapearDocente = (row: any): Docente => {
  return {
    id: Number(row.id),
    usuarioId: row.usuarioId !== null ? String(row.usuarioId) : null,
    nombre: row.nombre,
    registroAcademico: row.registroAcademico,
    registroMedico: row.registroAcademico,
    email: row.email,
    telefono: row.telefono,
    departamentoId: Number(row.departamentoId),
    especialidadId: Number(row.departamentoId),
    activo: Boolean(row.activo),
  };
};

/**
 * Veritas AI — Servicio de Docentes / Auditores de Integridad Académica
 * Migrado a persistencia PostgreSQL / Supabase
 */
export const obtenerDocentes = async (): Promise<Docente[]> => {
  const query = `
    SELECT
      id,
      usuario_id AS "usuarioId",
      nombre,
      registro_academico AS "registroAcademico",
      email,
      telefono,
      departamento_id AS "departamentoId",
      activo
    FROM docentes
    ORDER BY id ASC
  `;
  const res = await consultar(query);
  return res.rows.map(mapearDocente);
};

export const obtenerDocentePorId = async (
  id: number | string
): Promise<Docente | undefined> => {
  const query = `
    SELECT
      id,
      usuario_id AS "usuarioId",
      nombre,
      registro_academico AS "registroAcademico",
      email,
      telefono,
      departamento_id AS "departamentoId",
      activo
    FROM docentes
    WHERE id = $1
    LIMIT 1
  `;
  const res = await consultar(query, [Number(id)]);
  if (res.rows.length === 0) return undefined;
  return mapearDocente(res.rows[0]);
};

export const obtenerDocentePorUsuarioId = async (
  usuarioId: number | string,
  email?: string
): Promise<Docente | undefined> => {
  const strId = String(usuarioId).trim();

  // 1. Búsqueda directa por usuario_id
  const queryDirecta = `
    SELECT
      id,
      usuario_id AS "usuarioId",
      nombre,
      registro_academico AS "registroAcademico",
      email,
      telefono,
      departamento_id AS "departamentoId",
      activo
    FROM docentes
    WHERE usuario_id = $1
    LIMIT 1
  `;
  const resDirecta = await consultar(queryDirecta, [strId]);
  if (resDirecta.rows.length > 0) {
    return mapearDocente(resDirecta.rows[0]);
  }

  // 2. Búsqueda por correo y sus variantes/aliases
  let aliases: string[] = [];
  if (email) {
    aliases = obtenerAliasesEmail(email);
  } else {
    // Si no vino email pero tenemos usuarioId, consultar usuario para extraer su email
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
        registro_academico AS "registroAcademico",
        email,
        telefono,
        departamento_id AS "departamentoId",
        activo
      FROM docentes
      WHERE LOWER(TRIM(email)) = ANY($1::text[])
      LIMIT 1
    `;
    const resEmail = await consultar(queryEmail, [aliases]);
    if (resEmail.rows.length > 0) {
      // Auto-vincular usuario_id si aún no estaba asignado
      const d = resEmail.rows[0];
      if (!d.usuarioId && strId) {
        try {
          await consultar('UPDATE docentes SET usuario_id = $1 WHERE id = $2', [strId, d.id]);
          d.usuarioId = strId;
        } catch {}
      }
      return mapearDocente(d);
    }
  }

  return undefined;
};

export const crearDocente = async (datos: DatosDocente): Promise<Docente> => {
  const reg = datos.registroAcademico || datos.registroMedico || `DOC-${Date.now()}`;
  const dep = Number(datos.departamentoId || datos.especialidadId || 1);
  const uId = sanitizarUsuarioId(datos.usuarioId);
  const activo = datos.activo !== undefined ? Boolean(datos.activo) : true;

  const query = `
    INSERT INTO docentes (
      usuario_id,
      nombre,
      registro_academico,
      email,
      telefono,
      departamento_id,
      activo
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      usuario_id AS "usuarioId",
      nombre,
      registro_academico AS "registroAcademico",
      email,
      telefono,
      departamento_id AS "departamentoId",
      activo
  `;
  const res = await consultar(query, [
    uId,
    datos.nombre.trim(),
    reg.trim(),
    datos.email.toLowerCase().trim(),
    datos.telefono.trim(),
    dep,
    activo,
  ]);

  return mapearDocente(res.rows[0]);
};

export const actualizarDocente = async (
  id: number | string,
  datos: DatosDocente
): Promise<Docente | null> => {
  const actual = await obtenerDocentePorId(id);
  if (!actual) return null;

  const reg = datos.registroAcademico || datos.registroMedico || actual.registroAcademico;
  const dep = Number(datos.departamentoId || datos.especialidadId || actual.departamentoId);
  const uId = datos.usuarioId !== undefined ? sanitizarUsuarioId(datos.usuarioId) : actual.usuarioId;
  const activo = datos.activo !== undefined ? Boolean(datos.activo) : actual.activo;

  const query = `
    UPDATE docentes
    SET
      nombre = $2,
      registro_academico = $3,
      email = $4,
      telefono = $5,
      departamento_id = $6,
      activo = $7,
      usuario_id = $8
    WHERE id = $1
    RETURNING
      id,
      usuario_id AS "usuarioId",
      nombre,
      registro_academico AS "registroAcademico",
      email,
      telefono,
      departamento_id AS "departamentoId",
      activo
  `;
  const res = await consultar(query, [
    Number(id),
    datos.nombre.trim(),
    reg.trim(),
    datos.email.toLowerCase().trim(),
    datos.telefono.trim(),
    dep,
    activo,
    uId,
  ]);

  return mapearDocente(res.rows[0]);
};

export const actualizarDocenteParcial = async (
  id: number | string,
  datos: Partial<DatosDocente>
): Promise<Docente | null> => {
  const actual = await obtenerDocentePorId(id);
  if (!actual) return null;

  const nombre = datos.nombre !== undefined ? datos.nombre.trim() : actual.nombre;
  const reg =
    datos.registroAcademico !== undefined || datos.registroMedico !== undefined
      ? (datos.registroAcademico || datos.registroMedico)!.trim()
      : actual.registroAcademico;
  const email = datos.email !== undefined ? datos.email.toLowerCase().trim() : actual.email;
  const telefono = datos.telefono !== undefined ? datos.telefono.trim() : actual.telefono;
  const dep =
    datos.departamentoId !== undefined || datos.especialidadId !== undefined
      ? Number(datos.departamentoId || datos.especialidadId)
      : actual.departamentoId;
  const activo = datos.activo !== undefined ? Boolean(datos.activo) : actual.activo;
  const uId = datos.usuarioId !== undefined ? sanitizarUsuarioId(datos.usuarioId) : actual.usuarioId;

  const query = `
    UPDATE docentes
    SET
      nombre = $2,
      registro_academico = $3,
      email = $4,
      telefono = $5,
      departamento_id = $6,
      activo = $7,
      usuario_id = $8
    WHERE id = $1
    RETURNING
      id,
      usuario_id AS "usuarioId",
      nombre,
      registro_academico AS "registroAcademico",
      email,
      telefono,
      departamento_id AS "departamentoId",
      activo
  `;
  const res = await consultar(query, [Number(id), nombre, reg, email, telefono, dep, activo, uId]);
  return mapearDocente(res.rows[0]);
};

export const eliminarDocente = async (id: number | string): Promise<boolean> => {
  const query = `DELETE FROM docentes WHERE id = $1 RETURNING id`;
  const res = await consultar(query, [Number(id)]);
  return (res.rowCount ?? 0) > 0;
};

export default {
  obtenerDocentes,
  obtenerDocentePorId,
  obtenerDocentePorUsuarioId,
  crearDocente,
  actualizarDocente,
  actualizarDocenteParcial,
  eliminarDocente,
  // Alias de compatibilidad
  obtenerMedicos: obtenerDocentes,
  obtenerMedicoPorId: obtenerDocentePorId,
  obtenerMedicoPorUsuarioId: obtenerDocentePorUsuarioId,
  crearMedico: crearDocente,
  actualizarMedico: actualizarDocente,
  actualizarMedicoParcial: actualizarDocenteParcial,
  eliminarMedico: eliminarDocente,
};
