import { Request, Response } from 'express';
import laboratoriosService from '../services/laboratorios.service';

export const obtenerLaboratorios = (_req: Request, res: Response): void => {
  const lista = laboratoriosService.obtenerLaboratorios();
  res.status(200).json({
    success: true,
    total: lista.length,
    mensaje: 'Lista de laboratorios y nodos de cómputo obtenida correctamente',
    laboratorios: lista,
    consultorios: lista,
  });
};

export const obtenerLaboratorioPorId = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const lab = laboratoriosService.obtenerLaboratorioPorId(id);

  if (!lab) {
    res.status(404).json({
      success: false,
      mensaje: 'Laboratorio no encontrado',
    });
    return;
  }

  res.status(200).json({
    success: true,
    laboratorio: lab,
    consultorio: lab,
  });
};

export default {
  obtenerLaboratorios,
  obtenerLaboratorioPorId,
  // Alias
  obtenerConsultorios: obtenerLaboratorios,
  obtenerConsultorioPorId: obtenerLaboratorioPorId,
};
