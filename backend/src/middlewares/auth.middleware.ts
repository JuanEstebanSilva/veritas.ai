import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../utils/jwt.util';
import { prisma } from '../config/prisma';

/**
 * Laboratorio No. 9 — Construcción del proyecto — Autenticación con JWT
 * PARTE 8 — Crear middleware JWT
 *
 * Middleware para validar el token Bearer en cabecera Authorization.
 * Descompone, verifica firma criptográfica (HS256) y comprueba vigencia (exp).
 * Asocia los datos del usuario autenticado en `req.usuario`.
 */
export const autenticarJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authorization = req.get('Authorization');

  // --------------------------------------
  // Header ausente
  // --------------------------------------
  if (!authorization) {
    res.status(401).json({
      success: false,
      message: 'Token de autenticación requerido',
      mensaje: 'Token de autenticación requerido',
    });
    return;
  }

  // --------------------------------------
  // Validar formato Bearer
  // --------------------------------------
  const partes = authorization.split(' ');
  if (
    partes.length !== 2 ||
    partes[0] !== 'Bearer' ||
    !partes[1]
  ) {
    res.status(401).json({
      success: false,
      message: 'Formato de token inválido',
      mensaje: 'Formato de token inválido',
    });
    return;
  }

  const token = partes[1];

  try {
    // ------------------------------------
    // Verificar firma y expiración
    // ------------------------------------
    const payload = verificarToken(token);

    // ------------------------------------
    // Asociar usuario a la petición
    // ------------------------------------
    const subVal = payload.sub;
    const subNum = Number(subVal);

    req.usuario = {
      id: !isNaN(subNum) && String(subNum) === String(subVal) ? subNum : subVal,
      email: payload.email,
      rol: payload.rol,
    };

    // Compatibilidad adicional para endpoints que consumen req.user en Veritas AI
    if (subVal) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: String(subVal) },
        });
        if (user) {
          (req as any).user = user;
        }
      } catch {
        // En pruebas aisladas de JWT en memoria no detiene la ejecución
      }
    }

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expirado',
        mensaje: 'Token expirado',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Token inválido',
      mensaje: 'Token inválido',
    });
  }
};

export default autenticarJWT;
