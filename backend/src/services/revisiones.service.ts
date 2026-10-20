import { consultar } from '../config/database';

export interface Revision {
  id: number;
  estudianteId: number;
  docenteId: number;
  fecha: string;
  hora?: string;
  motivo: string;
  estado: 'programada' | 'confirmada' | 'atendida' | 'cancelada';
  // Aliases de compatibilidad para contratos legacy
  pacienteId?: number;
  medicoId?: number;
}

export interface DatosRevision {
  estudianteId?: number;
  pacienteId?: number;
  docenteId?: number;
  medicoId?: number;
  fecha: string;
  hora?: string;
  motivo: string;
  estado?: 'programada' | 'confirmada' | 'atendida' | 'cancelada';
}

const transicionesValidas: Record<string, string[]> = {
  programada: ['confirmada', 'cancelada'],
  confirmada: ['atendida', 'cancelada'],
  atendida: [],
  cancelada: [],
};

const extraerFechaYHora = (fechaInput: string, horaInput?: string): { fecha: string; hora: string } => {
  let fecha = fechaInput.trim();
  let hora = horaInput ? horaInput.trim() : '10:00:00';

  if (fecha.includes('T')) {
    const partes = fecha.split('T');
    fecha = partes[0];
    const tiempo = partes[1].replace('Z', '').trim();
    if (tiempo.length >= 5) {
      hora = tiempo.length === 5 ? `${tiempo}:00` : tiempo.substring(0, 8);
    }
  }

  return { fecha, hora };
};

const mapearRevision = (row: any): Revision => {
  return {
    id: Number(row.id),
    estudianteId: Number(row.estudianteId),
    pacienteId: Number(row.estudianteId),
    docenteId: Number(row.docenteId),
    medicoId: Number(row.docenteId),
    fecha: row.fecha,
    hora: row.hora,
    motivo: row.motivo,
    estado: row.estado,
  };
};

/**
 * Veritas AI — Servicio de Revisiones y Escaneos de Integridad Académica
 * Migrado a persistencia PostgreSQL / Supabase
 */
export const obtenerTodasLasRevisiones = async (): Promise<Revision[]> => {
  const query = `
    SELECT
      id,
      estudiante_id AS "estudianteId",
      docente_id AS "docenteId",
      TO_CHAR(fecha, 'YYYY-MM-DD') AS "fecha",
      SUBSTRING(hora::text FROM 1 FOR 5) AS "hora",
      motivo,
      estado
    FROM revisiones
    ORDER BY id ASC
  `;
  const res = await consultar(query);
  return res.rows.map(mapearRevision);
};

export const obtenerRevisionPorId = async (
  id: number | string
): Promise<Revision | undefined> => {
  const query = `
    SELECT
      id,
      estudiante_id AS "estudianteId",
      docente_id AS "docenteId",
      TO_CHAR(fecha, 'YYYY-MM-DD') AS "fecha",
      SUBSTRING(hora::text FROM 1 FOR 5) AS "hora",
      motivo,
      estado
    FROM revisiones
    WHERE id = $1
    LIMIT 1
  `;
  const res = await consultar(query, [Number(id)]);
  if (res.rows.length === 0) return undefined;
  return mapearRevision(res.rows[0]);
};

export const obtenerRevisionesPorEstudiante = async (
  estudianteId: number | string
): Promise<Revision[]> => {
  const query = `
    SELECT
      id,
      estudiante_id AS "estudianteId",
      docente_id AS "docenteId",
      TO_CHAR(fecha, 'YYYY-MM-DD') AS "fecha",
      SUBSTRING(hora::text FROM 1 FOR 5) AS "hora",
      motivo,
      estado
    FROM revisiones
    WHERE estudiante_id = $1
    ORDER BY fecha ASC, hora ASC
  `;
  const res = await consultar(query, [Number(estudianteId)]);
  return res.rows.map(mapearRevision);
};

export const obtenerRevisionesPorDocente = async (
  docenteId: number | string
): Promise<Revision[]> => {
  const query = `
    SELECT
      id,
      estudiante_id AS "estudianteId",
      docente_id AS "docenteId",
      TO_CHAR(fecha, 'YYYY-MM-DD') AS "fecha",
      SUBSTRING(hora::text FROM 1 FOR 5) AS "hora",
      motivo,
      estado
    FROM revisiones
    WHERE docente_id = $1
    ORDER BY fecha ASC, hora ASC
  `;
  const res = await consultar(query, [Number(docenteId)]);
  return res.rows.map(mapearRevision);
};

export const crearRevision = async (datos: DatosRevision): Promise<Revision> => {
  const estId = Number(datos.estudianteId || datos.pacienteId || 1);
  const docId = Number(datos.docenteId || datos.medicoId || 1);
  const { fecha, hora } = extraerFechaYHora(datos.fecha, datos.hora);
  const estado = datos.estado || 'programada';

  const query = `
    INSERT INTO revisiones (
      estudiante_id,
      docente_id,
      fecha,
      hora,
      motivo,
      estado
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      estudiante_id AS "estudianteId",
      docente_id AS "docenteId",
      TO_CHAR(fecha, 'YYYY-MM-DD') AS "fecha",
      SUBSTRING(hora::text FROM 1 FOR 5) AS "hora",
      motivo,
      estado
  `;
  const res = await consultar(query, [estId, docId, fecha, hora, datos.motivo.trim(), estado]);
  return mapearRevision(res.rows[0]);
};

export const actualizarRevision = async (
  id: number | string,
  datos: DatosRevision
): Promise<Revision | null> => {
  const actual = await obtenerRevisionPorId(id);
  if (!actual) return null;

  const estId = Number(datos.estudianteId || datos.pacienteId || actual.estudianteId);
  const docId = Number(datos.docenteId || datos.medicoId || actual.docenteId);
  const { fecha, hora } = extraerFechaYHora(datos.fecha || actual.fecha, datos.hora || actual.hora);
  const estado = datos.estado || actual.estado;
  const motivo = datos.motivo !== undefined ? datos.motivo.trim() : actual.motivo;

  const query = `
    UPDATE revisiones
    SET
      estudiante_id = $2,
      docente_id = $3,
      fecha = $4,
      hora = $5,
      motivo = $6,
      estado = $7
    WHERE id = $1
    RETURNING
      id,
      estudiante_id AS "estudianteId",
      docente_id AS "docenteId",
      TO_CHAR(fecha, 'YYYY-MM-DD') AS "fecha",
      SUBSTRING(hora::text FROM 1 FOR 5) AS "hora",
      motivo,
      estado
  `;
  const res = await consultar(query, [Number(id), estId, docId, fecha, hora, motivo, estado]);
  return mapearRevision(res.rows[0]);
};

export const actualizarRevisionParcial = async (
  id: number | string,
  datos: Partial<DatosRevision>
): Promise<Revision | null> => {
  const actual = await obtenerRevisionPorId(id);
  if (!actual) return null;

  const estId = Number(datos.estudianteId || datos.pacienteId || actual.estudianteId);
  const docId = Number(datos.docenteId || datos.medicoId || actual.docenteId);
  const fechaStr = datos.fecha || actual.fecha;
  const horaStr = datos.hora || actual.hora;
  const { fecha, hora } = extraerFechaYHora(fechaStr, horaStr);
  const motivo = datos.motivo !== undefined ? datos.motivo.trim() : actual.motivo;
  const estado = datos.estado || actual.estado;

  const query = `
    UPDATE revisiones
    SET
      estudiante_id = $2,
      docente_id = $3,
      fecha = $4,
      hora = $5,
      motivo = $6,
      estado = $7
    WHERE id = $1
    RETURNING
      id,
      estudiante_id AS "estudianteId",
      docente_id AS "docenteId",
      TO_CHAR(fecha, 'YYYY-MM-DD') AS "fecha",
      SUBSTRING(hora::text FROM 1 FOR 5) AS "hora",
      motivo,
      estado
  `;
  const res = await consultar(query, [Number(id), estId, docId, fecha, hora, motivo, estado]);
  return mapearRevision(res.rows[0]);
};

export const cambiarEstadoRevision = async (
  id: number | string,
  nuevoEstado: string
): Promise<{ exito: boolean; error?: string; revision?: Revision }> => {
  const actual = await obtenerRevisionPorId(id);
  if (!actual) {
    return { exito: false, error: 'NO_ENCONTRADA' };
  }

  const permitidos = transicionesValidas[actual.estado] || [];
  if (!permitidos.includes(nuevoEstado)) {
    return { exito: false, error: 'TRANSICION_INVALIDA' };
  }

  const query = `
    UPDATE revisiones
    SET estado = $2
    WHERE id = $1
    RETURNING
      id,
      estudiante_id AS "estudianteId",
      docente_id AS "docenteId",
      TO_CHAR(fecha, 'YYYY-MM-DD') AS "fecha",
      SUBSTRING(hora::text FROM 1 FOR 5) AS "hora",
      motivo,
      estado
  `;
  const res = await consultar(query, [Number(id), nuevoEstado]);
  return { exito: true, revision: mapearRevision(res.rows[0]) };
};

export const eliminarRevision = async (id: number | string): Promise<boolean> => {
  const query = `DELETE FROM revisiones WHERE id = $1 RETURNING id`;
  const res = await consultar(query, [Number(id)]);
  return (res.rowCount ?? 0) > 0;
};

export default {
  obtenerTodasLasRevisiones,
  obtenerRevisionPorId,
  obtenerRevisionesPorEstudiante,
  obtenerRevisionesPorDocente,
  crearRevision,
  actualizarRevision,
  actualizarRevisionParcial,
  cambiarEstadoRevision,
  eliminarRevision,
  // Alias de compatibilidad
  obtenerTodasLasCitas: obtenerTodasLasRevisiones,
  obtenerCitaPorId: obtenerRevisionPorId,
  obtenerCitasPorPaciente: obtenerRevisionesPorEstudiante,
  obtenerCitasPorMedico: obtenerRevisionesPorDocente,
  crearCita: crearRevision,
  actualizarCita: actualizarRevision,
  actualizarCitaParcial: actualizarRevisionParcial,
  cambiarEstadoCita: cambiarEstadoRevision,
  eliminarCita: eliminarRevision,
};
