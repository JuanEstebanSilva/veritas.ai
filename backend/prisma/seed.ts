import { PrismaClient, Role, AnalysisType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando sembrado de datos (Seed) para Plagelio...');

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@plagelio.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!Secure*';

  // 1. Crear o actualizar el Administrador Único
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password_hash: adminPasswordHash,
      role: Role.ADMIN,
      is_active: true,
      is_premium: true,
    },
    create: {
      name: process.env.ADMIN_NAME || 'Administrador',
      last_name: process.env.ADMIN_LAST_NAME || 'Sistema',
      email: adminEmail,
      password_hash: adminPasswordHash,
      role: Role.ADMIN,
      is_active: true,
      is_premium: true,
      premium_since: new Date(),
    },
  });
  console.log(`✓ Administrador verificado: ${adminUser.email} (Rol: ${adminUser.role})`);

  // Asegurar compatibilidad si se configuró admin@veritas.ai previamente
  if (adminEmail !== 'admin@veritas.ai') {
    try {
      await prisma.user.upsert({
        where: { email: 'admin@veritas.ai' },
        update: { password_hash: adminPasswordHash, role: Role.ADMIN, is_active: true, is_premium: true },
        create: {
          name: 'Administrador (Legacy)',
          last_name: 'Sistema',
          email: 'admin@veritas.ai',
          password_hash: adminPasswordHash,
          role: Role.ADMIN,
          is_active: true,
          is_premium: true,
          premium_since: new Date(),
        },
      });
    } catch { /* ignorar si falla */ }
  }

  // 2. Crear un usuario estándar de demostración
  const demoEmail = 'usuario@plagelio.com';
  const demoPasswordHash = await bcrypt.hash('User123!Secure*', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      name: 'Carlos',
      last_name: 'Mendoza',
      email: demoEmail,
      password_hash: demoPasswordHash,
      role: Role.USER,
      is_active: true,
      is_premium: false,
      daily_analysis_count: 2,
      last_analysis_date: new Date(),
    },
  });
  console.log(`✓ Usuario de prueba creado: ${demoUser.email} (Rol: ${demoUser.role})`);

  // Usuario demo legacy para compatibilidad
  try {
    await prisma.user.upsert({
      where: { email: 'usuario@veritas.ai' },
      update: {},
      create: {
        name: 'Carlos (Legacy)',
        last_name: 'Mendoza',
        email: 'usuario@veritas.ai',
        password_hash: demoPasswordHash,
        role: Role.USER,
        is_active: true,
        is_premium: false,
        daily_analysis_count: 2,
        last_analysis_date: new Date(),
      },
    });
  } catch { /* ignorar si falla */ }

  // 3. Crear análisis de muestra para el usuario de prueba
  const sampleText =
    'La inteligencia artificial representa un campo de estudio crucial para la computación moderna. ' +
    'En conclusión, desempeña un papel fundamental en el procesamiento masivo de datos y la automatización inteligente. ' +
    'Asimismo, la metodología de la investigación comprende procedimientos racionales para contrastar hipótesis empíricas.';

  const existingAnalysis = await prisma.analysis.findFirst({
    where: { user_id: demoUser.id },
  });

  if (!existingAnalysis) {
    await prisma.analysis.create({
      data: {
        user_id: demoUser.id,
        type: AnalysisType.TEXT,
        title_or_filename: 'Ensayo Metodológico y Tecnológico',
        original_text: sampleText,
        ai_score: 68.0,
        similarity_score: 24.0,
        improved_text:
          'El estudio de la computación actual sitúa al aprendizaje automático en un lugar central. ' +
          'Por esta razón, resulta determinante en el análisis de grandes volúmenes de información y la toma autónoma de decisiones. ' +
          'Bajo esta perspectiva, las pautas investigativas articulan métodos sistemáticos para evaluar evidencias en el terreno empírico.',
        improved_ai_score: 22.0,
        improved_similarity_score: 12.0,
        results: {
          create: [
            {
              paragraph_index: 0,
              paragraph_text: sampleText,
              paragraph_ai_score: 68.0,
              indicators: JSON.stringify([
                'Estructura excesivamente uniforme',
                'Transiciones demasiado predecibles',
              ]),
              explanation:
                'Presenta recurrencia de giros idiomáticos típicos de modelos predictivos y longitud de oraciones homogénea.',
            },
          ],
        },
        sources: {
          create: [
            {
              source_url: 'https://es.wikipedia.org/wiki/Inteligencia_artificial',
              source_title: 'Wikipedia: Inteligencia Artificial',
              matched_text: 'La inteligencia artificial es un campo de la informática...',
              user_snippet: sampleText.slice(0, 100),
              similarity_percentage: 16.0,
            },
            {
              source_url: 'https://dialnet.unirioja.es/descarga/articulo/educacion-metodologia.pdf',
              source_title: 'Dialnet: Metodología de la Investigación',
              matched_text: 'La metodología de la investigación comprende el conjunto de procedimientos...',
              user_snippet: sampleText.slice(120, 220),
              similarity_percentage: 8.0,
            },
          ],
        },
      },
    });
    console.log('✓ Análisis inicial de demostración creado con éxito.');
  }

  console.log('🌱 Sembrado de datos completado.');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
