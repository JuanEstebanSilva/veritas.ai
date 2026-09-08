import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role } from '@prisma/client';
import { createTestToken } from './helpers';
import bcrypt from 'bcryptjs';

describe('3. Control Estricto del Límite Diario de 5 Análisis', () => {
  let freeUserToken: string;
  let freeUserId: string;
  let premiumUserToken: string;
  let premiumUserId: string;

  beforeAll(async () => {
    const pass = await bcrypt.hash('Secret123!', 10);

    // Usuario gratuito con 0 análisis
    const freeUser = await prisma.user.create({
      data: {
        name: 'Gratuito',
        last_name: 'Test',
        email: `free_${Date.now()}@veritas.ai`,
        password_hash: pass,
        role: Role.USER,
        is_active: true,
        is_premium: false,
        daily_analysis_count: 4, // Lo inicializamos en 4 para probar el límite en la siguiente llamada
        last_analysis_date: new Date(),
      },
    });
    freeUserId = freeUser.id;
    freeUserToken = createTestToken({ userId: freeUser.id, email: freeUser.email, role: Role.USER });

    // Usuario Premium con más de 5 análisis
    const premiumUser = await prisma.user.create({
      data: {
        name: 'Premium',
        last_name: 'VIP',
        email: `vip_${Date.now()}@veritas.ai`,
        password_hash: pass,
        role: Role.USER,
        is_active: true,
        is_premium: true,
        daily_analysis_count: 10,
        last_analysis_date: new Date(),
      },
    });
    premiumUserId = premiumUser.id;
    premiumUserToken = createTestToken({ userId: premiumUser.id, email: premiumUser.email, role: Role.USER });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [freeUserId, premiumUserId] } },
    });
    await prisma.$disconnect();
  });

  it('debe permitir el 5to análisis a un usuario gratuito', async () => {
    const res = await request(app)
      .post('/api/analyses/text')
      .set('Authorization', `Bearer ${freeUserToken}`)
      .send({
        title: 'Análisis número 5',
        text: 'Este es el quinto análisis permitido para el usuario gratuito en su jornada diaria.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.analysis.aiScore).toBeDefined();

    // Verificar en base de datos que el contador es ahora 5
    const dbUser = await prisma.user.findUnique({ where: { id: freeUserId } });
    expect(dbUser?.daily_analysis_count).toBe(5);
  });

  it('debe bloquear con 429 cuando el usuario gratuito intenta su 6to análisis', async () => {
    const res = await request(app)
      .post('/api/analyses/text')
      .set('Authorization', `Bearer ${freeUserToken}`)
      .send({
        title: 'Análisis número 6 (bloqueado)',
        text: 'Este análisis debería ser bloqueado de inmediato porque ya consumió sus 5 cuotas del día.',
      });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.isLimitReached).toBe(true);
    expect(res.body.message).toBe(
      'Has alcanzado tus 5 análisis gratuitos de hoy. Obtén Premium para disfrutar de análisis ilimitados.'
    );
  });

  it('debe permitir análisis ilimitados a un usuario Premium', async () => {
    const res = await request(app)
      .post('/api/analyses/text')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({
        title: 'Análisis Premium sin restricciones',
        text: 'Los miembros Premium pueden analizar documentos y fragmentos extensos de forma continua e ilimitada.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
