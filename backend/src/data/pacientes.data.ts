export interface Paciente {
  id: number;
  usuarioId: number | string | null;
  nombre: string;
  documento: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
}

export const pacientes: Paciente[] = [
  {
    id: 1,
    usuarioId: null,
    nombre: 'Laura Gómez',
    documento: '1001001001',
    email: 'laura@veritas.com',
    telefono: '3001234567',
    fechaNacimiento: '1995-04-10',
  },
  {
    id: 2,
    usuarioId: null,
    nombre: 'Carlos Ramírez',
    documento: '1001001002',
    email: 'carlos@veritas.com',
    telefono: '3012345678',
    fechaNacimiento: '1988-08-22',
  },
  {
    id: 3,
    usuarioId: null,
    nombre: 'Ana Martínez',
    documento: '1001001003',
    email: 'ana@veritas.com',
    telefono: '3023456789',
    fechaNacimiento: '2000-01-15',
  },
];

export default pacientes;
