import { pacientes, Paciente } from '../data/pacientes.data';
import { usuariosMemoria } from './usuarios.service';

export interface DatosPaciente {
  nombre: string;
  documento: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  usuarioId?: number | string | null;
}

const sanitizarUsuarioId = (uId: any): number | string | null => {
  if (uId === undefined || uId === null) return null;
  const num = Number(uId);
  if (!isNaN(num) && typeof uId !== 'string') return num;
  if (!isNaN(num) && typeof uId === 'string' && /^\d+$/.test(uId.trim())) return num;
  return String(uId);
};

// ========================================
// Obtener todos los pacientes
// ========================================
export const obtenerPacientes = (): Paciente[] => {
  return pacientes;
};

// ========================================
// Obtener paciente por ID
// ========================================
export const obtenerPacientePorId = (id: number | string): Paciente | undefined => {
  return pacientes.find((p) => p.id === Number(id));
};

// ========================================
// Obtener paciente por usuarioId (Bloque 6C, Parte 4)
// ========================================
export const obtenerPacientePorUsuarioId = (usuarioId: number | string): Paciente | undefined => {
  const numId = Number(usuarioId);
  const strId = String(usuarioId);

  // 1. Coincidencia directa
  const directo = pacientes.find((p) => {
    if (p.usuarioId === null || p.usuarioId === undefined) return false;
    return (
      String(p.usuarioId) === strId ||
      (!isNaN(numId) && Number(p.usuarioId) === numId)
    );
  });
  if (directo) return directo;

  // 2. Coincidencia cruzada si el usuario tiene UUID y numId
  const u = usuariosMemoria.find(
    (user) =>
      String(user.id) === strId ||
      (!isNaN(numId) && (Number(user.id) === numId || (user as any).numId === numId)) ||
      String((user as any).numId) === strId
  );
  if (u) {
    const aliasNum = (u as any).numId;
    const aliasStr = String(u.id);
    return pacientes.find((p) => {
      if (p.usuarioId === null || p.usuarioId === undefined) return false;
      return (
        String(p.usuarioId) === aliasStr ||
        (aliasNum !== undefined && Number(p.usuarioId) === aliasNum)
      );
    });
  }

  return undefined;
};

// ========================================
// Crear paciente (Bloque 6C, Parte 8 - persistir usuarioId)
// ========================================
export const crearPaciente = (datos: DatosPaciente): Paciente => {
  const nuevoId =
    pacientes.length > 0
      ? Math.max(...pacientes.map((p) => p.id)) + 1
      : 1;

  const nuevoPaciente: Paciente = {
    id: nuevoId,
    usuarioId: sanitizarUsuarioId(datos.usuarioId),
    nombre: datos.nombre,
    documento: datos.documento,
    email: datos.email,
    telefono: datos.telefono,
    fechaNacimiento: datos.fechaNacimiento,
  };

  pacientes.push(nuevoPaciente);
  return nuevoPaciente;
};

// ========================================
// Actualizar paciente completo (PUT)
// ========================================
export const actualizarPaciente = (id: number | string, datos: DatosPaciente): Paciente | null => {
  const index = pacientes.findIndex((p) => p.id === Number(id));
  if (index === -1) return null;

  pacientes[index] = {
    ...pacientes[index],
    nombre: datos.nombre,
    documento: datos.documento,
    email: datos.email,
    telefono: datos.telefono,
    fechaNacimiento: datos.fechaNacimiento,
    usuarioId: datos.usuarioId !== undefined ? sanitizarUsuarioId(datos.usuarioId) : pacientes[index].usuarioId,
  };

  return pacientes[index];
};

// ========================================
// Actualizar paciente parcial (PATCH)
// ========================================
export const actualizarPacienteParcial = (id: number | string, datos: Partial<DatosPaciente>): Paciente | null => {
  const index = pacientes.findIndex((p) => p.id === Number(id));
  if (index === -1) return null;

  if (datos.nombre !== undefined) pacientes[index].nombre = datos.nombre;
  if (datos.documento !== undefined) pacientes[index].documento = datos.documento;
  if (datos.email !== undefined) pacientes[index].email = datos.email;
  if (datos.telefono !== undefined) pacientes[index].telefono = datos.telefono;
  if (datos.fechaNacimiento !== undefined) pacientes[index].fechaNacimiento = datos.fechaNacimiento;
  if (datos.usuarioId !== undefined) {
    pacientes[index].usuarioId = sanitizarUsuarioId(datos.usuarioId);
  }

  return pacientes[index];
};

// ========================================
// Eliminar paciente (DELETE)
// ========================================
export const eliminarPaciente = (id: number | string): boolean => {
  const index = pacientes.findIndex((p) => p.id === Number(id));
  if (index === -1) return false;
  pacientes.splice(index, 1);
  return true;
};

export default {
  obtenerPacientes,
  obtenerPacientePorId,
  obtenerPacientePorUsuarioId,
  crearPaciente,
  actualizarPaciente,
  actualizarPacienteParcial,
  eliminarPaciente,
};
