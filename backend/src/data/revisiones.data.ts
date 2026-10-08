export interface Revision {
  id: number;
  estudianteId: number;
  pacienteId?: number;
  docenteId: number;
  medicoId?: number;
  fecha: string;
  motivo: string;
  estado: 'programada' | 'confirmada' | 'atendida' | 'cancelada';
}

export const revisiones: Revision[] = [
  {
    id: 1,
    estudianteId: 1,
    pacienteId: 1,
    docenteId: 1,
    medicoId: 1,
    fecha: '2026-11-20T10:00:00Z',
    motivo: 'Evaluación y escaneo de integridad académica Veritas AI',
    estado: 'programada',
  },
];

export default revisiones;
