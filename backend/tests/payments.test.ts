import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role, PaymentStatus } from '@prisma/client';
import { createTestToken } from './helpers';
import bcrypt from 'bcryptjs';

describe('5. Módulo de Pagos, Webhooks y Activación Premium Segura', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    const pass = await bcrypt.hash('Secret123!', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Pago',
        last_name: 'Tester',
        email: `pay_${Date.now()}@veritas.ai`,
        password_hash: pass,
        role: Role.USER,
        is_active: true,
        is_premium: false,
      },
    });
    userId = user.id;
    userToken = createTestToken({ userId: user.id, email: user.email, role: Role.USER });
  });

  afterAll(async () => {
    // Integridad referencial (Lab 5): las FKs son ON DELETE RESTRICT,
    // por lo que hay que retirar primero los registros dependientes.
    await prisma.payment.deleteMany({ where: { user_id: userId } });
    await prisma.analysis.deleteMany({ where: { user_id: userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('debe iniciar una transacción en el Sandbox seguro y devolver ID de transacción', async () => {
    const res = await request(app)
      .post('/api/payments/sandbox-init')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.transaction.transactionId).toBeDefined();
    expect(res.body.transaction.amount).toBe(2.0);

    const payment = await prisma.payment.findUnique({
      where: { transaction_id: res.body.transaction.transactionId },
    });
    expect(payment?.status).toBe(PaymentStatus.PENDING);
  });

  it('debe registrar estado FAILED si la simulación de pago falla y no activar Premium', async () => {
    // Iniciar transacción
    const initRes = await request(app)
      .post('/api/payments/sandbox-init')
      .set('Authorization', `Bearer ${userToken}`);

    const txId = initRes.body.transaction.transactionId;

    // Confirmar con fallo simulado
    const failRes = await request(app)
      .post('/api/payments/sandbox-confirm')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        transactionId: txId,
        simulateSuccess: false,
      });

    expect(failRes.status).toBe(402);
    expect(failRes.body.success).toBe(false);

    // Verificar en base de datos que el usuario NO es premium
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(dbUser?.is_premium).toBe(false);
  });

  it('debe activar Premium vitalicio únicamente tras validación exitosa en backend', async () => {
    // Iniciar transacción
    const initRes = await request(app)
      .post('/api/payments/sandbox-init')
      .set('Authorization', `Bearer ${userToken}`);

    const txId = initRes.body.transaction.transactionId;

    // Confirmar con éxito
    const confirmRes = await request(app)
      .post('/api/payments/sandbox-confirm')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        transactionId: txId,
        simulateSuccess: true,
      });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);
    expect(confirmRes.body.isPremium).toBe(true);

    // Verificar en base de datos
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(dbUser?.is_premium).toBe(true);
    expect(dbUser?.premium_since).toBeDefined();

    const payment = await prisma.payment.findUnique({ where: { transaction_id: txId } });
    expect(payment?.status).toBe(PaymentStatus.COMPLETED);
  });

  it('debe rechazar webhook de Stripe sin encabezado stripe-signature', async () => {
    const res = await request(app)
      .post('/api/payments/webhook')
      .send({ event: 'checkout.session.completed' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('stripe-signature');
  });
});
