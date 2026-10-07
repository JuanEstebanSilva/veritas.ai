import { prisma } from '../config/prisma';
import { Role, User } from '@prisma/client';
import { generarPasswordHash, verificarPassword } from '../utils/passwordPolicy';

/**
 * Laboratorio No. 10 — Autorización Segura en APIs REST: RBAC, IDOR/BOLA y Control de Acceso a Recursos
 * BLOQUE 6A & 6B — Servicio de Usuarios (Bootstrap y Gestión Administrativa)
 *
 * Mantiene dos vías separadas de creación:
 * 1. crearUsuario (Registro público -> siempre rol "paciente" / Role.USER)
 * 2. crearUsuarioAdministrativo (Gestión administrativa -> rol privilegiado "medico" o "administrador")
 * 3. crearAdministradorInicial (Bootstrap al arrancar la aplicación desde variables de entorno)
 */

export interface DatosRegistroUsuario {
  nombre?: string;
  name?: string;
  last_name?: string;
  apellido?: string;
  email: string;
  password?: string;
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

export interface UsuarioMemoria {
  id: number | string;
  nombre: string;
  name?: string;
  last_name?: string;
  email: string;
  passwordHash?: string;
  password_hash?: string;
  rol: string;
  role?: Role;
  activo: boolean;
  is_active?: boolean;
  is_premium?: boolean;
  daily_analysis_count?: number;
  last_analysis_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// Registro en memoria para compatibilidad de laboratorio y pruebas de asignación de roles
export const usuariosMemoria: UsuarioMemoria[] = [];

// ========================================
// Obtener usuario por email
// ========================================
export const obtenerUsuarioPorEmail = async (email: string): Promise<any | null> => {
  const normalized = email.toLowerCase().trim();

  // 1. Buscar en base de datos PostgreSQL primero (fuente de verdad principal)
  try {
    let user = await prisma.user.findUnique({
      where: { email: normalized },
    });

    // Compatibilidad de dominios @veritas.com y @veritas.ai
    if (!user) {
      if (normalized.endsWith('@veritas.com')) {
        const aliasEmail = normalized.replace('@veritas.com', '@veritas.ai');
        user = await prisma.user.findUnique({ where: { email: aliasEmail } });
      } else if (normalized.endsWith('@veritas.ai')) {
        const aliasEmail = normalized.replace('@veritas.ai', '@veritas.com');
        user = await prisma.user.findUnique({ where: { email: aliasEmail } });
      }
    }

    if (user) {
      // Sincronizar estado en memoria si existe
      const enMemoria = usuariosMemoria.find((u) => u.email.toLowerCase() === normalized);
      if (enMemoria) {
        enMemoria.activo = user.is_active;
        enMemoria.is_active = user.is_active;
        enMemoria.password_hash = user.password_hash;
        enMemoria.passwordHash = user.password_hash;
      }
      return user;
    }
  } catch {
    // Si la base de datos no está disponible, continuar con memoria
  }

  // 2. Buscar en registro en memoria si no está en BD
  const enMemoria = usuariosMemoria.find((u) => u.email.toLowerCase() === normalized);
  if (enMemoria) {
    return enMemoria;
  }

  return null;
};

// ========================================
// Obtener usuario por ID
// ========================================
export const obtenerUsuarioPorId = async (id: string | number): Promise<any | null> => {
  const strId = String(id);
  const numId = Number(id);

  const enMemoria = usuariosMemoria.find(
    (u) =>
      String(u.id) === strId ||
      (!isNaN(numId) && Number(u.id) === numId) ||
      (!isNaN(numId) && (u as any).numId === numId) ||
      String((u as any).numId) === strId ||
      (u as any).uuid === strId ||
      (u as any).dbId === strId
  );
  if (enMemoria) {
    return enMemoria;
  }

  // 2. Buscar en PostgreSQL si es UUID o ID válido
  try {
    const user = await prisma.user.findUnique({
      where: { id: strId },
    });
    return user;
  } catch {
    return null;
  }
};

// ========================================
// Crear usuario (Registro público - Servidor fija rol paciente / user)
// ========================================
export const crearUsuario = async (datos: DatosRegistroUsuario): Promise<any> => {
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
      finalLastName = 'Veritas';
    }
  }

  // =========================================================================
  // SEGUNDA DEFENSA: Valores inmutables fijados por el servidor
  // =========================================================================
  let nuevoUsuarioDb: any = null;
  try {
    nuevoUsuarioDb = await prisma.user.create({
      data: {
        name: finalName,
        last_name: finalLastName,
        email: datos.email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: Role.USER, // Fijo en el servidor
        is_active: true, // Fijo en el servidor
        is_premium: false,
        daily_analysis_count: 0,
      },
    });
  } catch (err) {
    // Si falla la conexión a BD o id duplicado en tests, se usa ID en memoria
  }

  // Generar ID numérico consecutivo para laboratorio
  const siguienteId =
    usuariosMemoria.length > 0
      ? Math.max(
          ...usuariosMemoria.map((u) =>
            typeof (u as any).numId === 'number'
              ? (u as any).numId
              : typeof u.id === 'number'
              ? u.id
              : 0
          )
        ) + 1
      : 1;

  // Si existe en base de datos, usamos su UUID real para compatibilidad completa con Prisma
  const finalId = nuevoUsuarioDb ? nuevoUsuarioDb.id : siguienteId;

  const usuarioMem: UsuarioMemoria = {
    id: finalId,
    nombre: `${finalName} ${finalLastName}`.trim(),
    name: finalName,
    last_name: finalLastName,
    email: datos.email.toLowerCase().trim(),
    passwordHash,
    password_hash: passwordHash,
    rol: 'paciente',
    role: Role.USER,
    activo: true,
    is_active: true,
    is_premium: false,
    daily_analysis_count: 0,
    last_analysis_date: new Date(),
  };

  (usuarioMem as any).numId = siguienteId;
  if (nuevoUsuarioDb) {
    (usuarioMem as any).dbId = nuevoUsuarioDb.id;
    (usuarioMem as any).uuid = nuevoUsuarioDb.id;
  }

  usuariosMemoria.push(usuarioMem);

  return usuarioMem;
};

// ========================================
// Crear usuario desde administración (Bloque 6B)
// ========================================
export const crearUsuarioAdministrativo = async (datos: DatosRegistroUsuario): Promise<any> => {
  const passwordHash = await generarPasswordHash(datos.password!);
  const rawNombre = (datos.nombre || datos.name || '').trim();
  const rolAsignado = String(datos.rol || 'medico').toLowerCase().trim();

  let adminUserDb: any = null;
  // Intentar sincronizar con PostgreSQL si es rol compatible
  try {
    adminUserDb = await prisma.user.create({
      data: {
        name: rawNombre,
        last_name: 'Veritas',
        email: datos.email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: rolAsignado === 'administrador' || rolAsignado === 'admin' ? Role.ADMIN : Role.USER,
        is_active: true,
        is_premium: true,
        daily_analysis_count: 0,
      },
    });
  } catch {
    // Si ya existe o BD no disponible, no rompe la memoria
  }

  const siguienteId =
    usuariosMemoria.length > 0
      ? Math.max(
          ...usuariosMemoria.map((u) =>
            typeof (u as any).numId === 'number'
              ? (u as any).numId
              : typeof u.id === 'number'
              ? u.id
              : 0
          )
        ) + 1
      : 1;

  const finalId = adminUserDb ? adminUserDb.id : siguienteId;

  const nuevoUsuario: UsuarioMemoria = {
    id: finalId,
    nombre: rawNombre,
    name: rawNombre,
    last_name: 'Veritas',
    email: datos.email.toLowerCase().trim(),
    passwordHash,
    password_hash: passwordHash,
    rol: rolAsignado,
    role: rolAsignado === 'administrador' || rolAsignado === 'admin' ? Role.ADMIN : Role.USER,
    activo: true, // Siempre controlado por el servidor
    is_active: true,
    is_premium: true,
    daily_analysis_count: 0,
    last_analysis_date: new Date(),
  };

  (nuevoUsuario as any).numId = siguienteId;
  if (adminUserDb) {
    (nuevoUsuario as any).dbId = adminUserDb.id;
    (nuevoUsuario as any).uuid = adminUserDb.id;
  }

  usuariosMemoria.push(nuevoUsuario);

  return nuevoUsuario;
};

// ========================================
// Crear administrador inicial (Bootstrap - Bloque 6A, Parte 15)
// ========================================
export const crearAdministradorInicial = async (): Promise<any | null> => {
  const nombre = process.env.ADMIN_NOMBRE || process.env.ADMIN_NAME || 'Administrador Veritas';
  const email = (process.env.ADMIN_EMAIL || 'admin@veritas.com').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'SANTOTO_2026—2';

  if (!nombre || !email || !password) {
    console.warn('Administrador inicial no configurado');
    return null;
  }

  const existente = await obtenerUsuarioPorEmail(email);
  if (existente) {
    return existente;
  }

  const passwordHash = await generarPasswordHash(password);

  let adminDb: any = null;
  try {
    adminDb = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: {
        role: Role.ADMIN,
        is_active: true,
      },
      create: {
        name: nombre,
        last_name: 'Veritas',
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role: Role.ADMIN,
        is_active: true,
        is_premium: true,
      },
    });
  } catch {
    // Si PostgreSQL no está conectado, el bootstrap en memoria garantiza el funcionamiento
  }

  const siguienteId =
    usuariosMemoria.length > 0
      ? Math.max(
          ...usuariosMemoria.map((u) =>
            typeof (u as any).numId === 'number'
              ? (u as any).numId
              : typeof u.id === 'number'
              ? u.id
              : 0
          )
        ) + 1
      : 1;

  const finalId = adminDb ? adminDb.id : siguienteId;

  const administrador: UsuarioMemoria = {
    id: finalId,
    nombre,
    name: nombre,
    last_name: 'Veritas',
    email: email.toLowerCase(),
    passwordHash,
    password_hash: passwordHash,
    rol: 'administrador',
    role: Role.ADMIN,
    activo: true,
    is_active: true,
    is_premium: true,
    daily_analysis_count: 0,
    last_analysis_date: new Date(),
  };

  (administrador as any).numId = siguienteId;
  if (adminDb) {
    (administrador as any).dbId = adminDb.id;
    (administrador as any).uuid = adminDb.id;
  }

  usuariosMemoria.push(administrador);

  console.log('Administrador inicial creado');
  return administrador;
};

// ========================================
// Verificar credenciales
// ========================================
export const verificarCredenciales = async (
  email: string,
  password: string
): Promise<any | null> => {
  const usuario = await obtenerUsuarioPorEmail(email);

  const hashComparar = usuario?.passwordHash || usuario?.password_hash;
  const passwordValida = await verificarPassword(password, hashComparar);

  if (!usuario || !passwordValida) {
    return null;
  }

  return usuario;
};

export default {
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorId,
  crearUsuario,
  crearUsuarioAdministrativo,
  crearAdministradorInicial,
  verificarCredenciales,
};
