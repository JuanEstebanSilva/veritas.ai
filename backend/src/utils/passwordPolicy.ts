import bcrypt from 'bcryptjs';

/**
 * Política de contraseñas (Lab 7 — Bloque 4A: usuarios, hashing y salting).
 *
 * A diferencia de las API Keys (aleatorias, 256 bits, SHA-256), las contraseñas
 * las elige una persona: tienen poca entropía y son atacables con diccionarios.
 * Por eso se usa bcrypt, lento a propósito y con un salt aleatorio por hash que
 * viaja dentro del propio hash ($2b$12$<22 caracteres de salt><31 de hash>).
 */

/** Factor de coste: 2^12 iteraciones por cada hash o verificación. */
export const SALT_ROUNDS = 12;
export const PASSWORD_MIN = 10;
/** bcrypt solo procesa los primeros 72 bytes; lo que sigue se ignoraría en silencio. */
export const PASSWORD_MAX = 72;

/**
 * Devuelve el motivo del rechazo, o null si la contraseña cumple la política.
 * La longitud se cuenta en caracteres para el usuario, y además se exige que
 * no pase de 72 bytes, porque «ñ» o «á» ocupan dos bytes en UTF-8.
 */
export const validarPassword = (password: unknown): string | null => {
  if (typeof password !== 'string' || password.length === 0) {
    return 'La contraseña es obligatoria.';
  }
  const caracteres = [...password].length;
  if (caracteres < PASSWORD_MIN || caracteres > PASSWORD_MAX) {
    return `La contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres.`;
  }
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX) {
    return `La contraseña supera los ${PASSWORD_MAX} bytes que procesa bcrypt: usa menos tildes o símbolos especiales.`;
  }
  return null;
};

/** Hash con salt aleatorio y coste 12. La misma contraseña produce hashes distintos. */
export const generarPasswordHash = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

/**
 * Hash ficticio con el mismo coste, calculado una sola vez al cargar el módulo.
 * Cuando el correo no existe se verifica contra él, para que ese camino tarde
 * lo mismo que el de un correo registrado y el tiempo de respuesta no revele
 * qué cuentas existen.
 */
const HASH_FICTICIO = bcrypt.hashSync('plagelio · cuenta inexistente · no coincide', SALT_ROUNDS);

/**
 * Verifica la contraseña contra el hash del usuario o, si no hay usuario,
 * contra el hash ficticio. bcrypt se ejecuta SIEMPRE, exista o no la cuenta.
 */
export const verificarPassword = (password: string, hashUsuario?: string | null): Promise<boolean> =>
  bcrypt.compare(password, hashUsuario ?? HASH_FICTICIO);
