import { departamentos, Departamento } from '../data/departamentos.data';

export const obtenerDepartamentos = (): Departamento[] => {
  return departamentos;
};

export const obtenerDepartamentoPorId = (id: number | string): Departamento | undefined => {
  return departamentos.find((e) => e.id === Number(id));
};

export default {
  obtenerDepartamentos,
  obtenerDepartamentoPorId,
  // Alias
  obtenerEspecialidades: obtenerDepartamentos,
  obtenerEspecialidadPorId: obtenerDepartamentoPorId,
};
