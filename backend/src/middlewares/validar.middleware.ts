import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware genérico para verificar resultados de express-validator
 * Usado en toda la API para garantizar que las peticiones con datos inválidos respondan 400 Bad Request.
 */
export const validar = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      mensaje: 'Datos inválidos',
      message: 'Datos inválidos',
      errores: errors.array(),
      errors: errors.array(),
    });
    return;
  }
  next();
};

export default validar;
