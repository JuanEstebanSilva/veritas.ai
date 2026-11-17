/**
 * Datos de prueba para el Laboratorio No. 5 (Integridad referencial).
 * Crea tres usuarios con distinto grado de dependencias para poder demostrar
 * los tres desenlaces: 409 por analisis, 409 por pagos y 200 sin relaciones.
 */
import { PrismaClient, Role, AnalysisType, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Lab5!Secure*2026', 12);

  // 1. Usuario CON analisis (y con sub-registros por parrafo y fuentes)
  const conAnalisis = await prisma.user.upsert({
    where: { email: 'lab.analisis@plagelio.com' },
    update: {},
    create: { name: 'Laura', last_name: 'Con Analisis', email: 'lab.analisis@plagelio.com', password_hash: hash, role: Role.USER },
  });

  const yaTiene = await prisma.analysis.findFirst({ where: { user_id: conAnalisis.id } });
  if (!yaTiene) {
    const analisis = await prisma.analysis.create({
      data: {
        user_id: conAnalisis.id,
        type: AnalysisType.TEXT,
        title_or_filename: 'Ensayo sobre redes neuronales',
        original_text: 'La inteligencia artificial ha transformado de manera significativa los procesos academicos contemporaneos.',
        ai_score: 87.4,
        similarity_score: 22.1,
      },
    });
    await prisma.analysisResult.create({
      data: {
        analysis_id: analisis.id,
        paragraph_index: 0,
        paragraph_text: 'La inteligencia artificial ha transformado de manera significativa los procesos academicos.',
        paragraph_ai_score: 87.4,
        indicators: JSON.stringify(['Alta uniformidad', 'Cadencia constante']),
        explanation: 'Perplejidad baja y varianza de longitud de frase muy reducida.',
      },
    });
    await prisma.analysisSource.create({
      data: {
        analysis_id: analisis.id,
        source_url: 'https://es.wikipedia.org/wiki/Inteligencia_artificial',
        source_title: 'Inteligencia artificial - Wikipedia',
        matched_text: 'La inteligencia artificial ha transformado los procesos academicos',
        user_snippet: 'La inteligencia artificial ha transformado de manera significativa los procesos academicos',
        similarity_percentage: 22.1,
      },
    });
  }

  // 2. Usuario CON pagos (sin analisis): demuestra que el 409 tambien salta por pagos
  const conPagos = await prisma.user.upsert({
    where: { email: 'lab.pagos@plagelio.com' },
    update: {},
    create: { name: 'Carlos', last_name: 'Con Pagos', email: 'lab.pagos@plagelio.com', password_hash: hash, role: Role.USER, is_premium: true, premium_since: new Date() },
  });
  const tienePago = await prisma.payment.findFirst({ where: { user_id: conPagos.id } });
  if (!tienePago) {
    await prisma.payment.create({
      data: { user_id: conPagos.id, provider: 'sandbox', transaction_id: 'lab5_txn_demo_0001', amount: 2.0, currency: 'USD', status: PaymentStatus.COMPLETED },
    });
  }

  // 3. Usuario SIN relaciones: demuestra el 200 OK
  const sinRelaciones = await prisma.user.upsert({
    where: { email: 'lab.sinrelaciones@plagelio.com' },
    update: {},
    create: { name: 'Marta', last_name: 'Sin Relaciones', email: 'lab.sinrelaciones@plagelio.com', password_hash: hash, role: Role.USER },
  });

  const resumen = {
    con_analisis: { id: conAnalisis.id, email: conAnalisis.email, analisis: await prisma.analysis.count({ where: { user_id: conAnalisis.id } }), pagos: await prisma.payment.count({ where: { user_id: conAnalisis.id } }) },
    con_pagos: { id: conPagos.id, email: conPagos.email, analisis: await prisma.analysis.count({ where: { user_id: conPagos.id } }), pagos: await prisma.payment.count({ where: { user_id: conPagos.id } }) },
    sin_relaciones: { id: sinRelaciones.id, email: sinRelaciones.email, analisis: 0, pagos: 0 },
  };
  console.log(JSON.stringify(resumen, null, 2));
}

main().finally(() => prisma.$disconnect());
