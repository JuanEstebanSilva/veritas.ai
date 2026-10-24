import request from 'supertest';
import app from '../src/app';
import usuariosService from '../src/services/usuarios.service';

const apiKey = '61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0';

describe('Laboratorio No. 11 — Veritas AI (Auditoría de Integridad Académica: 22 Tests)', () => {
  let tokenAdmin = '';
  let tokenEstudiante = '';
  let timestamp = Date.now();
  let revisionId = 1;

  beforeAll(async () => {
    await usuariosService.crearAdministradorInicial();
  });

  describe('Bloque A: Autenticación y Perfil Académico', () => {
    it('1. Login Administrador Veritas AI debe responder 200 OK y devolver token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-API-Key', apiKey)
        .send({
          email: 'admin@veritas.ai',
          password: 'SANTOTO_2026--2',
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      tokenAdmin = res.body.token;
    });

    it('2. Login Contraseña Errónea debe responder 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-API-Key', apiKey)
        .send({
          email: 'admin@veritas.ai',
          password: 'MAL',
        });

      expect(res.status).toBe(401);
    });

    it('3. Registro de Estudiante / Autor debe responder 201 Created', async () => {
      timestamp = Date.now();
      const res = await request(app)
        .post('/api/auth/registro')
        .set('X-API-Key', apiKey)
        .send({
          nombre: `Estudiante Investigador ${timestamp}`,
          email: `estudiante.autor.${timestamp}@veritas.ai`,
          password: 'Password123*',
        });

      expect(res.status).toBe(201);
    });

    it('4. Login Estudiante Registrado debe responder 200 OK y guardar token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-API-Key', apiKey)
        .send({
          email: `estudiante.autor.${timestamp}@veritas.ai`,
          password: 'Password123*',
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      tokenEstudiante = res.body.token;
    });

    it('5. Consultar Perfil con Bearer Token debe responder 200 OK', async () => {
      const res = await request(app)
        .get('/api/auth/perfil')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.usuario).toBeDefined();
    });
  });

  describe('Bloque B: Departamentos Académicos', () => {
    it('6. Listar Departamentos Académicos debe responder 200 OK', async () => {
      const res = await request(app)
        .get('/api/departamentos')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
    });

    it('7. Crear Departamento Académico con Admin debe responder 201 Created', async () => {
      const res = await request(app)
        .post('/api/departamentos')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: `Inteligencia Artificial y Ética Computacional ${timestamp}`,
          descripcion: 'Investigación en integridad académica, modelos LLM y NLP',
          activa: true,
        });

      expect(res.status).toBe(201);
    });

    it('8. Departamento Académico Duplicado debe responder 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/departamentos')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: `inteligencia artificial y ética computacional ${timestamp}`,
          descripcion: 'Duplicado en minúsculas',
          activa: true,
        });

      expect(res.status).toBe(409);
    });

    it('9. Crear Departamento con Token de Estudiante (RBAC) debe responder 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/departamentos')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenEstudiante}`)
        .send({
          nombre: `Departamento No Autorizado ${timestamp}`,
          descripcion: 'Intento sin privilegios administrativos',
          activa: true,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Bloque C: Docentes y Auditores de Ética', () => {
    it('10. Crear Docente Auditor con Admin debe responder 201 Created', async () => {
      const res = await request(app)
        .post('/api/docentes')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: `Dr. Carlos Ruiz ${timestamp}`,
          registroAcademico: `DOC-${timestamp}`,
          email: `carlos.ruiz.${timestamp}@veritas.ai`,
          telefono: '3101112233',
          departamentoId: 1,
          activo: true,
        });

      expect(res.status).toBe(201);
    });

    it('11. Código de Docente Duplicado debe responder 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/docentes')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Dr. Carlos Ruiz Duplicado',
          registroAcademico: `DOC-${timestamp}`,
          email: `carlos.otro.${timestamp}@veritas.ai`,
          telefono: '3101112233',
          departamentoId: 1,
          activo: true,
        });

      expect(res.status).toBe(409);
    });
  });

  describe('Bloque D: Estudiantes Autores y Laboratorios de Cómputo', () => {
    it('12. Crear Estudiante Autor con Admin debe responder 201 Created', async () => {
      const res = await request(app)
        .post('/api/estudiantes')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: `Laura Méndez ${timestamp}`,
          documento: `DOC-${timestamp}`,
          email: `laura.${timestamp}@veritas.ai`,
          telefono: '3123456789',
          fechaNacimiento: '1998-05-12',
        });

      expect(res.status).toBe(201);
    });

    it('13. Documento de Estudiante Duplicado debe responder 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/estudiantes')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Laura Méndez Copia',
          documento: `DOC-${timestamp}`,
          email: `laura.copia.${timestamp}@veritas.ai`,
          telefono: '3123456789',
          fechaNacimiento: '1998-05-12',
        });

      expect(res.status).toBe(409);
    });

    it('14. Crear Laboratorio de Cómputo con Admin debe responder 201 Created', async () => {
      const res = await request(app)
        .post('/api/laboratorios')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          codigo: `LAB-${timestamp}`,
          nombre: `Laboratorio de PLN y Cómputo Ético ${timestamp}`,
          piso: 3,
          ubicacion: 'Edificio de Ingeniería - Cómputo Avanzado',
          activo: true,
        });

      expect(res.status).toBe(201);
    });
  });

  describe('Bloque E: Revisiones Éticas y Agenda de Auditoría', () => {
    const testFecha = `2027-${String((timestamp % 12) + 1).padStart(2, '0')}-${String((timestamp % 28) + 1).padStart(2, '0')}`;
    const testHora = `${String((Math.floor(timestamp / 1000) % 12) + 8).padStart(2, '0')}:${String(Math.floor(timestamp / 100) % 60).padStart(2, '0')}:00`;

    it('15. Crear Revisión Ética Válida con Admin debe responder 201 Created (estado: programada)', async () => {
      const res = await request(app)
        .post('/api/revisiones')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estudianteId: 1,
          docenteId: 1,
          laboratorioId: 1,
          fecha: testFecha,
          hora: testHora,
          motivo: 'Auditoría de originalidad, perplejidad y similitud semántica en tesis de IA',
        });

      expect(res.status).toBe(201);
      const c = res.body.revision || res.body.cita;
      if (c && c.id) revisionId = c.id;
    });

    it('16. Conflicto de Horario / Doble Asignación debe responder 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/revisiones')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estudianteId: 2,
          docenteId: 1,
          laboratorioId: 1,
          fecha: testFecha,
          hora: testHora,
          motivo: 'Auditoría solapada en mismo laboratorio y docente',
        });

      expect(res.status).toBe(409);
    });

    it('17. Cambio de Estado Válido a "confirmada" debe responder 200 OK', async () => {
      const res = await request(app)
        .patch(`/api/revisiones/${revisionId}/estado`)
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'confirmada' });

      expect(res.status).toBe(200);
    });

    it('18. Cambio de Estado Válido a "atendida" debe responder 200 OK', async () => {
      const res = await request(app)
        .patch(`/api/revisiones/${revisionId}/estado`)
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'atendida' });

      expect(res.status).toBe(200);
    });

    it('19. Cambio de Estado Inválido de "atendida" a "programada" debe responder 409 Conflict', async () => {
      const res = await request(app)
        .patch(`/api/revisiones/${revisionId}/estado`)
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'programada' });

      expect(res.status).toBe(409);
    });
  });

  describe('Bloque F: Seguridad BOLA / IDOR e Integridad Referencial', () => {
    it('20. Consultar Revisiones Propias con Token de Estudiante debe responder 200 OK', async () => {
      const res = await request(app)
        .get('/api/revisiones/mis-revisiones')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenEstudiante}`);

      expect(res.status).toBe(200);
    });

    it('21. Consultar Revisión Ajena con Token de Estudiante debe responder 403 Forbidden (BOLA Bloqueado)', async () => {
      const res = await request(app)
        .get('/api/revisiones/1')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenEstudiante}`);

      expect(res.status).toBe(403);
    });

    it('22. Eliminar Estudiante con Revisiones Activas debe responder 409 Conflict (Integridad Referencial)', async () => {
      const res = await request(app)
        .delete('/api/estudiantes/1')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(409);
    });
  });
});
