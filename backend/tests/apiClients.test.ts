import { Request, Response, NextFunction } from 'express';
import { prisma } from '../src/config/prisma';
import { generarHash, compararSeguro } from '../src/utils/hash.util';
import { buscarClientePorApiKey } from '../src/services/apiClients.service';
import { validarApiKey } from '../src/middleware/apiKeyMiddleware';

/**
 * Lab 6 — Múltiples clientes con API Keys almacenadas como hash.
 *
 * Se prueba la capa real (validarApiKey), no el envoltorio que la omite en el
 * entorno de pruebas. Los clientes se crean con claves propias del test, así
 * que no dependen del .env de nadie.
 */
describe('6. API Keys por cliente almacenadas como hash SHA-256', () => {
  const CLAVE_ACTIVA = 'test-lab6-clave-activa-0123456789abcdef0123456789';
  const CLAVE_INACTIVA = 'test-lab6-clave-inactiva-0123456789abcdef012345678';
  const nombres = ['Test Lab6 Activo', 'Test Lab6 Inactivo'];
  let idActivo = 0;

  beforeAll(async () => {
    await prisma.apiClient.deleteMany({ where: { name: { in: nombres } } });
    const activo = await prisma.apiClient.create({
      data: { name: nombres[0], key_hash: generarHash(CLAVE_ACTIVA), is_active: true },
    });
    await prisma.apiClient.create({
      data: { name: nombres[1], key_hash: generarHash(CLAVE_INACTIVA), is_active: false },
    });
    idActivo = activo.id;
  });

  afterAll(async () => {
    await prisma.apiClient.deleteMany({ where: { name: { in: nombres } } });
    await prisma.$disconnect();
  });

  /** Ejecuta el middleware con una petición simulada y devuelve qué hizo. */
  const ejecutar = async (apiKey?: string) => {
    const req = {
      originalUrl: '/api/users',
      url: '/api/users',
      get: (h: string) => (h.toLowerCase() === 'x-api-key' ? apiKey : undefined),
    } as unknown as Request;
    let status = 0;
    let body: any = null;
    const res = {
      status(code: number) { status = code; return this; },
      json(data: any) { body = data; return this; },
    } as unknown as Response;
    let siguio = false;
    const next: NextFunction = () => { siguio = true; };
    await validarApiKey(req, res, next);
    return { status, body, siguio, cliente: req.apiClient };
  };

  it('el hash es SHA-256 en hexadecimal y es determinista', () => {
    const h = generarHash('abc');
    expect(h).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(generarHash('abc')).toBe(h);
  });

  it('la comparación en tiempo constante distingue hashes distintos', () => {
    expect(compararSeguro(generarHash('a'), generarHash('a'))).toBe(true);
    expect(compararSeguro(generarHash('a'), generarHash('b'))).toBe(false);
    expect(compararSeguro('corto', generarHash('a'))).toBe(false);
  });

  it('la base de datos guarda el hash y nunca la clave original', async () => {
    const fila = await prisma.apiClient.findUnique({ where: { name: nombres[0] } });
    expect(fila?.key_hash).toBe(generarHash(CLAVE_ACTIVA));
    expect(JSON.stringify(fila)).not.toContain(CLAVE_ACTIVA);
  });

  it('A — sin API Key responde 401 «API Key requerida»', async () => {
    const r = await ejecutar(undefined);
    expect(r.status).toBe(401);
    expect(r.body.message).toBe('API Key requerida');
    expect(r.siguio).toBe(false);
  });

  it('B — una clave inventada responde 401 «API Key inválida»', async () => {
    const r = await ejecutar('cualquier-cosa');
    expect(r.status).toBe(401);
    expect(r.body.message).toBe('API Key inválida');
    expect(r.siguio).toBe(false);
  });

  it('C — una clave activa pasa y deja el cliente identificado en req.apiClient', async () => {
    const r = await ejecutar(CLAVE_ACTIVA);
    expect(r.siguio).toBe(true);
    expect(r.cliente).toEqual({ id: idActivo, name: nombres[0] });
  });

  it('D — una clave correcta de un cliente deshabilitado responde 403', async () => {
    const r = await ejecutar(CLAVE_INACTIVA);
    expect(r.status).toBe(403);
    expect(r.body.message).toBe('API Key deshabilitada');
    expect(r.siguio).toBe(false);
  });

  it('revocar a un cliente surte efecto sin reiniciar y sin tocar a los demás', async () => {
    await prisma.apiClient.update({ where: { name: nombres[0] }, data: { is_active: false } });
    expect((await buscarClientePorApiKey(CLAVE_ACTIVA)).estado).toBe('deshabilitada');
    await prisma.apiClient.update({ where: { name: nombres[0] }, data: { is_active: true } });
    expect((await buscarClientePorApiKey(CLAVE_ACTIVA)).estado).toBe('activa');
  });
});
