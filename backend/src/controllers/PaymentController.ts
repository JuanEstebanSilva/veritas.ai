import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { PaymentService } from '../services/PaymentService';
import { prisma } from '../config/prisma';

export class PaymentController {
  /**
   * Crear sesión de checkout de Stripe Test Mode
   */
  public static async createCheckoutSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;

      if (user.is_premium) {
        res.status(400).json({
          success: false,
          message: 'Tu cuenta ya cuenta con acceso Premium vitalicio.',
        });
        return;
      }

      try {
        const checkoutUrl = await PaymentService.createStripeCheckoutSession(user.id, user.email);
        res.status(200).json({
          success: true,
          provider: 'stripe',
          checkoutUrl,
        });
      } catch (err: any) {
        // Si Stripe no tiene credenciales configuradas, sugerir modo sandbox de prueba
        res.status(200).json({
          success: true,
          provider: 'sandbox',
          message: 'Stripe no configurado en .env. Se puede utilizar el Sandbox de prueba seguro.',
        });
      }
    } catch (error: any) {
      console.error('Error al crear checkout:', error);
      res.status(500).json({ success: false, message: 'Error al iniciar pasarela de pagos.' });
    }
  }

  /**
   * Endpoint receptor de Webhook de Stripe (con verificación de firma criptográfica)
   */
  public static async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      res.status(400).json({ success: false, message: 'Falta encabezado stripe-signature.' });
      return;
    }

    try {
      const processed = await PaymentService.handleStripeWebhook(req.body, sig);
      res.status(200).json({ received: true, processed });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Iniciar transacción de prueba en Sandbox
   */
  public static async initSandboxPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;

      if (user.is_premium) {
        res.status(400).json({
          success: false,
          message: 'Tu cuenta ya cuenta con acceso Premium vitalicio.',
        });
        return;
      }

      const transaction = await PaymentService.createSandboxTransaction(user.id);

      res.status(200).json({
        success: true,
        message: 'Sesión de pago Sandbox iniciada.',
        transaction,
        testInstructions: {
          amount: '$2.00 USD (Pago Único Vitalicio)',
          description: 'Ambiente de pruebas / Sandbox',
          testCards: [
            { brand: 'Visa Éxito', number: '4242 •••• •••• 4242', outcome: 'Aprobado' },
            { brand: 'Mastercard Rechazo', number: '5555 •••• •••• 5555', outcome: 'Fondos insuficientes' },
          ],
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al inicializar pago sandbox.' });
    }
  }

  /**
   * Confirmar transacción de prueba en Sandbox (con validación de backend)
   */
  public static async confirmSandboxPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { transactionId, simulateSuccess } = req.body;

      if (!transactionId) {
        res.status(400).json({ success: false, message: 'ID de transacción requerido.' });
        return;
      }

      const result = await PaymentService.confirmSandboxPayment({
        userId: user.id,
        transactionId,
        simulateSuccess: simulateSuccess !== false, // default true
      });

      if (!result.success) {
        res.status(402).json({
          success: false,
          message: result.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        isPremium: true,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Consultar historial de pagos del usuario
   */
  public static async getPaymentHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;

      const payments = await prisma.payment.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
      });

      res.status(200).json({
        success: true,
        payments,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al consultar pagos.' });
    }
  }
}
