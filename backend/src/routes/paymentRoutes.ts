import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Webhook de Stripe (usa body en crudo Buffer para verificación de firma criptográfica)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleStripeWebhook
);

// Rutas de pago autenticadas
router.post('/create-checkout-session', authenticateJWT, PaymentController.createCheckoutSession);
// El pago simulado activa premium sin cobro: solo existe fuera de producción y se puede
// apagar en cualquier entorno con PAYMENTS_SANDBOX=false.
const sandboxHabilitado = (_req: Request, res: Response, next: NextFunction): void => {
  const activo = process.env.NODE_ENV !== 'production' && process.env.PAYMENTS_SANDBOX !== 'false';
  if (!activo) {
    res.status(404).json({ success: false, message: 'El pago simulado no está disponible en este entorno.' });
    return;
  }
  next();
};

router.post('/sandbox-init', sandboxHabilitado, authenticateJWT, PaymentController.initSandboxPayment);
router.post('/sandbox-confirm', sandboxHabilitado, authenticateJWT, PaymentController.confirmSandboxPayment);
router.get('/history', authenticateJWT, PaymentController.getPaymentHistory);

export default router;
