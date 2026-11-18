import { Request, Response, NextFunction } from 'express';

/**
 * Límite de intentos fallidos de inicio de sesión (OWASP API4: consumo de recursos y fuerza bruta).
 *
 * Cuenta los fallos por combinación de IP y correo en una ventana deslizante. Al superar el
 * máximo responde 429 con Retry-After hasta que caduquen los fallos más antiguos. Un inicio de
 * sesión correcto limpia el contador de esa combinación.
 *
 * El registro vive en memoria: es suficiente para una instancia; con varias instancias debe
 * pasar a un almacén compartido (por ejemplo, Redis).
 */
const MAX_FALLOS = Math.max(1, parseInt(process.env.LOGIN_MAX_ATTEMPTS || '10', 10));
const VENTANA_MS = Math.max(1, parseInt(process.env.LOGIN_WINDOW_MINUTES || '15', 10)) * 60_000;
const fallos = new Map<string, number[]>();

const clave = (req: Request) => `${req.ip}|${String(req.body?.email || '').toLowerCase().trim()}`;
const vigentes = (k: string, ahora: number) => (fallos.get(k) || []).filter((t) => ahora - t < VENTANA_MS);

export const limitarIntentosLogin = (req: Request, res: Response, next: NextFunction): void => {
  const k = clave(req);
  const ahora = Date.now();
  const lista = vigentes(k, ahora);
  if (lista.length >= MAX_FALLOS) {
    const espera = Math.ceil((VENTANA_MS - (ahora - lista[0])) / 1000);
    res.setHeader('Retry-After', String(espera));
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.',
      mensaje: 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.',
    });
    return;
  }
  // Registrar el resultado cuando termine la respuesta
  res.on('finish', () => {
    if (res.statusCode === 200) fallos.delete(k);
    else if (res.statusCode === 401) {
      fallos.set(k, [...vigentes(k, Date.now()), Date.now()]);
      // Con muchos correos distintos el registro crecería sin límite: se purgan las entradas caducadas
      if (fallos.size > 10_000) {
        const t = Date.now();
        for (const key of fallos.keys()) if (vigentes(key, t).length === 0) fallos.delete(key);
      }
    }
  });
  next();
};

/** Solo para pruebas: vacía el registro. */
export const reiniciarIntentosLogin = () => fallos.clear();
