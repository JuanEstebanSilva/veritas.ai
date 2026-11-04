import request from 'supertest';
import app from '../src/app';
import usuariosService from '../src/services/usuarios.service';

const apiKey = '61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0';

describe('Bloque 11 — Veritas AI: Actualización Progresiva de API Segura (25 Pruebas)', () => {
  let tokenAdmin = '';
  let tokenAdminOriginal = '';
  let tokenEstudiante = '';
  let estudianteId = 2;
  let tokenRecuperacion = '';
  let codigosRespaldo: string[] = [];
  const timestamp = Date.now();
  const testEstudianteEmail = `estudiante.bloque11.${timestamp}@veritas.ai`;
  let claveActualEstudiante = 'Password123*';

  beforeAll(async () => {
    // Inicializar administrador y usuarios de laboratorio
    await usuariosService.crearAdministradorInicial();

    // Registrar estudiante de prueba para las operaciones del laboratorio
    const regRes = await request(app)
      .post('/api/auth/registro')
      .set('X-API-Key', apiKey)
      .send({
        nombre: `Estudiante Bloque 11 ${timestamp}`,
        email: testEstudianteEmail,
        password: claveActualEstudiante,
      });

    if (regRes.body?.usuario?.id || regRes.body?.user?.id) {
      estudianteId = regRes.body?.usuario?.id || regRes.body?.user?.id;
    }
  });

  // ==========================================================================
  // PRUEBAS 1 A 7: Autenticación, Versión de Sesión y Cambio de Contraseña Propia
  // ==========================================================================
  describe('Paso 8: 1 a 7 — Login, JWT y Cambio de Contraseña con version_sesion', () => {
    it('1. Login válido POST /api/auth/login debe responder 200 OK y devolver JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEstudianteEmail,
          password: claveActualEstudiante,
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      tokenEstudiante = res.body.token;

      // Obtener también token de Administrador para pruebas administrativas posteriores
      const adminRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@veritas.ai',
          password: 'SANTOTO_2026--2',
        });
      if (adminRes.status === 200) {
        tokenAdmin = adminRes.body.token;
        tokenAdminOriginal = adminRes.body.token;
      }
    });

    it('2. Login con JSON o cuerpo inválido debe responder 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'correo-no-valido',
          password: '',
        });

      expect(res.status).toBe(400);
    });

    it('3. Perfil o recurso protegido GET /api/auth/perfil sin JWT debe responder 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/auth/perfil');

      expect(res.status).toBe(401);
      expect(res.body.mensaje || res.body.message).toMatch(/Token de autenticación requerido/i);
    });

    it('4. Cambio de contraseña con contraseña actual correcta debe responder 200 OK e incrementar version_sesion', async () => {
      const nuevaClave = 'NuevaClaveSegura2026!';
      const res = await request(app)
        .patch('/api/auth/cambiar-password')
        .set('Authorization', `Bearer ${tokenEstudiante}`)
        .send({
          passwordActual: claveActualEstudiante,
          passwordNueva: nuevaClave,
          confirmarPassword: nuevaClave,
        });

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toMatch(/Contraseña actualizada/i);
      claveActualEstudiante = nuevaClave;
    });

    it('5. Intento de usar JWT anterior debe responder 401 Unauthorized (Sesión revocada)', async () => {
      const res = await request(app)
        .get('/api/auth/perfil')
        .set('Authorization', `Bearer ${tokenEstudiante}`);

      expect(res.status).toBe(401);
      expect(res.body.mensaje || res.body.message).toMatch(/Sesión revocada/i);
    });

    it('6. Login con contraseña nueva debe responder 200 OK y emitir nuevo JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEstudianteEmail,
          password: claveActualEstudiante,
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      tokenEstudiante = res.body.token; // Nuevo token válido con version_sesion actualizada
    });

    it('7. Cambio de contraseña con contraseña actual incorrecta debe responder 401 Unauthorized sin alterar datos', async () => {
      const res = await request(app)
        .patch('/api/auth/cambiar-password')
        .set('Authorization', `Bearer ${tokenEstudiante}`)
        .send({
          passwordActual: 'ClaveCompletamenteErronea999*',
          passwordNueva: 'OtraClaveCualquiera2026!',
          confirmarPassword: 'OtraClaveCualquiera2026!',
        });

      expect(res.status).toBe(401);
      expect(res.body.mensaje || res.body.message).toMatch(/Contraseña actual inválida/i);
    });
  });

  // ==========================================================================
  // PRUEBAS 8 A 11: Recuperación Administrativa y Control RBAC
  // ==========================================================================
  describe('Paso 8: 8 a 11 — Recuperación Administrativa y Restablecimiento con Token', () => {
    it('8. Administrador genera recuperación para una cuenta de prueba: debe responder 201 Created y emitir token temporal', async () => {
      const res = await request(app)
        .post(`/api/auth/recuperacion/admin/${estudianteId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.token.length).toBe(64);
      tokenRecuperacion = res.body.token;
    });

    it('9. Restablecimiento mediante token válido debe responder 200 OK y marcar token como consumido', async () => {
      const claveDesdeToken = 'ClaveRestablecidaToken2026!';
      const res = await request(app)
        .post('/api/auth/restablecer-password')
        .set('X-API-Key', apiKey)
        .send({
          token: tokenRecuperacion,
          passwordNueva: claveDesdeToken,
          confirmarPassword: claveDesdeToken,
        });

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toMatch(/Contraseña restablecida/i);
      claveActualEstudiante = claveDesdeToken;
    });

    it('10. Reutilización o vencimiento del token debe responder 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/restablecer-password')
        .set('X-API-Key', apiKey)
        .send({
          token: tokenRecuperacion, // Ya fue consumido
          passwordNueva: 'IntentoReutilizacion2026!',
          confirmarPassword: 'IntentoReutilizacion2026!',
        });

      expect(res.status).toBe(400);
      expect(res.body.mensaje || res.body.message).toMatch(/Token inválido, utilizado o expirado/i);
    });

    it('11. Usuario no administrador (estudiante) intenta generar recuperación administrativa: debe responder 403 Forbidden (RBAC)', async () => {
      // Iniciar sesión con la clave nueva del estudiante para tener JWT fresco
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEstudianteEmail,
          password: claveActualEstudiante,
        });
      tokenEstudiante = loginRes.body.token;

      const res = await request(app)
        .post(`/api/auth/recuperacion/admin/${estudianteId}`)
        .set('Authorization', `Bearer ${tokenEstudiante}`);

      expect(res.status).toBe(403);
    });
  });

  // ==========================================================================
  // PRUEBAS 12 A 16: Códigos de Recuperación de Respaldo de Un Solo Uso
  // ==========================================================================
  describe('Paso 8: 12 a 16 — Códigos de Respaldo de Un Solo Uso', () => {
    it('12. Usuario autenticado genera ocho códigos de respaldo: debe responder 201 Created y retornar 8 códigos', async () => {
      const res = await request(app)
        .post('/api/auth/codigos-recuperacion')
        .set('Authorization', `Bearer ${tokenEstudiante}`)
        .send({
          passwordActual: claveActualEstudiante,
        });

      expect(res.status).toBe(201);
      expect(Array.isArray(res.body.codigos)).toBe(true);
      expect(res.body.codigos.length).toBe(8);
      codigosRespaldo = res.body.codigos;
    });

    it('13. Consulta de estado de códigos de respaldo debe responder 200 OK y saldo 8', async () => {
      const res = await request(app)
        .get('/api/auth/codigos-recuperacion/estado')
        .set('Authorization', `Bearer ${tokenEstudiante}`);

      expect(res.status).toBe(200);
      expect(res.body.disponibles).toBe(8);
    });

    it('14. Regeneración de códigos debe responder 201 Created e invalidar los anteriores', async () => {
      const primerCodigoAntiguo = codigosRespaldo[0];

      const res = await request(app)
        .post('/api/auth/codigos-recuperacion/regenerar')
        .set('Authorization', `Bearer ${tokenEstudiante}`)
        .send({
          passwordActual: claveActualEstudiante,
        });

      expect(res.status).toBe(201);
      expect(res.body.codigos.length).toBe(8);
      // El lote nuevo reemplaza al anterior
      codigosRespaldo = res.body.codigos;

      // Intentar usar un código del lote anterior debe fallar
      const falloAntiguo = await request(app)
        .post('/api/auth/restablecer-con-codigo')
        .set('X-API-Key', apiKey)
        .send({
          email: testEstudianteEmail,
          codigo: primerCodigoAntiguo,
          passwordNueva: 'ClaveFalloAntiguo2026!',
          confirmarPassword: 'ClaveFalloAntiguo2026!',
        });

      expect(falloAntiguo.status).toBe(400);
    });

    it('15. Restablecimiento con un código válido debe responder 200 OK y consumirlo', async () => {
      const codigoAConsumir = codigosRespaldo[0];
      const nuevaClaveCodigo = 'ClaveDesdeCodigoRespaldo2026!';

      const res = await request(app)
        .post('/api/auth/restablecer-con-codigo')
        .set('X-API-Key', apiKey)
        .send({
          email: testEstudianteEmail,
          codigo: codigoAConsumir,
          passwordNueva: nuevaClaveCodigo,
          confirmarPassword: nuevaClaveCodigo,
        });

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toMatch(/Contraseña restablecida/i);
      claveActualEstudiante = nuevaClaveCodigo;
    });

    it('16. Reutilización de un código ya consumido debe responder 400 Bad Request', async () => {
      const codigoYaConsumido = codigosRespaldo[0];

      const res = await request(app)
        .post('/api/auth/restablecer-con-codigo')
        .set('X-API-Key', apiKey)
        .send({
          email: testEstudianteEmail,
          codigo: codigoYaConsumido,
          passwordNueva: 'OtraClaveIntentoReuso2026!',
          confirmarPassword: 'OtraClaveIntentoReuso2026!',
        });

      expect(res.status).toBe(400);
      expect(res.body.mensaje || res.body.message).toMatch(/Código o cuenta inválidos/i);
    });
  });

  // ==========================================================================
  // PRUEBAS 17 A 19: Revisiones Académicas, BOLA/IDOR y Restricción RBAC
  // ==========================================================================
  describe('Paso 8: 17 a 19 — Revisiones Éticas y Defensa BOLA / IDOR', () => {
    it('17. Estudiante consulta /api/revisiones/mis-revisiones con JWT debe responder 200 OK', async () => {
      // Login fresco con contraseña actualizada
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEstudianteEmail,
          password: claveActualEstudiante,
        });
      tokenEstudiante = loginRes.body.token;

      const res = await request(app)
        .get('/api/revisiones/mis-revisiones')
        .set('Authorization', `Bearer ${tokenEstudiante}`);

      expect(res.status).toBe(200);
    });

    it('18. Estudiante consulta revisión de otro autor/estudiante debe responder 403 Forbidden (BOLA / IDOR)', async () => {
      // Suponiendo revisión ID 1 pertenece a otro autor o auditor
      const res = await request(app)
        .get('/api/revisiones/1')
        .set('Authorization', `Bearer ${tokenEstudiante}`);

      expect(res.status).toBe(403);
    });

    it('19. Estudiante intenta GET /api/revisiones global administrativo debe responder 403 Forbidden (RBAC)', async () => {
      const res = await request(app)
        .get('/api/revisiones')
        .set('Authorization', `Bearer ${tokenEstudiante}`);

      expect(res.status).toBe(403);
    });
  });

  // ==========================================================================
  // PRUEBAS 20 A 25: Desacoplamiento de API Key, Recursos JWT y Swagger
  // ==========================================================================
  describe('Paso 8: 20 a 25 — API Key Privada, Recursos JWT sin API Key y OpenAPI Swagger', () => {
    it('20. GET /api/seguridad/cliente sin API Key debe responder 401 Unauthorized (API Key requerida)', async () => {
      const res = await request(app)
        .get('/api/seguridad/cliente');

      expect(res.status).toBe(401);
      expect(res.body.mensaje || res.body.message).toMatch(/API Key requerida/i);
    });

    it('21. GET /api/seguridad/cliente con API Key válida debe responder 200 OK', async () => {
      const res = await request(app)
        .get('/api/seguridad/cliente')
        .set('X-API-Key', apiKey);

      expect(res.status).toBe(200);
      expect(res.body.cliente || res.body.client).toBeDefined();
    });

    it('22. Login sin API Key y con cuerpo inválido debe responder 400 Bad Request (no "API Key requerida")', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalido' }); // sin cabecera X-API-Key y cuerpo inválido

      expect(res.status).toBe(400);
      expect(res.body.mensaje || res.body.message).not.toMatch(/API Key requerida/i);
    });

    it('23. mis-revisiones sin JWT y sin API Key debe responder 401 Unauthorized (Token requerido)', async () => {
      const res = await request(app)
        .get('/api/revisiones/mis-revisiones');

      expect(res.status).toBe(401);
      expect(res.body.mensaje || res.body.message).toMatch(/Token de autenticación requerido/i);
    });

    it('24. mis-revisiones con JWT y sin API Key debe responder 200 OK (Recurso desacoplado)', async () => {
      const res = await request(app)
        .get('/api/revisiones/mis-revisiones')
        .set('Authorization', `Bearer ${tokenEstudiante}`); // Sin cabecera X-API-Key

      expect(res.status).toBe(200);
    });

    it('25. OpenAPI / Swagger expone especificación con seguridad explícita (OpenAPI 3.0.3)', async () => {
      const res = await request(app)
        .get('/openapi.json');

      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.components.securitySchemes.ApiKeyAuth).toBeDefined();
      expect(res.body.components.securitySchemes.BearerAuth).toBeDefined();
      expect(res.body.paths['/api/auth/login']).toBeDefined();
      expect(res.body.paths['/api/auth/cambiar-password']).toBeDefined();
      expect(res.body.paths['/api/auth/recuperacion/admin/{usuarioId}']).toBeDefined();
      expect(res.body.paths['/api/auth/restablecer-password']).toBeDefined();
      expect(res.body.paths['/api/auth/codigos-recuperacion']).toBeDefined();
      expect(res.body.paths['/api/auth/restablecer-con-codigo']).toBeDefined();
    });
  });

  // ==========================================================================
  // PASO 10: Verificación de Preflight CORS (OPTIONS)
  // ==========================================================================
  describe('Paso 10: Comprobación de Preflight CORS para React + Vite', () => {
    it('Preflight OPTIONS /api/auth/login desde http://localhost:5173 debe responder 204 No Content', async () => {
      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type');

      expect([200, 204]).toContain(res.status);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
  });
});

