import { Router } from 'express';
import {
  obtenerDepartamentos,
  obtenerDepartamentoPorId,
} from '../controllers/departamentos.controller';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';

const router = Router();

router.get(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'paciente', 'user', 'docente', 'estudiante'),
  obtenerDepartamentos
);

router.get(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'paciente', 'user', 'docente', 'estudiante'),
  obtenerDepartamentoPorId
);

export default router;
