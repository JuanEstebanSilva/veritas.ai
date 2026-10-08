import { revisiones, Revision } from '../data/revisiones.data';

export interface DatosRevision {
  estudianteId?: number;
  pacienteId?: number;
  docenteId?: number;
  medicoId?: number;
  fecha: string;
  motivo: string;
  estado?: 'programada' | 'confirmada' | 'atendida' | 'cancelada';
}

const transicionesValidas: Record<string, string[]> = {
  programada: ['confirmada', 'cancelada'],
  confirmada: ['atendida', 'cancelada'],
  atendida: [],
  cancelada: [],
};

export const obtenerTodasLasRevisiones = (): Revision[] => {
  return revisiones;
};

export const obtenerRevisionPorId = (id: number | string): Revision | undefined => {
  return revisiones.find((r) => r.id === Number(id));
};

export const obtenerRevisionesPorEstudiante = (
  estudianteId: number | string
): Revision[] => {
  return revisiones.filter((r) => r.estudianteId === Number(estudianteId));
};

export const obtenerRevisionesPorDocente = (
  docenteId: number | string
): Revision[] => {
  return revisiones.filter((r) => r.docenteId === Number(docenteId));
};

export const crearRevision = (datos: DatosRevision): Revision => {
  const nuevoId =
    revisiones.length > 0
      ? Math.max(...revisiones.map((r) => r.id)) + 1
      : 1;

  const estId = Number(datos.estudianteId || datos.pacienteId || 1);
  const docId = Number(datos.docenteId || datos.medicoId || 1);

  const nuevaRevision: Revision = {
    id: nuevoId,
    estudianteId: estId,
    pacienteId: estId,
    docenteId: docId,
    medicoId: docId,
    fecha: datos.fecha,
    motivo: datos.motivo,
    estado: datos.estado || 'programada',
  };

  revisiones.push(nuevaRevision);
  return nuevaRevision;
};

export const actualizarRevision = (
  id: number | string,
  datos: DatosRevision
): Revision | null => {
  const index = revisiones.findIndex((r) => r.id === Number(id));
  if (index === -1) return null;

  const estId = Number(datos.estudianteId || datos.pacienteId || revisiones[index].estudianteId);
  const docId = Number(datos.docenteId || datos.medicoId || revisiones[index].docenteId);

  revisiones[index] = {
    ...revisiones[index],
    estudianteId: estId,
    docenteId: docId,
    fecha: datos.fecha,
    motivo: datos.motivo,
    estado: datos.estado || revisiones[index].estado,
  };

  return revisiones[index];
};

export const actualizarRevisionParcial = (
  id: number | string,
  datos: Partial<DatosRevision>
): Revision | null => {
  const index = revisiones.findIndex((r) => r.id === Number(id));
  if (index === -1) return null;

  if (datos.estudianteId !== undefined || datos.pacienteId !== undefined) {
    revisiones[index].estudianteId = Number(datos.estudianteId || datos.pacienteId);
  }
  if (datos.docenteId !== undefined || datos.medicoId !== undefined) {
    revisiones[index].docenteId = Number(datos.docenteId || datos.medicoId);
  }
  if (datos.fecha !== undefined) revisiones[index].fecha = datos.fecha;
  if (datos.motivo !== undefined) revisiones[index].motivo = datos.motivo;
  if (datos.estado !== undefined) revisiones[index].estado = datos.estado;

  return revisiones[index];
};

export const cambiarEstadoRevision = (
  id: number | string,
  nuevoEstado: string
): { exito: boolean; error?: string; revision?: Revision } => {
  const index = revisiones.findIndex((r) => r.id === Number(id));
  if (index === -1) {
    return { exito: false, error: 'NO_ENCONTRADA' };
  }

  const estadoActual = revisiones[index].estado;
  const permitidos = transicionesValidas[estadoActual] || [];

  if (!permitidos.includes(nuevoEstado)) {
    return { exito: false, error: 'TRANSICION_INVALIDA' };
  }

  revisiones[index].estado = nuevoEstado as any;
  return { exito: true, revision: revisiones[index] };
};

export const eliminarRevision = (id: number | string): boolean => {
  const index = revisiones.findIndex((r) => r.id === Number(id));
  if (index === -1) return false;
  revisiones.splice(index, 1);
  return true;
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
