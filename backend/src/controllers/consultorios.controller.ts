import { Request, Response } from 'express';
import consultoriosService from '../services/consultorios.service';

export const obtenerConsultorios = (_req: Request, res: Response): void => {
  const lista = consultoriosService.obtenerConsultorios();
  res.status(200).json({
    success: true,
    consultorios: lista,
  });
};

export const obtenerConsultorioPorId = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const c = consultoriosService.obtenerConsultorioPorId(id);
  if (!c) {
    res.status(404).json({ success: false, mensaje: 'Consultorio no encontrado' });
    return;
  }
  res.status(200).json({ success: true, consultorio: c });
};

export const crearConsultorio = (req: Request, res: Response): void => {
  const { numero, piso } = req.body;
  const nuevo = consultoriosService.crearConsultorio({ numero, piso });
  res.status(201).json({
    success: true,
    mensaje: 'Consultorio creado correctamente',
    consultorio: nuevo,
  });
};

export const actualizarConsultorio = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const c = consultoriosService.actualizarConsultorio(id, req.body);
  if (!c) {
    res.status(404).json({ success: false, mensaje: 'Consultorio no encontrado' });
    return;
  }
  res.status(200).json({ success: true, mensaje: 'Consultorio actualizado correctamente', consultorio: c });
};

export const eliminarConsultorio = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const eliminado = consultoriosService.eliminarConsultorio(id);
  if (!eliminado) {
    res.status(404).json({ success: false, mensaje: 'Consultorio no encontrado' });
    return;
  }
  res.status(200).json({ success: true, mensaje: 'Consultorio eliminado correctamente' });
};

export default {
  obtenerConsultorios,
  obtenerConsultorioPorId,
  crearConsultorio,
  actualizarConsultorio,
  eliminarConsultorio,
};
