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
        description: 'Servidor local de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key requerida para autenticar el cliente en los endpoints de la API.',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT obtenido en /api/auth/login. Pega solo el token: Swagger antepone «Bearer ».',
        },
      },
    },
    // Seguridad global: API Key Y JWT (un solo objeto = AND). Registro y login la
    // sobrescriben con solo ApiKeyAuth: sería imposible exigir JWT para obtener el JWT.
    security: [
      {
        ApiKeyAuth: [],
        BearerAuth: [],
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
