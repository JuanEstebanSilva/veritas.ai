import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Middleware para validar la API Key en los endpoints protegidos.
 */
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const apiKeyConfigurada = process.env.API_KEY;

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

  const recibido = Buffer.from(apiKeyRecibida);
  const esperado = Buffer.from(apiKeyConfigurada);

  // timingSafeEqual exige buffers del mismo tamaño
  if (recibido.length !== esperado.length || !crypto.timingSafeEqual(recibido, esperado)) {
    res.status(401).json({ success: false, message: "API Key inválida" });
    return;
  }

  next();
};
