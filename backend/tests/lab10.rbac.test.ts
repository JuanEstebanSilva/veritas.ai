import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role, User } from '@prisma/client';
import { createTestToken } from './helpers';

/**
 * Lab 10 — Autorización: RBAC + autorización a nivel de objeto (BOLA/IDOR).
 *   401 → no hay identidad · 403 por rol → RBAC · 403 por objeto → el recurso no te corresponde.
 *
 * Equivalencias con la API del Hospital:
 *   administrador → ADMIN · médico → DOCENTE · paciente → USER (estudiante)
 *   cita → análisis · cita.medicoId → asignación docente ↔ estudiante
 */
describe('Lab 10 · RBAC y BOLA en Plagelio', () => {
  const sufijo = Date.now();
  const ids: string[] = [];
  const u: Record<string, User> = {};
  const t: Record<string, string> = {};
  const an: Record<string, string> = {};

  const crear = async (clave: string, role: Role) => {
    const hash = await bcrypt.hash('ClaveSegura2026!', 4);
    const user = await prisma.user.create({
      data: { name: clave, last_name: 'Lab10', email: `${clave}.lab10.${sufijo}@plagelio.com`, password_hash: hash, role },
    });
    ids.push(user.id);
    u[clave] = user;
    t[clave] = createTestToken({ userId: user.id, email: user.email, role });
  };
  const analisis = async (clave: string, dueno: string) => {
    const a = await prisma.analysis.create({
      data: { user_id: u[dueno].id, title_or_filename: `Ensayo de ${dueno}`, original_text: 'Texto de prueba del Lab 10.' },
    });
    an[clave] = a.id;
  };
  const get = (ruta: string, quien?: string) => {
    const r = request(app).get(ruta);
    return quien ? r.set('Authorization', `Bearer ${t[quien]}`) : r;
  };

  beforeAll(async () => {
    await crear('admin', Role.ADMIN);
    await crear('docenteA', Role.DOCENTE);
    await crear('docenteB', Role.DOCENTE);
    await crear('docenteSinGrupo', Role.DOCENTE);
    await crear('estA', Role.USER);
    await crear('estB', Role.USER);
    await prisma.teacherStudent.createMany({
      data: [
        { teacher_id: u.docenteA.id, student_id: u.estA.id },
        { teacher_id: u.docenteB.id, student_id: u.estB.id },
      ],
    });
    await analisis('A', 'estA');
    await analisis('B', 'estB');
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { user_id: { in: ids } } });
    await prisma.analysis.deleteMany({ where: { user_id: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  });

  describe('autenticación antes que autorización', () => {
    it('sin JWT → 401', async () => {
      expect((await get('/api/analyses')).status).toBe(401);
    });

    it('JWT alterado (rol → ADMIN, misma firma) → 401', async () => {
      const [h, p, s] = t.estA.split('.');
      const payload = { ...JSON.parse(Buffer.from(p, 'base64url').toString()), role: 'ADMIN' };
      const alterado = `${h}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${s}`;
      const res = await request(app).get('/api/analyses').set('Authorization', `Bearer ${alterado}`);
      expect(res.status).toBe(401);
    });
  });

  describe('RBAC: ¿tu rol puede hacer esta operación?', () => {
    it.each([
      ['estA', 403],
      ['docenteA', 403],
      ['admin', 200],
    ])('GET /api/analyses (vista global) con %s → %i', async (quien, esperado) => {
      expect((await get('/api/analyses', quien)).status).toBe(esperado);
    });

    it('el administrador ve los análisis de todos los estudiantes', async () => {
      const res = await get('/api/analyses', 'admin');
      const vistos = res.body.analyses.map((a: { id: string }) => a.id);
      expect(vistos).toEqual(expect.arrayContaining([an.A, an.B]));
    });

    it.each([['estA'], ['docenteA']])('%s no puede crear usuarios → 403', async (quien) => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${t[quien]}`)
        .send({ name: 'X', last_name: 'Y', email: `x.${quien}.${sufijo}@plagelio.com`, password: 'ClaveSegura2026!', role: 'DOCENTE' });
      expect(res.status).toBe(403);
    });

    it('el ADMIN crea un DOCENTE → 201 con rol DOCENTE', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${t.admin}`)
        .send({ name: 'Nuevo', last_name: 'Docente', email: `nuevo.docente.${sufijo}@plagelio.com`, password: 'ClaveSegura2026!', role: 'DOCENTE', is_active: false, id: 'x' });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('DOCENTE');
      expect(res.body.user.is_active).toBe(true);
      ids.push(res.body.user.id);
    });

    it('rol inexistente "superadmin" → 400', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${t.admin}`)
        .send({ name: 'S', last_name: 'A', email: `sa.${sufijo}@plagelio.com`, password: 'ClaveSegura2026!', role: 'superadmin' });
      expect(res.status).toBe(400);
    });

    it('el registro público ignora role: "DOCENTE" → queda USER', async () => {
      const email = `registro.docente.${sufijo}@universidad.edu`;
      const res = await request(app).post('/api/auth/register').send({
        name: 'Falso', last_name: 'Docente', email, password: 'ClaveSegura2026!', confirm_password: 'ClaveSegura2026!', role: 'DOCENTE',
      });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('USER');
      ids.push(res.body.user.id);
    });
  });

  describe('BOLA: ¿puedes hacerlo sobre ESTE recurso?', () => {
    it.each([
      ['estA', 'A', 200],
      ['estA', 'B', 403],
      ['estB', 'B', 200],
      ['estB', 'A', 403],
      ['docenteA', 'A', 200],
      ['docenteA', 'B', 403],
      ['docenteB', 'B', 200],
      ['docenteB', 'A', 403],
      ['admin', 'A', 200],
      ['admin', 'B', 200],
    ])('GET /api/analyses/:id — %s pide el análisis %s → %i', async (quien, cual, esperado) => {
      expect((await get(`/api/analyses/${an[cual]}`, quien)).status).toBe(esperado);
    });

    it.each([
      ['estA', 'estA', 200],
      ['estA', 'estB', 403],
      ['docenteA', 'estA', 200],
      ['docenteA', 'estB', 403],
      ['admin', 'estB', 200],
    ])('GET /api/analyses/student/:studentId — %s pide a %s → %i', async (quien, estudiante, esperado) => {
      expect((await get(`/api/analyses/student/${u[estudiante].id}`, quien)).status).toBe(esperado);
    });

    it.each([
      ['docenteA', 'docenteA', 200],
      ['docenteA', 'docenteB', 403],
      ['estA', 'docenteA', 403],
      ['admin', 'docenteB', 200],
    ])('GET /api/analyses/teacher/:teacherId — %s pide el grupo de %s → %i', async (quien, docente, esperado) => {
      expect((await get(`/api/analyses/teacher/${u[docente].id}`, quien)).status).toBe(esperado);
    });

    it('id mal formado → 400 antes de comprobar propiedad; inexistente → 404', async () => {
      expect((await get('/api/analyses/student/123', 'admin')).status).toBe(400);
      expect((await get('/api/analyses/00000000-0000-4000-8000-000000000000', 'admin')).status).toBe(404);
      expect((await get('/api/analyses/student/00000000-0000-4000-8000-000000000000', 'admin')).status).toBe(404);
    });

    it('el docente asignado puede LEER el análisis, pero no borrarlo (acción ≠ propiedad)', async () => {
      const res = await request(app).delete(`/api/analyses/${an.A}`).set('Authorization', `Bearer ${t.docenteA}`);
      expect(res.status).toBe(403);
      expect(await prisma.analysis.findUnique({ where: { id: an.A } })).not.toBeNull();
    });

    it('un estudiante no puede borrar el análisis de otro', async () => {
      const res = await request(app).delete(`/api/analyses/${an.A}`).set('Authorization', `Bearer ${t.estB}`);
      expect(res.status).toBe(403);
    });
  });

  describe('/mine: la identidad sale del JWT', () => {
    it('estudiante → solo sus análisis', async () => {
      const res = await get('/api/analyses/mine', 'estA');
      expect(res.status).toBe(200);
      expect(res.body.analyses.map((a: { id: string }) => a.id)).toEqual([an.A]);
    });

    it('docente → solo los de sus estudiantes asignados', async () => {
      const res = await get('/api/analyses/mine', 'docenteA');
      expect(res.status).toBe(200);
      expect(res.body.analyses.map((a: { id: string }) => a.id)).toEqual([an.A]);
    });

    it('docente sin estudiantes asignados → 403', async () => {
      expect((await get('/api/analyses/mine', 'docenteSinGrupo')).status).toBe(403);
    });

    it('administrador → 403 (usa la vista global)', async () => {
      expect((await get('/api/analyses/mine', 'admin')).status).toBe(403);
    });

    it('sin JWT → 401', async () => {
      expect((await get('/api/analyses/mine')).status).toBe(401);
    });
  });

  describe('asignaciones docente ↔ estudiante (solo ADMIN)', () => {
    const asignar = (docente: string, body: object, quien = 'admin') =>
      request(app).post(`/api/teachers/${docente}/students`).set('Authorization', `Bearer ${t[quien]}`).send(body);

    it('asignación válida → 201; del cuerpo solo se usa studentId', async () => {
      const res = await asignar(u.docenteSinGrupo.id, { studentId: u.estB.id, id: 999, teacher_id: u.docenteA.id });
      expect(res.status).toBe(201);
      expect(res.body.assignment.teacher_id).toBe(u.docenteSinGrupo.id);
      expect(res.body.assignment.id).not.toBe(999);
    });

    it.each([
      ['duplicada', 409, () => asignar(u.docenteA.id, { studentId: u.estA.id })],
      ['estudiante inexistente', 400, () => asignar(u.docenteA.id, { studentId: '00000000-0000-4000-8000-000000000000' })],
      ['studentId mal formado', 400, () => asignar(u.docenteA.id, { studentId: 'abc' })],
      ['el "estudiante" es un docente', 409, () => asignar(u.docenteA.id, { studentId: u.docenteB.id })],
      ['el "docente" es un estudiante', 409, () => asignar(u.estA.id, { studentId: u.estB.id })],
      ['docente inexistente', 404, () => asignar('00000000-0000-4000-8000-000000000000', { studentId: u.estB.id })],
      ['la hace un docente', 403, () => asignar(u.docenteA.id, { studentId: u.estB.id }, 'docenteA')],
    ])('%s → %i', async (_caso, esperado, peticion) => {
      expect((await peticion()).status).toBe(esperado);
    });

    it('un docente consulta su grupo (200) pero no el de otro (403)', async () => {
      expect((await get(`/api/teachers/${u.docenteA.id}/students`, 'docenteA')).status).toBe(200);
      expect((await get(`/api/teachers/${u.docenteB.id}/students`, 'docenteA')).status).toBe(403);
    });

    it('al retirar la asignación el docente pierde el acceso al instante', async () => {
      const r1 = await request(app)
        .delete(`/api/teachers/${u.docenteB.id}/students/${u.estB.id}`)
        .set('Authorization', `Bearer ${t.admin}`);
      expect(r1.status).toBe(200);
      expect((await get(`/api/analyses/${an.B}`, 'docenteB')).status).toBe(403);
    });
  });

  describe('pagos: transacción ajena o inexistente', () => {
    it('confirmar la transacción de otro estudiante → 403 y no se toca', async () => {
      const init = await request(app).post('/api/payments/sandbox-init').set('Authorization', `Bearer ${t.estB}`);
      const transactionId = init.body.transaction.transactionId;
      const res = await request(app)
        .post('/api/payments/sandbox-confirm')
        .set('Authorization', `Bearer ${t.estA}`)
        .send({ transactionId, simulateSuccess: true });
      expect(res.status).toBe(403);
      const pago = await prisma.payment.findUniqueOrThrow({ where: { transaction_id: transactionId } });
      expect(pago.status).toBe('PENDING');
      const estA = await prisma.user.findUniqueOrThrow({ where: { id: u.estA.id } });
      expect(estA.is_premium).toBe(false);
    });

    it('transacción inexistente → 404', async () => {
      const res = await request(app)
        .post('/api/payments/sandbox-confirm')
        .set('Authorization', `Bearer ${t.estA}`)
        .send({ transactionId: 'sbx_no_existe', simulateSuccess: true });
      expect(res.status).toBe(404);
    });
  });
});
