import { estudiantes, Estudiante } from '../data/estudiantes.data';
import { usuariosMemoria, obtenerAliasesEmail } from './usuarios.service';

export interface DatosEstudiante {
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

export const obtenerEstudiantes = (): Estudiante[] => {
  return estudiantes;
};

export const obtenerEstudiantePorId = (id: number | string): Estudiante | undefined => {
  return estudiantes.find((e) => e.id === Number(id));
};

export const obtenerEstudiantePorUsuarioId = (
  usuarioId: number | string,
  email?: string
): Estudiante | undefined => {
  const numId = Number(usuarioId);
  const strId = String(usuarioId);

  // 1. Coincidencia directa por usuarioId
  const directo = estudiantes.find((e) => {
    if (e.usuarioId === null || e.usuarioId === undefined) return false;
    return (
      String(e.usuarioId) === strId ||
      (!isNaN(numId) && Number(e.usuarioId) === numId)
    );
  });
  if (directo) return directo;

  // 2. Coincidencia por correo con soporte de alias
  if (email) {
    const aliases = obtenerAliasesEmail(email);
    const porEmail = estudiantes.find(
      (e) => e.email && aliases.includes(e.email.toLowerCase().trim())
    );
    if (porEmail) return porEmail;
  }

  // 3. Coincidencia cruzada si el usuario está en memoria
  const u = usuariosMemoria.find(
    (user) =>
      String(user.id) === strId ||
      (!isNaN(numId) && (Number(user.id) === numId || (user as any).numId === numId)) ||
      String((user as any).numId) === strId ||
      (user as any).uuid === strId
  );
  if (u) {
    const aliasNum = (u as any).numId;
    const aliasStr = String(u.id);
    const userEmail = u.email?.toLowerCase().trim();

    return estudiantes.find((e) => {
      if (e.usuarioId !== null && e.usuarioId !== undefined) {
        if (
          String(e.usuarioId) === aliasStr ||
          (aliasNum !== undefined && Number(e.usuarioId) === aliasNum)
        ) {
          return true;
        }
      }
      if (userEmail && e.email && e.email.toLowerCase().trim() === userEmail) {
        return true;
      }
      return false;
    });
  }

  return undefined;
};

export const crearEstudiante = (datos: DatosEstudiante): Estudiante => {
  const nuevoId =
    estudiantes.length > 0
      ? Math.max(...estudiantes.map((e) => e.id)) + 1
      : 1;

  const nuevoEstudiante: Estudiante = {
    id: nuevoId,
    usuarioId: sanitizarUsuarioId(datos.usuarioId),
    nombre: datos.nombre,
    documento: datos.documento,
    email: datos.email,
    telefono: datos.telefono,
    fechaNacimiento: datos.fechaNacimiento,
  };

  estudiantes.push(nuevoEstudiante);
  return nuevoEstudiante;
};

export const actualizarEstudiante = (
  id: number | string,
  datos: DatosEstudiante
): Estudiante | null => {
  const index = estudiantes.findIndex((e) => e.id === Number(id));
  if (index === -1) return null;

  estudiantes[index] = {
    ...estudiantes[index],
    nombre: datos.nombre,
    documento: datos.documento,
    email: datos.email,
    telefono: datos.telefono,
    fechaNacimiento: datos.fechaNacimiento,
    usuarioId: datos.usuarioId !== undefined ? sanitizarUsuarioId(datos.usuarioId) : estudiantes[index].usuarioId,
  };

  return estudiantes[index];
};

export const actualizarEstudianteParcial = (
  id: number | string,
  datos: Partial<DatosEstudiante>
): Estudiante | null => {
  const index = estudiantes.findIndex((e) => e.id === Number(id));
  if (index === -1) return null;

  if (datos.nombre !== undefined) estudiantes[index].nombre = datos.nombre;
  if (datos.documento !== undefined) estudiantes[index].documento = datos.documento;
  if (datos.email !== undefined) estudiantes[index].email = datos.email;
  if (datos.telefono !== undefined) estudiantes[index].telefono = datos.telefono;
  if (datos.fechaNacimiento !== undefined) estudiantes[index].fechaNacimiento = datos.fechaNacimiento;
  if (datos.usuarioId !== undefined) {
    estudiantes[index].usuarioId = sanitizarUsuarioId(datos.usuarioId);
  }

  return estudiantes[index];
};

export const eliminarEstudiante = (id: number | string): boolean => {
  const index = estudiantes.findIndex((e) => e.id === Number(id));
  if (index === -1) return false;
  estudiantes.splice(index, 1);
  return true;
};

export default {
  obtenerEstudiantes,
  obtenerEstudiantePorId,
  obtenerEstudiantePorUsuarioId,
  crearEstudiante,
  actualizarEstudiante,
  actualizarEstudianteParcial,
  eliminarEstudiante,
  // Alias de compatibilidad
  obtenerPacientes: obtenerEstudiantes,
  obtenerPacientePorId: obtenerEstudiantePorId,
  obtenerPacientePorUsuarioId: obtenerEstudiantePorUsuarioId,
  crearPaciente: crearEstudiante,
  actualizarPaciente: actualizarEstudiante,
  actualizarPacienteParcial: actualizarEstudianteParcial,
  eliminarPaciente: eliminarEstudiante,
};
