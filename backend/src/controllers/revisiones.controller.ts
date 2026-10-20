import { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import revisionesService from '../services/revisiones.service';
import estudiantesService from '../services/estudiantes.service';
import docentesService from '../services/docentes.service';

/**
 * Veritas AI — Controlador de Revisiones y Escaneos de Integridad Académica
 */

export const obtenerTodasLasRevisiones = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lista = await revisionesService.obtenerTodasLasRevisiones();
    res.status(200).json({
      success: true,
      total: lista.length,
      mensaje: 'Lista de todas las revisiones de documentos',
      revisiones: lista,
      citas: lista,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerRevisionPorId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const revision = await revisionesService.obtenerRevisionPorId(id);

    if (!revision) {
      res.status(404).json({
        success: false,
        mensaje: 'Revisión no encontrada',
        message: 'Revisión no encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      revision,
      cita: revision,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerRevisionesPorEstudiante = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const estId = req.params.estudianteId || req.params.pacienteId;
    const lista = await revisionesService.obtenerRevisionesPorEstudiante(estId as string);

    res.status(200).json({
      success: true,
      total: lista.length,
      mensaje: 'Revisiones del estudiante obtenidas correctamente',
      revisiones: lista,
      citas: lista,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerRevisionesPorDocente = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const docId = req.params.docenteId || req.params.medicoId;
    const lista = await revisionesService.obtenerRevisionesPorDocente(docId as string);

    res.status(200).json({
      success: true,
      total: lista.length,
      mensaje: 'Revisiones asignadas al docente obtenidas correctamente',
      revisiones: lista,
      citas: lista,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerMisRevisiones = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = req.usuario || (req as any).user;

    if (!usuario) {
      res.status(401).json({
        success: false,
        mensaje: 'Token de autenticación requerido',
        message: 'Token de autenticación requerido',
      });
      return;
    }

    const rawRol = String(usuario.rol || usuario.role || '').toLowerCase().trim();

    if (rawRol === 'administrador' || rawRol === 'admin') {
      res.status(403).json({
        success: false,
        mensaje: 'Endpoint restringido a perfiles de estudiante o docente',
        message: 'Endpoint restringido a perfiles de estudiante o docente',
      });
      return;
    }

    if (
      rawRol === 'paciente' ||
      rawRol === 'user' ||
      rawRol === 'usuario' ||
      rawRol === 'estudiante'
    ) {
      const estudiante = await estudiantesService.obtenerEstudiantePorUsuarioId(
        usuario.id,
        usuario.email
      );
      if (!estudiante) {
        res.status(403).json({
          success: false,
          mensaje: 'El usuario no tiene un perfil de estudiante asociado',
          message: 'El usuario no tiene un estudiante o paciente asociado',
        });
        return;
      }
      const misRevisiones = await revisionesService.obtenerRevisionesPorEstudiante(estudiante.id);
      res.status(200).json({
        success: true,
        mensaje: 'Mis revisiones como autor/estudiante',
        revisiones: misRevisiones,
        citas: misRevisiones,
      });
      return;
    }

    if (
      rawRol === 'medico' ||
      rawRol === 'doctor' ||
      rawRol === 'auditor' ||
      rawRol === 'docente' ||
      rawRol === 'profesor'
    ) {
      const docente = await docentesService.obtenerDocentePorUsuarioId(
        usuario.id,
        usuario.email
      );
      if (!docente) {
        res.status(403).json({
          success: false,
          mensaje: 'El usuario no tiene un perfil docente asociado',
          message: 'El usuario no tiene un perfil docente asociado',
        });
        return;
      }
      const misRevisiones = await revisionesService.obtenerRevisionesPorDocente(docente.id);
      res.status(200).json({
        success: true,
        mensaje: 'Mis revisiones como docente auditor',
        revisiones: misRevisiones,
        citas: misRevisiones,
      });
      return;
    }

    res.status(403).json({
      success: false,
      mensaje: 'Rol no autorizado para consultar mis-revisiones',
      message: 'Rol no autorizado para consultar mis-revisiones',
    });
  } catch (error) {
    next(error);
  }
};

export const crearRevision = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const datos = matchedData(req, { locations: ['body'] }) as any;
    const estId = Number(datos.estudianteId || datos.pacienteId);
    const docId = Number(datos.docenteId || datos.medicoId);

    const estudiante = await estudiantesService.obtenerEstudiantePorId(estId);
    if (!estudiante) {
      res.status(404).json({
        success: false,
        mensaje: 'El estudiante especificado no existe',
        message: 'El estudiante especificado no existe',
      });
      return;
    }

    const docente = await docentesService.obtenerDocentePorId(docId);
    if (!docente) {
      res.status(404).json({
        success: false,
        mensaje: 'El docente especificado no existe',
        message: 'El docente especificado no existe',
      });
      return;
    }

    const revision = await revisionesService.crearRevision(datos);

    res.status(201).json({
      success: true,
      mensaje: 'Revisión creada correctamente',
      revision,
      cita: revision,
    });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        mensaje: 'El docente ya tiene una revisión programada en esa misma fecha y horario',
        message: 'Conflicto: solapamiento de horario para el docente',
      });
      return;
    }
    if (error.code === '23503') {
      res.status(400).json({
        success: false,
        mensaje: 'El estudiante o docente especificado no existe en la base de datos',
        message: 'Referencia inválida: clave foránea no encontrada',
      });
      return;
    }
    next(error);
  }
};

export const actualizarRevision = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const datos = matchedData(req, { locations: ['body'] }) as any;

    const revision = await revisionesService.actualizarRevision(id, datos);
    if (!revision) {
      res.status(404).json({
        success: false,
        mensaje: 'Revisión no encontrada',
        message: 'Revisión no encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Revisión actualizada correctamente',
      revision,
      cita: revision,
    });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        mensaje: 'El docente ya tiene una revisión programada en esa misma fecha y horario',
      });
      return;
    }
    next(error);
  }
};

export const cambiarEstadoRevision = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { estado } = matchedData(req, { locations: ['body'] }) as any;

    const resultado = await revisionesService.cambiarEstadoRevision(id, estado);

    if (!resultado.exito) {
      if (resultado.error === 'NO_ENCONTRADA') {
        res.status(404).json({
          success: false,
          mensaje: 'Revisión no encontrada',
          message: 'Revisión no encontrada',
        });
        return;
      }
      res.status(409).json({
        success: false,
        mensaje: 'Transición de estado inválida',
        message: 'Transición de estado inválida',
      });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Estado de la revisión actualizado correctamente',
      revision: resultado.revision,
      cita: resultado.revision,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarRevision = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existe = await revisionesService.obtenerRevisionPorId(id);

    if (!existe) {
      res.status(404).json({
        success: false,
        mensaje: 'Revisión no encontrada',
        message: 'Revisión no encontrada',
      });
      return;
    }

    await revisionesService.eliminarRevision(id);

    res.status(200).json({
      success: true,
      mensaje: 'Revisión eliminada correctamente',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  obtenerTodasLasRevisiones,
  obtenerRevisionPorId,
  obtenerRevisionesPorEstudiante,
  obtenerRevisionesPorDocente,
  obtenerMisRevisiones,
  crearRevision,
  actualizarRevision,
  cambiarEstadoRevision,
  eliminarRevision,
  // Alias de compatibilidad
  obtenerTodasLasCitas: obtenerTodasLasRevisiones,
  obtenerCitaPorId: obtenerRevisionPorId,
  obtenerCitasPorPaciente: obtenerRevisionesPorEstudiante,
  obtenerCitasPorMedico: obtenerRevisionesPorDocente,
  obtenerMisCitas: obtenerMisRevisiones,
  crearCita: crearRevision,
  actualizarCita: actualizarRevision,
  cambiarEstadoCita: cambiarEstadoRevision,
  eliminarCita: eliminarRevision,
};
