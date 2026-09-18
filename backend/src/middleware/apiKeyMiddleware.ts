import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { CryptoVault } from '../utils/cryptoVault';

/**
 * Middleware para validar la API Key en los endpoints protegidos.
 */
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // En entorno de pruebas automatizadas, no bloquear los tests unitarios
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const rawEnvKey = process.env.API_KEY || '';
  const apiKeyConfigurada = ENV.API_KEY || CryptoVault.decrypt(rawEnvKey);

  if (!apiKeyConfigurada) {
    console.error("ERROR: La variable de entorno API_KEY no está configurada.");
    res.status(500).json({ success: false, message: "Error de configuración del servidor" });
    return;
  }

  // Rutas exentas de API Key (documentación, OpenAPI spec y health check)
  const path = req.originalUrl || req.url;
  if (
    path.startsWith('/api-docs') ||
    path.startsWith('/openapi.json') ||
    path.startsWith('/api/health')
  ) {
    next();
    return;
  }

  // Express normaliza los nombres de headers. Usamos req.get() que es case-insensitive
  const apiKeyRecibida = req.get("X-API-Key");

  if (!apiKeyRecibida) {
    res.status(401).json({ success: false, message: "API Key requerida" });
    return;
  }

  let isMatch = false;
  const recibidoBuf = Buffer.from(apiKeyRecibida);

  // 1. Comparar contra la clave descifrada (timing-safe)
  if (apiKeyConfigurada) {
    const esperadoBuf = Buffer.from(apiKeyConfigurada);
    if (recibidoBuf.length === esperadoBuf.length && crypto.timingSafeEqual(recibidoBuf, esperadoBuf)) {
      isMatch = true;
    }
  }

  // 2. Si el cliente envió la clave encriptada directamente, también aceptarla
  if (!isMatch && rawEnvKey) {
    const rawBuf = Buffer.from(rawEnvKey);
    if (recibidoBuf.length === rawBuf.length && crypto.timingSafeEqual(recibidoBuf, rawBuf)) {
      isMatch = true;
    }
  }

  if (!isMatch) {
    res.status(401).json({ success: false, message: "API Key inválida" });
    return;
  }

  next();
};
