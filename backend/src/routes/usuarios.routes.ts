import { Router } from 'express';
import { crearUsuario } from '../controllers/usuarios.controller';
import { validarCreacionUsuario } from '../middlewares/usuarios.validator';
import { validar } from '../middlewares/validar.middleware';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UsuarioAdministrativoEntrada:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *         - password
 *         - rol
 *       properties:
 *         nombre:
 *           type: string
 *           example: Médico Veritas
 *         email:
 *           type: string
 *           format: email
 *           example: medico@veritas.com
 *         password:
 *           type: string
 *           format: password
 *           example: ClaveMedico2026!
 *         rol:
 *           type: string
 *           enum:
 *             - medico
 *             - administrador
 *           example: medico
 */

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     tags:
 *       - Usuarios
 *     summary: Crear usuario privilegiado
 *     description: >
 *       Permite a un administrador autenticado crear
 *       usuarios con rol medico o administrador.
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioAdministrativoEntrada'
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       409:
 *         description: Correo electrónico ya registrado
 */
router.post(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarCreacionUsuario,
  validar,
  crearUsuario
);

export default router;
