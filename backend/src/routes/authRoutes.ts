import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';
import { preventPrivilegeEscalation } from '../middleware/roleGuard';
import {
  validarRegistro,
  validarLogin,
  validarCambioPassword,
  validarGenerarRecuperacion,
  validarRestablecimiento,
  validarGenerarCodigos,
  validarRestablecerConCodigo,
  verificarErroresValidacion,
} from '../middleware/authValidator';

const router = Router();

// ========================================
// Registro y Login
// ========================================
router.post(
  ['/register', '/registro'],
  validarRegistro,
  verificarErroresValidacion,
  preventPrivilegeEscalation,
  AuthController.register
);

router.post(
  '/login',
  validarLogin,
  verificarErroresValidacion,
  AuthController.login
);

// ========================================
// Perfil Autenticado con Bearer JWT
// ========================================
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

// ========================================
// Bloque 11: Cambio de Contraseña Propia
// ========================================
router.patch(
  ['/cambiar-password', '/change-password'],
  autenticarJWT,
  validarCambioPassword,
  verificarErroresValidacion,
  AuthController.cambiarPassword
);

// ========================================
// Bloque 11: Recuperación Administrativa
// ========================================
router.post(
  ['/recuperacion/admin/:usuarioId', '/recovery/admin/:usuarioId'],
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarGenerarRecuperacion,
  verificarErroresValidacion,
  AuthController.generarRecuperacionAdmin
);

router.post(
  ['/restablecer-password', '/reset-password'],
  validarRestablecimiento,
  verificarErroresValidacion,
  AuthController.restablecerPassword
);

// ========================================
// Bloque 11: Códigos de Respaldo
// ========================================
router.post(
  ['/codigos-recuperacion', '/recovery-codes'],
  autenticarJWT,
  validarGenerarCodigos,
  verificarErroresValidacion,
  AuthController.generarCodigos
);

router.get(
  ['/codigos-recuperacion/estado', '/recovery-codes/status'],
  autenticarJWT,
  AuthController.estadoCodigos
);

router.post(
  ['/codigos-recuperacion/regenerar', '/recovery-codes/regenerate'],
  autenticarJWT,
  validarGenerarCodigos,
  verificarErroresValidacion,
  AuthController.generarCodigos
);

router.post(
  ['/restablecer-con-codigo', '/reset-with-code'],
  validarRestablecerConCodigo,
  verificarErroresValidacion,
  AuthController.restablecerConCodigo
);

export default router;
