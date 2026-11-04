import { Request, Response, NextFunction } from 'express';
import { body, param, matchedData, validationResult } from 'express-validator';

/**
 * Validaciones de Autenticación para Veritas AI (Laboratorio 8 y Bloque 11)
 *
 * Incluye validaciones para:
 * - Registro público seguro (rol fijado por el servidor)
 * - Inicio de sesión
 * - Cambio de contraseña propia
 * - Recuperación administrativa de contraseñas
 * - Restablecimiento mediante token temporal
 * - Códigos de respaldo de un solo uso
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
    .isEmail()
    .withMessage('Debe proporcionar un correo electrónico válido')
    .normalizeEmail(),

  body('password')
    .isString()
    .withMessage('La contraseña debe ser texto')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),
];

// ========================================
// Bloque 11: Cambio de Contraseña Propia
// ========================================
export const validarCambioPassword = [
  body('passwordActual')
    .isString()
    .notEmpty()
    .withMessage('La contraseña actual es obligatoria'),

  body('passwordNueva')
    .isString()
    .isLength({ min: 12, max: 72 })
    .withMessage('La nueva contraseña debe tener entre 12 y 72 caracteres')
    .custom((v) => {
      if (!/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/[0-9]/.test(v)) {
        throw new Error('Incluya mayúscula, minúscula y número');
      }
      return true;
    }),

  body('confirmarPassword')
    .isString()
    .custom((v, { req }) => v === req.body.passwordNueva)
    .withMessage('La confirmación no coincide'),
];

// ========================================
// Bloque 11: Recuperación Administrativa
// ========================================
export const validarGenerarRecuperacion = [
  param('usuarioId')
    .custom((val) => {
      if (!val || (isNaN(Number(val)) && typeof val !== 'string')) {
        throw new Error('ID de usuario inválido');
      }
      return true;
    })
    .withMessage('ID de usuario inválido'),
];

export const validarRestablecimiento = [
  body('token')
    .isString()
    .matches(/^[a-f0-9]{64}$/i)
    .withMessage('Token inválido'),

  body('passwordNueva')
    .isString()
    .isLength({ min: 12, max: 72 })
    .withMessage('La nueva contraseña debe tener entre 12 y 72 caracteres')
    .custom((v) => {
      if (!/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/[0-9]/.test(v)) {
        throw new Error('Incluya mayúscula, minúscula y número');
      }
      return true;
    }),

  body('confirmarPassword')
    .isString()
    .custom((v, { req }) => v === req.body.passwordNueva)
    .withMessage('La confirmación no coincide'),
];

// ========================================
// Bloque 11: Códigos de Respaldo
// ========================================
export const validarGenerarCodigos = [
  body('passwordActual')
    .isString()
    .notEmpty()
    .withMessage('Contraseña actual obligatoria'),
];

export const validarRestablecerConCodigo = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Correo inválido'),

  body('codigo')
    .isString()
    .matches(/^[a-fA-F0-9]{4}(?:-[a-fA-F0-9]{4}){7}$/)
    .withMessage('Código inválido'),

  body('passwordNueva')
    .isString()
    .isLength({ min: 12, max: 72 })
    .withMessage('La nueva contraseña debe tener entre 12 y 72 caracteres')
    .custom((v) => {
      if (!/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/[0-9]/.test(v)) {
        throw new Error('Contraseña insegura');
      }
      return true;
    }),

  body('confirmarPassword')
    .isString()
    .custom((v, { req }) => v === req.body.passwordNueva)
    .withMessage('La confirmación no coincide'),
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
      mensaje:
        primerError === 'Debe proporcionar un correo electrónico válido'
          ? 'Debe proporcionar un correo electrónico válido'
          : 'Datos inválidos',
      errores: errors.array(),
      errors: errors.array(),
    });
    return;
  }
  next();
};

export default {
  validarRegistro,
  validarLogin,
  validarCambioPassword,
  validarGenerarRecuperacion,
  validarRestablecimiento,
  validarGenerarCodigos,
  validarRestablecerConCodigo,
  verificarErroresValidacion,
};
