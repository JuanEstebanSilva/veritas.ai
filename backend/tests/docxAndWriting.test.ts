import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role } from '@prisma/client';
import { createTestToken } from './helpers';
import { DocxService } from '../src/services/DocxService';
import { LinguisticEngine } from '../src/utils/linguisticEngine';
import bcrypt from 'bcryptjs';

describe('4. Módulo de Mejora de Redacción y Procesamiento DOCX', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    const pass = await bcrypt.hash('Secret123!', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Docx',
        last_name: 'Tester',
        email: `docx_${Date.now()}@veritas.ai`,
        password_hash: pass,
        role: Role.USER,
        is_active: true,
      },
    });
    userId = user.id;
    userToken = createTestToken({ userId: user.id, email: user.email, role: Role.USER });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('debe mejorar el texto sustituyendo clichés y preservando citas entre comillas', async () => {
    const rawText =
      'En conclusión, es crucial destacar que la tecnología "Machine Learning 2026" desempeña un papel fundamental. ' +
      'Asimismo, en primer lugar, es de suma importancia evaluar los datos.';

    const res = await request(app)
      .post('/api/writing/improve')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ text: rawText });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.improvedText).toBeDefined();
    expect(res.body.improvedText).toContain('"Machine Learning 2026"'); // Cita intacta
    expect(res.body.summaryOfChanges).toBeInstanceOf(Array);
  });

  it('debe generar y compilar un archivo DOCX descargable', async () => {
    const improvedText =
      'Este es un documento generado para pruebas de validación tipográfica.\n\n' +
      'El análisis determinó una clara optimización en el ritmo y fluidez del contenido.';

    const buffer = await DocxService.generateImprovedDocx({
      title: 'Prueba de Exportación DOCX',
      improvedText,
      originalAiScore: 75,
      improvedAiScore: 20,
      similarityScore: 10,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000); // Archivo DOCX zip estructurado

    // Probar extracción con mammoth
    const extracted = await DocxService.extractTextFromBuffer(buffer);
    expect(extracted.text).toContain('Prueba de Exportación DOCX');
    expect(extracted.text).toContain('optimización en el ritmo y fluidez');
  });

  it('debe responder con headers correctos en POST /api/writing/download-docx', async () => {
    const res = await request(app)
      .post('/api/writing/download-docx')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Documento Test',
        improvedText: 'Contenido verificado para descarga binaria de documento Word.',
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument');
    expect(res.headers['content-disposition']).toContain('documento_mejorado.docx');
  });
});
