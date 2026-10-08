import { body, param } from 'express-validator';

/**
 * Laboratorio No. 10 — Autorización Segura en APIs REST: RBAC, IDOR/BOLA
 * Validador para citas médicas
 */

export const validarCreacionCita = [
  body('pacienteId')
    .custom((val, { req }) => {
      const id = val || req.body.estudianteId;
      if (!id || isNaN(Number(id)) || Number(id) < 1) {
        throw new Error('El pacienteId o estudianteId debe ser un entero positivo');
      }
      req.body.pacienteId = Number(id);
      return true;
    }),

  body('medicoId')
    .custom((val, { req }) => {
      const id = val || req.body.docenteId;
      if (!id || isNaN(Number(id)) || Number(id) < 1) {
        throw new Error('El medicoId o docenteId debe ser un entero positivo');
      }
      req.body.medicoId = Number(id);
      return true;
    }),

  body('fecha')
    .isISO8601()
    .withMessage('La fecha debe tener formato ISO8601 válido'),

  body('motivo')
    .isString()
    .withMessage('El motivo debe ser texto')
    .trim()
    .notEmpty()
    .withMessage('El motivo es obligatorio'),
];

export const validarIdCita = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID de cita debe ser un entero positivo')
    .toInt(),
];

export const validarEstadoCita = [
  body('estado')
    .isIn(['programada', 'confirmada', 'atendida', 'cancelada'])
    .withMessage('El estado debe ser programada, confirmada, atendida o cancelada'),
];

export default {
  validarCreacionCita,
  validarIdCita,
  validarEstadoCita,
};
