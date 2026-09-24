import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleGuard';
import { validateUuidParam } from '../middleware/validateUuidParam';

const router = Router();

// Todas las rutas de administración de usuarios requieren rol estricto de ADMIN
router.use(authenticateJWT);
router.use(requireAdmin);

router.get('/stats', UserController.getAdminStats);
router.get('/', UserController.getAllUsers);
router.get('/:id', validateUuidParam('id'), UserController.getUserById);
router.post('/', UserController.createUser);
router.put('/:id', validateUuidParam('id'), UserController.updateUser);
router.patch('/:id/toggle-active', validateUuidParam('id'), UserController.toggleActive);
router.patch('/:id/toggle-premium', validateUuidParam('id'), UserController.togglePremium);
router.delete('/:id', validateUuidParam('id'), UserController.deleteUser);

export default router;
