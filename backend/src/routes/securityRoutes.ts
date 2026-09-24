import { Router } from 'express';
import { SecurityController } from '../controllers/SecurityController';

const router = Router();

// Protegido por app.use('/api', apiKeyMiddleware) sin configuración adicional
// Soporta tanto /client como /cliente (compatibilidad con Laboratorio 6)
router.get(['/client', '/cliente'], SecurityController.getClient);

export default router;
