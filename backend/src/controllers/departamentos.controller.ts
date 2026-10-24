import { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import departamentosService from '../services/departamentos.service';

/**
 * Veritas AI — Controlador de Departamentos y Facultades Académicas (Especialidades)
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

export const crearDepartamento = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const datos = matchedData(req, { locations: ['body'] }) as any;
    const nuevo = await departamentosService.crearDepartamento(datos);

    res.status(201).json({
      success: true,
      mensaje: 'Departamento académico creado exitosamente',
      departamento: nuevo,
      especialidad: nuevo,
    });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        mensaje: 'Ya existe un departamento con ese nombre.',
      });
      return;
    }
    next(error);
  }
};

export const actualizarDepartamento = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const datos = matchedData(req, { locations: ['body'] }) as any;
    const actualizado = await departamentosService.actualizarDepartamento(id, datos);

    if (!actualizado) {
      res.status(404).json({
        success: false,
        mensaje: 'Departamento no encontrado para actualizar',
      });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Departamento académico actualizado completamente',
      departamento: actualizado,
      especialidad: actualizado,
    });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        mensaje: 'Ya existe otro departamento con ese nombre.',
      });
      return;
    }
    next(error);
  }
};

export const actualizarDepartamentoParcial = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const datos = matchedData(req, { locations: ['body'] }) as any;
    const actualizado = await departamentosService.actualizarDepartamentoParcial(id, datos);

    if (!actualizado) {
      res.status(404).json({
        success: false,
        mensaje: 'Departamento no encontrado para actualizar',
      });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Departamento académico actualizado parcialmente',
      departamento: actualizado,
      especialidad: actualizado,
    });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        mensaje: 'Ya existe otro departamento con ese nombre.',
      });
      return;
    }
    next(error);
  }
};

export const eliminarDepartamento = async (
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

    const resultado = await departamentosService.eliminarDepartamento(id);
    if (!resultado.eliminado) {
      res.status(409).json({
        success: false,
        mensaje: resultado.motivo || 'No se puede eliminar el departamento debido a restricciones de integridad referencial.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Departamento académico eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  obtenerDepartamentos,
  obtenerDepartamentoPorId,
  crearDepartamento,
  actualizarDepartamento,
  actualizarDepartamentoParcial,
  eliminarDepartamento,
  // Aliases de compatibilidad
  obtenerEspecialidades: obtenerDepartamentos,
  obtenerEspecialidadPorId: obtenerDepartamentoPorId,
  crearEspecialidad: crearDepartamento,
  actualizarEspecialidad: actualizarDepartamento,
  actualizarEspecialidadParcial: actualizarDepartamentoParcial,
  eliminarEspecialidad: eliminarDepartamento,
};
