import request from 'supertest';
import { randomBytes } from 'crypto';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { generarToken } from '../src/utils/jwt.util';
import usuariosService from '../src/services/usuarios.service';
import estudiantesService from '../src/services/estudiantes.service';
import docentesService from '../src/services/docentes.service';
import revisionesService from '../src/services/revisiones.service';
import { buscarClientePorApiKey } from '../src/services/apiClients.service';
import { AIService } from '../src/services/AIService';
import { LiveSearchService } from '../src/services/LiveSearchService';

/**
 * Regresión de los hallazgos de seguridad del MVP.
 *
 * Cada caso reproduce el ataque que antes funcionaba. No usa credenciales fijas: crea sus
 * propios usuarios con contraseñas aleatorias y toma la API key del entorno.
 */
describe('Seguridad del MVP — regresión de hallazgos', () => {
  jest.setTimeout(60000);

  const apiKey = process.env.API_KEY_WEB || process.env.API_KEY_POSTMAN || '';
  const marca = `${Date.now()}_${randomBytes(3).toString('hex')}`;
  // Contraseña con guiones para el caso de las equivalencias (antes «-» y «—» se aceptaban igual)
  const password = `Pl-${randomBytes(6).toString('hex')}-Aa1!`;

  const correoA = `seg.a_${marca}@pruebas.plagelio.dev`;
  const correoB = `seg.b_${marca}@pruebas.plagelio.dev`;
  let tokenA = '';
  let tokenB = '';
  let idA = '';
  let idB = '';

  const api = () => ({
    post: (url: string) => request(app).post(url).set('X-API-Key', apiKey),
    get: (url: string) => request(app).get(url).set('X-API-Key', apiKey),
    patch: (url: string) => request(app).patch(url).set('X-API-Key', apiKey),
  });

  const registrar = async (email: string, nombre: string) => {
    const res = await api().post('/api/auth/register').send({ name: nombre, last_name: 'Prueba', email, password, confirm_password: password });
    expect(res.status).toBe(201);
    return res.body;
  };

  beforeAll(async () => {
    expect(apiKey).not.toBe('');
    const a = await registrar(correoA, 'Usuaria Seguridad A');
    const b = await registrar(correoB, 'Usuario Seguridad B');
    tokenA = a.token;
    tokenB = b.token;
    idA = a.user.id;
    idB = b.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Autenticación', () => {
    it('la API key que estaba fija en el código ya no se acepta si no está registrada', async () => {
      // Valor que buscarClientePorApiKey aceptaba sin consultar la base (ya publicado; queda revocado)
      const claveAntigua = '2d06b37d2bb5286e3b024067042652d30a030d67ac0b9d40b0f46be13cc03b';
      const spy = jest.spyOn(prisma.apiClient, 'findUnique').mockResolvedValue(null as any);
      const resultado = await buscarClientePorApiKey(claveAntigua);
      expect(resultado.estado).not.toBe('activa');
      spy.mockRestore();
    });

    it('una contraseña "equivalente" (raya en lugar de guion) se rechaza', async () => {
      const variante = password.replace(/-/g, '—');
      const res = await api().post('/api/auth/login').send({ email: correoA, password: variante });
      expect(res.status).toBe(401);
      const ok = await api().post('/api/auth/login').send({ email: correoA, password });
      expect(ok.status).toBe(200);
    });

    it('los errores de validación no devuelven la contraseña enviada', async () => {
      const secreta = `NoDebeVolver-${randomBytes(4).toString('hex')}-Aa1!`;
      const res = await api().post('/api/auth/register').send({ name: 'ab', email: `corto_${marca}@pruebas.plagelio.dev`, password: secreta });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).not.toContain(secreta);
    });

    it('limita los intentos fallidos de inicio de sesión (429 con Retry-After)', async () => {
      const objetivo = `fuerza.bruta_${marca}@pruebas.plagelio.dev`;
      const maximo = Math.max(1, parseInt(process.env.LOGIN_MAX_ATTEMPTS || '10', 10));
      for (let i = 0; i < maximo; i++) {
        const r = await api().post('/api/auth/login').send({ email: objetivo, password: `Incorrecta${i}-Aa1!` });
        expect(r.status).toBe(401);
      }
      const bloqueado = await api().post('/api/auth/login').send({ email: objetivo, password: 'Otra-Mas-Aa1!' });
      expect(bloqueado.status).toBe(429);
      expect(Number(bloqueado.headers['retry-after'])).toBeGreaterThan(0);
    });

    it('un token emitido antes de cambiar la contraseña deja de servir en los endpoints del producto', async () => {
      const correo = `sesion_${marca}@pruebas.plagelio.dev`;
      const reg = await registrar(correo, 'Usuaria Sesión');
      const viejo = reg.token;
      expect((await api().get('/api/auth/me').set('Authorization', `Bearer ${viejo}`)).status).toBe(200);

      const nueva = `Nu-${randomBytes(6).toString('hex')}-Bb2!`;
      const cambio = await api()
        .patch('/api/auth/cambiar-password')
        .set('Authorization', `Bearer ${viejo}`)
        .send({ passwordActual: password, passwordNueva: nueva, confirmarPassword: nueva, confirmPassword: nueva });
      expect(cambio.status).toBe(200);

      const despues = await api().get('/api/auth/me').set('Authorization', `Bearer ${viejo}`);
      expect(despues.status).toBe(401);
      const historial = await api().get('/api/analyses/history').set('Authorization', `Bearer ${viejo}`);
      expect(historial.status).toBe(401);
    });
  });

  describe('Autorización sobre objetos (BOLA)', () => {
    it('no se puede exportar a .docx el análisis de otra persona', async () => {
      const analisis = await prisma.analysis.create({
        data: { user_id: idA, title_or_filename: `Privado ${marca}`, original_text: 'Texto privado de la usuaria A para la prueba de exportación.' },
      });
      const ajeno = await api().post('/api/writing/download-docx').set('Authorization', `Bearer ${tokenB}`).send({ analysisId: analisis.id });
      expect(ajeno.status).toBe(403);
      const propio = await api().post('/api/writing/download-docx').set('Authorization', `Bearer ${tokenA}`).send({ analysisId: analisis.id });
      expect(propio.status).toBe(200);
    });

    it('un docente no puede confirmar, atender ni cancelar la revisión de otro docente', async () => {
      const clave = `Dc-${randomBytes(6).toString('hex')}-Aa1!`;
      const crearDocente = async (sufijo: string, departamento: number) => {
        const email = `docente.${sufijo}_${marca}@pruebas.plagelio.dev`;
        const u = await usuariosService.crearUsuarioAdministrativo({ nombre: `Docente ${sufijo}`, email, password: clave, rol: 'docente' });
        const d = await docentesService.crearMedico({
          nombre: `Docente ${sufijo}`, registroMedico: `RS-${sufijo}-${marca}`, email, telefono: '3100000000', especialidadId: departamento, usuarioId: u.id,
        });
        return { token: generarToken({ id: u.id, email: u.email, rol: 'docente' }), docenteId: d.id };
      };
      const propietario = await crearDocente('a', 1);
      const intruso = await crearDocente('b', 2);

      const est = await usuariosService.crearUsuario({ nombre: 'Estudiante Seguridad', email: `est_${marca}@pruebas.plagelio.dev`, password: clave });
      const estudiante = await estudiantesService.crearPaciente({
        nombre: 'Estudiante Seguridad', documento: `DS-${marca}`, email: `est_${marca}@pruebas.plagelio.dev`, telefono: '3000000000', fechaNacimiento: '2000-01-01', usuarioId: est.id,
      });
      const revision = await revisionesService.crearCita({
        pacienteId: estudiante.id, medicoId: propietario.docenteId, fecha: '2027-03-15T10:00:00Z', motivo: `Revisión de seguridad ${marca}`, estado: 'programada',
      });

      for (const accion of ['confirmar', 'atender', 'cancelar']) {
        const res = await api().patch(`/api/revisiones/${revision.id}/${accion}`).set('Authorization', `Bearer ${intruso.token}`).send({});
        expect(res.status).toBe(403);
      }
      const propia = await api().patch(`/api/revisiones/${revision.id}/confirmar`).set('Authorization', `Bearer ${propietario.token}`).send({});
      expect(propia.status).not.toBe(403);
    });

    it('el repositorio interno no revela el contenido, el título ni el autor de documentos ajenos', async () => {
      const texto =
        `Informe ${marca}: la cooperativa ribereña registró durante tres temporadas el caudal del río, ` +
        'las capturas por especie y el precio en muelle, y comparó esas series con los reportes de lluvias de la estación ' +
        'meteorológica municipal para estimar cuánto se adelantaba la subienda en los años más secos de la década.';
      const titulo = `Tesis confidencial ${marca}`;
      await prisma.analysis.create({ data: { user_id: idA, title_or_filename: titulo, original_text: texto } });

      const paraOtro = await AIService.compareAgainstInternalRepository(texto, undefined, idB);
      const ajena = paraOtro.find((m) => m.sourceUrl.startsWith('repositorio://plagelio/coincidencia/'));
      expect(ajena).toBeDefined();
      expect(ajena!.matchedText).toBe('[Contenido protegido: pertenece a otro usuario]');
      expect(JSON.stringify(paraOtro)).not.toContain(titulo);
      expect(JSON.stringify(paraOtro)).not.toContain(idA);

      const paraDuena = await AIService.compareAgainstInternalRepository(texto, undefined, idA);
      expect(paraDuena.some((m) => m.sourceUrl.startsWith('repositorio://plagelio/mis-documentos/') && m.sourceTitle.includes(titulo))).toBe(true);
    });
  });

  describe('Lógica de negocio y entradas', () => {
    it('el pago simulado no existe en producción', async () => {
      const previo = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const res = await api().post('/api/payments/sandbox-init').set('Authorization', `Bearer ${tokenA}`).send({});
        expect(res.status).toBe(404);
        const conf = await api().post('/api/payments/sandbox-confirm').set('Authorization', `Bearer ${tokenA}`).send({ transactionId: 'x' });
        expect(conf.status).toBe(404);
      } finally {
        process.env.NODE_ENV = previo;
      }
      const usuario = await prisma.user.findUnique({ where: { id: idA } });
      expect(usuario?.is_premium).toBe(false);
    });

    it('el humanizador informa la puntuación que mide el motor, sin ajustarla', async () => {
      // Con una puntuación original baja, la versión anterior inventaba una reducción
      // (devolvía original - 1) aunque el motor midiera más en el texto reescrito.
      const texto =
        'En conclusión, es crucial destacar que la inteligencia artificial juega un papel fundamental en la educación. ' +
        'Además, es importante señalar que la tecnología transforma los procesos de aprendizaje. ' +
        'Asimismo, cabe mencionar que los docentes deben adaptarse a este nuevo paradigma.';
      const analisis = await prisma.analysis.create({
        data: { user_id: idA, title_or_filename: `Humanizar ${marca}`, original_text: texto, ai_score: 2 },
      });
      const res = await api().post('/api/writing/improve').set('Authorization', `Bearer ${tokenA}`).send({ analysisId: analisis.id });
      expect(res.status).toBe(200);
      const medido = await AIService.analyzeAI(res.body.improvedText);
      expect(medido.overallAiScore).toBeGreaterThan(2);
      expect(res.body.improvedAiScore).toBe(medido.overallAiScore);
      const guardado = await prisma.analysis.findUnique({ where: { id: analisis.id } });
      expect(guardado?.improved_ai_score).toBe(medido.overallAiScore);
    });

    it('un archivo con formato no admitido responde 400, no 500', async () => {
      const res = await api()
        .post('/api/analyses/document')
        .set('Authorization', `Bearer ${tokenA}`)
        .attach('file', Buffer.from('MZ binario'), { filename: 'programa.exe', contentType: 'application/octet-stream' });
      expect(res.status).toBe(400);
    });
  });

  describe('Similitud', () => {
    it('no parte oraciones en puntos internos y recorta las largas en vez de descartarlas', () => {
      const texto =
        'Herramientas como Humata.ai y la versión 3.5 de otros modelos resumen artículos completos en segundos para estudiantes. ' +
        'Esta oración es deliberadamente muy larga porque reúne varias ideas encadenadas sobre lectura académica, síntesis de fuentes, ' +
        'citación y verificación, de modo que supera con holgura el límite de caracteres de una consulta.';
      const consultas = LiveSearchService.generateSearchQueries(texto, 3);
      // Antes «Humata.ai» y «3.5» partían la oración en trozos demasiado cortos para buscarse
      expect(consultas.some((c) => c.includes('Humata.ai y la versión 3.5'))).toBe(true);
      // Antes la oración de más de 140 caracteres se descartaba entera
      expect(consultas.some((c) => c.startsWith('Esta oración es deliberadamente'))).toBe(true);
      expect(consultas.every((c) => c.length <= 140)).toBe(true);
    });
  });
});
