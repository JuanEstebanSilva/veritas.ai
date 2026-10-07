import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role } from '@prisma/client';
import { generarToken } from '../src/utils/jwt.util';
import usuariosService from '../src/services/usuarios.service';
import pacientesService from '../src/services/pacientes.service';
import medicosService from '../src/services/medicos.service';
import citasService from '../src/services/citas.service';

/**
 * Laboratorio No. 10 — Autorización Segura en APIs REST: RBAC, IDOR/BOLA y Control de Acceso a Recursos
 * Veritas AI — SUITE DE PRUEBAS COMPLETA (BLOQUE 6A, 6B y 6C)
 *
 * Dominio adaptado a Veritas AI (@veritas.com y @veritas.ai).
 * Verifica los 30 casos obligatorios y los escenarios de la matriz de autorización.
 */
describe('Laboratorio No. 10 — Autorización Segura en APIs REST: RBAC, IDOR/BOLA (Veritas AI)', () => {
  const apiKeyValida = '61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0';
  const timestamp = Date.now();
  const passwordSegura = 'ClaveSegura2026!';

  // Identidades del laboratorio
  let tokenAdmin: string;
  let tokenMedicoA: string;
  let tokenMedicoB: string;
  let tokenPacienteA: string;
  let tokenPacienteB: string;
  let tokenSinPerfil: string;

  let usuarioAdminId: number | string;
  let usuarioMedicoAId: number | string;
  let usuarioMedicoBId: number | string;
  let usuarioPacienteAId: number | string;
  let usuarioPacienteBId: number | string;
  let usuarioSinPerfilId: number | string;

  let pacienteAId: number;
  let pacienteBId: number;
  let medicoAId: number;
  let medicoBId: number;
  let citaAId: number;
  let citaBId: number;

  beforeAll(async () => {
    // 1. Inicializar Administrador Bootstrap (Bloque 6A)
    process.env.ADMIN_NOMBRE = 'Administrador Veritas';
    process.env.ADMIN_EMAIL = 'admin@veritas.com';
    process.env.ADMIN_PASSWORD = 'SANTOTO_2026—2';

    const admin = await usuariosService.crearAdministradorInicial();
    usuarioAdminId = admin.id;
    tokenAdmin = generarToken({
      id: admin.id,
      email: admin.email,
      rol: 'administrador',
    });

    // 2. Crear usuarios con roles mediante gestión administrativa y registro público
    const medicoAUser = await usuariosService.crearUsuarioAdministrativo({
      nombre: 'Médico Seguridad A',
      email: `medico.a_${timestamp}@veritas.com`,
      password: passwordSegura,
      rol: 'medico',
    });
    usuarioMedicoAId = medicoAUser.id;
    tokenMedicoA = generarToken({
      id: medicoAUser.id,
      email: medicoAUser.email,
      rol: 'medico',
    });

    const medicoBUser = await usuariosService.crearUsuarioAdministrativo({
      nombre: 'Médico Seguridad B',
      email: `medico.b_${timestamp}@veritas.com`,
      password: passwordSegura,
      rol: 'medico',
    });
    usuarioMedicoBId = medicoBUser.id;
    tokenMedicoB = generarToken({
      id: medicoBUser.id,
      email: medicoBUser.email,
      rol: 'medico',
    });

    // Registro público de Pacientes (rol paciente asignado por servidor)
    const pacienteAUser = await usuariosService.crearUsuario({
      nombre: 'Paciente Veritas A',
      email: `paciente.a_${timestamp}@veritas.com`,
      password: passwordSegura,
    });
    usuarioPacienteAId = pacienteAUser.id;
    tokenPacienteA = generarToken({
      id: pacienteAUser.id,
      email: pacienteAUser.email,
      rol: 'paciente',
    });

    const pacienteBUser = await usuariosService.crearUsuario({
      nombre: 'Paciente Veritas B',
      email: `paciente.b_${timestamp}@veritas.com`,
      password: passwordSegura,
    });
    usuarioPacienteBId = pacienteBUser.id;
    tokenPacienteB = generarToken({
      id: pacienteBUser.id,
      email: pacienteBUser.email,
      rol: 'paciente',
    });

    const sinPerfilUser = await usuariosService.crearUsuario({
      nombre: 'Usuario Sin Perfil',
      email: `sinperfil_${timestamp}@veritas.com`,
      password: passwordSegura,
    });
    usuarioSinPerfilId = sinPerfilUser.id;
    tokenSinPerfil = generarToken({
      id: sinPerfilUser.id,
      email: sinPerfilUser.email,
      rol: 'paciente',
    });

    // 3. Crear perfiles en datos con asociación explícita a usuarioId
    const medA = medicosService.crearMedico({
      nombre: 'Médico Veritas A',
      registroMedico: `RM-A-${timestamp}`,
      email: `medico.a_${timestamp}@veritas.com`,
      telefono: '3101112233',
      especialidadId: 1,
      usuarioId: usuarioMedicoAId,
    });
    medicoAId = medA.id;

    const medB = medicosService.crearMedico({
      nombre: 'Médico Veritas B',
      registroMedico: `RM-B-${timestamp}`,
      email: `medico.b_${timestamp}@veritas.com`,
      telefono: '3104445566',
      especialidadId: 2,
      usuarioId: usuarioMedicoBId,
    });
    medicoBId = medB.id;

    const pacA = pacientesService.crearPaciente({
      nombre: 'Paciente Veritas A',
      documento: `DOC-A-${timestamp}`,
      email: `paciente.a_${timestamp}@veritas.com`,
      telefono: '3001112233',
      fechaNacimiento: '1995-05-10',
      usuarioId: usuarioPacienteAId,
    });
    pacienteAId = pacA.id;

    const pacB = pacientesService.crearPaciente({
      nombre: 'Paciente Veritas B',
      documento: `DOC-B-${timestamp}`,
      email: `paciente.b_${timestamp}@veritas.com`,
      telefono: '3004445566',
      fechaNacimiento: '1998-08-20',
      usuarioId: usuarioPacienteBId,
    });
    pacienteBId = pacB.id;

    // 4. Crear citas para Paciente A y Paciente B
    const cA = citasService.crearCita({
      pacienteId: pacienteAId,
      medicoId: medicoAId,
      fecha: '2026-12-10T10:00:00Z',
      motivo: 'Control Paciente A Veritas',
      estado: 'programada',
    });
    citaAId = cA.id;

    const cB = citasService.crearCita({
      pacienteId: pacienteBId,
      medicoId: medicoBId,
      fecha: '2026-12-11T11:00:00Z',
      motivo: 'Control Paciente B Veritas',
      estado: 'programada',
    });
    citaBId = cB.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // =========================================================================
  // BLOQUE 6A — AUTENTICACIÓN VS AUTORIZACIÓN (RBAC)
  // =========================================================================
  describe('BLOQUE 6A — RBAC y Autenticación en Capas', () => {
    it('Caso 1: Acceso sin JWT a recurso protegido debe responder 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/pacientes')
        .set('X-API-Key', apiKeyValida);

      expect(res.status).toBe(401);
      expect(res.body.mensaje || res.body.message).toMatch(/Token de autenticación requerido|no autenticado/i);
    });

    it('Caso 2: JWT alterado o con firma falsa debe responder 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/pacientes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}alterado_invalido`);

      expect(res.status).toBe(401);
      expect(res.body.mensaje || res.body.message).toMatch(/Token inválido|formato/i);
    });

    it('Caso 3: JWT válido pero rol paciente en recurso restringido debe responder 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/pacientes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenPacienteA}`)
        .send({
          nombre: 'Paciente No Permitido',
          documento: '999999',
          email: 'nopermitido@veritas.com',
          telefono: '3009999999',
          fechaNacimiento: '2000-01-01',
        });

      expect(res.status).toBe(403);
      expect(res.body.mensaje).toBe('No tiene permisos para realizar esta operación');
    });

    it('Caso 4: Rol médico autorizado debe poder consultar pacientes (200 OK)', async () => {
      const res = await request(app)
        .get('/api/pacientes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenMedicoA}`);

      expect(res.status).toBe(200);
      expect(res.body.pacientes).toBeDefined();
      expect(Array.isArray(res.body.pacientes)).toBe(true);
    });

    it('Caso 5: Rol administrador autorizado debe poder consultar pacientes (200 OK)', async () => {
      const res = await request(app)
        .get('/api/pacientes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.pacientes).toBeDefined();
    });

    it('Caso 6 & 7: Paciente y Médico intentando crear paciente -> 403 Forbidden', async () => {
      const resPac = await request(app)
        .post('/api/pacientes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenPacienteA}`)
        .send({
          nombre: 'Nuevo Paciente Falso',
          documento: '88888',
          email: 'falso@veritas.com',
          telefono: '3000000000',
          fechaNacimiento: '1999-01-01',
        });
      expect(resPac.status).toBe(403);

      const resMed = await request(app)
        .post('/api/pacientes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenMedicoA}`)
        .send({
          nombre: 'Nuevo Paciente Falso 2',
          documento: '88889',
          email: 'falso2@veritas.com',
          telefono: '3000000000',
          fechaNacimiento: '1999-01-01',
        });
      expect(resMed.status).toBe(403);
    });

    it('Caso 8: Administrador crea paciente con datos válidos -> 201 Created', async () => {
      const res = await request(app)
        .post('/api/pacientes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Paciente Creado Por Admin',
          documento: `DOC-ADMIN-${timestamp}`,
          email: `admin.creado_${timestamp}@veritas.com`,
          telefono: '3005556677',
          fechaNacimiento: '1996-03-15',
        });

      expect(res.status).toBe(201);
      expect(res.body.mensaje).toBe('Paciente creado correctamente');
      expect(res.body.paciente).toBeDefined();
    });

    it('Caso 9: Paciente intenta eliminar paciente -> 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/pacientes/${pacienteAId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenPacienteA}`);

      expect(res.status).toBe(403);
    });

    it('Caso 10: Administrador intenta eliminar paciente con citas asociadas -> 409 Conflict (Integridad Referencial)', async () => {
      const res = await request(app)
        .delete(`/api/pacientes/${pacienteAId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(409);
      expect(res.body.mensaje).toMatch(/no se puede eliminar el paciente porque tiene citas asociadas/i);
    });

    it('Caso 30: Petición sin X-API-Key a endpoint protegido -> 401 Rechazado por API Key', async () => {
      process.env.ENFORCE_API_KEY_IN_TEST = 'true';
      try {
        const res = await request(app)
          .get('/api/pacientes')
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(401);
        expect(res.body.mensaje || res.body.message).toMatch(/API Key requerida/i);
      } finally {
        delete process.env.ENFORCE_API_KEY_IN_TEST;
      }
    });
  });

  // =========================================================================
  // BLOQUE 6B — GESTIÓN ADMINISTRATIVA DE USUARIOS
  // =========================================================================
  describe('BLOQUE 6B — Gestión Administrativa de Usuarios', () => {
    it('Caso 11: Registro público normal fija rol paciente controlado por servidor (201)', async () => {
      const emailPublico = `publico_${timestamp}@veritas.com`;
      const res = await request(app)
        .post('/api/auth/registro')
        .set('X-API-Key', apiKeyValida)
        .send({
          nombre: 'Usuario Público Veritas',
          email: emailPublico,
          password: passwordSegura,
        });

      expect(res.status).toBe(201);
      expect(res.body.usuario.rol).toMatch(/paciente|user/i);
    });

    it('Caso 12 a 15: Ataque de Mass Assignment en Registro Público es neutralizado', async () => {
      const emailAtaque = `ataque_${timestamp}@veritas.com`;
      const res = await request(app)
        .post('/api/auth/registro')
        .set('X-API-Key', apiKeyValida)
        .send({
          nombre: 'Atacante Veritas',
          email: emailAtaque,
          password: passwordSegura,
          rol: 'administrador',
          role: 'ADMIN',
          activo: false,
          passwordHash: 'hash-falso-inventado',
          esSuperAdmin: true,
          id: 9999,
        });

      expect(res.status).toBe(201);
      expect(res.body.usuario.rol).toMatch(/paciente|user/i);
      expect(res.body.usuario.activo).toBe(true);
      expect((res.body.usuario as any).esSuperAdmin).toBeUndefined();
      expect((res.body.usuario as any).passwordHash).toBeUndefined();
    });

    it('Caso 16: Admin crea médico desde gestión privilegiada POST /api/usuarios (201)', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Médico Hospitalario Veritas',
          email: `doc_${timestamp}@veritas.com`,
          password: passwordSegura,
          rol: 'medico',
        });

      expect(res.status).toBe(201);
      expect(res.body.mensaje).toBe('Usuario creado correctamente');
      expect(res.body.usuario.rol).toBe('medico');
      expect(res.body.usuario.passwordHash).toBeUndefined();
    });

    it('Caso 17: Admin crea administrador desde gestión privilegiada POST /api/usuarios (201)', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Segundo Administrador Veritas',
          email: `admin2_${timestamp}@veritas.com`,
          password: passwordSegura,
          rol: 'administrador',
        });

      expect(res.status).toBe(201);
      expect(res.body.usuario.rol).toMatch(/administrador|admin/i);
    });

    it('Caso 18: Médico intenta crear médico en POST /api/usuarios -> 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenMedicoA}`)
        .send({
          nombre: 'Médico No Autorizado',
          email: `doc_hacker_${timestamp}@veritas.com`,
          password: passwordSegura,
          rol: 'medico',
        });

      expect(res.status).toBe(403);
      expect(res.body.mensaje).toBe('No tiene permisos para realizar esta operación');
    });

    it('Caso 19: Paciente intenta crear administrador en POST /api/usuarios -> 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenPacienteA}`)
        .send({
          nombre: 'Admin Falso',
          email: `admin_falso_${timestamp}@veritas.com`,
          password: passwordSegura,
          rol: 'administrador',
        });

      expect(res.status).toBe(403);
      expect(res.body.mensaje).toBe('No tiene permisos para realizar esta operación');
    });

    it('Caso 20: Admin intenta asignar un rol no permitido -> 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Rol Invalido',
          email: `rolinvalido_${timestamp}@veritas.com`,
          password: passwordSegura,
          rol: 'superadmin',
        });

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('Datos inválidos');
    });
  });

  // =========================================================================
  // BLOQUE 6C — IDOR / BOLA Y ASOCIACIÓN DE RECURSOS
  // =========================================================================
  describe('BLOQUE 6C — Autorización a Nivel de Objeto (BOLA/IDOR)', () => {
    it('Caso 21: Asociar paciente con usuario inexistente -> 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/pacientes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Paciente Fantasma',
          documento: `DOC-FANTASMA-${timestamp}`,
          email: `fantasma_${timestamp}@veritas.com`,
          telefono: '3000000000',
          fechaNacimiento: '2000-01-01',
          usuarioId: 999999,
        });

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('El usuario asociado no existe');
    });

    it('Caso 22: Asociar paciente con usuario que tiene rol médico o admin -> 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/pacientes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Paciente Erroneo',
          documento: `DOC-ERR-${timestamp}`,
          email: `erroneo_${timestamp}@veritas.com`,
          telefono: '3000000000',
          fechaNacimiento: '2000-01-01',
          usuarioId: usuarioMedicoAId,
        });

      expect(res.status).toBe(409);
      expect(res.body.mensaje).toBe('El usuario asociado no tiene rol paciente');
    });

    it('Caso 23: Asociar mismo usuario a dos pacientes (relación 1:1) -> 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/pacientes')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Paciente Duplicado',
          documento: `DOC-DUP-${timestamp}`,
          email: `dup_${timestamp}@veritas.com`,
          telefono: '3000000000',
          fechaNacimiento: '2000-01-01',
          usuarioId: usuarioPacienteAId,
        });

      expect(res.status).toBe(409);
      expect(res.body.mensaje).toBe('El usuario ya está asociado a un paciente');
    });

    it('Caso 24: Asociar médico con usuario inexistente -> 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/medicos')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Médico Fantasma',
          registroMedico: `RM-FANT-${timestamp}`,
          email: `medfantasma_${timestamp}@veritas.com`,
          telefono: '3100000000',
          especialidadId: 1,
          usuarioId: 999999,
        });

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('El usuario asociado no existe');
    });

    it('Caso 25: Asociar médico con usuario de rol paciente -> 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/medicos')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Médico Conflicto',
          registroMedico: `RM-CONF-${timestamp}`,
          email: `medconf_${timestamp}@veritas.com`,
          telefono: '3100000000',
          especialidadId: 1,
          usuarioId: usuarioPacienteAId,
        });

      expect(res.status).toBe(409);
      expect(res.body.mensaje).toBe('El usuario asociado no tiene rol medico');
    });

    it('Caso 26: Asociar mismo usuario a dos médicos -> 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/medicos')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Médico Repetido',
          registroMedico: `RM-REP-${timestamp}`,
          email: `medrep_${timestamp}@veritas.com`,
          telefono: '3100000000',
          especialidadId: 1,
          usuarioId: usuarioMedicoAId,
        });

      expect(res.status).toBe(409);
      expect(res.body.mensaje).toBe('El usuario ya está asociado a un médico');
    });

    // Pruebas BOLA / IDOR en Citas
    it('Caso 11: Paciente A consulta sus propias citas /paciente/{A} -> 200 OK', async () => {
      const res = await request(app)
        .get(`/api/citas/paciente/${pacienteAId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenPacienteA}`);

      expect(res.status).toBe(200);
      expect(res.body.citas).toBeDefined();
    });

    it('Caso 12: Paciente A intenta consultar citas de Paciente B /paciente/{B} -> 403 Forbidden (BOLA/IDOR Protegido)', async () => {
      const res = await request(app)
        .get(`/api/citas/paciente/${pacienteBId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenPacienteA}`);

      expect(res.status).toBe(403);
      expect(res.body.mensaje).toBe('No tiene permisos para acceder a este recurso');
    });

    it('Caso 13: Paciente A consulta su cita individual -> 200 OK', async () => {
      const res = await request(app)
        .get(`/api/citas/${citaAId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenPacienteA}`);

      expect(res.status).toBe(200);
      expect(res.body.cita).toBeDefined();
    });

    it('Caso 14: Paciente A intenta consultar cita individual de Paciente B -> 403 Forbidden (BOLA Bloqueado)', async () => {
      const res = await request(app)
        .get(`/api/citas/${citaBId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenPacienteA}`);

      expect(res.status).toBe(403);
      expect(res.body.mensaje).toBe('No tiene permisos para acceder a este recurso');
    });

    it('Caso 15: Médico A consulta sus propias citas /medico/{A} -> 200 OK', async () => {
      const res = await request(app)
        .get(`/api/citas/medico/${medicoAId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenMedicoA}`);

      expect(res.status).toBe(200);
      expect(res.body.citas).toBeDefined();
    });

    it('Caso 16: Médico A intenta consultar citas de Médico B /medico/{B} -> 403 Forbidden (BOLA Bloqueado)', async () => {
      const res = await request(app)
        .get(`/api/citas/medico/${medicoBId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenMedicoA}`);

      expect(res.status).toBe(403);
      expect(res.body.mensaje).toBe('No tiene permisos para acceder a este recurso');
    });

    it('Caso 17: Médico A consulta cita individual asignada a él -> 200 OK', async () => {
      const res = await request(app)
        .get(`/api/citas/${citaAId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenMedicoA}`);

      expect(res.status).toBe(200);
      expect(res.body.cita).toBeDefined();
    });

    it('Caso 18: Médico A intenta consultar cita individual asignada a otro médico -> 403 Forbidden (BOLA Bloqueado)', async () => {
      const res = await request(app)
        .get(`/api/citas/${citaBId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenMedicoA}`);

      expect(res.status).toBe(403);
      expect(res.body.mensaje).toBe('No tiene permisos para acceder a este recurso');
    });

    it('Caso 19: Paciente usa /mis-citas -> 200 OK (solo citas propias derivadas del JWT)', async () => {
      const res = await request(app)
        .get('/api/citas/mis-citas')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenPacienteA}`);

      expect(res.status).toBe(200);
      expect(res.body.citas).toBeDefined();
      expect(res.body.citas.every((c: any) => c.pacienteId === pacienteAId)).toBe(true);
    });

    it('Caso 20: Médico usa /mis-citas -> 200 OK (solo citas propias derivadas del JWT)', async () => {
      const res = await request(app)
        .get('/api/citas/mis-citas')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenMedicoA}`);

      expect(res.status).toBe(200);
      expect(res.body.citas).toBeDefined();
      expect(res.body.citas.every((c: any) => c.medicoId === medicoAId)).toBe(true);
    });

    it('Caso 21: Administrador usa /mis-citas -> 403 Forbidden (Separación semántica)', async () => {
      const res = await request(app)
        .get('/api/citas/mis-citas')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(403);
      expect(res.body.mensaje).toMatch(/restringido a perfiles/i);
    });

    it('Caso 22: Usuario sin perfil asociado usa /mis-citas -> 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/citas/mis-citas')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenSinPerfil}`);

      expect(res.status).toBe(403);
      expect(res.body.mensaje).toMatch(/no tiene un paciente asociado/i);
    });

    it('Caso 24: Administrador consulta todas las citas GET /api/citas -> 200 OK (Acceso Global)', async () => {
      const res = await request(app)
        .get('/api/citas')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.citas).toBeDefined();
      expect(res.body.citas.length).toBeGreaterThanOrEqual(2);
    });

    it('Caso 25 & 26: Paciente y Médico intentando listar todas las citas GET /api/citas -> 403 Forbidden', async () => {
      const resPac = await request(app)
        .get('/api/citas')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenPacienteA}`);
      expect(resPac.status).toBe(403);

      const resMed = await request(app)
        .get('/api/citas')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenMedicoA}`);
      expect(resMed.status).toBe(403);
    });

    it('Caso 27: Paciente o Médico intentando crear cita POST /api/citas -> 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/citas')
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenPacienteA}`)
        .send({
          pacienteId: pacienteAId,
          medicoId: medicoAId,
          fecha: '2026-12-25T10:00:00Z',
          motivo: 'Intento de creación no autorizada',
        });

      expect(res.status).toBe(403);
    });

    it('Caso 28 & 29: Paciente o Médico intentando cambiar estado o modificar cita -> 403 Forbidden', async () => {
      const resEstado = await request(app)
        .patch(`/api/citas/${citaAId}/estado`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenPacienteA}`)
        .send({ estado: 'atendida' });
      expect(resEstado.status).toBe(403);

      const resDel = await request(app)
        .delete(`/api/citas/${citaAId}`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenMedicoA}`);
      expect(resDel.status).toBe(403);
    });

    it('Caso 54: Admin hace transición válida en máquina de estados (programada -> confirmada) -> 200 OK', async () => {
      const res = await request(app)
        .patch(`/api/citas/${citaAId}/estado`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'confirmada' });

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toBe('Estado de cita actualizado correctamente');
      expect(res.body.cita.estado).toBe('confirmada');
    });

    it('Caso 55: Admin hace transición inválida en máquina de estados (atendida -> programada) -> 409 Conflict', async () => {
      // 1. Llevar a estado terminal "atendida"
      await request(app)
        .patch(`/api/citas/${citaAId}/estado`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'atendida' });

      // 2. Intentar transición ilegal (atendida -> programada)
      const res = await request(app)
        .patch(`/api/citas/${citaAId}/estado`)
        .set('X-API-Key', apiKeyValida)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'programada' });

      expect(res.status).toBe(409);
      expect(res.body.mensaje).toBe('Transición de estado inválida');
    });
  });
});
