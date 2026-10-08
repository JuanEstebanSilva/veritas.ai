import { Router } from 'express';
import {
  obtenerLaboratorios,
  obtenerLaboratorioPorId,
} from '../controllers/laboratorios.controller';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';

const router = Router();

router.get(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'paciente', 'user', 'docente', 'estudiante'),
  obtenerLaboratorios
);

router.get(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'paciente', 'user', 'docente', 'estudiante'),
  obtenerLaboratorioPorId
);

export default router;
