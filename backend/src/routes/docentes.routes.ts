import { Router } from 'express';
import {
  obtenerDocentes,
  obtenerDocentePorId,
  crearDocente,
  actualizarDocente,
  actualizarDocenteParcial,
  eliminarDocente,
} from '../controllers/docentes.controller';
import {
  validarCreacionDocente,
  validarDocenteParcial,
  validarIdDocente,
} from '../middlewares/docentes.validator';
import { validar } from '../middlewares/validar.middleware';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';

const router = Router();

router.get(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'paciente', 'user', 'docente', 'estudiante'),
  obtenerDocentes
);

router.get(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'paciente', 'user', 'docente', 'estudiante'),
  validarIdDocente,
  validar,
  obtenerDocentePorId
);

router.post(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarCreacionDocente,
  validar,
  crearDocente
);

router.put(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdDocente,
  validarCreacionDocente,
  validar,
  actualizarDocente
);

router.patch(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdDocente,
  validarDocenteParcial,
  validar,
  actualizarDocenteParcial
);

router.delete(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdDocente,
  validar,
  eliminarDocente
);

export default router;
