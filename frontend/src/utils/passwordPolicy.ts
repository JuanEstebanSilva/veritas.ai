/**
 * Misma política que aplica el backend (backend/src/utils/passwordPolicy.ts).
 * Validar aquí solo mejora la experiencia: el servidor vuelve a comprobarlo.
 */
export const PASSWORD_MIN = 10;
/** bcrypt solo procesa los primeros 72 bytes de la contraseña. */
export const PASSWORD_MAX = 72;

export const validarPassword = (password: string): string | null => {
  const caracteres = [...password].length;
  if (caracteres < PASSWORD_MIN || caracteres > PASSWORD_MAX) {
    return `La contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres.`;
  }
  if (new TextEncoder().encode(password).length > PASSWORD_MAX) {
    return `La contraseña supera los ${PASSWORD_MAX} bytes permitidos: usa menos tildes o símbolos especiales.`;
  }
  return null;
};
