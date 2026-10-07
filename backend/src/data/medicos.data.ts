export interface Medico {
  id: number;
  usuarioId: number | string | null;
  nombre: string;
  registroMedico: string;
  email: string;
  telefono: string;
  especialidadId: number;
  activo: boolean;
}

export const medicos: Medico[] = [
  {
    id: 1,
    usuarioId: null,
    nombre: 'Carlos Rodríguez',
    registroMedico: 'RM-45871',
    email: 'carlos.rodriguez@veritas.com',
    telefono: '3109876543',
    especialidadId: 2,
    activo: true,
  },
];

export default medicos;
