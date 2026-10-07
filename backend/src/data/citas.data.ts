export interface Cita {
  id: number;
  pacienteId: number;
  medicoId: number;
  fecha: string;
  motivo: string;
  estado: 'programada' | 'confirmada' | 'atendida' | 'cancelada';
}

export const citas: Cita[] = [
  {
    id: 1,
    pacienteId: 1,
    medicoId: 1,
    fecha: '2026-11-20T10:00:00Z',
    motivo: 'Evaluación general Veritas AI',
    estado: 'programada',
  },
];

export default citas;
