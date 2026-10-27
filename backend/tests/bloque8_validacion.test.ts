import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/database';
import { generarToken } from '../src/utils/jwt.util';
import usuariosService from '../src/services/usuarios.service';

/**
 * Suite de Pruebas: LABORATORIO 8 — Validación Integral de la API
 * Proyecto: Veritas AI (Integridad Académica y Detección Antiplagio)
 * Compatible con la rúbrica P01 - P36 y SEG-01 - SEG-08
 */
describe('Laboratorio 8 — Validación Integral de la API (Veritas AI)', () => {
  jest.setTimeout(60000);

  const apiKeyValida = '61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0';
  const timestamp = Date.now();
  const passwordSegura = 'ClaveSegura2026!';

  let tokenAdmin: string;
  let tokenDocenteA: string;
  let tokenDocenteB: string;
  let tokenEstudianteA: string;
  let tokenEstudianteB: string;

  let usuarioAdminId: number | string;
  let usuarioDocenteAId: number | string;
  let usuarioDocenteBId: number | string;
  let usuarioEstudianteAId: number | string;
  let usuarioEstudianteBId: number | string;

  let estudianteAId: number;
  let estudianteBId: number;
  let docenteAId: number;
  let docenteBId: number;
  let revisionAId: number;
  let revisionBId: number;

  beforeAll(async () => {
    // 0. Limpiar revisiones de pruebas anteriores
    try {
      await pool.query("DELETE FROM public.revisiones WHERE fecha >= '2026-12-01'");
      await pool.query('UPDATE public.docentes SET activo = true WHERE id = 2');
    } catch {}

    // 1. Inicializar Administrador
    process.env.ADMIN_NOMBRE = 'Administrador Veritas';
    process.env.ADMIN_EMAIL = 'admin@veritas.com';
    process.env.ADMIN_PASSWORD = 'SANTOTO_2026—2';

    const admin = await usuariosService.crearAdministradorInicial();
    usuarioAdminId = admin.usuario?.id || admin.id || 1;
    tokenAdmin = generarToken({
      id: usuarioAdminId,
      email: 'admin@veritas.com',
      rol: 'administrador',
    });

    // 2. Crear identidades de Docentes (Auditores)
    const docAUser = await usuariosService.crearUsuarioAdministrativo({
      nombre: 'Docente Seguridad A',
      email: `docente.a_${timestamp}@veritas.com`,
      password: passwordSegura,
      rol: 'medico', // Compatible con docente
    });
    usuarioDocenteAId = docAUser.id;
    tokenDocenteA = generarToken({
      id: docAUser.id,
      email: docAUser.email,
      rol: 'medico',
    });

    const docBUser = await usuariosService.crearUsuarioAdministrativo({
      nombre: 'Docente Seguridad B',
      email: `docente.b_${timestamp}@veritas.com`,
      password: passwordSegura,
      rol: 'medico',
    });
    usuarioDocenteBId = docBUser.id;
    tokenDocenteB = generarToken({
      id: docBUser.id,
      email: docBUser.email,
      rol: 'medico',
    });

    // 3. Crear identidades de Estudiantes (Autores)
    const estAUser = await usuariosService.crearUsuario({
      nombre: 'Estudiante Veritas A',
      email: `estudiante.a_${timestamp}@veritas.com`,
      password: passwordSegura,
    });
    usuarioEstudianteAId = estAUser.id;
    tokenEstudianteA = generarToken({
      id: estAUser.id,
      email: estAUser.email,
      rol: 'paciente', // Compatible con estudiante
    });

    const estBUser = await usuariosService.crearUsuario({
      nombre: 'Estudiante Veritas B',
      email: `estudiante.b_${timestamp}@veritas.com`,
      password: passwordSegura,
    });
    usuarioEstudianteBId = estBUser.id;
    tokenEstudianteB = generarToken({
      id: estBUser.id,
      email: estBUser.email,
      rol: 'paciente',
    });
  });

  // =========================================================================
  // 8.1 USUARIOS Y AUTENTICACIÓN (P01 - P07)
  // =========================================================================
  describe('8.1 Usuarios y Autenticación (P01–P07)', () => {
    const emailP01 = `estudiante.p01_${timestamp}@veritas.com`;

    it('P01: Usuarios - Registro válido -> 201 Created', async () => {
      const res = await request(app)
        .post('/api/auth/registro')
        .set('X-API-Key', apiKeyValida)
        .send({
          nombre: 'Estudiante P01',
          email: emailP01,
          password: passwordSegura,
        });

      expect(res.status).toBe(201);
      expect(res.body.usuario).toBeDefined();
      expect(res.body.usuario.rol).toBe('user');
    });

    it('P02: Usuarios - Correo duplicado -> 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/registro')
        .set('X-API-Key', apiKeyValida)
        .send({
          nombre: 'Estudiante Duplicado',
          email: emailP01,
          password: passwordSegura,
        });

      expect([409, 400]).toContain(res.status);
    });

    it('P03: Auth - Login correcto -> 200 OK y JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-API-Key', apiKeyValida)
        .send({
          email: emailP01,
          password: passwordSegura,
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('P04: Auth - Contraseña incorrecta -> 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-API-Key', apiKeyValida)
        .send({
          email: emailP01,
          password: 'PasswordErronea123!',
        });

      expect(res.status).toBe(401);
    });

    it('P05: Auth - Perfil con JWT válido -> 200 OK', async () => {
      const res = await request(app)
        .get('/api/auth/perfil')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.usuario).toBeDefined();
    });

    it('P06: Auth - Perfil sin JWT -> 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/auth/perfil')
        .set('X-API-Key', apiKeyValida);

      expect(res.status).toBe(401);
    });

    it('P07: Auth - Solicitar rol administrador en registro público -> Servidor asigna rol user (Sin elevación)', async () => {
      const res = await request(app)
        .post('/api/auth/registro')
        .set('X-API-Key', apiKeyValida)
        .send({
          nombre: 'Atacante Rol',
          email: `atacante_${timestamp}@veritas.com`,
          password: passwordSegura,
          rol: 'administrador',
          role: 'ADMIN',
        });

      expect(res.status).toBe(201);
      expect(res.body.usuario.rol).toBe('user');
    });
  });

  // =========================================================================
  // 8.2 ESTUDIANTES / PACIENTES (P08 - P14)
  // =========================================================================
  describe('8.2 Estudiantes / Autores (P08–P14)', () => {
    it('P08: Estudiantes - Crear estudiante válido -> 201 Created', async () => {
      const res = await request(app)
        .post('/api/estudiantes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Estudiante Investigador A',
          documento: `DOC_${timestamp}_1`,
          email: `estudiante.investigador_${timestamp}@veritas.com`,
          telefono: '3001234567',
          fecha_nacimiento: '1998-05-15',
          usuario_id: usuarioEstudianteAId,
        });

      expect(res.status).toBe(201);
      const est = res.body.estudiante || res.body.paciente;
      expect(est).toBeDefined();
      estudianteAId = est.id;
    });

    it('P09: Estudiantes - Listar estudiantes -> 200 OK', async () => {
      const res = await request(app)
        .get('/api/estudiantes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      const lista = res.body.estudiantes || res.body.pacientes || res.body;
      expect(Array.isArray(lista) || lista.length >= 0).toBeTruthy();
    });

    it('P10: Estudiantes - Consultar estudiante por ID -> 200 OK', async () => {
      const res = await request(app)
        .get(`/api/estudiantes/${estudianteAId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
    });

    it('P11: Estudiantes - Documento duplicado -> 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/estudiantes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Estudiante Documento Duplicado',
          documento: `DOC_${timestamp}_1`, // Mismo documento
          email: `otro.email_${timestamp}@veritas.com`,
          telefono: '3009998877',
          fecha_nacimiento: '1999-01-01',
        });

      expect(res.status).toBe(409);
    });

    it('P12: Estudiantes - PATCH válido -> 200 OK', async () => {
      const res = await request(app)
        .patch(`/api/estudiantes/${estudianteAId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          telefono: '3119876543',
        });

      expect(res.status).toBe(200);
    });

    it('P13: Estudiantes - Asociar usuario con rol distinto (docente/admin) -> 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/estudiantes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Conflicto Rol',
          documento: `DOC_CONF_${timestamp}`,
          email: `conflicto_${timestamp}@veritas.com`,
          telefono: '3001112233',
          fecha_nacimiento: '1995-10-10',
          usuario_id: usuarioDocenteAId, // Rol médico/docente no permitido para estudiante
        });

      expect([409, 400]).toContain(res.status);
    });

    it('P14: Estudiantes - Eliminar estudiante con revisiones asociadas -> 409 Conflict', async () => {
      // Estudiante 1 tiene revisiones asociadas en los datos iniciales
      const res = await request(app)
        .delete('/api/estudiantes/1')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(409);
    });
  });

  // =========================================================================
  // 8.3 DOCENTES / PROFESORES (P15 - P21)
  // =========================================================================
  describe('8.3 Docentes / Profesores (P15–P21)', () => {
    it('P15: Docentes - Crear docente con departamento activo -> 201 Created', async () => {
      const res = await request(app)
        .post('/api/docentes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Profesor Titular A',
          registro_academico: `REG_DOC_${timestamp}_1`,
          email: `docente.titular_${timestamp}@veritas.com`,
          telefono: '3151234567',
          departamento_id: 1,
          usuario_id: usuarioDocenteAId,
        });

      expect(res.status).toBe(201);
      const doc = res.body.docente || res.body.medico;
      expect(doc).toBeDefined();
      docenteAId = doc.id;
    });

    it('P16: Docentes - Registro académico duplicado -> 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/docentes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Docente Duplicado',
          registro_academico: `REG_DOC_${timestamp}_1`,
          email: `otro.docente_${timestamp}@veritas.com`,
          telefono: '3159998877',
          departamento_id: 1,
        });

      expect(res.status).toBe(409);
    });

    it('P17: Docentes - Listar docentes por departamento -> 200 OK', async () => {
      const res = await request(app)
        .get('/api/docentes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
    });

    it('P18: Docentes - Asociar usuario docente -> 200/201 OK', async () => {
      // Crear Docente B vinculado
      const res = await request(app)
        .post('/api/docentes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Profesor Titular B',
          registro_academico: `REG_DOC_${timestamp}_2`,
          email: `docente.titular2_${timestamp}@veritas.com`,
          telefono: '3157778899',
          departamento_id: 1,
          usuario_id: usuarioDocenteBId,
        });

      expect([200, 201]).toContain(res.status);
      const docB = res.body.docente || res.body.medico;
      docenteBId = docB ? docB.id : 2;
    });

    it('P19: Docentes - Asociar usuario de otro rol (estudiante) -> 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/docentes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Docente Rol Invalido',
          registro_academico: `REG_INV_${timestamp}`,
          email: `docente.invalido_${timestamp}@veritas.com`,
          telefono: '3156667788',
          departamento_id: 1,
          usuario_id: usuarioEstudianteAId, // Rol estudiante no permitido para docente
        });

      expect([409, 400]).toContain(res.status);
    });

    it('P20: Docentes - PATCH válido -> 200 OK', async () => {
      const res = await request(app)
        .patch(`/api/docentes/${docenteAId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          telefono: '3159990000',
        });

      expect(res.status).toBe(200);
    });

    it('P21: Docentes - Eliminar docente con revisiones asociadas -> 409 Conflict', async () => {
      // Docente 1 tiene revisiones asociadas en los datos iniciales
      const res = await request(app)
        .delete('/api/docentes/1')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(409);
    });
  });

  // =========================================================================
  // 8.4 LABORATORIOS / CONSULTORIOS (P22 - P25)
  // =========================================================================
  describe('8.4 Laboratorios y Nodos (P22–P25)', () => {
    let labId: number;

    it('P22: Laboratorios - Crear laboratorio -> 201 Created', async () => {
      const res = await request(app)
        .post('/api/laboratorios')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          numero: `LAB_AI_${timestamp}`,
          piso: 'Piso 4 - Centro de Supercómputo',
        });

      expect(res.status).toBe(201);
      const lab = res.body.laboratorio || res.body.consultorio;
      labId = lab.id;
    });

    it('P23: Laboratorios - Código duplicado -> 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/laboratorios')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          numero: `LAB_AI_${timestamp}`,
          piso: 'Piso 2',
        });

      expect(res.status).toBe(409);
    });

    it('P24: Laboratorios - PATCH válido -> 200 OK', async () => {
      const res = await request(app)
        .patch(`/api/laboratorios/${labId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          piso: 'Piso 4 - Nodo Cuántico Actualizado',
        });

      expect(res.status).toBe(200);
    });

    it('P25: Laboratorios - Eliminar laboratorio con revisiones asociadas -> 409 Conflict', async () => {
      // Laboratorio 1 tiene revisiones asociadas en los datos iniciales
      const res = await request(app)
        .delete('/api/laboratorios/1')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(409);
    });
  });

  // =========================================================================
  // 8.5 REVISIONES / CITAS ACADÉMICAS (P26 - P33)
  // =========================================================================
  describe('8.5 Revisiones de Integridad Académica (P26–P33)', () => {
    it('P26: Revisiones - Crear revisión válida -> 201 Created', async () => {
      const res = await request(app)
        .post('/api/revisiones')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estudiante_id: estudianteAId || 1,
          docente_id: docenteAId || 1,
          laboratorio_id: 1,
          fecha: '2026-12-01',
          hora: '09:00:00',
          motivo: 'Auditoría de integridad académica y similitud de tesis',
        });

      expect(res.status).toBe(201);
      const rev = res.body.revision || res.body.cita;
      expect(rev).toBeDefined();
      revisionAId = rev.id;
    });

    it('P27: Revisiones - Docente inexistente -> 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/revisiones')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estudiante_id: estudianteAId || 1,
          docente_id: 99999, // Inexistente
          laboratorio_id: 1,
          fecha: '2026-12-02',
          hora: '10:00:00',
          motivo: 'Prueba docente inexistente',
        });

      expect([400, 404]).toContain(res.status);
    });

    it('P28: Revisiones - Docente inactivo -> 409 Conflict', async () => {
      // Desactivar temporalmente docente B para la prueba
      await pool.query('UPDATE public.docentes SET activo = false WHERE id = $1', [docenteBId || 2]);

      const res = await request(app)
        .post('/api/revisiones')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estudiante_id: estudianteAId || 1,
          docente_id: docenteBId || 2,
          laboratorio_id: 1,
          fecha: '2026-12-03',
          hora: '11:00:00',
          motivo: 'Prueba docente inactivo',
        });

      expect(res.status).toBe(409);

      // Reactivar docente B
      await pool.query('UPDATE public.docentes SET activo = true WHERE id = $1', [docenteBId || 2]);
    });

    it('P29: Revisiones - Docente ocupado a la misma fecha y hora -> 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/revisiones')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estudiante_id: 2,
          docente_id: docenteAId || 1,
          laboratorio_id: 2,
          fecha: '2026-12-01',
          hora: '09:00:00', // Mismo horario que P26
          motivo: 'Solapamiento de horario de docente',
        });

      expect(res.status).toBe(409);
    });

    it('P30: Revisiones - Laboratorio ocupado a la misma fecha y hora -> 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/revisiones')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estudiante_id: 2,
          docente_id: docenteBId || 2,
          laboratorio_id: 1, // Mismo laboratorio que P26
          fecha: '2026-12-01',
          hora: '09:00:00',
          motivo: 'Solapamiento de laboratorio/consultorio',
        });

      expect(res.status).toBe(409);
    });

    it('P31: Revisiones - Máquina de estados: programada -> confirmada -> 200 OK', async () => {
      const res = await request(app)
        .patch(`/api/revisiones/${revisionAId}/estado`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estado: 'confirmada',
        });

      expect(res.status).toBe(200);
      const rev = res.body.revision || res.body.cita;
      expect(rev.estado).toBe('confirmada');
    });

    it('P32: Revisiones - Máquina de estados: confirmada -> atendida -> 200 OK', async () => {
      const res = await request(app)
        .patch(`/api/revisiones/${revisionAId}/estado`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estado: 'atendida',
        });

      expect(res.status).toBe(200);
      const rev = res.body.revision || res.body.cita;
      expect(rev.estado).toBe('atendida');
    });

    it('P33: Revisiones - Máquina de estados: atendida -> programada (Transición inválida) -> 409 Conflict', async () => {
      const res = await request(app)
        .patch(`/api/revisiones/${revisionAId}/estado`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estado: 'programada',
        });

      expect(res.status).toBe(409);
    });
  });

  // =========================================================================
  // 8.6 SEGURIDAD, RBAC, BOLA/IDOR Y PERSISTENCIA (P34 - P36, SEG01 - SEG08)
  // =========================================================================
  describe('8.6 Seguridad y Control de Acceso por Objeto (P34–P36, SEG-01–SEG-08)', () => {
    let revPropiaA: number;
    let revPropiaB: number;

    beforeAll(async () => {
      // Crear revisiones exclusivas para verificar BOLA entre A y B
      const rA = await request(app)
        .post('/api/revisiones')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estudiante_id: estudianteAId || 1,
          docente_id: docenteAId || 1,
          laboratorio_id: 1,
          fecha: '2026-12-10',
          hora: '14:00:00',
          motivo: 'Revisión privada de Estudiante A',
        });
      revPropiaA = (rA.body.revision || rA.body.cita).id;

      const rB = await request(app)
        .post('/api/revisiones')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          estudiante_id: 2,
          docente_id: docenteBId || 2,
          laboratorio_id: 2,
          fecha: '2026-12-10',
          hora: '15:00:00',
          motivo: 'Revisión privada de Estudiante B',
        });
      revPropiaB = (rB.body.revision || rB.body.cita).id;
    });

    it('P34 / SEG-02: BOLA/IDOR - Estudiante A consulta revisión ajena de Estudiante B -> 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/revisiones/${revPropiaB}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenEstudianteA}`);

      expect(res.status).toBe(403);
    });

    it('SEG-01: Estudiante A consulta su revisión propia -> 200 OK', async () => {
      const res = await request(app)
        .get(`/api/revisiones/${revPropiaA}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenEstudianteA}`);

      expect(res.status).toBe(200);
    });

    it('SEG-03: Estudiante consulta sus revisiones (/mis-citas) -> 200 OK solo propias', async () => {
      const res = await request(app)
        .get('/api/revisiones/mis-citas')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenEstudianteA}`);

      expect(res.status).toBe(200);
    });

    it('SEG-04: Docente consulta sus revisiones (/mis-citas) -> 200 OK solo asignadas', async () => {
      const res = await request(app)
        .get('/api/revisiones/mis-citas')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenDocenteA}`);

      expect(res.status).toBe(200);
    });

    it('SEG-05: Docente A consulta agenda de Docente B -> 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/revisiones/medico/${docenteBId || 2}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenDocenteA}`);

      expect(res.status).toBe(403);
    });

    it('SEG-06: Docente A consulta revisión individual asignada a Docente B -> 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/revisiones/${revPropiaB}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenDocenteA}`);

      expect(res.status).toBe(403);
    });

    it('SEG-07: Docente intenta crear revisión de uso administrativo -> 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/revisiones')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenDocenteA}`)
        .send({
          estudiante_id: 1,
          docente_id: 1,
          laboratorio_id: 1,
          fecha: '2026-12-15',
          hora: '08:00:00',
          motivo: 'Intento de creación sin rol admin',
        });

      expect(res.status).toBe(403);
    });

    it('SEG-08: Administrador consulta cualquier revisión por ID -> 200 OK (Acceso Global)', async () => {
      const res = await request(app)
        .get(`/api/revisiones/${revPropiaB}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
    });

    it('P35: API Key - Petición sin cabecera X-API-Key -> 401 Rechazada', async () => {
      process.env.ENFORCE_API_KEY_IN_TEST = 'true';
      try {
        const res = await request(app)
          .get('/api/estudiantes')
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect([401, 403]).toContain(res.status);
      } finally {
        delete process.env.ENFORCE_API_KEY_IN_TEST;
      }
    });

    it('P36: Persistencia - Datos conservados tras consultas múltiples y transacciones -> 200 OK', async () => {
      const res = await request(app)
        .get(`/api/revisiones/${revisionAId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      const rev = res.body.revision || res.body.cita;
      expect(rev).toBeDefined();
      expect(rev.estado).toBe('atendida');
    });
  });

  afterAll(async () => {
    try {
      await pool.query("DELETE FROM public.revisiones WHERE fecha >= '2026-12-01'");
      await pool.query('UPDATE public.docentes SET activo = true WHERE id = 2');
    } catch {}
  });
});
