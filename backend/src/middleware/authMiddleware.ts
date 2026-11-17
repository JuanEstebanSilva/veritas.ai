import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../config/prisma';
import { User } from '@prisma/client';

import { AuthenticatedRequest, JwtPayload } from '../types';
export type { AuthenticatedRequest };

export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Debes iniciar sesión para utilizar el analizador.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || ENV.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as any;

    const targetUserId = decoded.userId || decoded.sub;

    const user = await prisma.user.findUnique({
      where: { id: String(targetUserId) },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o sesión inválida.',
      });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Comunícate con el administrador.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expirado',
        mensaje: 'Token expirado',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Tu sesión ha expirado o el token es inválido. Inicia sesión nuevamente.',
      mensaje: 'Token inválido',
    });
  }
};
