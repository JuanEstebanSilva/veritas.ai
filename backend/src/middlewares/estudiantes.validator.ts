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
    .custom((val, { req }) => {
      const fn = val !== undefined ? val : req.body?.fecha_nacimiento;
      if (!fn) {
        throw new Error('La fecha de nacimiento es obligatoria');
      }
      if (typeof fn !== 'string') {
        throw new Error('La fecha de nacimiento debe ser texto');
      }
      req.body.fechaNacimiento = fn;
      return true;
    }),

  body('usuarioId')
    .optional({ nullable: true })
    .custom((val, { req }) => {
      const v = val !== undefined ? val : req.body?.usuario_id;
      if (v === null || v === undefined) return true;
      if (typeof v === 'number') {
        if (!Number.isInteger(v) || v < 1) {
          throw new Error('El usuarioId debe ser un entero positivo');
        }
        return true;
      }
      if (typeof v === 'string') {
        const num = Number(v);
        if (!isNaN(num)) {
          if (!Number.isInteger(num) || num < 1) {
            throw new Error('El usuarioId debe ser un entero positivo');
          }
          return true;
        }
        if (v.trim().length > 0) {
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
  body('fechaNacimiento')
    .optional()
    .custom((val, { req }) => {
      const fn = val !== undefined ? val : req.body?.fecha_nacimiento;
      if (fn && typeof fn !== 'string') {
        throw new Error('La fecha de nacimiento debe ser texto');
      }
      if (fn) req.body.fechaNacimiento = fn;
      return true;
    }),
  body('usuarioId')
    .optional({ nullable: true })
    .custom((val, { req }) => {
      const v = val !== undefined ? val : req.body?.usuario_id;
      if (v === null || v === undefined) return true;
      if (typeof v === 'number') {
        if (!Number.isInteger(v) || v < 1) {
          throw new Error('El usuarioId debe ser un entero positivo');
        }
        return true;
      }
      if (typeof v === 'string') {
        const num = Number(v);
        if (!isNaN(num)) {
          if (!Number.isInteger(num) || num < 1) {
            throw new Error('El usuarioId debe ser un entero positivo');
          }
          return true;
        }
        if (v.trim().length > 0) {
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
