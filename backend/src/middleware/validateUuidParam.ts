import { Request, Response, NextFunction } from 'express';

/**
 * Formato canónico UUID v4 (el que genera Prisma con @default(uuid())).
 */
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validador de identificadores de ruta (Lab 5 - BLOQUE 1).
 *
 * Separa explícitamente los tres estados que exige el laboratorio:
 *   400 Bad Request -> el identificador no es un UUID válido (petición mal formada)
 *   404 Not Found   -> el identificador es válido pero el recurso no existe
 *   409 Conflict    -> el recurso existe pero tiene registros dependientes
 *
 * Sin esta capa, un identificador mal formado llegaría a Prisma y se
 * confundiría con "no encontrado" (404) o produciría un error 500.
 */
export const validateUuidParam = (paramName = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName] as string | undefined;

    if (!value || !UUID_V4.test(value)) {
      res.status(400).json({
        success: false,
        message: `El identificador '${paramName}' no tiene un formato UUID válido.`,
      });
      return;
    }

    next();
  };
};
