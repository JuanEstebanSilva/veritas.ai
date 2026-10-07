export interface Especialidad {
  id: number;
  nombre: string;
  descripcion: string;
}

export const especialidades: Especialidad[] = [
  { id: 1, nombre: 'Medicina General', descripcion: 'Atención primaria y triaje Veritas AI' },
  { id: 2, nombre: 'Cardiología', descripcion: 'Diagnóstico y cuidado cardiovascular Veritas AI' },
  { id: 3, nombre: 'Neurología', descripcion: 'Atención neurológica especializada Veritas AI' },
];

export default especialidades;
