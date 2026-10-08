import { body, param } from 'express-validator';

export const validarCreacionRevision = [
  body('estudianteId').optional().isInt({ min: 1 }),
  body('pacienteId').optional().isInt({ min: 1 }),
  body('docenteId').optional().isInt({ min: 1 }),
  body('medicoId').optional().isInt({ min: 1 }),
  body().custom((value, { req }) => {
    const estId = req.body.estudianteId || req.body.pacienteId;
    if (!estId || isNaN(Number(estId)) || Number(estId) < 1) {
      throw new Error('El estudianteId debe ser un entero positivo');
    }
    req.body.estudianteId = Number(estId);
    req.body.pacienteId = Number(estId);

    const docId = req.body.docenteId || req.body.medicoId;
    if (!docId || isNaN(Number(docId)) || Number(docId) < 1) {
      throw new Error('El docenteId debe ser un entero positivo');
    }
    req.body.docenteId = Number(docId);
    req.body.medicoId = Number(docId);

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

export const validarIdRevision = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID de revisión debe ser un entero positivo')
    .toInt(),
];

export const validarEstadoRevision = [
  body('estado')
    .isIn(['programada', 'confirmada', 'atendida', 'cancelada'])
    .withMessage('El estado debe ser programada, confirmada, atendida o cancelada'),
];

export default {
  validarCreacionRevision,
  validarIdRevision,
  validarEstadoRevision,
  // Alias de compatibilidad
  validarCreacionCita: validarCreacionRevision,
  validarIdCita: validarIdRevision,
  validarEstadoCita: validarEstadoRevision,
};
