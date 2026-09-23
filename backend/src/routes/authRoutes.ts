import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { preventPrivilegeEscalation } from '../middleware/roleGuard';

const router = Router();

router.post(['/register', '/registro'], preventPrivilegeEscalation, AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authenticateJWT, AuthController.getProfile);
router.put('/me', authenticateJWT, preventPrivilegeEscalation, AuthController.updateProfile);

export default router;
