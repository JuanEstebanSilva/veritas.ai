export interface Docente {
  id: number;
  usuarioId: number | string | null;
  nombre: string;
  registroAcademico: string;
  email: string;
  telefono: string;
  departamentoId: number;
  activo: boolean;
}

export const docentes: Docente[] = [
  {
    id: 1,
    usuarioId: null,
    nombre: 'Carlos Rodríguez',
    registroAcademico: 'DOC-45871',
    email: 'carlos.rodriguez@veritas.com',
    telefono: '3109876543',
    departamentoId: 2,
    activo: true,
  },
];

export default docentes;
