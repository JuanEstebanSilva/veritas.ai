import { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import usuariosService from '../services/usuarios.service';

/**
 * Laboratorio No. 10 — Autorización Segura en APIs REST: RBAC, IDOR/BOLA y Control de Acceso
 * BLOQUE 6B — PARTE 5: Crear controller de usuarios
 *
 * Controlador para la creación de usuarios administrativos (médico o administrador)
 * Solo ejecutable por un Administrador autenticado.
 */
export const crearUsuario = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const datos = matchedData(req, {
      locations: ['body'],
    }) as { nombre: string; email: string; password: string; rol: string };

    // ------------------------------------
    // Verificar email duplicado
    // ------------------------------------
    const usuarioExistente = await usuariosService.obtenerUsuarioPorEmail(datos.email);
    if (usuarioExistente) {
      res.status(409).json({
        success: false,
        mensaje: 'Ya existe un usuario con ese correo electrónico',
        message: 'Ya existe un usuario con ese correo electrónico',
      });
      return;
    }

    // ------------------------------------
    // Crear usuario administrativo
    // ------------------------------------
    const usuario = await usuariosService.crearUsuarioAdministrativo(datos);

    // ------------------------------------
    // Respuesta segura (sin passwordHash)
    // ------------------------------------
    res.status(201).json({
      success: true,
      mensaje: 'Usuario creado correctamente',
      message: 'Usuario creado correctamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre || usuario.name,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  crearUsuario,
};
