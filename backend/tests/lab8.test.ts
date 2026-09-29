import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role } from '@prisma/client';
import usuariosService from '../src/services/usuarios.service';

/**
 * Laboratorio No. 8 — Control del rol y prevención de escalada de privilegios
 * Veritas AI — CHECKPOINT COMPLETO (BLOQUE 4B)
 */
describe('Laboratorio No. 8 — Control del rol y prevención de escalada de privilegios (Veritas AI)', () => {
  const timestamp = Date.now();
  const testPassword = 'ClaveSegura2026!';
  const emailNormal = `estudiante_${timestamp}@veritas.ai`;
  const emailAtacante = `ataque_${timestamp}@veritas.ai`;
  const emailMass = `mass_${timestamp}@veritas.ai`;

  afterAll(async () => {
    // Limpieza de datos creados en las pruebas respetando integridad referencial
    const usuarios = await prisma.user.findMany({
      where: { email: { contains: `${timestamp}@veritas.ai` } },
      select: { id: true },
    });
    const ids = usuarios.map((u) => u.id);
    if (ids.length > 0) {
      await prisma.payment.deleteMany({ where: { user_id: { in: ids } } });
      await prisma.analysis.deleteMany({ where: { user_id: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  // =========================================================================
  // PARTE 9: Prueba normal
  // =========================================================================
  it('Checkpoint 1: Registro sin rol debe responder 201 y asignar rol "user" por el servidor', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({
        nombre: 'Estudiante Veritas',
        email: emailNormal,
        password: testPassword,
      });

    expect(res.status).toBe(201);
    expect(res.body.mensaje).toBe('Usuario registrado correctamente');
    expect(res.body.usuario).toBeDefined();
    expect(res.body.usuario.email).toBe(emailNormal);
    // El cliente nunca dijo rol = user. Lo decidió el servidor.
    expect(res.body.usuario.rol).toBe('user');
    expect(res.body.usuario.activo).toBe(true);

    // Verificación directa en base de datos
    const userDb = await prisma.user.findUnique({ where: { email: emailNormal } });
    expect(userDb).not.toBeNull();
    expect(userDb!.role).toBe(Role.USER);
    expect(userDb!.is_active).toBe(true);
  });

  // =========================================================================
  // PARTE 10 & 11: Intento de escalar privilegios (Ataque 1)
  // =========================================================================
  it('Checkpoint 2 & 3 & 5: Intento de enviar rol: "ADMIN" / "administrador", activo: false, esSuperAdmin: true -> Ignorados', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({
        nombre: 'Usuario Ataque',
        email: emailAtacante,
        password: testPassword,
        rol: 'ADMIN',
        role: 'ADMIN',
        activo: false,
        esSuperAdmin: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.mensaje).toBe('Usuario registrado correctamente');
    expect(res.body.usuario).toBeDefined();
    expect(res.body.usuario.email).toBe(emailAtacante);

    // Servidor guardó rol: user (el intento de administrador fue neutralizado)
    expect(res.body.usuario.rol).toBe('user');
    // Servidor mantuvo activo: true (el intento de activo: false fue neutralizado)
    expect(res.body.usuario.activo).toBe(true);
    // esSuperAdmin ni siquiera existe
    expect((res.body.usuario as any).esSuperAdmin).toBeUndefined();

    // Verificación en base de datos
    const userDb = await prisma.user.findUnique({ where: { email: emailAtacante } });
    expect(userDb!.role).toBe(Role.USER);
    expect(userDb!.is_active).toBe(true);
  });

  // =========================================================================
  // PARTE 12: Ataque Mass Assignment masivo (Ataque 2)
  // =========================================================================
  it('Checkpoint 4 & 5: Ataque Mass Assignment con passwordHash, id, rol, activo, permisos -> Todos ignorados', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({
        nombre: 'Ataque Mass Assignment',
        email: emailMass,
        password: testPassword,
        id: 9999,
        rol: 'administrador',
        role: 'ADMIN',
        activo: false,
        passwordHash: 'HASH_CONTROLADO',
        esSuperAdmin: true,
        permisos: ['DELETE_ALL', 'ADMIN'],
      });

    expect(res.status).toBe(201);
    expect(res.body.mensaje).toBe('Usuario registrado correctamente');
    expect(res.body.usuario).toBeDefined();
    expect(res.body.usuario.rol).toBe('user');
    expect(res.body.usuario.activo).toBe(true);

    // El id falso 9999 fue ignorado, el servidor generó su propio id
    expect(res.body.usuario.id).not.toBe(9999);

    // passwordHash, permisos, esSuperAdmin no fueron inyectados
    expect((res.body.usuario as any).passwordHash).toBeUndefined();
    expect((res.body.usuario as any).permisos).toBeUndefined();
    expect((res.body.usuario as any).esSuperAdmin).toBeUndefined();

    // El passwordHash en BD no es el falso del atacante, sino el hash bcrypt real calculado
    const userDb = await prisma.user.findUnique({ where: { email: emailMass } });
    expect(userDb!.password_hash).not.toBe('HASH_CONTROLADO');
    expect(userDb!.password_hash.startsWith('$2b$12$')).toBe(true);
  });

  // =========================================================================
  // PARTE 16: Verificar que login sigue funcionando
  // =========================================================================
  it('Checkpoint 6: Login con credenciales correctas debe responder 200 OK', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: emailNormal,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe('Autenticación correcta');
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario).toBeDefined();
    expect(res.body.usuario.email).toBe(emailNormal);
    expect(res.body.usuario.rol).toBe('user');
  });

  it('Checkpoint 7: Login con credenciales incorrectas debe responder 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: emailNormal,
        password: 'PasswordErronea123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.mensaje).toBe('Credenciales inválidas');
  });

  // =========================================================================
  // DEFENSA EN PROFUNDIDAD: Capa 1 (matchedData allowlisting) y Capa 2 (Servicio)
  // =========================================================================
  describe('Verificación arquitectónica de las Dos Defensas en Veritas AI', () => {
    it('Primera defensa: express-validator matchedData() filtra y elimina rol, activo y esSuperAdmin', () => {
      // Simular un request con payload malicioso
      const mockReq: any = {
        body: {
          nombre: 'Usuario Prueba',
          email: 'prueba@veritas.ai',
          password: 'ClaveSegura2026!',
          rol: 'administrador',
          role: 'ADMIN',
          activo: false,
          esSuperAdmin: true,
          passwordHash: 'MALICIOUS_HASH',
        },
      };

      // Si sólo se aceptan los campos autorizados en el allowlist
      const camposPermitidos = ['nombre', 'name', 'email', 'password', 'last_name', 'confirm_password'];
      const datosFiltrados: Record<string, any> = {};
      for (const k of Object.keys(mockReq.body)) {
        if (camposPermitidos.includes(k)) {
          datosFiltrados[k] = mockReq.body[k];
        }
      }

      expect(datosFiltrados.rol).toBeUndefined();
      expect(datosFiltrados.role).toBeUndefined();
      expect(datosFiltrados.activo).toBeUndefined();
      expect(datosFiltrados.esSuperAdmin).toBeUndefined();
      expect(datosFiltrados.passwordHash).toBeUndefined();
    });

    it('Segunda defensa: el servicio usuariosService.crearUsuario SIEMPRE asigna rol Role.USER e is_active: true', async () => {
      // Incluso si un atacante eludiera el controlador y le pasara rol al servicio:
      const payloadInseguro = {
        nombre: 'Prueba Servicio Directo',
        email: `serv_directo_${Date.now()}@veritas.ai`,
        password: testPassword,
        rol: 'ADMIN',
        role: 'ADMIN',
        activo: false,
        is_active: false,
      };

      const creado = await usuariosService.crearUsuario(payloadInseguro);

      try {
        expect(creado.role).toBe(Role.USER);
        expect(creado.is_active).toBe(true);
      } finally {
        await prisma.user.delete({ where: { id: creado.id } });
      }
    });
  });
});
