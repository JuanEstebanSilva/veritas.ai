import { medicos, Medico } from '../data/medicos.data';
import { usuariosMemoria, obtenerAliasesEmail } from './usuarios.service';

export interface DatosMedico {
  nombre: string;
  registroMedico: string;
  email: string;
  telefono: string;
  especialidadId: number;
  activo?: boolean;
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
// Obtener todos los médicos
// ========================================
export const obtenerMedicos = (): Medico[] => {
  return medicos;
};

// ========================================
// Obtener médico por ID
// ========================================
export const obtenerMedicoPorId = (id: number | string): Medico | undefined => {
  return medicos.find((m) => m.id === Number(id));
};

// ========================================
// Obtener médico por usuarioId (Bloque 6C, Parte 5)
// ========================================
export const obtenerMedicoPorUsuarioId = (
  usuarioId: number | string,
  email?: string
): Medico | undefined => {
  const numId = Number(usuarioId);
  const strId = String(usuarioId);

  // 1. Coincidencia directa por usuarioId
  const directo = medicos.find((m) => {
    if (m.usuarioId === null || m.usuarioId === undefined) return false;
    return (
      String(m.usuarioId) === strId ||
      (!isNaN(numId) && Number(m.usuarioId) === numId)
    );
  });
  if (directo) return directo;

  // 2. Coincidencia por correo electrónico con soporte de alias
  if (email) {
    const aliases = obtenerAliasesEmail(email);
    const porEmail = medicos.find(
      (m) => m.email && aliases.includes(m.email.toLowerCase().trim())
    );
    if (porEmail) return porEmail;
  }

  // 3. Coincidencia cruzada si el usuario tiene UUID y numId en memoria
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

    return medicos.find((m) => {
      if (m.usuarioId !== null && m.usuarioId !== undefined) {
        if (
          String(m.usuarioId) === aliasStr ||
          (aliasNum !== undefined && Number(m.usuarioId) === aliasNum)
        ) {
          return true;
        }
      }
      if (userEmail && m.email && m.email.toLowerCase().trim() === userEmail) {
        return true;
      }
      return false;
    });
  }

  return undefined;
};

// ========================================
// Crear médico (Bloque 6C, persistir usuarioId)
// ========================================
export const crearMedico = (datos: DatosMedico): Medico => {
  const nuevoId =
    medicos.length > 0
      ? Math.max(...medicos.map((m) => m.id)) + 1
      : 1;

  const nuevoMedico: Medico = {
    id: nuevoId,
    usuarioId: sanitizarUsuarioId(datos.usuarioId),
    nombre: datos.nombre,
    registroMedico: datos.registroMedico,
    email: datos.email,
    telefono: datos.telefono,
    especialidadId: Number(datos.especialidadId),
    activo: datos.activo !== undefined ? Boolean(datos.activo) : true,
  };

  medicos.push(nuevoMedico);
  return nuevoMedico;
};

// ========================================
// Actualizar médico completo (PUT)
// ========================================
export const actualizarMedico = (id: number | string, datos: DatosMedico): Medico | null => {
  const index = medicos.findIndex((m) => m.id === Number(id));
  if (index === -1) return null;

  medicos[index] = {
    ...medicos[index],
    nombre: datos.nombre,
    registroMedico: datos.registroMedico,
    email: datos.email,
    telefono: datos.telefono,
    especialidadId: Number(datos.especialidadId),
    activo: datos.activo !== undefined ? Boolean(datos.activo) : medicos[index].activo,
    usuarioId: datos.usuarioId !== undefined ? sanitizarUsuarioId(datos.usuarioId) : medicos[index].usuarioId,
  };

  return medicos[index];
};

// ========================================
// Actualizar médico parcial (PATCH)
// ========================================
export const actualizarMedicoParcial = (id: number | string, datos: Partial<DatosMedico>): Medico | null => {
  const index = medicos.findIndex((m) => m.id === Number(id));
  if (index === -1) return null;

  if (datos.nombre !== undefined) medicos[index].nombre = datos.nombre;
  if (datos.registroMedico !== undefined) medicos[index].registroMedico = datos.registroMedico;
  if (datos.email !== undefined) medicos[index].email = datos.email;
  if (datos.telefono !== undefined) medicos[index].telefono = datos.telefono;
  if (datos.especialidadId !== undefined) medicos[index].especialidadId = Number(datos.especialidadId);
  if (datos.activo !== undefined) medicos[index].activo = Boolean(datos.activo);
  if (datos.usuarioId !== undefined) {
    medicos[index].usuarioId = sanitizarUsuarioId(datos.usuarioId);
  }

  return medicos[index];
};

// ========================================
// Eliminar médico (DELETE)
// ========================================
export const eliminarMedico = (id: number | string): boolean => {
  const index = medicos.findIndex((m) => m.id === Number(id));
  if (index === -1) return false;
  medicos.splice(index, 1);
  return true;
};

export default {
  obtenerMedicos,
  obtenerMedicoPorId,
  obtenerMedicoPorUsuarioId,
  crearMedico,
  actualizarMedico,
  actualizarMedicoParcial,
  eliminarMedico,
};
