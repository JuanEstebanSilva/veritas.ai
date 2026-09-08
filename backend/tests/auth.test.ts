import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

describe('1. Módulo de Autenticación (Registro y Login)', () => {
  const testEmail = `test_${Date.now()}@veritas.ai`;
  const testPassword = 'Password123!Secure';

  afterAll(async () => {
    // Limpieza
    await prisma.user.deleteMany({
      where: { email: { contains: 'test_' } },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('debe registrar un usuario exitosamente con rol USER', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Juan',
          last_name: 'Pérez',
          email: testEmail,
          password: testPassword,
          confirm_password: testPassword,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.role).toBe(Role.USER);
    });

    it('debe rechazar registro si las contraseñas no coinciden', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Juan',
          last_name: 'Pérez',
          email: `mismatch_${Date.now()}@veritas.ai`,
          password: testPassword,
          confirm_password: 'DifferentPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('no coinciden');
    });

    it('debe rechazar email duplicado', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Juan',
          last_name: 'Pérez',
          email: testEmail,
          password: testPassword,
          confirm_password: testPassword,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar contraseña demasiado corta (< 8 caracteres)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Juan',
          last_name: 'Pérez',
          email: `short_${Date.now()}@veritas.ai`,
          password: '123',
          confirm_password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe iniciar sesión con credenciales correctas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
    });

    it('debe rechazar login con contraseña incorrecta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar login con usuario inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@veritas.ai',
          password: 'AnyPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
