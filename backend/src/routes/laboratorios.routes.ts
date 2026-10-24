import { Router } from 'express';
import {
  obtenerLaboratorios,
  obtenerLaboratorioPorId,
  crearLaboratorio,
} from '../controllers/laboratorios.controller';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';

const router = Router();

router.get(
  '/',
  autenticarJWT,
  autorizarRoles(
    'administrador',
    'admin',
    'medico',
    'doctor',
    'paciente',
    'user',
    'docente',
    'profesor',
    'estudiante',
    'auditor'
  ),
  obtenerLaboratorios
);

router.get(
  '/:id',
  autenticarJWT,
  autorizarRoles(
    'administrador',
    'admin',
    'medico',
    'doctor',
    'paciente',
    'user',
    'docente',
    'profesor',
    'estudiante',
    'auditor'
  ),
  obtenerLaboratorioPorId
);

router.post(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  crearLaboratorio
);

export default router;
