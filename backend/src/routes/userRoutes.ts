import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleGuard';

const router = Router();

// Todas las rutas de administración de usuarios requieren rol estricto de ADMIN
router.use(authenticateJWT);
router.use(requireAdmin);

router.get('/stats', UserController.getAdminStats);
router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.patch('/:id/toggle-active', UserController.toggleActive);
router.patch('/:id/toggle-premium', UserController.togglePremium);
router.delete('/:id', UserController.deleteUser);

export default router;
