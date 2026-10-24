import request from 'supertest';
import app from '../src/app';
import usuariosService from '../src/services/usuarios.service';

const apiKey = '61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0';

describe('Bloque 7.3 — CRUD de Departamentos / Especialidades en PostgreSQL / Supabase', () => {
  let tokenAdmin = '';
  let tokenEstudiante = '';
  let idDepCreado = 0;

  beforeAll(async () => {
    await usuariosService.crearAdministradorInicial();

    const resAdmin = await request(app)
      .post('/api/auth/login')
      .set('X-API-Key', apiKey)
      .send({
        email: 'admin@veritas.com',
        password: process.env.ADMIN_PASSWORD || 'SANTOTO_2026—2',
      });
    tokenAdmin = resAdmin.body.token;

    const emailEst = `est_dep_${Date.now()}@veritas.com`;
    await request(app)
      .post('/api/auth/registro')
      .set('X-API-Key', apiKey)
      .send({
        nombre: 'Estudiante Dep Test',
        email: emailEst,
        password: 'ClaveEstudiante2026!',
      });

    const resEst = await request(app)
      .post('/api/auth/login')
      .set('X-API-Key', apiKey)
      .send({
        email: emailEst,
        password: 'ClaveEstudiante2026!',
      });
    tokenEstudiante = resEst.body.token;
  });

  it('1. GET /api/departamentos debe listar los departamentos académicos existentes (200 OK)', async () => {
    const res = await request(app)
      .get('/api/departamentos')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.departamentos)).toBe(true);
    expect(res.body.departamentos.length).toBeGreaterThanOrEqual(1);
  });

  it('2. GET /api/especialidades (Alias) debe responder 200 OK y devolver los mismos catálogos', async () => {
    const res = await request(app)
      .get('/api/especialidades')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenEstudiante}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.especialidades)).toBe(true);
  });

  it('3. GET /api/departamentos/:id debe consultar un departamento existente por ID (200 OK)', async () => {
    const res = await request(app)
      .get('/api/departamentos/1')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenEstudiante}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.departamento).toBeDefined();
    expect(res.body.departamento.id).toBe(1);
  });

  it('4. POST /api/departamentos debe rechazar con 403 Forbidden a usuarios con rol estudiante', async () => {
    const res = await request(app)
      .post('/api/departamentos')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        nombre: 'Departamento No Autorizado',
        descripcion: 'Intento de creación sin privilegios',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('5. POST /api/departamentos debe permitir a un Administrador crear un departamento (201 Created)', async () => {
    const res = await request(app)
      .post('/api/departamentos')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: `Auditoría Lingüística y NLP ${Date.now()}`,
        descripcion: 'Departamento especializado en detección de sesgos y modelos generativos',
        activo: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.departamento.id).toBeDefined();
    idDepCreado = res.body.departamento.id;
  });

  it('6. PUT /api/departamentos/:id debe actualizar completamente el departamento (200 OK)', async () => {
    const res = await request(app)
      .put(`/api/departamentos/${idDepCreado}`)
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: `Auditoría Lingüística Actualizada ${Date.now()}`,
        descripcion: 'Descripción completa actualizada con soporte para transformadores y LLMs',
        activo: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.departamento.descripcion).toContain('transformadores');
  });

  it('7. PATCH /api/departamentos/:id debe actualizar parcialmente un departamento (200 OK)', async () => {
    const res = await request(app)
      .patch(`/api/departamentos/${idDepCreado}`)
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        descripcion: 'Actualización parcial de la descripción solamente',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.departamento.descripcion).toBe('Actualización parcial de la descripción solamente');
  });

  it('8. DELETE /api/departamentos/:id con docentes asociados debe responder 409 Conflict (Integridad Referencial)', async () => {
    // El departamento 2 tiene docentes asignados en la semilla inicial
    const res = await request(app)
      .delete('/api/departamentos/2')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('9. DELETE /api/departamentos/:id sin docentes asociados debe eliminarlo exitosamente (200 OK)', async () => {
    const res = await request(app)
      .delete(`/api/departamentos/${idDepCreado}`)
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
