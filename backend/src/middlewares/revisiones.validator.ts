import { body, param } from 'express-validator';

export const validarCreacionRevision = [
  body('estudianteId').optional().isInt({ min: 1 }),
  body('estudiante_id').optional().isInt({ min: 1 }),
  body('pacienteId').optional().isInt({ min: 1 }),
  body('paciente_id').optional().isInt({ min: 1 }),
  body('docenteId').optional().isInt({ min: 1 }),
  body('docente_id').optional().isInt({ min: 1 }),
  body('medicoId').optional().isInt({ min: 1 }),
  body('medico_id').optional().isInt({ min: 1 }),
  body('laboratorioId').optional().isInt({ min: 1 }),
  body('laboratorio_id').optional().isInt({ min: 1 }),
  body('consultorioId').optional().isInt({ min: 1 }),
  body('consultorio_id').optional().isInt({ min: 1 }),
  body('hora').optional().isString(),
  body().custom((value, { req }) => {
    const estId = req.body.estudianteId || req.body.estudiante_id || req.body.pacienteId || req.body.paciente_id;
    if (!estId || isNaN(Number(estId)) || Number(estId) < 1) {
      throw new Error('El estudianteId debe ser un entero positivo');
    }
    req.body.estudianteId = Number(estId);
    req.body.estudiante_id = Number(estId);
    req.body.pacienteId = Number(estId);
    req.body.paciente_id = Number(estId);

    const docId = req.body.docenteId || req.body.docente_id || req.body.medicoId || req.body.medico_id;
    if (!docId || isNaN(Number(docId)) || Number(docId) < 1) {
      throw new Error('El docenteId debe ser un entero positivo');
    }
    req.body.docenteId = Number(docId);
    req.body.docente_id = Number(docId);
    req.body.medicoId = Number(docId);
    req.body.medico_id = Number(docId);

    const labId = req.body.laboratorioId || req.body.laboratorio_id || req.body.consultorioId || req.body.consultorio_id || 1;
    req.body.laboratorioId = Number(labId);
    req.body.laboratorio_id = Number(labId);
    req.body.consultorioId = Number(labId);
    req.body.consultorio_id = Number(labId);

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
