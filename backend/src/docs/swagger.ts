import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application, Request, Response } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Plagelio API Segura',
      version: '1.0.0',
      description:
        'API REST para la gestión de Plagelio con autenticación en capas mediante API Key (X-API-Key) y Tokens JWT (Bearer), control de acceso RBAC e integridad referencial.',
      contact: {
        name: 'Equipo de Desarrollo Plagelio / Veritas AI',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Servidor local de desarrollo Veritas AI',
      },
    ],
    tags: [
      {
        name: 'Autenticación',
        description: 'Registro público, login y obtención de tokens JWT',
      },
      {
        name: 'Usuarios',
        description: 'Gestión administrativa de usuarios del sistema (Bloque 6B)',
      },
      {
        name: 'Pacientes',
        description: 'Control de acceso a recursos de pacientes y perfiles (Bloque 6A)',
      },
      {
        name: 'Médicos',
        description: 'Gestión de médicos y perfiles autorizados (Bloque 6A)',
      },
      {
        name: 'Citas',
        description: 'Gestión segura de citas médicas, defensa contra IDOR/BOLA y /mis-citas (Bloque 6C)',
      },
      {
        name: 'Análisis IA',
        description: 'Detección de IA, citas académicas y auditoría de documentos',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key requerida para consumir los endpoints protegidos.',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT obtenido mediante el endpoint de login.',
        },
      },
    },
    // Seguridad global: por defecto nuestros endpoints requieren API Key.
    // Endpoints específicos (como /api/auth/perfil) sobrescriben con ApiKeyAuth + BearerAuth.
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/docs/*.ts'], // Rutas a las anotaciones Swagger
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  // 1. Endpoint público para exportar la especificación OpenAPI en JSON (requerido por OWASP ZAP y Postman)
  app.get('/openapi.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // 2. Interfaz interactiva Swagger UI con persistencia de tokens
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
      customSiteTitle: 'Plagelio API Segura — Documentación OpenAPI',
    })
  );
};
