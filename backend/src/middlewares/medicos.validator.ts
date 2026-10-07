import { body, param } from 'express-validator';

/**
 * Laboratorio No. 10 — Autorización Segura en APIs REST: RBAC, IDOR/BOLA
 * BLOQUE 6C — Validador para médicos con soporte de usuarioId
 */

export const validarCreacionMedico = [
  body('nombre')
    .isString()
    .withMessage('El nombre debe ser texto')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio'),

  body('registroMedico')
    .isString()
    .withMessage('El registro médico debe ser texto')
    .trim()
    .notEmpty()
    .withMessage('El registro médico es obligatorio'),

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

  body('especialidadId')
    .isInt({ min: 1 })
    .withMessage('La especialidadId debe ser un entero positivo')
    .toInt(),

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

export const validarMedicoParcial = [
  body('nombre').optional().isString().trim(),
  body('registroMedico').optional().isString().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('telefono').optional().isString().trim(),
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

export const validarIdMedico = [
  param('id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de médico debe ser un entero positivo')
    .toInt(),
  param('medicoId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de médico debe ser un entero positivo')
    .toInt(),
];

export default {
  validarCreacionMedico,
  validarMedicoParcial,
  validarIdMedico,
};
