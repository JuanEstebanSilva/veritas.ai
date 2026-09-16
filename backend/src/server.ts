import app from './app';
import { ENV } from './config/env';
import { prisma } from './config/prisma';

const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✓ Conexión establecida exitosamente con la base de datos PostgreSQL.');

    app.listen(ENV.PORT, () => {
      console.log(`===================================================`);
      console.log(`🚀 Servidor Plagelio activo en puerto ${ENV.PORT}`);
      console.log(`🔗 API Base: http://localhost:${ENV.PORT}/api`);
      console.log(`⚙  Modo: ${ENV.NODE_ENV}`);
      console.log(`💳 Pasarela: ${ENV.STRIPE_SECRET_KEY ? 'Stripe Test Mode' : 'Sandbox Local Activo'}`);
      console.log(`===================================================`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor Plagelio:', error);
    process.exit(1);
  }
};

startServer();
