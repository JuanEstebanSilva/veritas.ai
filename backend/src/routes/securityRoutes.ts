import { Router } from 'express';
import { SecurityController } from '../controllers/SecurityController';

const router = Router();

// Protegido por app.use('/api', apiKeyMiddleware) sin configuración adicional
router.get('/client', SecurityController.getClient);

export default router;
