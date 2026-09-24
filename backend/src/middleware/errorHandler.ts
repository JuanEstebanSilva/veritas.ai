import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

/**
 * Manejador global de errores.
 *
 * Regla de oro (hallazgo "Application Error Disclosure" de OWASP ZAP, Lab 5):
 * el detalle técnico de un error se REGISTRA en el servidor, nunca se DEVUELVE
 * al cliente. Una traza de pila revela rutas del sistema de ficheros, versiones
 * de librerías y estructura interna del proyecto, que es justo el mapa que un
 * atacante necesita para orientar el siguiente paso.
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // El detalle completo, incluida la traza, queda solo en los registros del servidor
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

  // Cuerpo mal formado: body-parser lanza un SyntaxError con status 400 y la
  // propiedad `body`. Su mensaje incluye un fragmento de la entrada y detalles
  // internos del parser, así que se sustituye por uno neutro.
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'El cuerpo de la petición no es un JSON válido.',
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

  // Los errores 4xx son fallos deliberados de la aplicación y su mensaje está
  // redactado para el usuario. Los 5xx son fallos inesperados: su mensaje puede
  // arrastrar detalle interno, de modo que se responde siempre con un texto fijo.
  const message =
    statusCode < 500
      ? err.message || 'Petición inválida.'
      : 'Ha ocurrido un error interno en el servidor.';

  res.status(statusCode).json({ success: false, message });
};
