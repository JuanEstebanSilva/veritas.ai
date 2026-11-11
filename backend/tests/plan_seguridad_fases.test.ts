import request from 'supertest';
import app from '../src/app';
import { generarLoteCodigos, generarTokenAleatorio, sha256Hex } from '../src/utils/crypto.util';
import usuariosService from '../src/services/usuarios.service';

const apiKey = '61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0';

describe('Plan de Implementación de Seguridad Backend — Veritas AI (Nuevas Fases y Soporte Frontend)', () => {
  jest.setTimeout(35000);
  let tokenAdmin = '';
  let tokenEstudiante = '';
  let estudianteId = 1;
  const timestamp = Date.now();
  const testEstudianteEmail = `estudiante.plan.${timestamp}@veritas.ai`;
  const claveEstudiante = 'PasswordSegura2026!';

  beforeAll(async () => {
    // 1. Asegurar Admin
    await usuariosService.crearAdministradorInicial();
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .set('X-API-Key', apiKey)
      .send({
        email: 'admin@veritas.com',
        password: 'SANTOTO_2026—2',
      });
    tokenAdmin = adminLogin.body.token;

    // 2. Registrar Estudiante
    const regRes = await request(app)
      .post('/api/auth/registro')
      .set('X-API-Key', apiKey)
      .send({
        nombre: `Estudiante Plan ${timestamp}`,
        email: testEstudianteEmail,
        password: claveEstudiante,
      });

    estudianteId = regRes.body?.usuario?.id || regRes.body?.user?.id || 1;

    // 3. Login Estudiante
    const estLogin = await request(app)
      .post('/api/auth/login')
      .set('X-API-Key', apiKey)
      .send({
        email: testEstudianteEmail,
        password: claveEstudiante,
      });
    tokenEstudiante = estLogin.body.token;
  });

  // ==========================================================================
  // FASE 2: Utilidades Criptográficas y Códigos Legibles
  // ==========================================================================
  describe('Fase 2: Utilidades Criptográficas', () => {
    it('generarTokenAleatorio debe devolver un string hexadecimal de 64 caracteres', () => {
      const token = generarTokenAleatorio();
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
    });

    it('sha256Hex debe generar el hash SHA-256 de 64 caracteres', () => {
      const hash = sha256Hex('prueba');
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it('generarLoteCodigos debe generar 8 códigos en formato XXXX-XXXX sin caracteres ambiguos', () => {
      const codigos = generarLoteCodigos(8);
      expect(codigos).toHaveLength(8);
      codigos.forEach((codigo) => {
        expect(codigo).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
      });
    });
  });

  // ==========================================================================
  // FASE 5: Endpoint de Contexto (/api/revisiones/mi-contexto y /api/mi-contexto)
  // ==========================================================================
  describe('Fase 5: Contexto de Usuario Autenticado', () => {
    it('GET /api/mi-contexto sin token debe responder 401 Unauthorized', async () => {
      const res = await request(app).get('/api/mi-contexto');
      expect(res.status).toBe(401);
    });

    it('GET /api/revisiones/mi-contexto con token de Estudiante debe retornar identidad y ficha', async () => {
      const res = await request(app)
        .get('/api/revisiones/mi-contexto')
        .set('Authorization', `Bearer ${tokenEstudiante}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.usuario).toBeDefined();
      expect(res.body.usuario.email).toBe(testEstudianteEmail);
    });

    it('GET /api/mi-contexto con token de Administrador debe retornar rol admin y ficha null', async () => {
      const res = await request(app)
        .get('/api/mi-contexto')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.usuario).toBeDefined();
      expect(res.body.usuario.rol).toMatch(/admin/i);
      expect(res.body.ficha).toBeNull();
    });
  });

  // ==========================================================================
  // FASE 5: Estadísticas para Dashboard Administrativo
  // ==========================================================================
  describe('Fase 5: Estadísticas de Sistema (/api/estadisticas/resumen)', () => {
    it('GET /api/estadisticas/resumen sin token debe responder 401 Unauthorized', async () => {
      const res = await request(app).get('/api/estadisticas/resumen');
      expect(res.status).toBe(401);
    });

    it('GET /api/estadisticas/resumen con token de estudiante debe responder 403 Forbidden (RBAC)', async () => {
      const res = await request(app)
        .get('/api/estadisticas/resumen')
        .set('Authorization', `Bearer ${tokenEstudiante}`);

      expect(res.status).toBe(403);
    });

    it('GET /api/estadisticas/resumen con token de Administrador debe responder 200 OK con métricas consolidadas', async () => {
      const res = await request(app)
        .get('/api/estadisticas/resumen')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.datos).toBeDefined();
      expect(res.body.datos.usuarios).toBeGreaterThanOrEqual(1);
      expect(res.body.datos.revisiones).toBeDefined();
      expect(res.body.datos.revisiones.total).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // FASE 5: Transiciones de Estado Discretas (/confirmar, /atender, /cancelar)
  // ==========================================================================
  describe('Fase 5: Flujos de Transición de Estado en Revisiones', () => {
    let revId: number;
    const testFecha1 = `2029-${String(1 + Math.floor(Math.random() * 11)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 25)).padStart(2, '0')}`;
    const testHora1 = `${String(8 + Math.floor(Math.random() * 10)).padStart(2, '0')}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}:00`;
    const testFecha2 = `2030-${String(1 + Math.floor(Math.random() * 11)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 25)).padStart(2, '0')}`;
    const testHora2 = `${String(8 + Math.floor(Math.random() * 10)).padStart(2, '0')}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}:00`;

    it('Crear revisión programada con Admin', async () => {
      const res = await request(app)
        .post('/api/revisiones')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estudianteId: 1,
          docenteId: 1,
          laboratorioId: 1,
          fecha: testFecha1,
          hora: testHora1,
          motivo: 'Revisión de Ética de Código y Plagio',
        });

      expect(res.status).toBe(201);
      revId = res.body.revision.id;
      expect(res.body.revision.estado).toBe('programada');
    });

    it('PATCH /api/revisiones/:id/confirmar debe cambiar estado a confirmada (200 OK)', async () => {
      const res = await request(app)
        .patch(`/api/revisiones/${revId}/confirmar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.revision.estado).toBe('confirmada');
    });

    it('PATCH /api/revisiones/:id/confirmar nuevamente debe responder 409 Conflict (Transición inválida)', async () => {
      const res = await request(app)
        .patch(`/api/revisiones/${revId}/confirmar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(409);
    });

    it('PATCH /api/revisiones/:id/atender debe cambiar estado a atendida (200 OK)', async () => {
      const res = await request(app)
        .patch(`/api/revisiones/${revId}/atender`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.revision.estado).toBe('atendida');
    });

    it('PATCH /api/revisiones/:id/cancelar sobre revisión atendida debe responder 409 Conflict', async () => {
      const res = await request(app)
        .patch(`/api/revisiones/${revId}/cancelar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(409);
    });

    it('Crear otra revisión y cancelarla exitosamente', async () => {
      const resCrear = await request(app)
        .post('/api/revisiones')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estudianteId: 1,
          docenteId: 1,
          laboratorioId: 1,
          fecha: testFecha2,
          hora: testHora2,
          motivo: 'Auditoría de Algoritmos Genéticos',
        });

      expect(resCrear.status).toBe(201);
      const nuevaRevId = resCrear.body.revision.id;

      const resCancel = await request(app)
        .patch(`/api/revisiones/${nuevaRevId}/cancelar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(resCancel.status).toBe(200);
      expect(resCancel.body.revision.estado).toBe('cancelada');
    });
  });
});

