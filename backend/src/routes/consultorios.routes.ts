import { Router } from 'express';
import {
  obtenerConsultorios,
  obtenerConsultorioPorId,
  crearConsultorio,
  actualizarConsultorio,
  eliminarConsultorio,
} from '../controllers/consultorios.controller';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';

const router = Router();

router.get(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'paciente', 'user'),
  obtenerConsultorios
);

router.get(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'paciente', 'user'),
  obtenerConsultorioPorId
);

router.post(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  crearConsultorio
);

router.put(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  actualizarConsultorio
);

router.delete(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  eliminarConsultorio
);

export default router;
