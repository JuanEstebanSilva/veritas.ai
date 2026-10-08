import { Router } from 'express';
import {
  obtenerTodasLasRevisiones,
  obtenerRevisionPorId,
  obtenerRevisionesPorEstudiante,
  obtenerRevisionesPorDocente,
  obtenerMisRevisiones,
  crearRevision,
  actualizarRevision,
  cambiarEstadoRevision,
  eliminarRevision,
} from '../controllers/revisiones.controller';
import {
  validarCreacionRevision,
  validarIdRevision,
  validarEstadoRevision,
} from '../middlewares/revisiones.validator';
import { validarIdEstudiante } from '../middlewares/estudiantes.validator';
import { validarIdDocente } from '../middlewares/docentes.validator';
import { validar } from '../middlewares/validar.middleware';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';
import {
  autorizarEstudiantePropio,
  autorizarDocentePropio,
  autorizarAccesoRevision,
} from '../middlewares/propiedad.middleware';

const router = Router();

router.get(
  ['/mis-revisiones', '/mis-citas'],
  autenticarJWT,
  obtenerMisRevisiones
);

router.get(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  obtenerTodasLasRevisiones
);

router.get(
  ['/estudiante/:estudianteId', '/paciente/:estudianteId'],
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'paciente', 'user', 'estudiante'),
  validarIdEstudiante,
  validar,
  autorizarEstudiantePropio,
  obtenerRevisionesPorEstudiante
);

router.get(
  ['/docente/:docenteId', '/medico/:docenteId', '/profesor/:docenteId'],
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'docente', 'profesor', 'auditor'),
  validarIdDocente,
  validar,
  autorizarDocentePropio,
  obtenerRevisionesPorDocente
);

router.get(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'paciente', 'user', 'docente', 'estudiante', 'auditor'),
  validarIdRevision,
  validar,
  autorizarAccesoRevision,
  obtenerRevisionPorId
);

router.post(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarCreacionRevision,
  validar,
  crearRevision
);

router.patch(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdRevision,
  validar,
  actualizarRevision
);

router.patch(
  '/:id/estado',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdRevision,
  validarEstadoRevision,
  validar,
  cambiarEstadoRevision
);

router.delete(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdRevision,
  validar,
  eliminarRevision
);

export default router;
