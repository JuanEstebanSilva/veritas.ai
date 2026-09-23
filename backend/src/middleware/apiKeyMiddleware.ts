import { Request, Response, NextFunction } from 'express';
import { buscarClientePorApiKey } from '../services/apiClients.service';

/**
 * Autenticación del CLIENTE mediante API Key (Labs 5 y 6).
 *
 *   sin cabecera X-API-Key .............. 401 API Key requerida
 *   su hash no coincide con ninguno ...... 401 API Key inválida
 *   coincide, pero el cliente está inactivo 403 API Key deshabilitada
 *   coincide y está activo ............... req.apiClient = { id, name } → next()
 *
 * 401 significa «no sé quién eres»; 403, «sé quién eres, pero tu credencial
 * está revocada».
 */
export const validarApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // El health check queda fuera para que los monitores de disponibilidad no necesiten credencial
  const path = req.originalUrl || req.url;
  if (path.startsWith('/api/health')) {
    next();
    return;
  }

  // Express normaliza el nombre de las cabeceras; solo se acepta en la cabecera, nunca en la URL
  const apiKeyRecibida = req.get('X-API-Key');
  if (!apiKeyRecibida) {
    res.status(401).json({ success: false, message: 'API Key requerida', mensaje: 'API Key requerida' });
    return;
  }

  try {
    const resultado = await buscarClientePorApiKey(apiKeyRecibida);

    if (resultado.estado === 'invalida') {
      res.status(401).json({ success: false, message: 'API Key inválida', mensaje: 'API Key inválida' });
      return;
    }
    if (resultado.estado === 'deshabilitada') {
      res.status(403).json({ success: false, message: 'API Key deshabilitada', mensaje: 'API Key deshabilitada' });
      return;
    }

    req.apiClient = resultado.cliente;
    (req as any).clienteApi = {
      id: resultado.cliente.id,
      nombre: resultado.cliente.name,
    };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware montado en app.ts. En las pruebas automatizadas se omite para no
 * obligar a cada test de negocio a llevar una API Key; la lógica de la capa se
 * prueba aparte, llamando a validarApiKey directamente (tests/apiClients.test.ts).
 */
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'test') {
    next();
    return;
  }
  void validarApiKey(req, res, next);
};
