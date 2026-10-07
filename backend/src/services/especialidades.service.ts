import { especialidades, Especialidad } from '../data/especialidades.data';

export const obtenerEspecialidades = (): Especialidad[] => {
  return especialidades;
};

export const obtenerEspecialidadPorId = (id: number | string): Especialidad | undefined => {
  return especialidades.find((e) => e.id === Number(id));
};

export const crearEspecialidad = (datos: { nombre: string; descripcion: string }): Especialidad => {
  const nuevoId =
    especialidades.length > 0
      ? Math.max(...especialidades.map((e) => e.id)) + 1
      : 1;

  const nueva: Especialidad = {
    id: nuevoId,
    nombre: datos.nombre,
    descripcion: datos.descripcion,
  };
  especialidades.push(nueva);
  return nueva;
};

export const actualizarEspecialidad = (id: number | string, datos: { nombre?: string; descripcion?: string }): Especialidad | null => {
  const index = especialidades.findIndex((e) => e.id === Number(id));
  if (index === -1) return null;
  if (datos.nombre) especialidades[index].nombre = datos.nombre;
  if (datos.descripcion) especialidades[index].descripcion = datos.descripcion;
  return especialidades[index];
};

export const eliminarEspecialidad = (id: number | string): boolean => {
  const index = especialidades.findIndex((e) => e.id === Number(id));
  if (index === -1) return false;
  especialidades.splice(index, 1);
  return true;
};

export default {
  obtenerEspecialidades,
  obtenerEspecialidadPorId,
  crearEspecialidad,
  actualizarEspecialidad,
  eliminarEspecialidad,
};
