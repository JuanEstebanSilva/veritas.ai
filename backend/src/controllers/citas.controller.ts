import { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import citasService from '../services/citas.service';
import pacientesService from '../services/pacientes.service';
import medicosService from '../services/medicos.service';

/**
 * Laboratorio No. 10 — Autorización Segura en APIs REST: RBAC, IDOR/BOLA
 * Controlador de Citas con protección BOLA/IDOR y máquina de estados
 */

// ========================================
// Obtener todas las citas (Solo Administrador)
// ========================================
export const obtenerTodasLasCitas = (_req: Request, res: Response): void => {
  const lista = citasService.obtenerTodasLasCitas();
  res.status(200).json({
    success: true,
    mensaje: 'Lista de todas las citas',
    citas: lista,
  });
};

// ========================================
// Obtener cita por ID individual (Protegido por autorizarAccesoCita)
// ========================================
export const obtenerCitaPorId = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const cita = citasService.obtenerCitaPorId(id);

  if (!cita) {
    res.status(404).json({
      success: false,
      mensaje: 'Cita no encontrada',
      message: 'Cita no encontrada',
    });
    return;
  }

  res.status(200).json({
    success: true,
    cita,
  });
};

// ========================================
// Obtener citas por paciente (Protegido por autorizarPacientePropio)
// ========================================
export const obtenerCitasPorPaciente = (req: Request, res: Response): void => {
  const pacienteId = req.params.pacienteId as string;
  const lista = citasService.obtenerCitasPorPaciente(pacienteId);

  res.status(200).json({
    success: true,
    mensaje: 'Citas del paciente obtenidas correctamente',
    citas: lista,
  });
};

// ========================================
// Obtener citas por médico (Protegido por autorizarMedicoPropio)
// ========================================
export const obtenerCitasPorMedico = (req: Request, res: Response): void => {
  const medicoId = req.params.medicoId as string;
  const lista = citasService.obtenerCitasPorMedico(medicoId);

  res.status(200).json({
    success: true,
    mensaje: 'Citas del médico obtenidas correctamente',
    citas: lista,
  });
};

// ========================================
// /mis-citas: Identidad derivada del JWT sin ID en URL (Bloque 6C / Test 19-23, 43-46)
// ========================================
export const obtenerMisCitas = (req: Request, res: Response): void => {
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

  // Separación semántica: el admin no es paciente ni médico (Test 21 & 45)
  if (rawRol === 'administrador' || rawRol === 'admin') {
    res.status(403).json({
      success: false,
      mensaje: 'Endpoint restringido a perfiles de paciente o médico',
      message: 'Endpoint restringido a perfiles de paciente o médico',
    });
    return;
  }

  if (rawRol === 'paciente' || rawRol === 'user' || rawRol === 'usuario') {
    const paciente = pacientesService.obtenerPacientePorUsuarioId(usuario.id);
    if (!paciente) {
      res.status(403).json({
        success: false,
        mensaje: 'El usuario no tiene un paciente asociado',
        message: 'El usuario no tiene un paciente asociado',
      });
      return;
    }
    const misCitas = citasService.obtenerCitasPorPaciente(paciente.id);
    res.status(200).json({
      success: true,
      mensaje: 'Mis citas como paciente',
      citas: misCitas,
    });
    return;
  }

  if (rawRol === 'medico' || rawRol === 'doctor' || rawRol === 'auditor') {
    const medico = medicosService.obtenerMedicoPorUsuarioId(usuario.id);
    if (!medico) {
      res.status(403).json({
        success: false,
        mensaje: 'El usuario no tiene un médico asociado',
        message: 'El usuario no tiene un médico asociado',
      });
      return;
    }
    const misCitas = citasService.obtenerCitasPorMedico(medico.id);
    res.status(200).json({
      success: true,
      mensaje: 'Mis citas como médico',
      citas: misCitas,
    });
    return;
  }

  res.status(403).json({
    success: false,
    mensaje: 'No tiene permisos para acceder a este recurso',
  });
};

// ========================================
// Crear cita (Solo Administrador)
// ========================================
export const crearCita = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const datos = matchedData(req, { locations: ['body'] }) as any;
    const cita = citasService.crearCita(datos);

    res.status(201).json({
      success: true,
      mensaje: 'Cita creada correctamente',
      cita,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// Actualizar cita (Solo Administrador)
// ========================================
export const actualizarCita = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const id = req.params.id as string;
    const datos = req.body;
    const cita = citasService.actualizarCita(id, datos);

    if (!cita) {
      res.status(404).json({ success: false, mensaje: 'Cita no encontrada' });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Cita actualizada correctamente',
      cita,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// Cambiar estado de cita con Máquina de Estados (Solo Administrador)
// ========================================
export const cambiarEstadoCita = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const id = req.params.id as string;
    const { estado } = req.body;

    const resultado = citasService.cambiarEstadoCita(id, estado);

    if (!resultado.exito) {
      if (resultado.error === 'NO_ENCONTRADA') {
        res.status(404).json({ success: false, mensaje: 'Cita no encontrada' });
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
      mensaje: 'Estado de cita actualizado correctamente',
      cita: resultado.cita,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// Eliminar cita (Solo Administrador)
// ========================================
export const eliminarCita = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const eliminada = citasService.eliminarCita(id);

  if (!eliminada) {
    res.status(404).json({ success: false, mensaje: 'Cita no encontrada' });
    return;
  }

  res.status(200).json({
    success: true,
    mensaje: 'Cita eliminada correctamente',
  });
};

export default {
  obtenerTodasLasCitas,
  obtenerCitaPorId,
  obtenerCitasPorPaciente,
  obtenerCitasPorMedico,
  obtenerMisCitas,
  crearCita,
  actualizarCita,
  cambiarEstadoCita,
  eliminarCita,
};
