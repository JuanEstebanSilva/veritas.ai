import { Router } from 'express';
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
router.post('/sandbox-init', authenticateJWT, PaymentController.initSandboxPayment);
router.post('/sandbox-confirm', authenticateJWT, PaymentController.confirmSandboxPayment);
router.get('/history', authenticateJWT, PaymentController.getPaymentHistory);

export default router;
