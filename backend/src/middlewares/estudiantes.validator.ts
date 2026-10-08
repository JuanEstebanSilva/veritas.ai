import { body, param } from 'express-validator';

export const validarCreacionEstudiante = [
  body('nombre')
    .isString()
    .withMessage('El nombre debe ser texto')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio'),

  body('documento')
    .isString()
    .withMessage('El documento debe ser texto')
    .trim()
    .notEmpty()
    .withMessage('El documento es obligatorio'),

  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un correo electrónico válido')
    .normalizeEmail(),

  body('telefono')
    .isString()
    .withMessage('El teléfono debe ser texto')
    .trim()
    .notEmpty()
    .withMessage('El teléfono es obligatorio'),

  body('fechaNacimiento')
    .isString()
    .withMessage('La fecha de nacimiento debe ser texto')
    .notEmpty()
    .withMessage('La fecha de nacimiento es obligatoria'),

  body('usuarioId')
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === undefined) return true;
      if (typeof val === 'number') {
        if (!Number.isInteger(val) || val < 1) {
          throw new Error('El usuarioId debe ser un entero positivo');
        }
        return true;
      }
      if (typeof val === 'string') {
        const num = Number(val);
        if (!isNaN(num)) {
          if (!Number.isInteger(num) || num < 1) {
            throw new Error('El usuarioId debe ser un entero positivo');
          }
          return true;
        }
        if (val.trim().length > 0) {
          return true;
        }
      }
      throw new Error('El usuarioId debe ser un entero positivo');
    }),
];

export const validarEstudianteParcial = [
  body('nombre').optional().isString().trim(),
  body('documento').optional().isString().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('telefono').optional().isString().trim(),
  body('fechaNacimiento').optional().isString(),
  body('usuarioId')
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === undefined) return true;
      if (typeof val === 'number') {
        if (!Number.isInteger(val) || val < 1) {
          throw new Error('El usuarioId debe ser un entero positivo');
        }
        return true;
      }
      if (typeof val === 'string') {
        const num = Number(val);
        if (!isNaN(num)) {
          if (!Number.isInteger(num) || num < 1) {
            throw new Error('El usuarioId debe ser un entero positivo');
          }
          return true;
        }
        if (val.trim().length > 0) {
          return true;
        }
      }
      throw new Error('El usuarioId debe ser un entero positivo');
    }),
];

export const validarIdEstudiante = [
  param('id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de estudiante debe ser un entero positivo')
    .toInt(),
  param('estudianteId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de estudiante debe ser un entero positivo')
    .toInt(),
  param('pacienteId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de estudiante debe ser un entero positivo')
    .toInt(),
];

export default {
  validarCreacionEstudiante,
  validarEstudianteParcial,
  validarIdEstudiante,
  // Alias de compatibilidad
  validarCreacionPaciente: validarCreacionEstudiante,
  validarPacienteParcial: validarEstudianteParcial,
  validarIdPaciente: validarIdEstudiante,
};
