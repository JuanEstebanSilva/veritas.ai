import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role, AnalysisType } from '@prisma/client';
import { createTestToken } from './helpers';
import bcrypt from 'bcryptjs';

describe('Suite DAST — Dynamic Application Security Testing (Plagelio)', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let adminToken: string;
  let user1AnalysisId: string;

  beforeAll(async () => {
    const passHash = await bcrypt.hash('SecurePassword123!', 10);

    // Usuario 1
    const u1 = await prisma.user.create({
      data: {
        name: 'Victim',
        last_name: 'User',
        email: `victim_dast_${Date.now()}@veritas.ai`,
        password_hash: passHash,
        role: Role.USER,
        is_active: true,
      },
    });
    user1Id = u1.id;
    user1Token = createTestToken({ userId: u1.id, email: u1.email, role: Role.USER });

    // Usuario 2 (Atacante simulado)
    const u2 = await prisma.user.create({
      data: {
        name: 'Attacker',
        last_name: 'Simulated',
        email: `attacker_dast_${Date.now()}@veritas.ai`,
        password_hash: passHash,
        role: Role.USER,
        is_active: true,
      },
    });
    user2Id = u2.id;
    user2Token = createTestToken({ userId: u2.id, email: u2.email, role: Role.USER });

    // Administrador
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        last_name: 'DAST',
        email: `admin_dast_${Date.now()}@veritas.ai`,
        password_hash: passHash,
        role: Role.ADMIN,
        is_active: true,
      },
    });
    adminToken = createTestToken({ userId: admin.id, email: admin.email, role: Role.ADMIN });

    // Crear un análisis perteneciente al Usuario 1
    const analysis = await prisma.analysis.create({
      data: {
        user_id: user1Id,
        type: AnalysisType.TEXT,
        title_or_filename: 'Documento Confidencial Víctima',
        original_text: 'Este es un texto confidencial del usuario 1 para pruebas de seguridad dinámica.',
        ai_score: 15,
        similarity_score: 5,
      },
    });
    user1AnalysisId = analysis.id;
  });

  afterAll(async () => {
    // Limpieza de datos de prueba
    await prisma.analysis.deleteMany({
      where: { user_id: { in: [user1Id, user2Id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [user1Id, user2Id] } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'admin_dast_' } },
    });
    await prisma.$disconnect();
  });

  describe('1. DAST - Autenticación y Gestión de Sesiones', () => {
    it('DAST-AUTH-01: Rechazar acceso sin token Bearer (401)', async () => {
      const res = await request(app).get('/api/analyses/history');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('DAST-AUTH-02: Rechazar token JWT malformado o truncado (401)', async () => {
      const res = await request(app)
        .get('/api/analyses/history')
        .set('Authorization', 'Bearer token_invalido_aleatorio_xyz');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('DAST-AUTH-03: Rechazar token JWT con firma criptográfica alterada (401)', async () => {
      const [header, payload] = user1Token.split('.');
      const forgedToken = `${header}.${payload}.firma_falsificada_1234567890`;
      const res = await request(app)
        .get('/api/analyses/history')
        .set('Authorization', `Bearer ${forgedToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. DAST - Control de Acceso y Prevención de IDOR', () => {
    it('DAST-IDOR-01: Bloquear a Usuario 2 al intentar leer análisis de Usuario 1 (403)', async () => {
      const res = await request(app)
        .get(`/api/analyses/${user1AnalysisId}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No tienes permiso');
    });

    it('DAST-IDOR-02: Bloquear a Usuario 2 al intentar eliminar análisis de Usuario 1 (403)', async () => {
      const res = await request(app)
        .delete(`/api/analyses/${user1AnalysisId}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No puedes eliminar');
    });

    it('DAST-BAC-01: Bloquear acceso a rutas administrativas con token estándar (403)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('DAST-BAC-02: Permitir acceso legítimo al Administrador (200)', async () => {
      const res = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. DAST - Inyección y Resiliencia de Entradas', () => {
    it('DAST-INJ-01: Resistir inyección SQL básica en Login sin bypass ni error 500', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: "' OR '1'='1' --",
          password: "' OR '1'='1' --",
        });
      // Debe retornar 401 sin ejecutar SQL ni filtrar información interna
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('DAST-INJ-02: Procesar payloads con etiquetas XSS en análisis de texto de forma segura', async () => {
      const xssPayload = '<script>alert("XSS Vulnerability")</script><img src="x" onerror="alert(1)"> Texto legítimo para análisis con longitud suficiente.';
      const res = await request(app)
        .post('/api/analyses/text')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          text: xssPayload,
          title: '<svg onload=alert(1)>',
        });
      // El servidor procesa el texto como string plano sin ejecutar scripts
      expect([201, 429]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body.success).toBe(true);
      }
    });

    it('DAST-INJ-03: Rechazar payloads con textos vacíos o inferiores a longitud mínima (400)', async () => {
      const res = await request(app)
        .post('/api/analyses/text')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ text: 'Corto' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. DAST - Seguridad en Carga de Archivos', () => {
    it('DAST-FILE-01: Rechazar subida de archivos ejecutables simulados o extensiones prohibidas (400)', async () => {
      const res = await request(app)
        .post('/api/analyses/docx')
        .set('Authorization', `Bearer ${user1Token}`)
        .attach('file', Buffer.from('malicious script content echo pwned'), 'malware.sh');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Formato inválido');
    });

    it('DAST-FILE-02: Rechazar solicitud de carga sin adjuntar archivo (400)', async () => {
      const res = await request(app)
        .post('/api/analyses/docx')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No se ha adjuntado ningún documento');
    });
  });

  describe('5. DAST - Integridad de Webhooks y Pasarela Financiera', () => {
    it('DAST-PAY-01: Rechazar llamada a webhook sin firma de Stripe (400)', async () => {
      const res = await request(app)
        .post('/api/payments/webhook')
        .send({ id: 'evt_fake_test' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('stripe-signature');
    });

    it('DAST-PAY-02: Rechazar confirmación de pago Sandbox con ID de transacción falso (500/400)', async () => {
      const res = await request(app)
        .post('/api/payments/sandbox-confirm')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          transactionId: 'sbx_non_existent_fake_id_999999',
          simulateSuccess: true,
        });
      expect([400, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe('6. DAST - Endpoints No Encontrados y Manejo de Errores', () => {
    it('DAST-ERR-01: Responder 404 estándar en rutas inexistentes sin volcado de rutas internas', async () => {
      const res = await request(app).get('/api/admin_secret_non_existent_route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('no encontrado');
    });
  });
});
