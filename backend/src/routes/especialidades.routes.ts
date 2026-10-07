import { Router } from 'express';
import {
  obtenerEspecialidades,
  obtenerEspecialidadPorId,
  crearEspecialidad,
  actualizarEspecialidad,
  eliminarEspecialidad,
} from '../controllers/especialidades.controller';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';

const router = Router();

router.get(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'paciente', 'user'),
  obtenerEspecialidades
);

router.get(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'paciente', 'user'),
  obtenerEspecialidadPorId
);

router.post(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  crearEspecialidad
);

router.put(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  actualizarEspecialidad
);

router.delete(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  eliminarEspecialidad
);

export default router;
