import { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import estudiantesService from '../services/estudiantes.service';
import usuariosService from '../services/usuarios.service';
import revisionesService from '../services/revisiones.service';

/**
 * Veritas AI — Controlador de Estudiantes / Autores de Trabajos
 */

export const obtenerEstudiantes = (req: Request, res: Response): void => {
  const lista = estudiantesService.obtenerEstudiantes();
  res.status(200).json({
    success: true,
    total: lista.length,
    mensaje: 'Lista de estudiantes obtenida correctamente',
    estudiantes: lista,
    pacientes: lista,
  });
};

export const obtenerEstudiantePorId = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const estudiante = estudiantesService.obtenerEstudiantePorId(id);

  if (!estudiante) {
    res.status(404).json({
      success: false,
      mensaje: 'Estudiante no encontrado',
    });
    return;
  }

  res.status(200).json({
    success: true,
    estudiante,
    paciente: estudiante,
  });
};

export const crearEstudiante = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const datos = matchedData(req, { locations: ['body'] }) as any;

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
        rolUsuario !== 'paciente' &&
        rolUsuario !== 'user' &&
        rolUsuario !== 'usuario' &&
        rolUsuario !== 'estudiante'
      ) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario asociado no tiene rol estudiante',
          message: 'El usuario asociado no tiene rol estudiante',
        });
        return;
      }

      const estudianteExistente = estudiantesService.obtenerEstudiantePorUsuarioId(
        datos.usuarioId,
        datos.email
      );
      if (estudianteExistente) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un estudiante',
          message: 'El usuario ya está asociado a un estudiante',
          estudiante: estudianteExistente,
          paciente: estudianteExistente,
        });
        return;
      }
    }

    const estudiante = estudiantesService.crearEstudiante(datos);

    res.status(201).json({
      success: true,
      mensaje: 'Estudiante creado correctamente',
      estudiante,
      paciente: estudiante,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarEstudiante = async (
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
      if (
        rolUsuario !== 'paciente' &&
        rolUsuario !== 'user' &&
        rolUsuario !== 'usuario' &&
        rolUsuario !== 'estudiante'
      ) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario asociado no tiene rol estudiante',
        });
        return;
      }

      const existente = estudiantesService.obtenerEstudiantePorUsuarioId(datos.usuarioId);
      if (existente && existente.id !== Number(id)) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un estudiante',
        });
        return;
      }
    }

    const estudiante = estudiantesService.actualizarEstudiante(id, datos);
    if (!estudiante) {
      res.status(404).json({ success: false, mensaje: 'Estudiante no encontrado' });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Estudiante actualizado correctamente',
      estudiante,
      paciente: estudiante,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarEstudianteParcial = async (
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
      if (
        rolUsuario !== 'paciente' &&
        rolUsuario !== 'user' &&
        rolUsuario !== 'usuario' &&
        rolUsuario !== 'estudiante'
      ) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario asociado no tiene rol estudiante',
        });
        return;
      }

      const existente = estudiantesService.obtenerEstudiantePorUsuarioId(datos.usuarioId);
      if (existente && existente.id !== Number(id)) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un estudiante',
        });
        return;
      }
    }

    const estudiante = estudiantesService.actualizarEstudianteParcial(id, datos);
    if (!estudiante) {
      res.status(404).json({ success: false, mensaje: 'Estudiante no encontrado' });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Perfil de estudiante actualizado correctamente',
      estudiante,
      paciente: estudiante,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarEstudiante = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const estudiante = estudiantesService.obtenerEstudiantePorId(id);

  if (!estudiante) {
    res.status(404).json({ success: false, mensaje: 'Estudiante no encontrado' });
    return;
  }

  // Integridad Referencial: Un estudiante con revisiones no puede eliminarse
  const revisionesAsociadas = revisionesService.obtenerRevisionesPorEstudiante(id);
  if (revisionesAsociadas.length > 0) {
    res.status(409).json({
      success: false,
      mensaje: 'No se puede eliminar el estudiante porque tiene revisiones asociadas',
      message: 'No se puede eliminar el estudiante porque tiene revisiones asociadas',
    });
    return;
  }

  estudiantesService.eliminarEstudiante(id);

  res.status(200).json({
    success: true,
    mensaje: 'Estudiante eliminado correctamente',
  });
};

export default {
  obtenerEstudiantes,
  obtenerEstudiantePorId,
  crearEstudiante,
  actualizarEstudiante,
  actualizarEstudianteParcial,
  eliminarEstudiante,
  // Alias
  obtenerPacientes: obtenerEstudiantes,
  obtenerPacientePorId: obtenerEstudiantePorId,
  crearPaciente: crearEstudiante,
  actualizarPaciente: actualizarEstudiante,
  actualizarPacienteParcial: actualizarEstudianteParcial,
  eliminarPaciente: eliminarEstudiante,
};
