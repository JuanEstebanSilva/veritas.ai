import { Request, Response, NextFunction } from 'express';
import estudiantesService from '../services/estudiantes.service';
import docentesService from '../services/docentes.service';
import revisionesService from '../services/revisiones.service';

/**
 * Laboratorio No. 10 — Autorización Segura en APIs REST: RBAC, IDOR/BOLA
 * Middleware de comprobación de propiedad a nivel de objeto (BOLA/IDOR) en Veritas AI
 * Adaptado a consultas asíncronas contra PostgreSQL / Supabase
 */

// ========================================
// Autorizar acceso al estudiante solicitado (/revisiones/estudiante/:estudianteId)
// ========================================
export const autorizarEstudiantePropio = async (
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

    // Administrador tiene acceso global
    if (rawRol === 'administrador' || rawRol === 'admin') {
      next();
      return;
    }

    // Estudiantes / usuarios
    if (
      rawRol !== 'paciente' &&
      rawRol !== 'user' &&
      rawRol !== 'usuario' &&
      rawRol !== 'estudiante'
    ) {
      res.status(403).json({
        success: false,
        mensaje: 'No tiene permisos para acceder a este recurso',
        message: 'No tiene permisos para acceder a este recurso',
      });
      return;
    }

    const estudianteAutenticado = await estudiantesService.obtenerEstudiantePorUsuarioId(
      usuario.id,
      usuario.email
    );

    if (!estudianteAutenticado) {
      res.status(403).json({
        success: false,
        mensaje: 'El usuario no tiene un perfil asociado',
        message: 'El usuario no tiene un estudiante asociado',
      });
      return;
    }

    const idSolicitado = String(req.params.estudianteId || req.params.pacienteId || req.params.id);

    // Comparación robusta como strings para prevenir IDOR / BOLA
    if (String(estudianteAutenticado.id) !== idSolicitado) {
      res.status(403).json({
        success: false,
        mensaje: 'No tiene permisos para acceder a este recurso',
        message: 'No tiene permisos para acceder a este recurso',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ========================================
// Autorizar acceso al docente solicitado (/revisiones/docente/:docenteId)
// ========================================
export const autorizarDocentePropio = async (
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
      next();
      return;
    }

    if (
      rawRol !== 'medico' &&
      rawRol !== 'doctor' &&
      rawRol !== 'auditor' &&
      rawRol !== 'docente' &&
      rawRol !== 'profesor'
    ) {
      res.status(403).json({
        success: false,
        mensaje: 'No tiene permisos para acceder a este recurso',
        message: 'No tiene permisos para acceder a este recurso',
      });
      return;
    }

    const docenteAutenticado = await docentesService.obtenerDocentePorUsuarioId(
      usuario.id,
      usuario.email
    );

    if (!docenteAutenticado) {
      res.status(403).json({
        success: false,
        mensaje: 'El usuario no tiene un perfil docente asociado',
        message: 'El usuario no tiene un docente asociado',
      });
      return;
    }

    const idSolicitado = String(req.params.docenteId || req.params.medicoId || req.params.id);

    // Comparación robusta como strings para prevenir IDOR / BOLA
    if (String(docenteAutenticado.id) !== idSolicitado) {
      res.status(403).json({
        success: false,
        mensaje: 'No tiene permisos para acceder a este recurso',
        message: 'No tiene permisos para acceder a este recurso',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ========================================
// Autorizar acceso a revisión individual (/revisiones/:id)
// ========================================
export const autorizarAccesoRevision = async (
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
      next();
      return;
    }

    const revId = String(req.params.id);
    const rev = await revisionesService.obtenerRevisionPorId(revId);

    if (!rev) {
      res.status(404).json({
        success: false,
        mensaje: 'Revisión no encontrada',
        message: 'Revisión no encontrada',
      });
      return;
    }

    // Validación para Estudiantes
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
      if (!estudiante || String(rev.estudianteId) !== String(estudiante.id)) {
        res.status(403).json({
          success: false,
          mensaje: 'No tiene permisos para acceder a este recurso',
          message: 'No tiene permisos para acceder a este recurso',
        });
        return;
      }
      next();
      return;
    }

    // Validación para Docentes
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
      if (!docente || String(rev.docenteId) !== String(docente.id)) {
        res.status(403).json({
          success: false,
          mensaje: 'No tiene permisos para acceder a este recurso',
          message: 'No tiene permisos para acceder a este recurso',
        });
        return;
      }
      next();
      return;
    }

    res.status(403).json({
      success: false,
      mensaje: 'No tiene permisos para acceder a este recurso',
      message: 'No tiene permisos para acceder a este recurso',
    });
  } catch (error) {
    next(error);
  }
};

// Alias retrocompatibles
export const autorizarPacientePropio = autorizarEstudiantePropio;
export const autorizarMedicoPropio = autorizarDocentePropio;
export const autorizarAccesoCita = autorizarAccesoRevision;

export default {
  autorizarEstudiantePropio,
  autorizarDocentePropio,
  autorizarAccesoRevision,
  autorizarPacientePropio,
  autorizarMedicoPropio,
  autorizarAccesoCita,
};
