import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../utils/jwt.util';
import { prisma } from '../config/prisma';
import usuariosService from '../services/usuarios.service';

/**
 * Laboratorio No. 9 y Bloque 11 — Veritas AI
 * Autenticación con JWT, verificación de cuenta activa y version_sesion (vs)
 *
 * Middleware para validar el token Bearer en cabecera Authorization.
 * Descompone, verifica firma criptográfica (HS256), comprueba vigencia (exp),
 * valida que el usuario no esté deshabilitado y rechaza tokens anteriores
 * tras un cambio o restablecimiento de contraseña (Sesión revocada).
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
  const partes = authorization.trim().split(/\s+/);
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
    // Consultar identidad real y version_sesion
    // ------------------------------------
    const subVal = payload.sub;
    const subNum = Number(subVal);
    const usuarioId = !isNaN(subNum) && String(subNum) === String(subVal) ? subNum : subVal;

    const usuario = await usuariosService.obtenerUsuarioPorId(usuarioId);
    if (!usuario) {
      res.status(401).json({
        success: false,
        message: 'La cuenta asociada al token no existe',
        mensaje: 'La cuenta asociada al token no existe',
      });
      return;
    }

    if (usuario.activo === false || usuario.is_active === false) {
      res.status(403).json({
        success: false,
        message: 'Usuario deshabilitado',
        mensaje: 'Usuario deshabilitado',
      });
      return;
    }

    // Rechazar JWT emitidos antes de un cambio de contraseña
    const vsUsuario = typeof usuario.versionSesion === 'number'
      ? usuario.versionSesion
      : typeof usuario.version_sesion === 'number'
      ? usuario.version_sesion
      : 0;

    if (!Number.isSafeInteger(payload.vs) || payload.vs !== vsUsuario) {
      res.status(401).json({
        success: false,
        message: 'Sesión revocada',
        mensaje: 'Sesión revocada',
      });
      return;
    }

    // ------------------------------------
    // Asociar usuario a la petición
    // ------------------------------------
    req.usuario = {
      id: usuarioId,
      email: usuario.email || payload.email,
      rol: usuario.rol || payload.rol,
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
