import { Request, Response, NextFunction } from 'express';
import { buscarClientePorApiKey } from '../services/apiClients.service';

/**
 * Autenticación del CLIENTE mediante API Key (Labs 5, 6 y Bloque 11).
 *
 *   sin cabecera X-API-Key .............. 401 API Key requerida
 *   su hash no coincide con ninguno ...... 401 API Key inválida
 *   coincide, pero el cliente está inactivo 403 API Key deshabilitada
 *   coincide y está activo ............... req.apiClient = { id, name } → next()
 *
 * En el Bloque 11 (LAB 11.6.3):
 * - Login público (/api/auth/login) es controlado y no exige API Key.
 * - Recursos protegidos por JWT en sus propios routers (/estudiantes, /docentes, /departamentos,
 *   /laboratorios, /revisiones, /usuarios) no exigen API Key obligatoria.
 * - Rutas de autenticación con JWT (/auth/perfil, /auth/cambiar-password, /auth/recuperacion/admin,
 *   /auth/codigos-recuperacion) se gestionan por BearerAuth.
 * - Integraciones privadas (ej. /seguridad/cliente, /auth/restablecer-password,
 *   /auth/restablecer-con-codigo) exigen API Key de cliente privado.
 */

const rutasRecursosJWT = new Set([
  '/estudiantes',
  '/pacientes',
  '/departamentos',
  '/especialidades',
  '/materias',
  '/docentes',
  '/medicos',
  '/profesores',
  '/auditores',
  '/laboratorios',
  '/consultorios',
  '/nodos',
  '/revisiones',
  '/citas',
  '/escaneos',
  '/usuarios',
  '/users',
  '/analyses',
  '/writing',
  '/payments',
]);

const rutasAuthJWT = new Set([
  '/auth/perfil',
  '/auth/profile',
  '/auth/cambiar-password',
  '/auth/change-password',
  '/auth/recuperacion',
  '/auth/recovery',
  '/auth/codigos-recuperacion',
  '/auth/recovery-codes',
]);

export const validarApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Express normaliza el nombre de las cabeceras; solo se acepta en la cabecera, nunca en la URL
  const apiKeyRecibida = req.get('X-API-Key');
  if (!apiKeyRecibida) {
    res.status(401).json({
      success: false,
      message: 'API Key requerida',
      mensaje: 'API Key requerida',
    });
    return;
  }

  try {
    const resultado = await buscarClientePorApiKey(apiKeyRecibida);

    if (resultado.estado === 'invalida') {
      res.status(401).json({
        success: false,
        message: 'API Key inválida',
        mensaje: 'API Key inválida',
      });
      return;
    }
    if (resultado.estado === 'deshabilitada') {
      res.status(403).json({
        success: false,
        message: 'API Key deshabilitada',
        mensaje: 'API Key deshabilitada',
      });
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
 * Middleware de control de credenciales en /api (Laboratorio / Bloque 11)
 */
export const apiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const path = req.path || '';

  // 0. Modo de prueba para forzar verificación de API Key
  if (process.env.ENFORCE_API_KEY_IN_TEST === 'true') {
    void validarApiKey(req, res, next);
    return;
  }

  // 1. Health check público
  if (path.startsWith('/health')) {
    return next();
  }

  // 2. Login público controlado: no exige API Key
  if (req.method === 'POST' && (path === '/auth/login' || path === '/auth/login/')) {
    const apiKey = req.get('X-API-Key');
    if (apiKey) {
      void validarApiKey(req, res, next);
      return;
    }
    return next();
  }

  // 3. Recursos protegidos por JWT en sus propios routers
  const partes = path.split('/').filter(Boolean);
  const recurso = '/' + (partes[0] || '');

  if (rutasRecursosJWT.has(recurso)) {
    const apiKey = req.get('X-API-Key');
    if (apiKey) {
      void validarApiKey(req, res, next);
      return;
    }
    return next();
  }

  // 4. Rutas de autenticación protegidas por JWT
  const rutaAuth = '/' + partes.slice(0, 2).join('/');
  if (rutasAuthJWT.has(rutaAuth)) {
    const apiKey = req.get('X-API-Key');
    if (apiKey) {
      void validarApiKey(req, res, next);
      return;
    }
    return next();
  }

  // 5. Clientes privados e integraciones (requieren API Key)
  void validarApiKey(req, res, next);
};

export default apiKeyMiddleware;
