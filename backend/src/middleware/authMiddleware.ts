import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { verificarToken, TokenPayload } from '../utils/jwt.util';

import { AuthenticatedRequest } from '../types';
export type { AuthenticatedRequest };

// message: texto para la web; mensaje: el mismo contrato que la API del Hospital (Labs 6–9)
const rechazar = (res: Response, status: number, message: string, mensaje: string): void => {
  res.status(status).json({ success: false, message, mensaje });
};

/**
 * Autenticación de la PERSONA mediante JWT (Lab 9). Corre después de la API Key,
 * que ya identificó a la APLICACIÓN: así cada petición protegida responde a
 * «¿qué cliente?» (req.apiClient) y «¿qué usuario?» (req.user).
 *
 * Authorization → Bearer <token> → jwt.verify (firma + exp + HS256) → BD → req.user
 */
export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authorization = req.get('Authorization');

  if (!authorization) {
    rechazar(res, 401, 'Token de autenticación requerido.', 'Token de autenticación requerido');
    return;
  }

  const partes = authorization.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer' || !partes[1]) {
    rechazar(res, 401, 'Formato de token inválido. Usa: Authorization: Bearer <token>.', 'Formato de token inválido');
    return;
  }

  let payload: TokenPayload;
  try {
    payload = verificarToken(partes[1]);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      rechazar(res, 401, 'Token expirado. Inicia sesión nuevamente.', 'Token expirado');
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      rechazar(res, 401, 'Token inválido.', 'Token inválido');
      return;
    }
    next(error);
    return;
  }

  try {
    // El token solo dice QUIÉN es (sub). El rol y el estado se leen de la base de
    // datos en cada petición: si el administrador desactiva una cuenta o le cambia
    // el rol, sus tokens ya emitidos dejan de dar esos privilegios al instante.
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      rechazar(res, 401, 'Token inválido.', 'Token inválido');
      return;
    }

    if (!user.is_active) {
      rechazar(res, 403, 'Tu cuenta ha sido desactivada. Comunícate con el administrador.', 'Usuario deshabilitado');
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
