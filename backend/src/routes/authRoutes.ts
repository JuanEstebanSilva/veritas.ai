import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { preventPrivilegeEscalation } from '../middleware/roleGuard';
import {
  validarRegistro,
  validarLogin,
  verificarErroresValidacion,
} from '../middleware/authValidator';

const router = Router();

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Registrar un nuevo usuario
 *     description: Registra un nuevo usuario en Veritas AI asignando el rol de forma segura en el servidor.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Estudiante Veritas
 *               email:
 *                 type: string
 *                 example: estudiante@veritas.ai
 *               password:
 *                 type: string
 *                 example: ClaveSegura2026!
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Correo electrónico ya registrado
 */
router.post(
  ['/register', '/registro'],
  validarRegistro,
  verificarErroresValidacion,
  preventPrivilegeEscalation,
  AuthController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Iniciar sesión y obtener JWT
 *     description: Autentica credenciales y emite una credencial temporal (JWT) firmada con HS256.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: estudiante@veritas.ai
 *               password:
 *                 type: string
 *                 example: ClaveSegura2026!
 *     responses:
 *       200:
 *         description: Autenticación correcta con token JWT
 *       401:
 *         description: Credenciales inválidas
 *       403:
 *         description: Usuario deshabilitado
 */
router.post(
  '/login',
  validarLogin,
  verificarErroresValidacion,
  AuthController.login
);

/**
 * @swagger
 * /api/auth/perfil:
 *   get:
 *     tags:
 *       - Autenticación
 *     summary: Obtener perfil del usuario autenticado
 *     description: Requiere API Key y un JWT válido.
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario autenticado correctamente
 *       401:
 *         description: Credenciales de autenticación ausentes o inválidas
 */
router.get(
  ['/perfil', '/profile'],
  autenticarJWT,
  (req, res) => {
    return res.status(200).json({
      success: true,
      mensaje: 'Usuario autenticado mediante JWT',
      usuario: req.usuario,
      clienteApi: (req as any).clienteApi || (req as any).apiClient,
    });
  }
);

router.get('/me', authenticateJWT, AuthController.getProfile);
router.put('/me', authenticateJWT, preventPrivilegeEscalation, AuthController.updateProfile);

export default router;
