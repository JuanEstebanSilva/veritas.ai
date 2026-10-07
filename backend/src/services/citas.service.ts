import { citas, Cita } from '../data/citas.data';

export interface DatosCita {
  pacienteId: number;
  medicoId: number;
  fecha: string;
  motivo: string;
  estado?: 'programada' | 'confirmada' | 'atendida' | 'cancelada';
}

// Máquina de estados para citas (Reglas de negocio del Bloque 6C)
const TRANSICIONES_PERMITIDAS: Record<string, string[]> = {
  programada: ['confirmada', 'cancelada'],
  confirmada: ['atendida', 'cancelada'],
  atendida: [], // Estado terminal
  cancelada: [], // Estado terminal
};

export const obtenerTodasLasCitas = (): Cita[] => {
  return citas;
};

export const obtenerCitaPorId = (id: number | string): Cita | undefined => {
  return citas.find((c) => c.id === Number(id));
};

export const obtenerCitasPorPaciente = (pacienteId: number | string): Cita[] => {
  return citas.filter((c) => c.pacienteId === Number(pacienteId));
};

export const obtenerCitasPorMedico = (medicoId: number | string): Cita[] => {
  return citas.filter((c) => c.medicoId === Number(medicoId));
};

export const crearCita = (datos: DatosCita): Cita => {
  const nuevoId =
    citas.length > 0
      ? Math.max(...citas.map((c) => c.id)) + 1
      : 1;

  const nuevaCita: Cita = {
    id: nuevoId,
    pacienteId: Number(datos.pacienteId),
    medicoId: Number(datos.medicoId),
    fecha: datos.fecha,
    motivo: datos.motivo,
    estado: datos.estado || 'programada',
  };

  citas.push(nuevaCita);
  return nuevaCita;
};

export const actualizarCita = (id: number | string, datos: Partial<DatosCita>): Cita | null => {
  const index = citas.findIndex((c) => c.id === Number(id));
  if (index === -1) return null;

  if (datos.pacienteId !== undefined) citas[index].pacienteId = Number(datos.pacienteId);
  if (datos.medicoId !== undefined) citas[index].medicoId = Number(datos.medicoId);
  if (datos.fecha !== undefined) citas[index].fecha = datos.fecha;
  if (datos.motivo !== undefined) citas[index].motivo = datos.motivo;

  return citas[index];
};

export const cambiarEstadoCita = (
  id: number | string,
  nuevoEstado: 'programada' | 'confirmada' | 'atendida' | 'cancelada'
): { exito: boolean; cita?: Cita; error?: string } => {
  const index = citas.findIndex((c) => c.id === Number(id));
  if (index === -1) {
    return { exito: false, error: 'NO_ENCONTRADA' };
  }

  const estadoActual = citas[index].estado;

  // Si intenta quedarse en el mismo estado, es válido
  if (estadoActual === nuevoEstado) {
    return { exito: true, cita: citas[index] };
  }

  const permitidos = TRANSICIONES_PERMITIDAS[estadoActual] || [];
  if (!permitidos.includes(nuevoEstado)) {
    return {
      exito: false,
      error: 'TRANSICION_INVALIDA',
    };
  }

  citas[index].estado = nuevoEstado;
  return { exito: true, cita: citas[index] };
};

export const eliminarCita = (id: number | string): boolean => {
  const index = citas.findIndex((c) => c.id === Number(id));
  if (index === -1) return false;
  citas.splice(index, 1);
  return true;
};

export default {
  obtenerTodasLasCitas,
  obtenerCitaPorId,
  obtenerCitasPorPaciente,
  obtenerCitasPorMedico,
  crearCita,
  actualizarCita,
  cambiarEstadoCita,
  eliminarCita,
};
