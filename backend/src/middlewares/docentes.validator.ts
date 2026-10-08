import { body, param } from 'express-validator';

export const validarCreacionDocente = [
  body('nombre')
    .isString()
    .withMessage('El nombre debe ser texto')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio'),

  body('registroAcademico')
    .optional()
    .isString()
    .withMessage('El registro académico debe ser texto')
    .trim(),

  body('registroMedico')
    .optional()
    .isString()
    .withMessage('El registro médico debe ser texto')
    .trim(),

  body().custom((value, { req }) => {
    if (!req.body.registroAcademico && !req.body.registroMedico) {
      throw new Error('El registro académico es obligatorio');
    }
    return true;
  }),

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

  body('departamentoId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El departamentoId debe ser un entero positivo')
    .toInt(),

  body('especialidadId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La especialidadId debe ser un entero positivo')
    .toInt(),

  body().custom((value, { req }) => {
    if (req.body.departamentoId === undefined && req.body.especialidadId === undefined) {
      req.body.departamentoId = 1;
    }
    return true;
  }),

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

export const validarDocenteParcial = [
  body('nombre').optional().isString().trim(),
  body('registroAcademico').optional().isString().trim(),
  body('registroMedico').optional().isString().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('telefono').optional().isString().trim(),
  body('departamentoId').optional().isInt({ min: 1 }).toInt(),
  body('especialidadId').optional().isInt({ min: 1 }).toInt(),
  body('activo').optional().isBoolean(),
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

export const validarIdDocente = [
  param('id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de docente debe ser un entero positivo')
    .toInt(),
  param('docenteId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de docente debe ser un entero positivo')
    .toInt(),
  param('medicoId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de docente debe ser un entero positivo')
    .toInt(),
];

export default {
  validarCreacionDocente,
  validarDocenteParcial,
  validarIdDocente,
  // Alias de compatibilidad
  validarCreacionMedico: validarCreacionDocente,
  validarMedicoParcial: validarDocenteParcial,
  validarIdMedico: validarIdDocente,
};
