import { prisma } from '../config/prisma';
import { stripe } from '../config/stripe';
import { ENV } from '../config/env';
import { PaymentStatus } from '@prisma/client';
import crypto from 'crypto';

export class PaymentService {
  public static readonly PREMIUM_PRICE_USD = 2.0;

  /**
   * Crea una sesión de Checkout en Stripe Test Mode
   */
  public static async createStripeCheckoutSession(userId: string, userEmail: string): Promise<string> {
    if (!stripe) {
      throw new Error('Stripe no está configurado. Use el modo sandbox local para pruebas.');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // Pago único vitalicio
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Plagelio Premium - Acceso Vitalicio',
              description: 'Análisis ilimitados de IA, similitud y mejoras de redacción de por vida.',
            },
            unit_amount: Math.round(this.PREMIUM_PRICE_USD * 100), // $2.00 en centavos
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
      },
      success_url: `${ENV.FRONTEND_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${ENV.FRONTEND_URL}/dashboard?payment=cancelled`,
    });

    // Registrar transacción en estado PENDING
    await prisma.payment.create({
      data: {
        user_id: userId,
        provider: 'stripe',
        transaction_id: session.id,
        amount: this.PREMIUM_PRICE_USD,
        currency: 'USD',
        status: PaymentStatus.PENDING,
      },
    });

    return session.url || '';
  }

  /**
   * Procesa el Webhook oficial de Stripe
   */
  public static async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<boolean> {
    if (!stripe || !ENV.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Configuración de Stripe Webhook incompleta.');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, ENV.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Error validando firma de Stripe Webhook:', err.message);
      throw new Error(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.client_reference_id || session.metadata?.userId;

      if (userId) {
        await this.activatePremiumForUser(userId, session.id, 'stripe', this.PREMIUM_PRICE_USD);
        return true;
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as any;
      await prisma.payment.updateMany({
        where: { transaction_id: paymentIntent.id },
        data: { status: PaymentStatus.FAILED },
      });
    }

    return false;
  }

  /**
   * Modo Sandbox Local: Inicia una transacción de prueba
   */
  public static async createSandboxTransaction(userId: string): Promise<{ transactionId: string; amount: number }> {
    const transactionId = `sbx_${crypto.randomBytes(12).toString('hex')}`;

    await prisma.payment.create({
      data: {
        user_id: userId,
        provider: 'stripe_sandbox_local',
        transaction_id: transactionId,
        amount: this.PREMIUM_PRICE_USD,
        currency: 'USD',
        status: PaymentStatus.PENDING,
      },
    });

    return {
      transactionId,
      amount: this.PREMIUM_PRICE_USD,
    };
  }

  /**
   * Modo Sandbox Local: Confirma el pago de prueba con validación estricta de backend
   */
  public static async confirmSandboxPayment(options: {
    userId: string;
    transactionId: string;
    simulateSuccess: boolean;
  }): Promise<{ success: boolean; message: string }> {
    const payment = await prisma.payment.findUnique({
      where: { transaction_id: options.transactionId },
    });

    if (!payment) {
      throw new Error('Transacción no encontrada.');
    }

    if (payment.user_id !== options.userId) {
      throw new Error('Transacción no autorizada para este usuario.');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return { success: true, message: 'La cuenta ya tiene Premium activo.' };
    }

    if (!options.simulateSuccess) {
      await prisma.payment.update({
        where: { transaction_id: options.transactionId },
        data: { status: PaymentStatus.FAILED },
      });
      return { success: false, message: 'El pago de prueba fue rechazado por el emisor.' };
    }

    await this.activatePremiumForUser(options.userId, options.transactionId, 'stripe_sandbox_local', payment.amount);

    return {
      success: true,
      message: '¡Pago confirmado exitosamente! Cuenta actualizada a Premium de por vida.',
    };
  }

  /**
   * Método atómico seguro para activar el estado Premium y registrar la fecha de adquisición
   */
  public static async activatePremiumForUser(
    userId: string,
    transactionId: string,
    provider: string,
    amount: number
  ): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          is_premium: true,
          premium_since: new Date(),
        },
      }),
      prisma.payment.upsert({
        where: { transaction_id: transactionId },
        update: {
          status: PaymentStatus.COMPLETED,
          amount,
        },
        create: {
          user_id: userId,
          provider,
          transaction_id: transactionId,
          amount,
          currency: 'USD',
          status: PaymentStatus.COMPLETED,
        },
      }),
    ]);
  }
}
