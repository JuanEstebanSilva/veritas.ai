import { Request, Response } from 'express';
import departamentosService from '../services/departamentos.service';

export const obtenerDepartamentos = (_req: Request, res: Response): void => {
  const lista = departamentosService.obtenerDepartamentos();
  res.status(200).json({
    success: true,
    total: lista.length,
    mensaje: 'Lista de departamentos académicos obtenida correctamente',
    departamentos: lista,
    especialidades: lista,
  });
};

export const obtenerDepartamentoPorId = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const dep = departamentosService.obtenerDepartamentoPorId(id);

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
};

export default {
  obtenerDepartamentos,
  obtenerDepartamentoPorId,
  // Alias
  obtenerEspecialidades: obtenerDepartamentos,
  obtenerEspecialidadPorId: obtenerDepartamentoPorId,
};
