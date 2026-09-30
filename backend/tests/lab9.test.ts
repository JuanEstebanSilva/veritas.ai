import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import {
  obtenerConfiguracionJWT,
  generarToken,
  verificarToken,
} from '../src/utils/jwt.util';
import autenticarJWT from '../src/middlewares/auth.middleware';
import { swaggerSpec } from '../src/docs/swagger';
import { Request, Response, NextFunction } from 'express';

/**
 * Laboratorio No. 9 — Construcción del proyecto — Autenticación con JWT
 * Veritas AI — SUITE DE PRUEBAS COMPLETA (BLOQUE 5: Login + JWT)
 *
 * Implementa y verifica:
 * - Emisión de JWT con claims mínimas seguras (sub, email, rol, iat, exp).
 * - Restricción explícita de algoritmo HS256 tanto en firma como en verificación.
 * - Endpoint protegido /api/auth/perfil con coexistencia de X-API-Key y Bearer JWT.
 * - Manejo robusto de errores de token: ausente, malformado, alterado y expirado.
 * - Especificación OpenAPI/Swagger con ApiKeyAuth y BearerAuth.
 * - Pruebas con dominios y usuarios propios del proyecto (@veritas.ai).
 */
describe('Laboratorio No. 9 — Autenticación con JWT (Veritas AI)', () => {
  const timestamp = Date.now();
  const testPassword = 'ClaveSegura2026!';
  const emailEstudiante = `estudiante_${timestamp}@veritas.ai`;
  const emailInactivo = `inactivo_${timestamp}@veritas.ai`;
  let tokenEstudiante: string;
  let idEstudiante: string;

  beforeAll(async () => {
    // Asegurar que el entorno de prueba tenga el secreto JWT configurado
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'veritas_ai_super_secret_jwt_token_key_change_in_production_998811';
    }
    if (!process.env.JWT_EXPIRES_IN) {
      process.env.JWT_EXPIRES_IN = '1h';
    }
  });

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
  // BLOQUE 1: Utilidad jwt.util.ts (Partes 4, 5 y 6)
  // =========================================================================
  describe('PARTE 4, 5 y 6 — Utilidad jwt.util (Configuración, HS256 y Claims)', () => {
    it('Checkpoint 1: obtenerConfiguracionJWT debe leer variables y lanzar error si JWT_SECRET no existe', () => {
      const config = obtenerConfiguracionJWT();
      expect(config.secret).toBeDefined();
      expect(config.expiresIn).toBeDefined();

      const secretOriginal = process.env.JWT_SECRET;
      try {
        delete process.env.JWT_SECRET;
        expect(() => obtenerConfiguracionJWT()).toThrow('JWT_SECRET no está configurado');
      } finally {
        process.env.JWT_SECRET = secretOriginal;
      }
    });

    it('Checkpoint 2: generarToken debe emitir un JWT firmado con HS256, subject (sub), email y rol', () => {
      const mockUsuario = {
        id: 'usr_veritas_123',
        email: 'investigador@veritas.ai',
        rol: 'user',
      };

      const token = generarToken(mockUsuario);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      // Decodificar encabezado (Header)
      const headerB64 = token.split('.')[0];
      const header = JSON.parse(Buffer.from(headerB64, 'base64').toString('utf8'));
      expect(header.alg).toBe('HS256');
      expect(header.typ).toBe('JWT');

      // Decodificar Payload
      const payloadB64 = token.split('.')[1];
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
      expect(payload.sub).toBe('usr_veritas_123');
      expect(payload.email).toBe('investigador@veritas.ai');
      expect(payload.rol).toBe('user');
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
      expect(payload.password).toBeUndefined();
      expect(payload.passwordHash).toBeUndefined();
    });

    it('Checkpoint 3: verificarToken debe verificar la firma con HS256 y retornar el payload', () => {
      const mockUsuario = {
        id: '42',
        email: 'estudiante@veritas.ai',
        rol: 'user',
      };

      const token = generarToken(mockUsuario);
      const decoded = verificarToken(token);

      expect(decoded.sub).toBe('42');
      expect(decoded.email).toBe('estudiante@veritas.ai');
      expect(decoded.rol).toBe('user');
    });

    it('Checkpoint 4: verificarToken debe rechazar tokens con algoritmos no autorizados (ej. "none")', () => {
      // Intento de ataque por omisión de algoritmo ("none")
      const headerNone = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(
        JSON.stringify({ sub: 'admin', email: 'admin@veritas.ai', rol: 'admin' })
      ).toString('base64');
      const unsignedToken = `${headerNone}.${payload}.`;

      expect(() => verificarToken(unsignedToken)).toThrow();
    });
  });

  // =========================================================================
  // BLOQUE 2: Flujo de Registro y Login con JWT (Partes 7, 14 y 15)
  // =========================================================================
  describe('PARTE 7, 14 y 15 — Registro y Login con emisión de JWT', () => {
    it('Checkpoint 5: POST /api/auth/registro debe crear usuario en Veritas AI y devolver respuesta estándar', async () => {
      const res = await request(app)
        .post('/api/auth/registro')
        .send({
          nombre: 'Estudiante Veritas',
          email: emailEstudiante,
          password: testPassword,
        });

      expect(res.status).toBe(201);
      expect(res.body.mensaje).toBe('Usuario registrado correctamente');
      expect(res.body.usuario).toBeDefined();
      expect(res.body.usuario.email).toBe(emailEstudiante);
      expect(res.body.usuario.rol).toBe('user');
      expect(res.body.usuario.activo).toBe(true);
      expect(res.body.token).toBeDefined();

      idEstudiante = res.body.usuario.id;
    });

    it('Checkpoint 6: POST /api/auth/login con credenciales correctas debe responder 200 OK y devolver token JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: emailEstudiante,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toBe('Autenticación correcta');
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
      expect(res.body.usuario).toBeDefined();
      expect(res.body.usuario.email).toBe(emailEstudiante);
      expect(res.body.usuario.rol).toBe('user');

      tokenEstudiante = res.body.token;

      // El token devuelto por login debe ser verificable con nuestra utilidad
      const payload = verificarToken(tokenEstudiante);
      expect(payload.email).toBe(emailEstudiante);
      expect(payload.sub).toBe(String(idEstudiante));
      expect(payload.rol).toBe('user');
    });

    it('Checkpoint 7: POST /api/auth/login con contraseña incorrecta debe responder 401 "Credenciales inválidas"', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: emailEstudiante,
          password: 'PasswordIncorrecta999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.mensaje).toBe('Credenciales inválidas');
      expect(res.body.token).toBeUndefined();
    });

    it('Checkpoint 8: POST /api/auth/login con cuenta deshabilitada debe responder 403 "Usuario deshabilitado"', async () => {
      // Registrar y desactivar usuario
      const reg = await request(app)
        .post('/api/auth/registro')
        .send({
          nombre: 'Usuario Inactivo',
          email: emailInactivo,
          password: testPassword,
        });

      await prisma.user.update({
        where: { email: emailInactivo },
        data: { is_active: false },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: emailInactivo,
          password: testPassword,
        });

      expect(res.status).toBe(403);
      expect(res.body.mensaje).toBe('Usuario deshabilitado');
      expect(res.body.token).toBeUndefined();
    });
  });

  // =========================================================================
  // BLOQUE 3: Middleware autenticarJWT y Endpoint GET /api/auth/perfil
  // (Partes 8, 9, 17, 18, 19, 21)
  // =========================================================================
  describe('PARTE 8, 9, 17, 18, 19, 21 — Middleware autenticarJWT y Endpoint /perfil', () => {
    it('Checkpoint 9: GET /api/auth/perfil con Bearer JWT válido debe responder 200 y exponer req.usuario', async () => {
      const res = await request(app)
        .get('/api/auth/perfil')
        .set('Authorization', `Bearer ${tokenEstudiante}`);

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toBe('Usuario autenticado mediante JWT');
      expect(res.body.usuario).toBeDefined();
      expect(res.body.usuario.email).toBe(emailEstudiante);
      expect(res.body.usuario.rol).toBe('user');
    });

    it('Checkpoint 10: GET /api/auth/perfil sin cabecera Authorization debe responder 401 "Token de autenticación requerido"', async () => {
      const res = await request(app).get('/api/auth/perfil');

      expect(res.status).toBe(401);
      expect(res.body.mensaje).toBe('Token de autenticación requerido');
    });

    it('Checkpoint 11: GET /api/auth/perfil con formato no Bearer debe responder 401 "Formato de token inválido"', async () => {
      const res = await request(app)
        .get('/api/auth/perfil')
        .set('Authorization', `Basic ${tokenEstudiante}`);

      expect(res.status).toBe(401);
      expect(res.body.mensaje).toBe('Formato de token inválido');

      const resSinEspacio = await request(app)
        .get('/api/auth/perfil')
        .set('Authorization', 'SoloTokenSinBearer');

      expect(resSinEspacio.status).toBe(401);
      expect(resSinEspacio.body.mensaje).toBe('Formato de token inválido');
    });

    it('Checkpoint 12: GET /api/auth/perfil con JWT alterado (firma manipulada) debe responder 401 "Token inválido"', async () => {
      // Tomamos el token válido y modificamos los últimos caracteres de la firma
      const partes = tokenEstudiante.split('.');
      const firmaAlterada = partes[2].slice(0, -3) + 'XYZ';
      const tokenManipulado = `${partes[0]}.${partes[1]}.${firmaAlterada}`;

      const res = await request(app)
        .get('/api/auth/perfil')
        .set('Authorization', `Bearer ${tokenManipulado}`);

      expect(res.status).toBe(401);
      expect(res.body.mensaje).toBe('Token inválido');
    });

    it('Checkpoint 13: GET /api/auth/perfil con JWT expirado debe responder 401 "Token expirado"', async () => {
      // Crear un token expirado intencionalmente (-10 segundos)
      const tokenExpirado = jwt.sign(
        { email: emailEstudiante, rol: 'user' },
        process.env.JWT_SECRET || 'secret',
        {
          algorithm: 'HS256',
          subject: String(idEstudiante),
          expiresIn: '-10s',
        }
      );

      const res = await request(app)
        .get('/api/auth/perfil')
        .set('Authorization', `Bearer ${tokenExpirado}`);

      expect(res.status).toBe(401);
      expect(res.body.mensaje).toBe('Token expirado');
    });
  });

  // =========================================================================
  // BLOQUE 4: Experimento: decodificar != verificar (Parte 20)
  // =========================================================================
  describe('PARTE 20 — Experimento: decodificar != verificar', () => {
    it('Checkpoint 14: jwt.decode() lee contenido sin comprobar firma ni autenticidad; verificarToken() exige firma válida', () => {
      const mockUsuario = {
        id: '99',
        email: 'observador@veritas.ai',
        rol: 'user',
      };

      const tokenReal = generarToken(mockUsuario);

      // 1. jwt.decode() lee el contenido sin necesidad del secreto
      const decodificado = jwt.decode(tokenReal) as any;
      expect(decodificado).not.toBeNull();
      expect(decodificado.email).toBe('observador@veritas.ai');
      expect(decodificado.rol).toBe('user');
      expect(decodificado.sub).toBe('99');

      // 2. Si un atacante altera el payload sin conocer el secreto:
      const partes = tokenReal.split('.');
      const payloadFalso = Buffer.from(
        JSON.stringify({ email: 'observador@veritas.ai', rol: 'ADMIN', sub: '99' })
      ).toString('base64url');
      const tokenFalso = `${partes[0]}.${payloadFalso}.${partes[2]}`;

      // jwt.decode() lo lee ingenuamente (no prueba autenticidad):
      const decodificadoFalso = jwt.decode(tokenFalso) as any;
      expect(decodificadoFalso.rol).toBe('ADMIN');

      // Mientras que verificarToken() detecta la manipulación y rechaza:
      expect(() => verificarToken(tokenFalso)).toThrow();
    });
  });

  // =========================================================================
  // BLOQUE 5: Swagger OpenAPI (Partes 10, 11 y 12)
  // =========================================================================
  describe('PARTE 10, 11 y 12 — Documentación OpenAPI y Esquemas de Seguridad', () => {
    it('Checkpoint 15: Swagger debe declarar esquemas ApiKeyAuth y BearerAuth con formato JWT', () => {
      const schemes = (swaggerSpec as any).components?.securitySchemes;
      expect(schemes).toBeDefined();

      // ApiKeyAuth
      expect(schemes.ApiKeyAuth).toBeDefined();
      expect(schemes.ApiKeyAuth.type).toBe('apiKey');
      expect(schemes.ApiKeyAuth.in).toBe('header');
      expect(schemes.ApiKeyAuth.name).toBe('X-API-Key');

      // BearerAuth
      expect(schemes.BearerAuth).toBeDefined();
      expect(schemes.BearerAuth.type).toBe('http');
      expect(schemes.BearerAuth.scheme).toBe('bearer');
      expect(schemes.BearerAuth.bearerFormat).toBe('JWT');
    });

    it('Checkpoint 16: Swagger debe declarar seguridad global con ApiKeyAuth', () => {
      const globalSecurity = (swaggerSpec as any).security;
      expect(globalSecurity).toBeDefined();
      expect(Array.isArray(globalSecurity)).toBe(true);

      const hasApiKey = globalSecurity.some((s: any) => 'ApiKeyAuth' in s);
      expect(hasApiKey).toBe(true);
    });

    it('Checkpoint 17: Ruta /api/auth/perfil debe exigir ApiKeyAuth Y BearerAuth en la misma regla', () => {
      const perfilPath = (swaggerSpec as any).paths?.['/api/auth/perfil'];
      expect(perfilPath).toBeDefined();
      expect(perfilPath.get).toBeDefined();

      const security = perfilPath.get.security;
      expect(security).toBeDefined();
      expect(Array.isArray(security)).toBe(true);

      // En OpenAPI, exigir ambos significa que están dentro del mismo objeto
      const combinedRule = security.find(
        (s: any) => 'ApiKeyAuth' in s && 'BearerAuth' in s
      );
      expect(combinedRule).toBeDefined();
    });
  });
});
