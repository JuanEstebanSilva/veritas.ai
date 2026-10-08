import { laboratorios, Laboratorio } from '../data/laboratorios.data';

export const obtenerLaboratorios = (): Laboratorio[] => {
  return laboratorios;
};

export const obtenerLaboratorioPorId = (id: number | string): Laboratorio | undefined => {
  return laboratorios.find((c) => c.id === Number(id));
};

export default {
  obtenerLaboratorios,
  obtenerLaboratorioPorId,
  // Alias
  obtenerConsultorios: obtenerLaboratorios,
  obtenerConsultorioPorId: obtenerLaboratorioPorId,
};
