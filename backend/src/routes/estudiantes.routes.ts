import { Router } from 'express';
import {
  obtenerEstudiantes,
  obtenerEstudiantePorId,
  crearEstudiante,
  actualizarEstudiante,
  actualizarEstudianteParcial,
  eliminarEstudiante,
} from '../controllers/estudiantes.controller';
import {
  validarCreacionEstudiante,
  validarEstudianteParcial,
  validarIdEstudiante,
} from '../middlewares/estudiantes.validator';
import { validar } from '../middlewares/validar.middleware';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';

const router = Router();

router.get(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'docente', 'profesor', 'auditor'),
  obtenerEstudiantes
);

router.get(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'docente', 'profesor', 'auditor'),
  validarIdEstudiante,
  validar,
  obtenerEstudiantePorId
);

router.post(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarCreacionEstudiante,
  validar,
  crearEstudiante
);

router.put(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdEstudiante,
  validarCreacionEstudiante,
  validar,
  actualizarEstudiante
);

router.patch(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdEstudiante,
  validarEstudianteParcial,
  validar,
  actualizarEstudianteParcial
);

router.delete(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdEstudiante,
  validar,
  eliminarEstudiante
);

export default router;
