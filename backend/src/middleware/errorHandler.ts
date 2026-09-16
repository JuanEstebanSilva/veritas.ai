import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error Plagelio]:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'El archivo excede el tamaño máximo permitido de 10 MB.',
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `Error en la subida del documento: ${err.message}`,
    });
    return;
  }

  if (err.message && err.message.includes('Formato inválido')) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Ha ocurrido un error interno en el servidor.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
