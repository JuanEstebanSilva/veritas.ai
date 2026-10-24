import request from 'supertest';
import app from '../src/app';
import usuariosService from '../src/services/usuarios.service';

const apiKey = '61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0';

describe('Laboratorio No. 11 — Colección Automatizada (HospitalSoft & Veritas AI: 22 Tests)', () => {
  let tokenAdmin = '';
  let tokenPaciente = '';
  let timestamp = Date.now();
  let citaId = 1;

  beforeAll(async () => {
    await usuariosService.crearAdministradorInicial();
  });

  describe('Bloque A: Autenticación y Perfil', () => {
    it('1. Login Admin debe responder 200 OK y devolver token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-API-Key', apiKey)
        .send({
          email: 'admin@hospital.com',
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
          email: 'admin@hospital.com',
          password: 'MAL',
        });

      expect(res.status).toBe(401);
    });

    it('3. Registro de Paciente debe responder 201 Created', async () => {
      timestamp = Date.now();
      const res = await request(app)
        .post('/api/auth/registro')
        .set('X-API-Key', apiKey)
        .send({
          nombre: 'Paciente Demo',
          email: `paciente.demo.${timestamp}@test.com`,
          password: 'Password123*',
        });

      expect(res.status).toBe(201);
    });

    it('4. Login Paciente Registrado debe responder 200 OK y guardar token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-API-Key', apiKey)
        .send({
          email: `paciente.demo.${timestamp}@test.com`,
          password: 'Password123*',
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      tokenPaciente = res.body.token;
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

  describe('Bloque B: Especialidades / Departamentos', () => {
    it('6. Listar Especialidades debe responder 200 OK', async () => {
      const res = await request(app)
        .get('/api/especialidades')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
    });

    it('7. Crear Especialidad con Admin debe responder 201 Created', async () => {
      const res = await request(app)
        .post('/api/especialidades')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: `Dermatología Especial ${timestamp}`,
          descripcion: 'Cuidado e investigación de la piel',
          activa: true,
        });

      expect(res.status).toBe(201);
    });

    it('8. Especialidad Duplicada debe responder 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/especialidades')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: `Dermatología Especial ${timestamp}`,
          descripcion: 'Duplicado',
          activa: true,
        });

      expect(res.status).toBe(409);
    });

    it('9. Crear Especialidad con Token de Paciente (RBAC) debe responder 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/especialidades')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenPaciente}`)
        .send({
          nombre: `Especialidad No Autorizada ${timestamp}`,
          descripcion: 'Intento sin permisos',
          activa: true,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Bloque C: Médicos / Docentes', () => {
    it('10. Crear Médico con Admin debe responder 201 Created', async () => {
      const res = await request(app)
        .post('/api/medicos')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: `Dr. Carlos Ruiz ${timestamp}`,
          registroMedico: `RM-${timestamp}`,
          email: `carlos.ruiz.${timestamp}@hospital.com`,
          telefono: '3101112233',
          especialidadId: 1,
          activo: true,
        });

      expect(res.status).toBe(201);
    });

    it('11. Registro Médico Duplicado debe responder 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/medicos')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Dr. Carlos Ruiz Duplicado',
          registroMedico: `RM-${timestamp}`,
          email: `carlos.otro.${timestamp}@hospital.com`,
          telefono: '3101112233',
          especialidadId: 1,
          activo: true,
        });

      expect(res.status).toBe(409);
    });
  });

  describe('Bloque D: Pacientes y Consultorios / Laboratorios', () => {
    it('12. Crear Paciente con Admin debe responder 201 Created', async () => {
      const res = await request(app)
        .post('/api/pacientes')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: `Laura Méndez ${timestamp}`,
          documento: `DOC-${timestamp}`,
          email: `laura.${timestamp}@test.com`,
          telefono: '3123456789',
          fechaNacimiento: '1998-05-12',
        });

      expect(res.status).toBe(201);
    });

    it('13. Documento Duplicado debe responder 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/pacientes')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Laura Méndez Copia',
          documento: `DOC-${timestamp}`,
          email: `laura.copia.${timestamp}@test.com`,
          telefono: '3123456789',
          fechaNacimiento: '1998-05-12',
        });

      expect(res.status).toBe(409);
    });

    it('14. Crear Consultorio con Admin debe responder 201 Created', async () => {
      const res = await request(app)
        .post('/api/consultorios')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          codigo: `CONS-${timestamp}`,
          nombre: `Consultorio ${timestamp}`,
          piso: 3,
          ubicacion: 'Ala Norte',
          activo: true,
        });

      expect(res.status).toBe(201);
    });
  });

  describe('Bloque E: Citas Médicas / Revisiones y Agenda', () => {
    const testFecha = `2027-${String((timestamp % 12) + 1).padStart(2, '0')}-${String((timestamp % 28) + 1).padStart(2, '0')}`;
    const testHora = `${String((Math.floor(timestamp / 1000) % 12) + 8).padStart(2, '0')}:${String(Math.floor(timestamp / 100) % 60).padStart(2, '0')}:00`;

    it('15. Crear Cita Válida con Admin debe responder 201 Created (estado: programada)', async () => {
      const res = await request(app)
        .post('/api/citas')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          pacienteId: 1,
          medicoId: 1,
          consultorioId: 1,
          fecha: testFecha,
          hora: testHora,
          motivo: 'Control general de salud',
        });

      expect(res.status).toBe(201);
      const c = res.body.cita || res.body.revision;
      if (c && c.id) citaId = c.id;
    });

    it('16. Conflicto de Horario / Doble Reserva debe responder 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/citas')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          pacienteId: 2,
          medicoId: 1,
          consultorioId: 1,
          fecha: testFecha,
          hora: testHora,
          motivo: 'Control general de salud solapado',
        });

      expect(res.status).toBe(409);
    });

    it('17. Cambio de Estado Válido a "confirmada" debe responder 200 OK', async () => {
      const res = await request(app)
        .patch(`/api/citas/${citaId}/estado`)
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'confirmada' });

      expect(res.status).toBe(200);
    });

    it('18. Cambio de Estado Válido a "atendida" debe responder 200 OK', async () => {
      const res = await request(app)
        .patch(`/api/citas/${citaId}/estado`)
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'atendida' });

      expect(res.status).toBe(200);
    });

    it('19. Cambio de Estado Inválido de "atendida" a "programada" debe responder 409 Conflict', async () => {
      const res = await request(app)
        .patch(`/api/citas/${citaId}/estado`)
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'programada' });

      expect(res.status).toBe(409);
    });
  });

  describe('Bloque F: Seguridad BOLA / IDOR e Integridad', () => {
    it('20. Consultar Citas Propias con Token de Paciente debe responder 200 OK', async () => {
      const res = await request(app)
        .get('/api/citas/mis-citas')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenPaciente}`);

      expect(res.status).toBe(200);
    });

    it('21. Consultar Cita Ajena con Token de Paciente debe responder 403 Forbidden (BOLA Bloqueado)', async () => {
      const res = await request(app)
        .get('/api/citas/1')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenPaciente}`);

      expect(res.status).toBe(403);
    });

    it('22. Eliminar Paciente con Citas Activas debe responder 409 Conflict (Integridad Referencial)', async () => {
      const res = await request(app)
        .delete('/api/pacientes/1')
        .set('X-API-Key', apiKey)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(409);
    });
  });
});
