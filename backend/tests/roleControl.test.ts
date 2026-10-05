import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role } from '@prisma/client';
import { createTestToken } from './helpers';

/**
 * Lab 8 — Control del rol y prevención de escalada de privilegios.
 * El cliente puede ENVIAR cualquier atributo, pero solo controla los de la lista
 * blanca; el rol, el estado y los contadores los decide el servidor.
 */
describe('Lab 8 · el rol lo asigna el servidor', () => {
  const sufijo = Date.now();
  const ids: string[] = [];
  let adminId: string;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const hash = await bcrypt.hash('ClaveSegura2026!', 4);
    const admin = await prisma.user.create({
      data: { name: 'Admin', last_name: 'Lab8', email: `admin.lab8.${sufijo}@plagelio.com`, password_hash: hash, role: Role.ADMIN },
    });
    const user = await prisma.user.create({
      data: { name: 'Usuario', last_name: 'Lab8', email: `user.lab8.${sufijo}@plagelio.com`, password_hash: hash, role: Role.USER },
    });
    adminId = admin.id;
    ids.push(admin.id, user.id);
    adminToken = createTestToken({ userId: admin.id, email: admin.email, role: Role.ADMIN });
    userToken = createTestToken({ userId: user.id, email: user.email, role: Role.USER });
  });

  afterAll(async () => {
    await prisma.analysis.deleteMany({ where: { user_id: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  });

  it('registro con atributos privilegiados → 201, pero el servidor guarda sus propios valores', async () => {
    const email = `mass.${sufijo}@universidad.edu`;
    const res = await request(app).post('/api/auth/register').send({
      name: 'Ataque',
      last_name: 'Mass Assignment',
      email,
      password: 'ClaveSegura2026!',
      confirm_password: 'ClaveSegura2026!',
      id: '00000000-0000-0000-0000-000000009999',
      role: 'ADMIN',
      is_active: false,
      is_premium: true,
      premium_since: '2020-01-01T00:00:00.000Z',
      daily_analysis_count: -100,
      password_hash: 'HASH_CONTROLADO',
      permisos: ['DELETE_ALL'],
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('USER');

    const guardado = await prisma.user.findUniqueOrThrow({ where: { email } });
    ids.push(guardado.id);
    expect(guardado.id).not.toBe('00000000-0000-0000-0000-000000009999');
    expect(guardado.role).toBe(Role.USER);
    expect(guardado.is_active).toBe(true);
    expect(guardado.is_premium).toBe(false);
    expect(guardado.premium_since).toBeNull();
    expect(guardado.daily_analysis_count).toBe(0);
    expect(guardado.password_hash).not.toBe('HASH_CONTROLADO');
    expect(await bcrypt.compare('ClaveSegura2026!', guardado.password_hash)).toBe(true);
  });

  it('un USER no puede usar la operación administrativa de crear usuarios → 403', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Otro', last_name: 'Admin', email: `x.${sufijo}@plagelio.com`, password: 'ClaveSegura2026!', role: 'ADMIN' });
    expect(res.status).toBe(403);
  });

  it('ni siquiera el ADMIN crea otro ADMIN por la API: administrador único', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Segundo', last_name: 'Admin', email: `segundo.${sufijo}@plagelio.com`, password: 'ClaveSegura2026!', role: 'ADMIN' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('USER');
    ids.push(res.body.user.id);
  });

  it('el administrador no puede desactivarse a sí mismo por PUT /api/users/:id', async () => {
    const res = await request(app)
      .put(`/api/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_active: false });
    expect(res.status).toBe(400);
    const admin = await prisma.user.findUniqueOrThrow({ where: { id: adminId } });
    expect(admin.is_active).toBe(true);
  });

  it('is_active / is_premium solo aceptan booleanos reales ("false" no es false)', async () => {
    const res = await request(app)
      .put(`/api/users/${ids[1]}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_premium: 'false' });
    expect(res.status).toBe(400);
  });
});
