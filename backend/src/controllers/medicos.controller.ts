import { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import medicosService from '../services/medicos.service';
import usuariosService from '../services/usuarios.service';
import citasService from '../services/citas.service';

/**
 * Laboratorio No. 10 — Autorización Segura en APIs REST: RBAC, IDOR/BOLA
 * BLOQUE 6A & 6C — Controlador de Médicos
 */

export const obtenerMedicos = (req: Request, res: Response): void => {
  const lista = medicosService.obtenerMedicos();
  res.status(200).json({
    success: true,
    mensaje: 'Lista de docentes / médicos obtenida correctamente',
    medicos: lista,
    docentes: lista,
    profesores: lista,
  });
};

export const obtenerMedicoPorId = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const medico = medicosService.obtenerMedicoPorId(id);

  if (!medico) {
    res.status(404).json({
      success: false,
      mensaje: 'Médico no encontrado',
    });
    return;
  }

  res.status(200).json({
    success: true,
    medico,
    docente: medico,
    profesor: medico,
  });
};

export const crearMedico = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const datos = matchedData(req, { locations: ['body'] }) as any;

    // ------------------------------------
    // Validar asociación lógica con usuario (Bloque 6C / Test 24, 25, 26)
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
      if (
        rolUsuario !== 'medico' &&
        rolUsuario !== 'doctor' &&
        rolUsuario !== 'auditor' &&
        rolUsuario !== 'docente' &&
        rolUsuario !== 'profesor'
      ) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario asociado no tiene rol medico',
          message: 'El usuario asociado no tiene rol docente o auditor',
        });
        return;
      }

      const medicoExistente = medicosService.obtenerMedicoPorUsuarioId(
        datos.usuarioId,
        datos.email
      );
      if (medicoExistente) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un médico',
          message: 'El usuario ya está asociado a un docente o auditor',
          medico: medicoExistente,
          docente: medicoExistente,
          profesor: medicoExistente,
        });
        return;
      }
    }

    const medico = medicosService.crearMedico(datos);

    res.status(201).json({
      success: true,
      mensaje: 'Médico creado correctamente',
      medico,
      docente: medico,
      profesor: medico,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarMedico = async (
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
      if (rolUsuario !== 'medico' && rolUsuario !== 'doctor' && rolUsuario !== 'auditor') {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario asociado no tiene rol medico',
        });
        return;
      }

      const existente = medicosService.obtenerMedicoPorUsuarioId(datos.usuarioId);
      if (existente && existente.id !== Number(id)) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un médico',
        });
        return;
      }
    }

    const medico = medicosService.actualizarMedico(id, datos);
    if (!medico) {
      res.status(404).json({ success: false, mensaje: 'Médico no encontrado' });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Médico actualizado correctamente',
      medico,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarMedicoParcial = async (
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
      if (rolUsuario !== 'medico' && rolUsuario !== 'doctor' && rolUsuario !== 'auditor') {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario asociado no tiene rol medico',
        });
        return;
      }

      const existente = medicosService.obtenerMedicoPorUsuarioId(datos.usuarioId);
      if (existente && existente.id !== Number(id)) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un médico',
        });
        return;
      }
    }

    const medico = medicosService.actualizarMedicoParcial(id, datos);
    if (!medico) {
      res.status(404).json({ success: false, mensaje: 'Médico no encontrado' });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Médico actualizado correctamente',
      medico,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarMedico = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const medico = medicosService.obtenerMedicoPorId(id);

  if (!medico) {
    res.status(404).json({ success: false, mensaje: 'Médico no encontrado' });
    return;
  }

  const citasAsociadas = citasService.obtenerCitasPorMedico(id);
  if (citasAsociadas.length > 0) {
    res.status(409).json({
      success: false,
      mensaje: 'No se puede eliminar el médico porque tiene citas asociadas',
      message: 'No se puede eliminar el médico porque tiene citas asociadas',
    });
    return;
  }

  medicosService.eliminarMedico(id);

  res.status(200).json({
    success: true,
    mensaje: 'Médico eliminado correctamente',
  });
};

export default {
  obtenerMedicos,
  obtenerMedicoPorId,
  crearMedico,
  actualizarMedico,
  actualizarMedicoParcial,
  eliminarMedico,
};
