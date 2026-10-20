import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

/**
 * Manejador global de errores de Veritas AI.
 *
 * Mapeo de errores de PostgreSQL / Supabase:
 * - 23505 (unique_violation) -> HTTP 409 Conflict
 * - 23503 (foreign_key_violation) -> HTTP 409 Conflict (si existen dependencias hijas)
 *                                   o HTTP 400 Bad Request (si la referencia padre no existe)
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // El detalle completo queda en consola del servidor
  console.error('[Error Veritas AI]:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        mensaje: 'El archivo excede el tamaño máximo permitido de 10 MB.',
        message: 'El archivo excede el tamaño máximo permitido de 10 MB.',
      });
      return;
    }
    res.status(400).json({
      success: false,
      mensaje: `Error en la subida del documento: ${err.message}`,
      message: `Error en la subida del documento: ${err.message}`,
    });
    return;
  }

  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    res.status(400).json({
      success: false,
      mensaje: 'El cuerpo de la petición no es un JSON válido.',
      message: 'El cuerpo de la petición no es un JSON válido.',
    });
    return;
  }

  // Mapeo de errores PostgreSQL: 23505 (unique_violation) -> HTTP 409 Conflict
  if (err.code === '23505') {
    res.status(409).json({
      success: false,
      mensaje: 'Conflicto de unicidad: el registro o identificador ya existe.',
      message: 'Conflicto de unicidad: el registro o identificador ya existe.',
    });
    return;
  }

  // Mapeo de errores PostgreSQL: 23503 (foreign_key_violation)
  if (err.code === '23503') {
    const detail = String(err.detail || err.message || '').toLowerCase();
    const esDependenciaHija =
      detail.includes('still referenced') ||
      detail.includes('aún es referenciado') ||
      detail.includes('todavía es referenciado') ||
      detail.includes('is still referenced from table');

    if (esDependenciaHija) {
      res.status(409).json({
        success: false,
        mensaje: 'No se puede eliminar el recurso porque tiene dependencias asociadas.',
        message: 'No se puede eliminar el recurso porque tiene dependencias asociadas.',
      });
      return;
    }

    res.status(400).json({
      success: false,
      mensaje: 'El recurso referenciado no existe en la base de datos.',
      message: 'El recurso referenciado no existe en la base de datos.',
    });
    return;
  }

  if (err.message && err.message.includes('Formato inválido')) {
    res.status(400).json({
      success: false,
      mensaje: err.message,
      message: err.message,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode < 500
      ? err.message || 'Petición inválida.'
      : 'Ha ocurrido un error interno en el servidor.';

  res.status(statusCode).json({
    success: false,
    mensaje: message,
    message,
  });
};
