import { prisma } from '../config/prisma';
import { Role, User } from '@prisma/client';
import { generarPasswordHash, verificarPassword } from '../utils/passwordPolicy';

/**
 * Laboratorio No. 8 — Control del rol y prevención de escalada de privilegios
 * PARTE 4 — Segunda defensa: modificar usuarios.service.js
 *
 * No queremos depender únicamente de que el controller filtre correctamente.
 * El service también debe decidir explícitamente qué valores persiste.
 * La línea crítica cambió de:
 *   rol: datos.rol
 * a:
 *   rol: "paciente" (o Role.USER)
 */

export interface DatosRegistroUsuario {
  nombre?: string;
  name?: string;
  last_name?: string;
  apellido?: string;
  email: string;
  password?: string;
  // Campos maliciosos que un atacante intente colar
  rol?: any;
  role?: any;
  activo?: any;
  is_active?: any;
  id?: any;
  passwordHash?: any;
  esSuperAdmin?: any;
  permisos?: any;
  [key: string]: any;
}

// ========================================
// Obtener usuario por email
// ========================================
export const obtenerUsuarioPorEmail = async (email: string): Promise<User | null> => {
  const normalized = email.toLowerCase().trim();
  let user = await prisma.user.findUnique({
    where: { email: normalized },
  });

  // Compatibilidad de dominios @plagelio.com y @veritas.ai
  if (!user) {
    if (normalized.endsWith('@plagelio.com')) {
      const legacyEmail = normalized.replace('@plagelio.com', '@veritas.ai');
      user = await prisma.user.findUnique({ where: { email: legacyEmail } });
    } else if (normalized.endsWith('@veritas.ai')) {
      const newEmail = normalized.replace('@veritas.ai', '@plagelio.com');
      user = await prisma.user.findUnique({ where: { email: newEmail } });
    }
  }

  return user;
};

// ========================================
// Obtener usuario por ID
// ========================================
export const obtenerUsuarioPorId = async (id: string | number): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id: String(id) },
  });
};

// ========================================
// Crear usuario (Segunda defensa - Servidor controla rol y estado)
// ========================================
export const crearUsuario = async (datos: DatosRegistroUsuario): Promise<User> => {
  const passwordHash = await generarPasswordHash(datos.password!);

  const rawNombre = (datos.nombre || datos.name || '').trim();
  const rawApellido = (datos.last_name || datos.apellido || '').trim();

  let finalName = rawNombre;
  let finalLastName = rawApellido;

  if (!finalLastName) {
    const parts = rawNombre.split(' ');
    if (parts.length > 1) {
      finalName = parts[0];
      finalLastName = parts.slice(1).join(' ');
    } else {
      finalLastName = 'Usuario';
    }
  }

  // =========================================================================
  // SEGUNDA DEFENSA: Allowlisting en el servicio y valores fijados por servidor
  // Bajo ninguna circunstancia se confía en datos.rol, datos.activo, datos.id, etc.
  // =========================================================================
  const nuevoUsuario = await prisma.user.create({
    data: {
      name: finalName,
      last_name: finalLastName,
      email: datos.email.toLowerCase().trim(),
      password_hash: passwordHash,
      // ====================================
      // Valores controlados por el servidor
      // ====================================
      role: Role.USER, // Fijo en el servidor (nunca datos.rol ni datos.role)
      is_active: true, // Fijo en el servidor (nunca datos.activo)
      is_premium: false,
      daily_analysis_count: 0,
    },
  });

  return nuevoUsuario;
};

// ========================================
// Verificar credenciales
// ========================================
export const verificarCredenciales = async (
  email: string,
  password: string
): Promise<User | null> => {
  const usuario = await obtenerUsuarioPorEmail(email);

  // bcrypt se ejecuta SIEMPRE (tiempo constante)
  const passwordValida = await verificarPassword(password, usuario?.password_hash);

  if (!usuario || !passwordValida) {
    return null;
  }

  return usuario;
};

export default {
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorId,
  crearUsuario,
  verificarCredenciales,
};
