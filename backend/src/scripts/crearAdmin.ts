import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando bootstrap administrativo...');

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD debe configurarse explícitamente para crear el administrador.');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: ENV.ADMIN_EMAIL },
    update: {
      password_hash: passwordHash,
      role: Role.ADMIN,
      is_active: true,
      is_premium: true,
    },
    create: {
      name: ENV.ADMIN_NAME,
      last_name: ENV.ADMIN_LAST_NAME,
      email: ENV.ADMIN_EMAIL,
      password_hash: passwordHash,
      role: Role.ADMIN,
      is_active: true,
      is_premium: true,
      premium_since: new Date(),
    },
  });

  console.log('Administrador inicial creado correctamente.');
  console.log(`ID del administrador: ${admin.id}`);
  console.log('Bootstrap finalizado correctamente.');
}

main()
  .catch((error: unknown) => {
    console.error('Error en bootstrap administrativo:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
