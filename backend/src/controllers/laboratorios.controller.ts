import { Request, Response, NextFunction } from 'express';
import laboratoriosService from '../services/laboratorios.service';

/**
 * Veritas AI — Controlador de Laboratorios y Nodos de Cómputo
 */

export const obtenerLaboratorios = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lista = await laboratoriosService.obtenerLaboratorios();
    res.status(200).json({
      success: true,
      total: lista.length,
      mensaje: 'Lista de laboratorios y nodos de cómputo obtenida correctamente',
      laboratorios: lista,
      consultorios: lista,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerLaboratorioPorId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const lab = await laboratoriosService.obtenerLaboratorioPorId(id);

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
  } catch (error) {
    next(error);
  }
};

export default {
  obtenerLaboratorios,
  obtenerLaboratorioPorId,
  // Alias de compatibilidad
  obtenerConsultorios: obtenerLaboratorios,
  obtenerConsultorioPorId: obtenerLaboratorioPorId,
};
