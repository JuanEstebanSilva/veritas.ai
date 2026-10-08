import { Router } from 'express';
import {
  obtenerPacientes,
  obtenerPacientePorId,
  crearPaciente,
  actualizarPaciente,
  actualizarPacienteParcial,
  eliminarPaciente,
} from '../controllers/pacientes.controller';
import {
  validarCreacionPaciente,
  validarPacienteParcial,
  validarIdPaciente,
} from '../middlewares/pacientes.validator';
import { validar } from '../middlewares/validar.middleware';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';

const router = Router();

/**
 * @swagger
 * /api/pacientes:
 *   get:
 *     tags:
 *       - Pacientes
 *     summary: Obtener todos los pacientes
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pacientes
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 *       403:
 *         description: Usuario sin permisos para realizar la operación
 */
router.get(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'docente', 'profesor'),
  obtenerPacientes
);

/**
 * @swagger
 * /api/pacientes/{id}:
 *   get:
 *     tags:
 *       - Pacientes
 *     summary: Obtener paciente por ID
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
 *         description: Detalle del paciente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Paciente no encontrado
 */
router.get(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin', 'medico', 'doctor', 'docente', 'profesor'),
  validarIdPaciente,
  validar,
  obtenerPacientePorId
);

/**
 * @swagger
 * /api/pacientes:
 *   post:
 *     tags:
 *       - Pacientes
 *     summary: Crear nuevo paciente (Solo Administrador)
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - documento
 *               - email
 *               - telefono
 *               - fechaNacimiento
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Paciente Veritas A
 *               documento:
 *                 type: string
 *                 example: "1000000001"
 *               email:
 *                 type: string
 *                 example: paciente.a@veritas.com
 *               telefono:
 *                 type: string
 *                 example: "3001234567"
 *               fechaNacimiento:
 *                 type: string
 *                 example: "1995-05-10"
 *               usuarioId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Paciente creado correctamente
 *       400:
 *         description: Datos inválidos o usuario asociado inexistente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (solo administrador)
 *       409:
 *         description: Rol incompatible o usuario ya asociado
 */
router.post(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarCreacionPaciente,
  validar,
  crearPaciente
);

router.put(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdPaciente,
  validarCreacionPaciente,
  validar,
  actualizarPaciente
);

router.patch(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdPaciente,
  validarPacienteParcial,
  validar,
  actualizarPacienteParcial
);

/**
 * @swagger
 * /api/pacientes/{id}:
 *   delete:
 *     tags:
 *       - Pacientes
 *     summary: Eliminar paciente (Solo Administrador)
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Paciente eliminado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       409:
 *         description: Integridad referencial (paciente tiene citas asociadas)
 */
router.delete(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdPaciente,
  validar,
  eliminarPaciente
);

export default router;
