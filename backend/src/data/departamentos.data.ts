export interface Departamento {
  id: number;
  nombre: string;
  descripcion: string;
}

export const departamentos: Departamento[] = [
  { id: 1, nombre: 'Ingeniería y Ciencias de la Computación', descripcion: 'Auditoría de código, algoritmos y proyectos tecnológicos' },
  { id: 2, nombre: 'Ciencias Sociales y Humanidades', descripcion: 'Análisis de ensayos, papers sociológicos y tesis de grado' },
  { id: 3, nombre: 'Ciencias de la Salud y Biomédicas', descripcion: 'Revisión de investigaciones clínicas y publicaciones científicas' },
];

export default departamentos;
