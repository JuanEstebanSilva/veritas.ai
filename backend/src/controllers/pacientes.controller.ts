import { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import pacientesService from '../services/pacientes.service';
import usuariosService from '../services/usuarios.service';
import citasService from '../services/citas.service';

/**
 * Laboratorio No. 10 — Autorización Segura en APIs REST: RBAC, IDOR/BOLA
 * BLOQUE 6A & 6C — Controlador de Pacientes
 */

export const obtenerPacientes = (req: Request, res: Response): void => {
  const lista = pacientesService.obtenerPacientes();
  res.status(200).json({
    success: true,
    mensaje: 'Lista de pacientes obtenida correctamente',
    pacientes: lista,
  });
};

export const obtenerPacientePorId = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const paciente = pacientesService.obtenerPacientePorId(id);

  if (!paciente) {
    res.status(404).json({
      success: false,
      mensaje: 'Paciente no encontrado',
    });
    return;
  }

  res.status(200).json({
    success: true,
    paciente,
  });
};

export const crearPaciente = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const datos = matchedData(req, { locations: ['body'] }) as any;

    // ------------------------------------
    // Validar asociación lógica con usuario (Bloque 6C, Partes 9, 10 y 11)
    // ------------------------------------
    if (datos.usuarioId !== undefined && datos.usuarioId !== null) {
      const usuario = await usuariosService.obtenerUsuarioPorId(datos.usuarioId);

      if (!usuario) {
        res.status(400).json({
          success: false,
          mensaje: 'El usuario asociado no existe',
          message: 'El usuario asociado no existe',
        });
        return;
      }

      const rolUsuario = String(usuario.rol || usuario.role || '').toLowerCase().trim();
      if (rolUsuario !== 'paciente' && rolUsuario !== 'user' && rolUsuario !== 'usuario') {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario asociado no tiene rol paciente',
          message: 'El usuario asociado no tiene rol paciente',
        });
        return;
      }

      const pacienteExistente = pacientesService.obtenerPacientePorUsuarioId(datos.usuarioId);
      if (pacienteExistente) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un paciente',
          message: 'El usuario ya está asociado a un paciente',
        });
        return;
      }
    }

    const paciente = pacientesService.crearPaciente(datos);

    res.status(201).json({
      success: true,
      mensaje: 'Paciente creado correctamente',
      paciente,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarPaciente = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const datos = matchedData(req, { locations: ['body'] }) as any;

    if (datos.usuarioId !== undefined && datos.usuarioId !== null) {
      const usuario = await usuariosService.obtenerUsuarioPorId(datos.usuarioId);
      if (!usuario) {
        res.status(400).json({
          success: false,
          mensaje: 'El usuario asociado no existe',
        });
        return;
      }

      const rolUsuario = String(usuario.rol || usuario.role || '').toLowerCase().trim();
      if (rolUsuario !== 'paciente' && rolUsuario !== 'user' && rolUsuario !== 'usuario') {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario asociado no tiene rol paciente',
        });
        return;
      }

      const existente = pacientesService.obtenerPacientePorUsuarioId(datos.usuarioId);
      if (existente && existente.id !== Number(id)) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un paciente',
        });
        return;
      }
    }

    const paciente = pacientesService.actualizarPaciente(id, datos);
    if (!paciente) {
      res.status(404).json({ success: false, mensaje: 'Paciente no encontrado' });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Paciente actualizado correctamente',
      paciente,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarPacienteParcial = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const datos = matchedData(req, { locations: ['body'] }) as any;

    if (datos.usuarioId !== undefined && datos.usuarioId !== null) {
      const usuario = await usuariosService.obtenerUsuarioPorId(datos.usuarioId);
      if (!usuario) {
        res.status(400).json({
          success: false,
          mensaje: 'El usuario asociado no existe',
        });
        return;
      }

      const rolUsuario = String(usuario.rol || usuario.role || '').toLowerCase().trim();
      if (rolUsuario !== 'paciente' && rolUsuario !== 'user' && rolUsuario !== 'usuario') {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario asociado no tiene rol paciente',
        });
        return;
      }

      const existente = pacientesService.obtenerPacientePorUsuarioId(datos.usuarioId);
      if (existente && existente.id !== Number(id)) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un paciente',
        });
        return;
      }
    }

    const paciente = pacientesService.actualizarPacienteParcial(id, datos);
    if (!paciente) {
      res.status(404).json({ success: false, mensaje: 'Paciente no encontrado' });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Paciente actualizado correctamente',
      paciente,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarPaciente = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const paciente = pacientesService.obtenerPacientePorId(id);

  if (!paciente) {
    res.status(404).json({ success: false, mensaje: 'Paciente no encontrado' });
    return;
  }

  // ------------------------------------
  // Integridad Referencial: Un paciente con citas no puede eliminarse (Bloque 6A, Parte 12 / Test 10)
  // ------------------------------------
  const citasAsociadas = citasService.obtenerCitasPorPaciente(id);
  if (citasAsociadas.length > 0) {
    res.status(409).json({
      success: false,
      mensaje: 'No se puede eliminar el paciente porque tiene citas asociadas',
      message: 'No se puede eliminar el paciente porque tiene citas asociadas',
    });
    return;
  }

  pacientesService.eliminarPaciente(id);

  res.status(200).json({
    success: true,
    mensaje: 'Paciente eliminado correctamente',
  });
};

export default {
  obtenerPacientes,
  obtenerPacientePorId,
  crearPaciente,
  actualizarPaciente,
  actualizarPacienteParcial,
  eliminarPaciente,
};
