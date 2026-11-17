import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role } from '@prisma/client';
import { createTestToken } from './helpers';
import bcrypt from 'bcryptjs';

describe('2. Control de Acceso por Roles y Prevención de Escalada de Privilegios', () => {
  let userToken: string;
  let adminToken: string;
  let testUserId: string;
  let adminUserId: string;

  beforeAll(async () => {
    // Crear usuario estándar
    const userPass = await bcrypt.hash('UserPass123!', 10);
    const regularUser = await prisma.user.create({
      data: {
        name: 'Normal',
        last_name: 'User',
        email: `normal_${Date.now()}@veritas.ai`,
        password_hash: userPass,
        role: Role.USER,
        is_active: true,
      },
    });
    testUserId = regularUser.id;
    userToken = createTestToken({ userId: regularUser.id, email: regularUser.email, role: Role.USER });

    // Crear usuario administrador
    const adminPass = await bcrypt.hash('AdminPass123!', 10);
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin',
        last_name: 'Master',
        email: `admin_${Date.now()}@veritas.ai`,
        password_hash: adminPass,
        role: Role.ADMIN,
        is_active: true,
      },
    });
    adminUserId = adminUser.id;
    adminToken = createTestToken({ userId: adminUser.id, email: adminUser.email, role: Role.ADMIN });
  });

  afterAll(async () => {
    // Integridad referencial (Lab 5): las FKs son ON DELETE RESTRICT,
    // por lo que hay que retirar primero los registros dependientes.
    const ids = [testUserId, adminUserId];
    await prisma.payment.deleteMany({ where: { user_id: { in: ids } } });
    await prisma.analysis.deleteMany({ where: { user_id: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  });

  it('debe rechazar con 403 cuando un usuario normal intenta acceder a GET /api/users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('permisos administrativos');
  });

  it('debe rechazar con 403 cuando un usuario normal intenta consultar estadísticas de admin', async () => {
    const res = await request(app)
      .get('/api/users/stats')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('debe bloquear intentos de escalada de privilegios en PUT /api/auth/me', async () => {
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        role: 'ADMIN',
        is_premium: true,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('No tienes autorización para modificar atributos privilegiados');
  });

  it('debe permitir a un usuario con rol ADMIN acceder al CRUD y estadísticas', async () => {
    const res = await request(app)
      .get('/api/users/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.totalUsers).toBeGreaterThanOrEqual(1);
  });
});
