import app from './app';
import { ENV } from './config/env';
import { prisma } from './config/prisma';
import { ConfiguracionApiKeysError } from './config/apiClients';
import { consultar } from './config/database';
import { sincronizarClientesApi } from './services/apiClients.service';

const startServer = async () => {
  try {
    // Verificar conexión a la base de datos (Prisma y pg Pool)
    await prisma.$connect();
    const pgCheck = await consultar('SELECT current_database(), current_user, NOW()');
    console.log(
      `✓ Conexión establecida exitosamente con PostgreSQL/Supabase (BD: ${pgCheck.rows[0].current_database}, Usuario: ${pgCheck.rows[0].current_user}).`
    );

    // Lab 6: se registran los hashes de las API Keys antes de aceptar peticiones.
    // Si falta alguna clave, el servidor no arranca en lugar de funcionar a medias.
    const clientes = await sincronizarClientesApi();
    console.log(`✓ API Keys: ${clientes.length} clientes registrados (solo se guarda su hash SHA-256).`);

    // Bloque 7.5.1: Se desacopla el bootstrap del arranque HTTP normal.
    // El administrador se inicializa explícitamente mediante npm run seed:admin

    app.listen(ENV.PORT, () => {
      console.log(`===================================================`);
      console.log(`🚀 Servidor Plagelio activo en puerto ${ENV.PORT}`);
      console.log(`🔗 API Base: http://localhost:${ENV.PORT}/api`);
      console.log(`📖 Swagger UI: http://localhost:${ENV.PORT}/api-docs`);
      console.log(`📄 OpenAPI JSON: http://localhost:${ENV.PORT}/openapi.json`);
      console.log(`⚙  Modo: ${ENV.NODE_ENV}`);
      console.log(`💳 Pasarela: ${ENV.STRIPE_SECRET_KEY ? 'Stripe Test Mode' : 'Sandbox Local Activo'}`);
      console.log(`===================================================`);
    });
  } catch (error) {
    if (error instanceof ConfiguracionApiKeysError) {
      console.error(`❌ Arranque detenido: ${error.message}`);
    } else {
      console.error('❌ Error al iniciar el servidor Plagelio:', error);
    }
    process.exit(1);
  }
};

startServer();
