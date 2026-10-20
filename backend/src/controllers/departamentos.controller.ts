import { Request, Response, NextFunction } from 'express';
import departamentosService from '../services/departamentos.service';

/**
 * Veritas AI — Controlador de Departamentos y Facultades Académicas
 */

export const obtenerDepartamentos = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lista = await departamentosService.obtenerDepartamentos();
    res.status(200).json({
      success: true,
      total: lista.length,
      mensaje: 'Lista de departamentos académicos obtenida correctamente',
      departamentos: lista,
      especialidades: lista,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerDepartamentoPorId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const dep = await departamentosService.obtenerDepartamentoPorId(id);

    if (!dep) {
      res.status(404).json({
        success: false,
        mensaje: 'Departamento no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      departamento: dep,
      especialidad: dep,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  obtenerDepartamentos,
  obtenerDepartamentoPorId,
  // Alias de compatibilidad
  obtenerEspecialidades: obtenerDepartamentos,
  obtenerEspecialidadPorId: obtenerDepartamentoPorId,
};
