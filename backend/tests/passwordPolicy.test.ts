import request from 'supertest';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { createTestToken } from './helpers';
import { validarPassword, generarPasswordHash, SALT_ROUNDS } from '../src/utils/passwordPolicy';

/**
 * Lab 7 — Bloque 4A: usuarios, hashing y salting.
 */
describe('7. Usuarios, hashing y salting', () => {
  const sufijo = Date.now();
  const correo = (n: string) => `lab7_${n}_${sufijo}@plagelio.com`;
  const CLAVE = 'ClaveSegura2026!';
  let adminToken = '';
  let adminId = '';

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        name: 'Admin', last_name: 'Lab7', email: correo('admin'),
        password_hash: await generarPasswordHash(CLAVE), role: Role.ADMIN, is_active: true,
      },
    });
    adminId = admin.id;
    adminToken = createTestToken({ userId: admin.id, email: admin.email, role: Role.ADMIN });
  });

  afterAll(async () => {
    const creados = await prisma.user.findMany({ where: { email: { contains: `_${sufijo}@` } }, select: { id: true } });
    const ids = creados.map((u) => u.id);
    await prisma.payment.deleteMany({ where: { user_id: { in: ids } } });
    await prisma.analysis.deleteMany({ where: { user_id: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  });

  const registrar = (email: string, password: string, extra: Record<string, unknown> = {}) =>
    request(app).post('/api/auth/register').send({
      name: 'Prueba', last_name: 'Lab7', email, password, confirm_password: password, ...extra,
    });

  describe('política de contraseñas', () => {
    it('acepta de 10 a 72 caracteres y rechaza fuera de ese rango', () => {
      expect(validarPassword('a'.repeat(9))).toMatch(/entre 10 y 72/);
      expect(validarPassword('a'.repeat(10))).toBeNull();
      expect(validarPassword('a'.repeat(72))).toBeNull();
      expect(validarPassword('a'.repeat(73))).toMatch(/entre 10 y 72/);
    });

    it('rechaza lo que supera los 72 bytes aunque tenga menos de 72 caracteres', () => {
      // 40 «ñ» son 40 caracteres pero 80 bytes en UTF-8: bcrypt ignoraría la mitad
      expect(validarPassword('ñ'.repeat(40))).toMatch(/72 bytes/);
    });

    it('el registro devuelve 400 con una contraseña de 9 caracteres', async () => {
      const res = await registrar(correo('corta'), 'Corta1234');
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/entre 10 y 72/);
    });

    it('el administrador ya no puede fijar una contraseña corta que antes se ignoraba en silencio', async () => {
      const res = await request(app).put(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin', last_name: 'Lab7', email: correo('admin'), password: 'corta' });
      expect(res.status).toBe(400);
    });
  });

  describe('hashing y salting', () => {
    it('la misma contraseña produce hashes distintos con el mismo coste', async () => {
      await registrar(correo('uno'), CLAVE).expect(201);
      await registrar(correo('dos'), CLAVE).expect(201);
      const [a, b] = await Promise.all([
        prisma.user.findUnique({ where: { email: correo('uno') } }),
        prisma.user.findUnique({ where: { email: correo('dos') } }),
      ]);
      expect(a!.password_hash).not.toBe(b!.password_hash);
      expect(a!.password_hash.slice(0, 7)).toBe(`$2b$${SALT_ROUNDS}$`);
      expect(b!.password_hash.slice(0, 7)).toBe(`$2b$${SALT_ROUNDS}$`);
      // El salt son los 22 caracteres que siguen al prefijo
      expect(a!.password_hash.slice(7, 29)).not.toBe(b!.password_hash.slice(7, 29));
      expect(await bcrypt.compare(CLAVE, a!.password_hash)).toBe(true);
      expect(await bcrypt.compare(CLAVE, b!.password_hash)).toBe(true);
    });

    it('ninguna respuesta de registro ni de login incluye el hash', async () => {
      const reg = await registrar(correo('sinhash'), CLAVE);
      const log = await request(app).post('/api/auth/login').send({ email: correo('sinhash'), password: CLAVE });
      for (const r of [reg, log]) {
        expect(JSON.stringify(r.body)).not.toMatch(/password|\$2[aby]\$/);
      }
    });
  });

  describe('mass assignment', () => {
    it('descarta rol, estado, premium y hash enviados en el registro', async () => {
      const res = await registrar(correo('ataque'), CLAVE, {
        role: 'ADMIN', is_active: false, is_premium: true, password_hash: 'HASH_FALSO', daily_analysis_count: 999,
      });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('USER');
      expect(res.body.user.is_premium).toBe(false);
      const fila = await prisma.user.findUnique({ where: { email: correo('ataque') } });
      expect(fila!.is_active).toBe(true);
      expect(fila!.password_hash).not.toBe('HASH_FALSO');
      expect(fila!.daily_analysis_count).toBe(0);
      const login = await request(app).post('/api/auth/login').send({ email: correo('ataque'), password: CLAVE });
      expect(login.status).toBe(200);
    });
  });

  describe('login sin fugas de información', () => {
    it('ejecuta bcrypt también cuando el correo no existe', async () => {
      const espia = jest.spyOn(bcrypt, 'compare');
      const res = await request(app).post('/api/auth/login').send({ email: correo('noexiste'), password: CLAVE });
      expect(res.status).toBe(401);
      expect(espia).toHaveBeenCalledTimes(1);
      espia.mockRestore();
    });

    it('correo inexistente y contraseña incorrecta dan exactamente la misma respuesta', async () => {
      await registrar(correo('existe'), CLAVE).expect(201);
      const a = await request(app).post('/api/auth/login').send({ email: correo('noexiste2'), password: 'OtraClave2026!' });
      const b = await request(app).post('/api/auth/login').send({ email: correo('existe'), password: 'OtraClave2026!' });
      expect(a.status).toBe(401);
      expect(b.status).toBe(401);
      expect(a.body).toEqual(b.body);
    });

    it('una cuenta desactivada solo se revela a quien conoce la contraseña', async () => {
      await registrar(correo('inactiva'), CLAVE).expect(201);
      await prisma.user.update({ where: { email: correo('inactiva') }, data: { is_active: false } });
      const mal = await request(app).post('/api/auth/login').send({ email: correo('inactiva'), password: 'OtraClave2026!' });
      const bien = await request(app).post('/api/auth/login').send({ email: correo('inactiva'), password: CLAVE });
      expect(mal.status).toBe(401);
      expect(bien.status).toBe(403);
    });
  });
});
