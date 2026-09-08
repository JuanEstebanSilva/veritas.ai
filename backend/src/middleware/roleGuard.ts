import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { Role } from '@prisma/client';

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Autenticación requerida.',
    });
    return;
  }

  if (req.user.role !== Role.ADMIN) {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado: Se requieren permisos administrativos.',
    });
    return;
  }

  next();
};

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
