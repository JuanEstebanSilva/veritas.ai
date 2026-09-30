import jwt from 'jsonwebtoken';

/**
 * Laboratorio No. 9 — Construcción del proyecto — Autenticación con JWT
 * PARTE 5 — Crear jwt.util
 *
 * Utilidad centralizada para configuración, emisión y verificación de tokens JWT.
 * Sigue las buenas prácticas de OWASP:
 * - Algoritmo simétrico seguro explícito (HS256)
 * - Restricción estricta de algoritmos en verificación (previene algorithm confusion)
 * - Identificador único en subject (sub)
 * - Control de expiración (exp)
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
  [key: string]: any;
}

export interface TokenPayloadDecoded {
  sub: string;
  email: string;
  rol: string;
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
// Generar JWT
// ========================================
export const generarToken = (usuario: UsuarioTokenPayload): string => {
  const { secret, expiresIn } = obtenerConfiguracionJWT();

  const rol =
    usuario.rol ||
    (usuario.role ? String(usuario.role).toLowerCase() : 'user');

  const payload = {
    email: usuario.email,
    rol: rol,
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
