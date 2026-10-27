import { Request, Response, NextFunction } from 'express';
import laboratoriosService from '../services/laboratorios.service';

/**
 * Veritas AI — Controlador de Laboratorios y Nodos de Cómputo (Consultorios)
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

export const crearLaboratorio = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const datos = req.body;
    const nuevo = await laboratoriosService.crearLaboratorio(datos);

    res.status(201).json({
      success: true,
      mensaje: 'Laboratorio / Consultorio registrado exitosamente',
      laboratorio: nuevo,
      consultorio: nuevo,
    });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        mensaje: 'Ya existe un laboratorio o consultorio con ese código o número.',
      });
      return;
    }
    next(error);
  }
};

export const actualizarLaboratorio = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const actualizado = await laboratoriosService.actualizarLaboratorio(id, req.body);

    if (!actualizado) {
      res.status(404).json({
        success: false,
        mensaje: 'Laboratorio no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Laboratorio actualizado correctamente',
      laboratorio: actualizado,
      consultorio: actualizado,
    });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        mensaje: 'Ya existe otro laboratorio con ese código o número.',
      });
      return;
    }
    next(error);
  }
};

export const eliminarLaboratorio = async (
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

    const resultado = await laboratoriosService.eliminarLaboratorio(id);

    if (resultado.tieneRevisiones) {
      res.status(409).json({
        success: false,
        mensaje: 'No se puede eliminar el laboratorio porque tiene revisiones asociadas',
        message: 'No se puede eliminar el laboratorio porque tiene revisiones asociadas',
      });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Laboratorio eliminado correctamente',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  obtenerLaboratorios,
  obtenerLaboratorioPorId,
  crearLaboratorio,
  actualizarLaboratorio,
  actualizarLaboratorioParcial: actualizarLaboratorio,
  eliminarLaboratorio,
  // Alias de compatibilidad
  obtenerConsultorios: obtenerLaboratorios,
  obtenerConsultorioPorId: obtenerLaboratorioPorId,
  crearConsultorio: crearLaboratorio,
  actualizarConsultorio: actualizarLaboratorio,
  eliminarConsultorio: eliminarLaboratorio,
};
