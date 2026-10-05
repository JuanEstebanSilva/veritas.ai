import app from './app';
import { ENV } from './config/env';
import { prisma } from './config/prisma';
import { ConfiguracionApiKeysError } from './config/apiClients';
import { sincronizarClientesApi } from './services/apiClients.service';
import { obtenerConfiguracionJWT, ConfiguracionJwtError } from './utils/jwt.util';

const startServer = async () => {
  try {
    // Lab 9 (fail-fast): sin un JWT_SECRET propio y robusto el servidor no arranca,
    // en vez de arrancar y fallar en el primer login (o firmar con un secreto público).
    const jwtConfig = obtenerConfiguracionJWT();
    console.log(`✓ JWT: HS256, secreto de ${jwtConfig.secret.length} caracteres, vigencia ${jwtConfig.expiresIn}.`);

    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✓ Conexión establecida exitosamente con la base de datos PostgreSQL.');

    // Lab 6: se registran los hashes de las API Keys antes de aceptar peticiones.
    // Si falta alguna clave, el servidor no arranca en lugar de funcionar a medias.
    const clientes = await sincronizarClientesApi();
    console.log(`✓ API Keys: ${clientes.length} clientes registrados (solo se guarda su hash SHA-256).`);

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
    if (error instanceof ConfiguracionApiKeysError || error instanceof ConfiguracionJwtError) {
      console.error(`❌ Arranque detenido: ${error.message}`);
    } else {
      console.error('❌ Error al iniciar el servidor Plagelio:', error);
    }
    process.exit(1);
  }
};

startServer();
