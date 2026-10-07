import { Request, Response } from 'express';
import especialidadesService from '../services/especialidades.service';

export const obtenerEspecialidades = (_req: Request, res: Response): void => {
  const lista = especialidadesService.obtenerEspecialidades();
  res.status(200).json({
    success: true,
    especialidades: lista,
  });
};

export const obtenerEspecialidadPorId = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const esp = especialidadesService.obtenerEspecialidadPorId(id);
  if (!esp) {
    res.status(404).json({ success: false, mensaje: 'Especialidad no encontrada' });
    return;
  }
  res.status(200).json({ success: true, especialidad: esp });
};

export const crearEspecialidad = (req: Request, res: Response): void => {
  const { nombre, descripcion } = req.body;
  const nueva = especialidadesService.crearEspecialidad({ nombre, descripcion });
  res.status(201).json({
    success: true,
    mensaje: 'Especialidad creada correctamente',
    especialidad: nueva,
  });
};

export const actualizarEspecialidad = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const esp = especialidadesService.actualizarEspecialidad(id, req.body);
  if (!esp) {
    res.status(404).json({ success: false, mensaje: 'Especialidad no encontrada' });
    return;
  }
  res.status(200).json({ success: true, mensaje: 'Especialidad actualizada correctamente', especialidad: esp });
};

export const eliminarEspecialidad = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const eliminada = especialidadesService.eliminarEspecialidad(id);
  if (!eliminada) {
    res.status(404).json({ success: false, mensaje: 'Especialidad no encontrada' });
    return;
  }
  res.status(200).json({ success: true, mensaje: 'Especialidad eliminada correctamente' });
};

export default {
  obtenerEspecialidades,
  obtenerEspecialidadPorId,
  crearEspecialidad,
  actualizarEspecialidad,
  eliminarEspecialidad,
};
