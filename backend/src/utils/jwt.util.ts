import jwt from 'jsonwebtoken';

/**
 * Laboratorio No. 9 y Bloque 11 — Veritas AI
 * Autenticación con JWT e invalidación de sesión por versionSesion (vs)
 *
 * Utilidad centralizada para configuración, emisión y verificación de tokens JWT.
 * Sigue las buenas prácticas de OWASP:
 * - Algoritmo simétrico seguro explícito (HS256)
 * - Restricción estricta de algoritmos en verificación (previene algorithm confusion)
 * - Identificador único en subject (sub)
 * - Control de expiración (exp)
 * - Versión de sesión (vs) para invalidación al cambiar o restablecer contraseña
 * - No incluye datos sensibles (contraseñas ni hashes) en el payload
 */

export interface ConfiguracionJWT {
  secret: string;
  expiresIn: string;
}

export interface UsuarioTokenPayload {
  id: string | number;
  email: string;
  rol?: string;
  role?: string;
  nombre?: string;
  name?: string;
  versionSesion?: number;
  version_sesion?: number;
  vs?: number;
  [key: string]: any;
}

export interface TokenPayloadDecoded {
  sub: string;
  email: string;
  rol: string;
  vs?: number;
  iat: number;
  exp: number;
  [key: string]: any;
}

// ========================================
// Obtener configuración JWT
// ========================================
export const obtenerConfiguracionJWT = (): ConfiguracionJWT => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

  if (!secret) {
    throw new Error('JWT_SECRET no está configurado');
  }

  return {
    secret,
    expiresIn,
  };
};

// ========================================
// Generar JWT con control de version_sesion (vs)
// ========================================
export const generarToken = (usuario: UsuarioTokenPayload): string => {
  const { secret, expiresIn } = obtenerConfiguracionJWT();

  const rol =
    usuario.rol ||
    (usuario.role ? String(usuario.role).toLowerCase() : 'user');

  const vs =
    typeof usuario.versionSesion === 'number'
      ? usuario.versionSesion
      : typeof usuario.version_sesion === 'number'
      ? usuario.version_sesion
      : typeof usuario.vs === 'number'
      ? usuario.vs
      : 0;

  const payload = {
    email: usuario.email,
    rol: rol,
    vs: vs,
  };

  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    subject: String(usuario.id),
    expiresIn: expiresIn as any,
  });
};

// ========================================
// Verificar JWT
// ========================================
export const verificarToken = (token: string): TokenPayloadDecoded => {
  const { secret } = obtenerConfiguracionJWT();

  return jwt.verify(token, secret, {
    algorithms: ['HS256'],
  }) as TokenPayloadDecoded;
};

export default {
  obtenerConfiguracionJWT,
  generarToken,
  verificarToken,
};
