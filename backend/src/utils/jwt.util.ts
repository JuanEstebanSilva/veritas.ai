import jwt, { SignOptions } from 'jsonwebtoken';
import '../config/env'; // carga backend/.env antes de leer process.env

/**
 * JWT de sesión (Lab 9 — Bloque 5: login + JWT).
 *
 * El token identifica a la PERSONA; la API Key identifica a la APLICACIÓN.
 * Va firmado (HMAC-SHA256), no cifrado: cualquiera puede decodificar el payload,
 * así que solo lleva lo necesario para identificar al usuario, nunca contraseñas
 * ni hashes. La firma garantiza que nadie sin JWT_SECRET pueda fabricarlo ni alterarlo.
 */

/** Único algoritmo admitido, tanto al firmar como al verificar. */
export const ALGORITMO_JWT = 'HS256' as const;

/** 64 caracteres hex = 256 bits, el tamaño de la salida de SHA-256 (RFC 7518 §3.2). */
export const LONGITUD_MINIMA_JWT_SECRET = 64;

/**
 * Secretos que han estado publicados en el repositorio (plantilla .env.example y
 * valor por defecto del código). Quien los conozca podría fabricar sesiones de
 * cualquier usuario, así que nunca se aceptan aunque cumplan la longitud.
 */
const SECRETOS_PUBLICADOS = [
  'plagelio_super_secret_jwt_token_key_change_in_production_998811',
  'veritas_ai_default_jwt_secret_change_me_123',
  'REEMPLAZAR_CON_SECRETO_JWT_SEGURO',
];

export class ConfiguracionJwtError extends Error {}

export interface ConfiguracionJwt {
  secret: string;
  expiresIn: NonNullable<SignOptions['expiresIn']>;
}

/** Claims que lleva cada token emitido por la API. */
export interface TokenPayload {
  sub: string; // id del usuario (claim estándar «subject»)
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Lee y valida la configuración. Sin valores por defecto: si falta el secreto,
 * es público o es corto, se lanza ConfiguracionJwtError (el servidor no arranca).
 */
export const obtenerConfiguracionJWT = (): ConfiguracionJwt => {
  const secret = process.env.JWT_SECRET || '';
  const duracion = (process.env.JWT_EXPIRES_IN || '1h').trim();

  if (!secret) {
    throw new ConfiguracionJwtError('JWT_SECRET no está configurado.');
  }
  if (SECRETOS_PUBLICADOS.includes(secret)) {
    throw new ConfiguracionJwtError('JWT_SECRET es un valor publicado en el repositorio; genera uno nuevo.');
  }
  if (secret.length < LONGITUD_MINIMA_JWT_SECRET) {
    throw new ConfiguracionJwtError(
      `JWT_SECRET debe tener al menos ${LONGITUD_MINIMA_JWT_SECRET} caracteres (tiene ${secret.length}).`
    );
  }

  // «3600» sin unidad se interpreta como segundos (jsonwebtoken lo leería como milisegundos)
  const expiresIn = (/^\d+$/.test(duracion) ? Number(duracion) : duracion) as ConfiguracionJwt['expiresIn'];
  try {
    jwt.sign({}, secret, { algorithm: ALGORITMO_JWT, expiresIn });
  } catch {
    throw new ConfiguracionJwtError(`JWT_EXPIRES_IN no es una duración válida: «${duracion}» (usa p. ej. 15m o 1h).`);
  }

  return { secret, expiresIn };
};

/** Emite el token de sesión: sub = id, más el correo y el rol en el momento del login. */
export const generarToken = (usuario: { id: string; email: string; role: string }): string => {
  const { secret, expiresIn } = obtenerConfiguracionJWT();
  return jwt.sign({ email: usuario.email, role: usuario.role }, secret, {
    algorithm: ALGORITMO_JWT,
    subject: String(usuario.id),
    expiresIn,
  });
};

/**
 * Verifica firma y expiración. `algorithms` se fija explícitamente: el algoritmo
 * lo decide el servidor, no la cabecera del token que envía el cliente.
 * Lanza TokenExpiredError o JsonWebTokenError si el token no es válido.
 */
export const verificarToken = (token: string): TokenPayload => {
  const { secret } = obtenerConfiguracionJWT();
  const payload = jwt.verify(token, secret, { algorithms: [ALGORITMO_JWT] });
  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw new jwt.JsonWebTokenError('El token no identifica a ningún usuario.');
  }
  return payload as TokenPayload;
};
