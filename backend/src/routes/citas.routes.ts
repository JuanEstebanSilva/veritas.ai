import { Router } from 'express';
import {
  obtenerTodasLasCitas,
  obtenerCitaPorId,
  obtenerCitasPorPaciente,
  obtenerCitasPorMedico,
  obtenerMisCitas,
  crearCita,
  actualizarCita,
  cambiarEstadoCita,
  eliminarCita,
} from '../controllers/citas.controller';
import {
  validarCreacionCita,
  validarIdCita,
  validarEstadoCita,
} from '../middlewares/citas.validator';
import { validarIdPaciente } from '../middlewares/pacientes.validator';
import { validarIdMedico } from '../middlewares/medicos.validator';
import { validar } from '../middlewares/validar.middleware';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';
import {
  autorizarPacientePropio,
  autorizarMedicoPropio,
  autorizarAccesoCita,
} from '../middlewares/propiedad.middleware';

const router = Router();

/**
 * @swagger
 * /api/citas/mis-citas:
 *   get:
 *     tags:
 *       - Citas
 *     summary: Obtener citas propias del usuario autenticado (derivadas del JWT)
 *     description: Permite a pacientes y médicos consultar sus citas sin exponer IDs ajenos en la URL.
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de citas del perfil autenticado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado o perfil no asociado
 */
router.get(
  ['/mis-citas', '/mis-revisiones'],
  autenticarJWT,
  obtenerMisCitas
);

/**
 * @swagger
 * /api/citas:
 *   get:
 *     tags:
 *       - Citas
 *     summary: Listar todas las citas (Solo Administrador)
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas las citas del hospital
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 */
router.get(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  obtenerTodasLasCitas
);

/**
 * @swagger
 * /api/citas/paciente/{pacienteId}:
 *   get:
 *     tags:
 *       - Citas
 *     summary: Consultar citas por paciente con protección BOLA/IDOR
 *     parameters:
 *       - in: path
 *         name: pacienteId
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Citas del paciente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: BOLA/IDOR - No tiene permisos para ver citas de otro paciente
 */
router.get(
  ['/paciente/:pacienteId', '/estudiante/:pacienteId'],
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'paciente', 'user', 'estudiante'),
  validarIdPaciente,
  validar,
  autorizarPacientePropio,
  obtenerCitasPorPaciente
);

/**
 * @swagger
 * /api/citas/medico/{medicoId}:
 *   get:
 *     tags:
 *       - Citas
 *     summary: Consultar citas por médico con protección BOLA/IDOR
 *     parameters:
 *       - in: path
 *         name: medicoId
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Citas del médico
 *       401:
 *         description: No autenticado
 *       403:
 *         description: BOLA/IDOR - No tiene permisos para ver citas de otro médico
 */
router.get(
  ['/medico/:medicoId', '/docente/:medicoId', '/profesor/:medicoId'],
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'docente', 'profesor'),
  validarIdMedico,
  validar,
  autorizarMedicoPropio,
  obtenerCitasPorMedico
);

/**
 * @swagger
 * /api/citas/{id}:
 *   get:
 *     tags:
 *       - Citas
 *     summary: Consultar cita individual con protección BOLA a nivel de objeto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Detalle de la cita
 *       401:
 *         description: No autenticado
 *       403:
 *         description: BOLA - La cita no pertenece al usuario autenticado
 *       404:
 *         description: Cita no encontrada
 */
router.get(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'paciente', 'user'),
  validarIdCita,
  validar,
  autorizarAccesoCita,
  obtenerCitaPorId
);

router.post(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarCreacionCita,
  validar,
  crearCita
);

router.patch(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdCita,
  validar,
  actualizarCita
);

router.patch(
  '/:id/estado',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdCita,
  validarEstadoCita,
  validar,
  cambiarEstadoCita
);

router.delete(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdCita,
  validar,
  eliminarCita
);

export default router;
