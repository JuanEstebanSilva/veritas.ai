import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role } from '@prisma/client';
import {
  obtenerConfiguracionJWT,
  generarToken,
  ConfiguracionJwtError,
  LONGITUD_MINIMA_JWT_SECRET,
} from '../src/utils/jwt.util';

/** Lab 9 — Autenticación con JWT. */
describe('Lab 9 · configuración del JWT (fail-fast)', () => {
  const original = { secret: process.env.JWT_SECRET, exp: process.env.JWT_EXPIRES_IN };
  afterEach(() => {
    process.env.JWT_SECRET = original.secret;
    process.env.JWT_EXPIRES_IN = original.exp;
  });

  it('rechaza un JWT_SECRET ausente', () => {
    process.env.JWT_SECRET = '';
    expect(() => obtenerConfiguracionJWT()).toThrow(ConfiguracionJwtError);
  });

  it('rechaza los secretos que estuvieron publicados en el repositorio', () => {
    for (const publicado of [
      'plagelio_super_secret_jwt_token_key_change_in_production_998811',
      'veritas_ai_default_jwt_secret_change_me_123',
      'REEMPLAZAR_CON_SECRETO_JWT_SEGURO',
    ]) {
      process.env.JWT_SECRET = publicado;
      expect(() => obtenerConfiguracionJWT()).toThrow(/publicado/);
    }
  });

  it(`rechaza secretos de menos de ${LONGITUD_MINIMA_JWT_SECRET} caracteres`, () => {
    process.env.JWT_SECRET = 'a'.repeat(LONGITUD_MINIMA_JWT_SECRET - 1);
    expect(() => obtenerConfiguracionJWT()).toThrow(/al menos/);
  });

  it('rechaza una duración inválida y lee un número sin unidad como segundos', () => {
    process.env.JWT_EXPIRES_IN = 'una-hora';
    expect(() => obtenerConfiguracionJWT()).toThrow(/JWT_EXPIRES_IN/);
    process.env.JWT_EXPIRES_IN = '3600';
    expect(obtenerConfiguracionJWT().expiresIn).toBe(3600);
  });
});

describe('Lab 9 · emisión y verificación del token', () => {
  const sufijo = Date.now();
  let user: { id: string; email: string; role: Role };
  let token: string;

  beforeAll(async () => {
    process.env.JWT_EXPIRES_IN = '1h';
    const creado = await prisma.user.create({
      data: {
        name: 'Paciente',
        last_name: 'JWT',
        email: `jwt.${sufijo}@universidad.edu`,
        password_hash: await bcrypt.hash('ClaveSegura2026!', 4),
        role: Role.USER,
      },
    });
    user = { id: creado.id, email: creado.email, role: creado.role };
    token = generarToken(user);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  const perfil = (authorization?: string) => {
    const req = request(app).get('/api/auth/me');
    return authorization === undefined ? req : req.set('Authorization', authorization);
  };
  const firmar = (payload: object, opciones: jwt.SignOptions, secreto = process.env.JWT_SECRET as string) =>
    jwt.sign(payload, secreto, opciones);

  it('el token lleva HS256, sub, email, role, iat y exp (1 h) y nada de contraseñas', () => {
    const { header, payload } = jwt.decode(token, { complete: true }) as jwt.Jwt & { payload: jwt.JwtPayload };
    expect(header.alg).toBe('HS256');
    expect(payload.sub).toBe(user.id);
    expect(payload.email).toBe(user.email);
    expect(payload.role).toBe('USER');
    expect((payload.exp as number) - (payload.iat as number)).toBe(3600);
    expect(Object.keys(payload).sort()).toEqual(['email', 'exp', 'iat', 'role', 'sub']);
  });

  it('login devuelve el token y GET /api/auth/me lo acepta', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'ClaveSegura2026!' });
    expect(login.status).toBe(200);
    const res = await perfil(`Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body).toHaveProperty('client');
  });

  it('GET /api/auth/perfil (alias con el contrato del Hospital) devuelve usuario y clienteApi', async () => {
    const res = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe('Usuario autenticado mediante JWT');
    expect(res.body.usuario).toEqual({ id: user.id, email: user.email, rol: 'user' });
    expect(res.body).toHaveProperty('clienteApi');
  });

  it('sin cabecera → 401 «Token de autenticación requerido»', async () => {
    const res = await perfil();
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/requerido/);
    expect(res.body.mensaje).toBe('Token de autenticación requerido');
  });

  it('formato distinto de «Bearer <token>» → 401 «Formato de token inválido»', async () => {
    for (const valor of [`Basic ${token}`, 'Bearer', `Bearer ${token} extra`, `bearer ${token}`]) {
      const res = await perfil(valor);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Formato/);
    }
  });

  it('token alterado en un carácter → 401 «Token inválido»', async () => {
    const alterado = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A');
    const res = await perfil(`Bearer ${alterado}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token inválido.');
  });

  it('token caducado → 401 «Token expirado»', async () => {
    const ahora = Math.floor(Date.now() / 1000);
    const caducado = firmar(
      { email: user.email, role: 'USER', iat: ahora - 7200, exp: ahora - 3600 },
      { algorithm: 'HS256', subject: user.id }
    );
    const res = await perfil(`Bearer ${caducado}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expirado/);
  });

  it('firmado con otro secreto, con alg:none o con HS512 → 401 (solo se admite HS256 con nuestro secreto)', async () => {
    const otroSecreto = firmar({ email: user.email, role: 'ADMIN' }, { algorithm: 'HS256', subject: user.id }, 'x'.repeat(64));
    const hs512 = firmar({ email: user.email, role: 'USER' }, { algorithm: 'HS512', subject: user.id });
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const sinFirma = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: user.id, email: user.email, role: 'ADMIN' })}.`;
    for (const t of [otroSecreto, hs512, sinFirma]) {
      const res = await perfil(`Bearer ${t}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Token inválido.');
    }
  });

  it('el rol del token no concede privilegios: manda el rol guardado en la base de datos', async () => {
    const conRolAdmin = generarToken({ ...user, role: 'ADMIN' });
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${conRolAdmin}`);
    expect(res.status).toBe(403);
  });

  it('un token válido de una cuenta desactivada deja de servir al instante → 403', async () => {
    await prisma.user.update({ where: { id: user.id }, data: { is_active: false } });
    const res = await perfil(`Bearer ${token}`);
    expect(res.status).toBe(403);
    await prisma.user.update({ where: { id: user.id }, data: { is_active: true } });
  });
});
