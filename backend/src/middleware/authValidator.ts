import { Request, Response, NextFunction } from 'express';
import { body, matchedData, validationResult } from 'express-validator';

/**
 * Laboratorio No. 8 — Control del rol y prevención de escalada de privilegios
 * PARTE 2 — Primera defensa: modificar auth.validator.js
 *
 * Vamos a eliminar completamente la validación de rol del registro.
 * El cliente ya no puede enviar ni controlar el campo "rol" ni atributos sensibles.
 */

// ========================================
// Registro
// ========================================
export const validarRegistro = [
  body('nombre')
    .optional()
    .isString()
    .withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre debe tener entre 3 y 100 caracteres'),

  body('name')
    .optional()
    .isString()
    .withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre debe tener entre 3 y 100 caracteres'),

  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un correo electrónico válido')
    .normalizeEmail(),

  body('password')
    .isString()
    .withMessage('La contraseña debe ser texto')
    .isLength({ min: 10, max: 72 })
    .withMessage('La contraseña debe tener entre 10 y 72 caracteres'),

  body('last_name').optional().isString().trim(),
  body('confirm_password').optional().isString(),

  // Validación personalizada para garantizar presencia de nombre y coincidencia de confirmación si existe
  body().custom((_, { req }) => {
    const rawNombre = req.body.nombre || req.body.name;
    if (!rawNombre || typeof rawNombre !== 'string' || rawNombre.trim().length < 3) {
      throw new Error('El nombre debe tener entre 3 y 100 caracteres');
    }

    if (req.body.confirm_password && req.body.password !== req.body.confirm_password) {
      throw new Error('Las contraseñas no coinciden.');
    }

    return true;
  }),
];

// ========================================
// Login
// ========================================
export const validarLogin = [
  body('email')
    .isString()
    .withMessage('Debe proporcionar un correo electrónico válido')
    .notEmpty()
    .withMessage('El correo es obligatorio'),

  body('password')
    .isString()
    .withMessage('La contraseña debe ser texto')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),
];

/**
 * Middleware para procesar los errores de validación de express-validator
 */
export const verificarErroresValidacion = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const primerError = errors.array()[0].msg;
    res.status(400).json({
      success: false,
      message: primerError,
      mensaje: primerError === 'Debe proporcionar un correo electrónico válido'
        ? 'Debe proporcionar un correo electrónico válido'
        : 'Datos inválidos',
      errors: errors.array(),
    });
    return;
  }
  next();
};

export { matchedData };
