import { Response, NextFunction, RequestHandler } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { Role } from '@prisma/client';

/**
 * RBAC — Lab 10. Responde «¿tu ROL puede hacer esta operación?».
 *
 *   authenticateJWT (¿quién eres?) → authorizeRoles (¿qué puede hacer tu rol?) → validadores → controlador
 *
 * 401: no hay identidad autenticada. 403: sabemos quién eres, pero tu rol no tiene permiso.
 * El rol sale de req.user, que authenticateJWT lee de la base de datos en cada petición (Lab 9),
 * nunca del cuerpo de la petición ni de un claim que el cliente pueda reescribir.
 *
 * Uso: authorizeRoles(Role.ADMIN) · authorizeRoles(Role.ADMIN, Role.DOCENTE) · …
 */
export const authorizeRoles = (...rolesPermitidos: Role[]): RequestHandler => {
  const handler = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Autenticación requerida.', mensaje: 'Usuario no autenticado' });
      return;
    }
    if (!rolesPermitidos.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: rolesPermitidos.length === 1 && rolesPermitidos[0] === Role.ADMIN
          ? 'Acceso denegado: Se requieren permisos administrativos.'
          : 'Acceso denegado: tu rol no tiene permiso para realizar esta operación.',
        mensaje: 'No tiene permisos para realizar esta operación',
      });
      return;
    }
    next();
  };
  return handler as RequestHandler;
};

/** Operaciones exclusivas del administrador único (Lab 8). */
export const requireAdmin = authorizeRoles(Role.ADMIN);

/**
 * Middleware para sanitizar payloads y prevenir escalada de privilegios
 * (un usuario normal no puede alterar su propio rol, límite de análisis o estado premium)
 */
export const preventPrivilegeEscalation = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role !== Role.ADMIN) {
    // Si un usuario normal intenta enviar campos restringidos
    if (
      req.body.role !== undefined ||
      req.body.is_premium !== undefined ||
      req.body.daily_analysis_count !== undefined ||
      req.body.premium_since !== undefined
    ) {
      res.status(403).json({
        success: false,
        message: 'Acción no permitida: No tienes autorización para modificar atributos privilegiados.',
      });
      return;
    }
  }
  next();
};
