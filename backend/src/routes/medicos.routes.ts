import { Router } from 'express';
import {
  obtenerMedicos,
  obtenerMedicoPorId,
  crearMedico,
  actualizarMedico,
  actualizarMedicoParcial,
  eliminarMedico,
} from '../controllers/medicos.controller';
import {
  validarCreacionMedico,
  validarMedicoParcial,
  validarIdMedico,
} from '../middlewares/medicos.validator';
import { validar } from '../middlewares/validar.middleware';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';

const router = Router();

/**
 * @swagger
 * /api/medicos:
 *   get:
 *     tags:
 *       - Médicos
 *     summary: Obtener todos los médicos
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de médicos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.get(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'paciente', 'user'),
  obtenerMedicos
);

router.get(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'paciente', 'user'),
  validarIdMedico,
  validar,
  obtenerMedicoPorId
);

router.post(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarCreacionMedico,
  validar,
  crearMedico
);

router.put(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdMedico,
  validarCreacionMedico,
  validar,
  actualizarMedico
);

router.patch(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdMedico,
  validarMedicoParcial,
  validar,
  actualizarMedicoParcial
);

router.delete(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdMedico,
  validar,
  eliminarMedico
);

export default router;
