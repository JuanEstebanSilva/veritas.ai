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
