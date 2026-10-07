import { consultorios, Consultorio } from '../data/consultorios.data';

export const obtenerConsultorios = (): Consultorio[] => {
  return consultorios;
};

export const obtenerConsultorioPorId = (id: number | string): Consultorio | undefined => {
  return consultorios.find((c) => c.id === Number(id));
};

export const crearConsultorio = (datos: { numero: string; piso: string }): Consultorio => {
  const nuevoId =
    consultorios.length > 0
      ? Math.max(...consultorios.map((c) => c.id)) + 1
      : 1;

  const nuevo: Consultorio = {
    id: nuevoId,
    numero: datos.numero,
    piso: datos.piso,
  };
  consultorios.push(nuevo);
  return nuevo;
};

export const actualizarConsultorio = (id: number | string, datos: { numero?: string; piso?: string }): Consultorio | null => {
  const index = consultorios.findIndex((c) => c.id === Number(id));
  if (index === -1) return null;
  if (datos.numero) consultorios[index].numero = datos.numero;
  if (datos.piso) consultorios[index].piso = datos.piso;
  return consultorios[index];
};

export const eliminarConsultorio = (id: number | string): boolean => {
  const index = consultorios.findIndex((c) => c.id === Number(id));
  if (index === -1) return false;
  consultorios.splice(index, 1);
  return true;
};

export default {
  obtenerConsultorios,
  obtenerConsultorioPorId,
  crearConsultorio,
  actualizarConsultorio,
  eliminarConsultorio,
};
