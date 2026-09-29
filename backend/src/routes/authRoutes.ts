import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { preventPrivilegeEscalation } from '../middleware/roleGuard';
import {
  validarRegistro,
  validarLogin,
  verificarErroresValidacion,
} from '../middleware/authValidator';

const router = Router();

// ============================================================================
// Laboratorio 8: Control de rol y prevención de escalada de privilegios
// validarRegistro: Primera defensa (allowlisting - elimina rol del payload)
// ============================================================================
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

router.get('/me', authenticateJWT, AuthController.getProfile);
router.put('/me', authenticateJWT, preventPrivilegeEscalation, AuthController.updateProfile);

export default router;

