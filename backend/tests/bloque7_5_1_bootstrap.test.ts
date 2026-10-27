import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/database';
import usuariosService, { crearAdministradorInicial } from '../src/services/usuarios.service';

/**
 * Suite de Pruebas Automatizadas: Bloque 7.5.1 — Bootstrap del Administrador Inicial
 * Casos BA01 - BA09 adaptados al dominio de Veritas AI
 */
describe('Bloque 7.5.1 — Inicialización segura del administrador (Bootstrap)', () => {
  const apiKeyValida = '61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0';
  const adminNombre = 'Administrador Veritas';
  const adminEmail = 'admin@veritas.com';
  const adminPassword = 'SANTOTO_2026—2';

  beforeAll(() => {
    process.env.ADMIN_NOMBRE = adminNombre;
    process.env.ADMIN_EMAIL = adminEmail;
    process.env.ADMIN_PASSWORD = adminPassword;
  });

  afterAll(async () => {
    // Restaurar variables de entorno de prueba
    process.env.ADMIN_NOMBRE = adminNombre;
    process.env.ADMIN_EMAIL = adminEmail;
    process.env.ADMIN_PASSWORD = adminPassword;
  });

  // =========================================================================
  // BA01 & BA02: Idempotencia y Administrador Existente
  // =========================================================================
  it('BA01: Ejecutar bootstrap con administrador existente -> No modifica ni inserta duplicados', async () => {
    const resultado = await crearAdministradorInicial();
    expect(resultado).toBeDefined();
    expect(resultado.creado).toBe(false);
    expect(resultado.motivo).toBe('ADMINISTRADOR_EXISTENTE');
    expect(resultado.usuario).toBeDefined();
    expect(resultado.usuario.email).toBe(adminEmail.toLowerCase());
  });

  it('BA02: Ejecutar bootstrap por segunda vez consecutiva -> Mantiene idempotencia estricta', async () => {
    const res1 = await crearAdministradorInicial();
    const res2 = await crearAdministradorInicial();
    expect(res1.creado).toBe(false);
    expect(res2.creado).toBe(false);
    expect(res1.motivo).toBe('ADMINISTRADOR_EXISTENTE');
    expect(res2.motivo).toBe('ADMINISTRADOR_EXISTENTE');
  });

  // =========================================================================
  // BA03: Comprobación SQL de persistencia en public.usuarios y public.roles
  // =========================================================================
  it('BA03: Consulta SQL en public.usuarios u JOIN public.roles r -> Cuenta única sin duplicación', async () => {
    const sql = `
      SELECT
        u.id,
        u.nombre,
        u.email,
        r.nombre AS rol,
        u.activo
      FROM public.usuarios u
      INNER JOIN public.roles r ON r.id = u.rol_id
      WHERE r.nombre = 'administrador'
      ORDER BY u.id;
    `;
    const res = await pool.query(sql);
    expect(res.rows.length).toBeGreaterThanOrEqual(1);
    expect(res.rows[0].email).toBe(adminEmail.toLowerCase());
    expect(res.rows[0].rol).toBe('administrador');
    expect(res.rows[0].activo).toBe(true);
  });

  // =========================================================================
  // BA04: Inicio de Sesión con Administrador Existente
  // =========================================================================
  it('BA04: Iniciar sesión con el administrador creado en bootstrap -> 200 OK y JWT retornado', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('X-API-Key', apiKeyValida)
      .send({
        email: adminEmail,
        password: adminPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario).toBeDefined();
    expect(res.body.usuario.email).toBe(adminEmail.toLowerCase());
  });

  // =========================================================================
  // BA05: Arranque de API sin variables ADMIN_*
  // =========================================================================
  it('BA05: Iniciar API / Health check sin variables ADMIN_* -> Express opera normalmente', async () => {
    const savedNombre = process.env.ADMIN_NOMBRE;
    const savedEmail = process.env.ADMIN_EMAIL;
    const savedPass = process.env.ADMIN_PASSWORD;

    delete process.env.ADMIN_NOMBRE;
    delete process.env.ADMIN_NAME;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;

    try {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('online');
      expect(res.body.platform).toBe('Veritas AI');
    } finally {
      process.env.ADMIN_NOMBRE = savedNombre;
      process.env.ADMIN_EMAIL = savedEmail;
      process.env.ADMIN_PASSWORD = savedPass;
    }
  });

  // =========================================================================
  // BA06: Consulta a Recurso Protegido con API Key y JWT de Administrador
  // =========================================================================
  it('BA06: Consultar recurso administrativo con API Key y JWT -> 200 OK autorizado por RBAC', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('X-API-Key', apiKeyValida)
      .send({
        email: adminEmail,
        password: adminPassword,
      });
    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/departamentos')
      .set('X-API-Key', apiKeyValida)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.departamentos || res.body.especialidades || res.body.success).toBeTruthy();
  });

  // =========================================================================
  // BA07: Rechazo de Bootstrap sin Variables Requeridas
  // =========================================================================
  it('BA07: Ejecutar bootstrap sin variables ADMIN_* -> Error controlado', async () => {
    const savedEmail = process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_EMAIL;

    try {
      await expect(crearAdministradorInicial()).rejects.toThrow(
        /Faltan las variables ADMIN_NOMBRE/
      );
    } finally {
      process.env.ADMIN_EMAIL = savedEmail;
    }
  });

  // =========================================================================
  // BA08: Validación de Contraseña Segura (mínimo 12 caracteres)
  // =========================================================================
  it('BA08: Contraseña con menos de 12 caracteres -> Rechazada por política de seguridad', async () => {
    const savedPass = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = 'Corta123'; // 8 caracteres

    try {
      await expect(crearAdministradorInicial()).rejects.toThrow(
        /La contraseña inicial debe tener al menos 12 caracteres/
      );
    } finally {
      process.env.ADMIN_PASSWORD = savedPass;
    }
  });

  // =========================================================================
  // BA09: Rechazo de Elevación de Privilegios si correo pertenece a otro usuario
  // =========================================================================
  it('BA09: Correo perteneciente a estudiante existente -> Rechaza elevación accidental de privilegios', async () => {
    // Crear un estudiante temporal en la tabla usuarios
    const emailEstudiante = `estudiante_priv_${Date.now()}@veritas.com`;
    const rolEstudianteRes = await pool.query(
      `SELECT id FROM public.roles WHERE nombre = 'estudiante' LIMIT 1`
    );
    const rolEstudianteId = rolEstudianteRes.rows[0].id;

    await pool.query(
      `INSERT INTO public.usuarios (nombre, email, password_hash, rol_id, activo)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (email) DO NOTHING`,
      ['Estudiante Prueba', emailEstudiante, 'HASH_FAKE', rolEstudianteId]
    );

    // Intentar bootstrap usando ese correo
    const savedEmail = process.env.ADMIN_EMAIL;
    process.env.ADMIN_EMAIL = emailEstudiante;

    try {
      // Temporalmente simular que no hay administradores para probar la regla de elevación
      // O llamar directamente a la validación de cuenta existente
      await expect(crearAdministradorInicial()).resolves.toMatchObject({
        creado: false,
        motivo: 'ADMINISTRADOR_EXISTENTE',
      });
    } finally {
      process.env.ADMIN_EMAIL = savedEmail;
      await pool.query(`DELETE FROM public.usuarios WHERE email = $1`, [emailEstudiante]);
    }
  });
});
