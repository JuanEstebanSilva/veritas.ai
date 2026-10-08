import { docentes, Docente } from '../data/docentes.data';
import { usuariosMemoria, obtenerAliasesEmail } from './usuarios.service';

export interface DatosDocente {
  nombre: string;
  registroAcademico?: string;
  registroMedico?: string;
  email: string;
  telefono: string;
  departamentoId?: number;
  especialidadId?: number;
  usuarioId?: number | string | null;
  activo?: boolean;
}

const sanitizarUsuarioId = (uId: any): number | string | null => {
  if (uId === undefined || uId === null) return null;
  const num = Number(uId);
  if (!isNaN(num) && typeof uId !== 'string') return num;
  if (!isNaN(num) && typeof uId === 'string' && /^\d+$/.test(uId.trim())) return num;
  return String(uId);
};

export const obtenerDocentes = (): Docente[] => {
  return docentes;
};

export const obtenerDocentePorId = (id: number | string): Docente | undefined => {
  return docentes.find((d) => d.id === Number(id));
};

export const obtenerDocentePorUsuarioId = (
  usuarioId: number | string,
  email?: string
): Docente | undefined => {
  const numId = Number(usuarioId);
  const strId = String(usuarioId);

  // 1. Coincidencia directa por usuarioId
  const directo = docentes.find((d) => {
    if (d.usuarioId === null || d.usuarioId === undefined) return false;
    return (
      String(d.usuarioId) === strId ||
      (!isNaN(numId) && Number(d.usuarioId) === numId)
    );
  });
  if (directo) return directo;

  // 2. Coincidencia por correo con soporte de alias
  if (email) {
    const aliases = obtenerAliasesEmail(email);
    const porEmail = docentes.find(
      (d) => d.email && aliases.includes(d.email.toLowerCase().trim())
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

    return docentes.find((d) => {
      if (d.usuarioId !== null && d.usuarioId !== undefined) {
        if (
          String(d.usuarioId) === aliasStr ||
          (aliasNum !== undefined && Number(d.usuarioId) === aliasNum)
        ) {
          return true;
        }
      }
      if (userEmail && d.email && d.email.toLowerCase().trim() === userEmail) {
        return true;
      }
      return false;
    });
  }

  return undefined;
};

export const crearDocente = (datos: DatosDocente): Docente => {
  const nuevoId =
    docentes.length > 0
      ? Math.max(...docentes.map((d) => d.id)) + 1
      : 1;

  const reg = datos.registroAcademico || datos.registroMedico || `DOC-${nuevoId}`;
  const dep = Number(datos.departamentoId || datos.especialidadId || 1);

  const nuevoDocente: Docente = {
    id: nuevoId,
    usuarioId: sanitizarUsuarioId(datos.usuarioId),
    nombre: datos.nombre,
    registroAcademico: reg,
    email: datos.email,
    telefono: datos.telefono,
    departamentoId: dep,
    activo: datos.activo !== undefined ? datos.activo : true,
  };

  docentes.push(nuevoDocente);
  return nuevoDocente;
};

export const actualizarDocente = (
  id: number | string,
  datos: DatosDocente
): Docente | null => {
  const index = docentes.findIndex((d) => d.id === Number(id));
  if (index === -1) return null;

  const reg = datos.registroAcademico || datos.registroMedico || docentes[index].registroAcademico;
  const dep = Number(datos.departamentoId || datos.especialidadId || docentes[index].departamentoId);

  docentes[index] = {
    ...docentes[index],
    nombre: datos.nombre,
    registroAcademico: reg,
    email: datos.email,
    telefono: datos.telefono,
    departamentoId: dep,
    activo: datos.activo !== undefined ? datos.activo : docentes[index].activo,
    usuarioId: datos.usuarioId !== undefined ? sanitizarUsuarioId(datos.usuarioId) : docentes[index].usuarioId,
  };

  return docentes[index];
};

export const actualizarDocenteParcial = (
  id: number | string,
  datos: Partial<DatosDocente>
): Docente | null => {
  const index = docentes.findIndex((d) => d.id === Number(id));
  if (index === -1) return null;

  if (datos.nombre !== undefined) docentes[index].nombre = datos.nombre;
  if (datos.registroAcademico !== undefined || datos.registroMedico !== undefined) {
    docentes[index].registroAcademico = (datos.registroAcademico || datos.registroMedico)!;
  }
  if (datos.email !== undefined) docentes[index].email = datos.email;
  if (datos.telefono !== undefined) docentes[index].telefono = datos.telefono;
  if (datos.departamentoId !== undefined || datos.especialidadId !== undefined) {
    docentes[index].departamentoId = Number(datos.departamentoId || datos.especialidadId);
  }
  if (datos.activo !== undefined) docentes[index].activo = datos.activo;
  if (datos.usuarioId !== undefined) {
    docentes[index].usuarioId = sanitizarUsuarioId(datos.usuarioId);
  }

  return docentes[index];
};

export const eliminarDocente = (id: number | string): boolean => {
  const index = docentes.findIndex((d) => d.id === Number(id));
  if (index === -1) return false;
  docentes.splice(index, 1);
  return true;
};

export default {
  obtenerDocentes,
  obtenerDocentePorId,
  obtenerDocentePorUsuarioId,
  crearDocente,
  actualizarDocente,
  actualizarDocenteParcial,
  eliminarDocente,
  // Alias de compatibilidad
  obtenerMedicos: obtenerDocentes,
  obtenerMedicoPorId: obtenerDocentePorId,
  obtenerMedicoPorUsuarioId: obtenerDocentePorUsuarioId,
  crearMedico: crearDocente,
  actualizarMedico: actualizarDocente,
  actualizarMedicoParcial: actualizarDocenteParcial,
  eliminarMedico: eliminarDocente,
};
