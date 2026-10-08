import { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import revisionesService from '../services/revisiones.service';
import estudiantesService from '../services/estudiantes.service';
import docentesService from '../services/docentes.service';

/**
 * Veritas AI — Controlador de Revisiones y Escaneos de Integridad Académica
 */

export const obtenerTodasLasRevisiones = (_req: Request, res: Response): void => {
  const lista = revisionesService.obtenerTodasLasRevisiones();
  res.status(200).json({
    success: true,
    total: lista.length,
    mensaje: 'Lista de todas las revisiones de documentos',
    revisiones: lista,
    citas: lista,
  });
};

export const obtenerRevisionPorId = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const revision = revisionesService.obtenerRevisionPorId(id);

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
};

export const obtenerRevisionesPorEstudiante = (req: Request, res: Response): void => {
  const estId = req.params.estudianteId || req.params.pacienteId;
  const lista = revisionesService.obtenerRevisionesPorEstudiante(estId as string);

  res.status(200).json({
    success: true,
    total: lista.length,
    mensaje: 'Revisiones del estudiante obtenidas correctamente',
    revisiones: lista,
    citas: lista,
  });
};

export const obtenerRevisionesPorDocente = (req: Request, res: Response): void => {
  const docId = req.params.docenteId || req.params.medicoId;
  const lista = revisionesService.obtenerRevisionesPorDocente(docId as string);

  res.status(200).json({
    success: true,
    total: lista.length,
    mensaje: 'Revisiones asignadas al docente obtenidas correctamente',
    revisiones: lista,
    citas: lista,
  });
};

export const obtenerMisRevisiones = (req: Request, res: Response): void => {
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

  if (rawRol === 'paciente' || rawRol === 'user' || rawRol === 'usuario' || rawRol === 'estudiante') {
    const estudiante = estudiantesService.obtenerEstudiantePorUsuarioId(
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
    const misRevisiones = revisionesService.obtenerRevisionesPorEstudiante(estudiante.id);
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
    const docente = docentesService.obtenerDocentePorUsuarioId(
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
    const misRevisiones = revisionesService.obtenerRevisionesPorDocente(docente.id);
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
    mensaje: 'No tiene permisos para acceder a este recurso',
    message: 'No tiene permisos para acceder a este recurso',
  });
};

export const crearRevision = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const matched = matchedData(req, { locations: ['body'] }) as any;
    const datos = {
      ...matched,
      estudianteId: req.body.estudianteId || req.body.pacienteId,
      pacienteId: req.body.estudianteId || req.body.pacienteId,
      docenteId: req.body.docenteId || req.body.medicoId,
      medicoId: req.body.docenteId || req.body.medicoId,
      fecha: req.body.fecha || matched.fecha,
      motivo: req.body.motivo || matched.motivo,
      estado: req.body.estado || matched.estado,
    };
    const revision = revisionesService.crearRevision(datos);

    res.status(201).json({
      success: true,
      mensaje: 'Revisión creada correctamente',
      revision,
      cita: revision,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarRevision = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const id = req.params.id as string;
    const matched = matchedData(req, { locations: ['body'] }) as any;
    const datos = {
      ...matched,
      estudianteId: req.body.estudianteId || req.body.pacienteId,
      pacienteId: req.body.estudianteId || req.body.pacienteId,
      docenteId: req.body.docenteId || req.body.medicoId,
      medicoId: req.body.docenteId || req.body.medicoId,
      fecha: req.body.fecha || matched.fecha,
      motivo: req.body.motivo || matched.motivo,
      estado: req.body.estado || matched.estado,
    };
    const revision = revisionesService.actualizarRevision(id, datos);

    if (!revision) {
      res.status(404).json({ success: false, mensaje: 'Revisión no encontrada' });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Revisión actualizada correctamente',
      revision,
      cita: revision,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarRevisionParcial = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const id = req.params.id as string;
    const datos = matchedData(req, { locations: ['body'] }) as any;
    const revision = revisionesService.actualizarRevisionParcial(id, datos);

    if (!revision) {
      res.status(404).json({ success: false, mensaje: 'Revisión no encontrada' });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Revisión actualizada correctamente',
      revision,
      cita: revision,
    });
  } catch (error) {
    next(error);
  }
};

export const cambiarEstadoRevision = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const id = req.params.id as string;
    const { estado } = req.body;

    const resultado = revisionesService.cambiarEstadoRevision(id, estado);

    if (!resultado.exito) {
      if (resultado.error === 'NO_ENCONTRADA') {
        res.status(404).json({ success: false, mensaje: 'Revisión no encontrada' });
        return;
      }
      if (resultado.error === 'TRANSICION_INVALIDA') {
        res.status(409).json({
          success: false,
          mensaje: 'Transición de estado inválida',
          message: 'Transición de estado inválida',
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      mensaje: 'Estado de revisión actualizado correctamente',
      revision: resultado.revision,
      cita: resultado.revision,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarRevision = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const eliminada = revisionesService.eliminarRevision(id);

  if (!eliminada) {
    res.status(404).json({ success: false, mensaje: 'Revisión no encontrada' });
    return;
  }

  res.status(200).json({
    success: true,
    mensaje: 'Revisión eliminada correctamente',
  });
};

export default {
  obtenerTodasLasRevisiones,
  obtenerRevisionPorId,
  obtenerRevisionesPorEstudiante,
  obtenerRevisionesPorDocente,
  obtenerMisRevisiones,
  crearRevision,
  actualizarRevision,
  actualizarRevisionParcial,
  cambiarEstadoRevision,
  eliminarRevision,
  // Alias
  obtenerTodasLasCitas: obtenerTodasLasRevisiones,
  obtenerCitaPorId: obtenerRevisionPorId,
  obtenerCitasPorPaciente: obtenerRevisionesPorEstudiante,
  obtenerCitasPorMedico: obtenerRevisionesPorDocente,
  obtenerMisCitas: obtenerMisRevisiones,
  crearCita: crearRevision,
  actualizarCita: actualizarRevision,
  actualizarCitaParcial: actualizarRevisionParcial,
  cambiarEstadoCita: cambiarEstadoRevision,
  eliminarCita: eliminarRevision,
};
