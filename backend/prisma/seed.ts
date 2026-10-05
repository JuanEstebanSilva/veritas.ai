import { PrismaClient, Role, AnalysisType } from '@prisma/client';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { validarPassword, generarPasswordHash } from '../src/utils/passwordPolicy';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

/**
 * Contraseñas que han estado publicadas en el repositorio (plantilla .env.example
 * y botón de demostración del login). Conocerlas no puede dar el rol ADMIN.
 */
const CONTRASENAS_PUBLICADAS = ['Admin123!Secure*', 'REEMPLAZAR_CON_CONTRASENA_SEGURA'];

class ConfiguracionSeedError extends Error {}

/**
 * El administrador único sale SOLO de aquí (Lab 8): el registro público siempre
 * crea USER y ninguna ruta de la API asigna el rol ADMIN. Por eso el seed no
 * tiene valores por defecto: sin ADMIN_EMAIL y ADMIN_PASSWORD propios no hay admin.
 */
function leerAdministradorInicial(): { email: string; password: string } {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    throw new ConfiguracionSeedError('define ADMIN_EMAIL y ADMIN_PASSWORD en backend/.env (no hay valores por defecto).');
  }
  if (CONTRASENAS_PUBLICADAS.includes(password)) {
    throw new ConfiguracionSeedError('ADMIN_PASSWORD es un valor publicado en el repositorio; genera uno nuevo.');
  }
  const errorPassword = validarPassword(password);
  if (errorPassword) {
    throw new ConfiguracionSeedError(`ADMIN_PASSWORD no cumple la política: ${errorPassword}`);
  }
  return { email, password };
}

async function main() {
  console.log('🌱 Iniciando sembrado de datos (Seed) para Plagelio...');

  const admin = leerAdministradorInicial();

  // 1. Crear o actualizar el Administrador Único
  const adminPasswordHash = await generarPasswordHash(admin.password);
  const adminUser = await prisma.user.upsert({
    where: { email: admin.email },
    update: {
      password_hash: adminPasswordHash,
      role: Role.ADMIN,
      is_active: true,
      is_premium: true,
    },
    create: {
      name: process.env.ADMIN_NAME || 'Administrador',
      last_name: process.env.ADMIN_LAST_NAME || 'Sistema',
      email: admin.email,
      password_hash: adminPasswordHash,
      role: Role.ADMIN,
      is_active: true,
      is_premium: true,
      premium_since: new Date(),
    },
  });
  console.log(`✓ Administrador verificado: ${adminUser.email} (Rol: ${adminUser.role})`);

  // Administrador único: cualquier otra cuenta ADMIN (p. ej. la heredada
  // admin@veritas.ai, creada por versiones anteriores de este seed con la misma
  // contraseña pública) pasa a USER, queda desactivada y recibe una contraseña
  // aleatoria que nadie conoce.
  const otrosAdmins = await prisma.user.findMany({
    where: { role: Role.ADMIN, email: { not: admin.email } },
    select: { id: true, email: true },
  });
  for (const otro of otrosAdmins) {
    await prisma.user.update({
      where: { id: otro.id },
      data: {
        role: Role.USER,
        is_active: false,
        password_hash: await generarPasswordHash(crypto.randomBytes(32).toString('hex')),
      },
    });
    console.log(`✓ Cuenta ADMIN adicional retirada: ${otro.email} (ahora USER y desactivada)`);
  }

  // 2. Crear un usuario estándar de demostración
  const demoEmail = 'usuario@plagelio.com';
  const demoPasswordHash = await generarPasswordHash('User123!Secure*');
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
          create: [],
        },
      },
    });
    console.log('✓ Análisis inicial de demostración creado con éxito.');
  }

  console.log('🌱 Sembrado de datos completado.');
}

main()
  .catch((e) => {
    if (e instanceof ConfiguracionSeedError) {
      console.error(`❌ Seed detenido: ${e.message}`);
    } else {
      console.error('Error en seed:', e);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
