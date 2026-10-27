import { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import estudiantesService from '../services/estudiantes.service';
import usuariosService from '../services/usuarios.service';
import revisionesService from '../services/revisiones.service';

/**
 * Veritas AI — Controlador de Estudiantes / Autores de Trabajos
 */

export const obtenerEstudiantes = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lista = await estudiantesService.obtenerEstudiantes();
    res.status(200).json({
      success: true,
      total: lista.length,
      mensaje: 'Lista de estudiantes obtenida correctamente',
      estudiantes: lista,
      pacientes: lista,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerEstudiantePorId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const estudiante = await estudiantesService.obtenerEstudiantePorId(id);

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
  } catch (error) {
    next(error);
  }
};

export const crearEstudiante = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const raw = req.body || {};
    const matched = matchedData(req, { locations: ['body'] }) as any;
    const datos = {
      ...raw,
      ...matched,
    };
    datos.fechaNacimiento = datos.fechaNacimiento || datos.fecha_nacimiento;
    datos.usuarioId = datos.usuarioId !== undefined ? datos.usuarioId : datos.usuario_id;

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

      const estudianteExistente = await estudiantesService.obtenerEstudiantePorUsuarioId(
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

    const estudiante = await estudiantesService.crearEstudiante(datos);

    res.status(201).json({
      success: true,
      mensaje: 'Estudiante creado correctamente',
      estudiante,
      paciente: estudiante,
    });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        mensaje: 'El documento o email ya se encuentra registrado para otro estudiante',
        message: 'Conflicto: registro duplicado en la base de datos',
      });
      return;
    }
    if (error.code === '23503') {
      res.status(400).json({
        success: false,
        mensaje: 'El usuario asociado referenciado no existe',
        message: 'Referencia inválida: clave foránea no encontrada',
      });
      return;
    }
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
    const raw = req.body || {};
    const matched = matchedData(req, { locations: ['body'] }) as any;
    const datos = {
      ...raw,
      ...matched,
    };
    datos.fechaNacimiento = datos.fechaNacimiento || datos.fecha_nacimiento;
    datos.usuarioId = datos.usuarioId !== undefined ? datos.usuarioId : datos.usuario_id;

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

      const existente = await estudiantesService.obtenerEstudiantePorUsuarioId(datos.usuarioId);
      if (existente && String(existente.id) !== String(id)) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un estudiante',
        });
        return;
      }
    }

    const estudiante = await estudiantesService.actualizarEstudiante(id, datos);
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
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        mensaje: 'El documento o email ya se encuentra registrado para otro estudiante',
      });
      return;
    }
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
    const raw = req.body || {};
    const matched = matchedData(req, { locations: ['body'] }) as any;
    const datos = {
      ...raw,
      ...matched,
    };
    datos.fechaNacimiento = datos.fechaNacimiento || datos.fecha_nacimiento;
    datos.usuarioId = datos.usuarioId !== undefined ? datos.usuarioId : datos.usuario_id;

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

      const existente = await estudiantesService.obtenerEstudiantePorUsuarioId(datos.usuarioId);
      if (existente && String(existente.id) !== String(id)) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un estudiante',
        });
        return;
      }
    }

    const estudiante = await estudiantesService.actualizarEstudianteParcial(id, datos);
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
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        mensaje: 'El documento o email ya se encuentra registrado para otro estudiante',
      });
      return;
    }
    next(error);
  }
};

export const eliminarEstudiante = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const estudiante = await estudiantesService.obtenerEstudiantePorId(id);

    if (!estudiante) {
      res.status(404).json({ success: false, mensaje: 'Estudiante no encontrado' });
      return;
    }

    // Integridad Referencial: Un estudiante con revisiones no puede eliminarse
    const revisionesAsociadas = await revisionesService.obtenerRevisionesPorEstudiante(id);
    if (revisionesAsociadas.length > 0) {
      res.status(409).json({
        success: false,
        mensaje: 'No se puede eliminar el estudiante porque tiene revisiones asociadas',
        message: 'No se puede eliminar el estudiante porque tiene revisiones asociadas',
      });
      return;
    }

    await estudiantesService.eliminarEstudiante(id);

    res.status(200).json({
      success: true,
      mensaje: 'Estudiante eliminado correctamente',
    });
  } catch (error: any) {
    if (error.code === '23503') {
      res.status(409).json({
        success: false,
        mensaje: 'No se puede eliminar el estudiante porque tiene revisiones asociadas',
        message: 'Violación de clave foránea: existen registros dependientes',
      });
      return;
    }
    next(error);
  }
};

export default {
  obtenerEstudiantes,
  obtenerEstudiantePorId,
  crearEstudiante,
  actualizarEstudiante,
  actualizarEstudianteParcial,
  eliminarEstudiante,
  // Alias de compatibilidad
  obtenerPacientes: obtenerEstudiantes,
  obtenerPacientePorId: obtenerEstudiantePorId,
  crearPaciente: crearEstudiante,
  actualizarPaciente: actualizarEstudiante,
  actualizarPacienteParcial: actualizarEstudianteParcial,
  eliminarPaciente: eliminarEstudiante,
};
