import request from 'supertest';
import app from '../src/app';
import { LiveSearchService } from '../src/services/LiveSearchService';
import { AIService } from '../src/services/AIService';
import { CitationService } from '../src/services/CitationService';
import { prisma } from '../src/config/prisma';
import { createTestToken } from './helpers';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Flujo de Análisis: PDF, Búsqueda Web Real y Evaluación con Citas APA', () => {
  let userToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const pass = await bcrypt.hash('Secret123!', 10);
    const user = await prisma.user.create({
      data: {
        name: 'PdfUser',
        last_name: 'Tester',
        email: `pdf_test_${Date.now()}@veritas.ai`,
        password_hash: pass,
        role: Role.USER,
        is_active: true,
        is_premium: true,
      },
    });
    testUserId = user.id;
    userToken = createTestToken({ userId: user.id, email: user.email, role: Role.USER });
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.payment.deleteMany({ where: { user_id: testUserId } });
      await prisma.analysis.deleteMany({ where: { user_id: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  it('debe extraer consultas salientes e invocar fetchRawWebResults para búsqueda web real', async () => {
    const sampleText = 'El aprendizaje profundo y las redes convolucionales son fundamentales en visión computacional moderna según Goodfellow et al. (2016).';
    const queries = LiveSearchService.generateSearchQueries(sampleText, 2);

    expect(Array.isArray(queries)).toBe(true);
    expect(queries.length).toBeGreaterThanOrEqual(1);

    // Ejecución de búsqueda web
    const rawResults = await LiveSearchService.fetchRawWebResults(sampleText);
    expect(Array.isArray(rawResults)).toBe(true);
  });

  it('debe calcular similitud y citas APA 7 a partir de fuentes web reales encontradas', async () => {
    const academicText = 'La inteligencia artificial moderna y los modelos generativos profundos permiten estimar distribuciones de probabilidad complejas en espacios multidimensionales.';

    const report = await AIService.analyzeSimilarity(academicText);

    expect(report).toBeDefined();
    expect(typeof report.overallSimilarityScore).toBe('number');
    expect(report.overallSimilarityScore).toBeGreaterThanOrEqual(0);
    expect(report.overallSimilarityScore).toBeLessThanOrEqual(100);
    expect(report.disclaimer).toBeDefined();
    expect(Array.isArray(report.sources)).toBe(true);
  });

  it('debe generar citas formales en formato APA 7ma edición con inText y reference', () => {
    const apa = CitationService.generateApa7({
      title: 'Deep Learning',
      url: 'https://doi.org/10.1109/CVPR.2016.90',
      author: 'Ian Goodfellow',
      year: 2016,
      siteName: 'MIT Press',
    });

    expect(apa.inText).toBe('(Goodfellow, 2016)');
    expect(apa.reference).toContain('https://doi.org/10.1109/CVPR.2016.90');
    expect(apa.reference).toContain('Goodfellow, I. (2016).');
  });

  it('debe exponer la ruta /api/analyses/pdf y validar que requiera archivo', async () => {
    const res = await request(app)
      .post('/api/analyses/pdf')
      .set('Authorization', `Bearer ${userToken}`);

    // Debe responder 400 porque no se adjuntó archivo, demostrando que la ruta existe y está protegida
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('No se ha adjuntado ningún documento');
  });
});
