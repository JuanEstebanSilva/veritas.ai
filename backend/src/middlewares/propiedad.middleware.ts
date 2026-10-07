import { Request, Response, NextFunction } from 'express';
import pacientesService from '../services/pacientes.service';
import medicosService from '../services/medicos.service';
import citasService from '../services/citas.service';

/**
 * Laboratorio No. 10 — Autorización Segura en APIs REST: RBAC, IDOR/BOLA
 * BLOQUE 6C — PARTE 17, 21 y Cierre Arquitectónico
 * Middleware de comprobación de propiedad a nivel de objeto (BOLA/IDOR)
 */

// ========================================
// Autorizar acceso al paciente solicitado (/citas/paciente/:pacienteId)
// ========================================
export const autorizarPacientePropio = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const usuario = req.usuario || (req as any).user;

  // --------------------------------------
  // Requiere autenticación previa
  // --------------------------------------
  if (!usuario) {
    res.status(401).json({
      success: false,
      mensaje: 'Usuario no autenticado',
      message: 'Usuario no autenticado',
    });
    return;
  }

  const rawRol = String(usuario.rol || usuario.role || '').toLowerCase().trim();

  // --------------------------------------
  // Administrador puede continuar (Acceso global)
  // --------------------------------------
  if (rawRol === 'administrador' || rawRol === 'admin') {
    next();
    return;
  }

  // --------------------------------------
  // Esta regla aplica a pacientes
  // --------------------------------------
  if (rawRol !== 'paciente' && rawRol !== 'user' && rawRol !== 'usuario') {
    res.status(403).json({
      success: false,
      mensaje: 'No tiene permisos para acceder a este recurso',
      message: 'No tiene permisos para acceder a este recurso',
    });
    return;
  }

  // --------------------------------------
  // Buscar perfil del usuario autenticado
  // --------------------------------------
  const pacienteAutenticado = pacientesService.obtenerPacientePorUsuarioId(usuario.id);

  if (!pacienteAutenticado) {
    res.status(403).json({
      success: false,
      mensaje: 'El usuario no tiene un paciente asociado',
      message: 'El usuario no tiene un paciente asociado',
    });
    return;
  }

  // --------------------------------------
  // Paciente solicitado en URL
  // --------------------------------------
  const pacienteIdSolicitado = Number(req.params.pacienteId || req.params.id);

  // --------------------------------------
  // Comprobar propiedad (BOLA / IDOR)
  // --------------------------------------
  if (pacienteAutenticado.id !== pacienteIdSolicitado) {
    res.status(403).json({
      success: false,
      mensaje: 'No tiene permisos para acceder a este recurso',
      message: 'No tiene permisos para acceder a este recurso',
    });
    return;
  }

  // --------------------------------------
  // Es su propio recurso
  // --------------------------------------
  next();
};

// ========================================
// Autorizar acceso al médico solicitado (/citas/medico/:medicoId)
// ========================================
export const autorizarMedicoPropio = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const usuario = req.usuario || (req as any).user;

  if (!usuario) {
    res.status(401).json({
      success: false,
      mensaje: 'Usuario no autenticado',
      message: 'Usuario no autenticado',
    });
    return;
  }

  const rawRol = String(usuario.rol || usuario.role || '').toLowerCase().trim();

  if (rawRol === 'administrador' || rawRol === 'admin') {
    next();
    return;
  }

  if (rawRol !== 'medico' && rawRol !== 'doctor' && rawRol !== 'auditor') {
    res.status(403).json({
      success: false,
      mensaje: 'No tiene permisos para acceder a este recurso',
      message: 'No tiene permisos para acceder a este recurso',
    });
    return;
  }

  const medicoAutenticado = medicosService.obtenerMedicoPorUsuarioId(usuario.id);

  if (!medicoAutenticado) {
    res.status(403).json({
      success: false,
      mensaje: 'El usuario no tiene un médico asociado',
      message: 'El usuario no tiene un médico asociado',
    });
    return;
  }

  const medicoIdSolicitado = Number(req.params.medicoId || req.params.id);

  if (medicoAutenticado.id !== medicoIdSolicitado) {
    res.status(403).json({
      success: false,
      mensaje: 'No tiene permisos para acceder a este recurso',
      message: 'No tiene permisos para acceder a este recurso',
    });
    return;
  }

  next();
};

// ========================================
// Autorizar acceso a cita individual (/citas/:id)
// ========================================
export const autorizarAccesoCita = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const usuario = req.usuario || (req as any).user;

  if (!usuario) {
    res.status(401).json({
      success: false,
      mensaje: 'Usuario no autenticado',
      message: 'Usuario no autenticado',
    });
    return;
  }

  const rawRol = String(usuario.rol || usuario.role || '').toLowerCase().trim();

  // Administrador tiene acceso global
  if (rawRol === 'administrador' || rawRol === 'admin') {
    next();
    return;
  }

  const citaId = Number(req.params.id);
  const cita = citasService.obtenerCitaPorId(citaId);

  if (!cita) {
    res.status(404).json({
      success: false,
      mensaje: 'Cita no encontrada',
      message: 'Cita no encontrada',
    });
    return;
  }

  // Validación para Pacientes
  if (rawRol === 'paciente' || rawRol === 'user' || rawRol === 'usuario') {
    const paciente = pacientesService.obtenerPacientePorUsuarioId(usuario.id);
    if (!paciente || cita.pacienteId !== paciente.id) {
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

  // Validación para Médicos
  if (rawRol === 'medico' || rawRol === 'doctor' || rawRol === 'auditor') {
    const medico = medicosService.obtenerMedicoPorUsuarioId(usuario.id);
    if (!medico || cita.medicoId !== medico.id) {
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
};

export default {
  autorizarPacientePropio,
  autorizarMedicoPropio,
  autorizarAccesoCita,
};
