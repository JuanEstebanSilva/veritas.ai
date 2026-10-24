import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application, Request, Response } from 'express';

const docFiles = [
  './src/docs/authSwagger.ts',
  './src/docs/departamentosSwagger.ts',
  './src/docs/docentesSwagger.ts',
  './src/docs/estudiantesSwagger.ts',
  './src/docs/laboratoriosSwagger.ts',
  './src/docs/revisionesSwagger.ts',
  './src/docs/securitySwagger.ts',
  './dist/src/docs/authSwagger.js',
  './dist/src/docs/departamentosSwagger.js',
  './dist/src/docs/docentesSwagger.js',
  './dist/src/docs/estudiantesSwagger.js',
  './dist/src/docs/laboratoriosSwagger.js',
  './dist/src/docs/revisionesSwagger.js',
  './dist/src/docs/securitySwagger.js',
];

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Veritas AI — Documentación Interactiva OpenAPI (Laboratorio 11)',
      version: '1.0.0',
      description:
        'Documentación OpenAPI y Swagger UI interactiva para la plataforma de Integridad Académica Veritas AI. Incluye persistencia PostgreSQL en Supabase con TLS, Autenticación en dos capas (X-API-Key y JWT Bearer), Control RBAC, Defensa BOLA/IDOR e Integridad Referencial.',
      contact: {
        name: 'Equipo de Desarrollo Veritas AI',
        email: 'soporte@veritas.ai',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Servidor local de desarrollo Veritas AI (Puerto 5000)',
      },
    ],
    tags: [
      {
        name: 'Autenticación',
        description: 'Bloque A: Inicio de sesión (JWT HS256), registro público de estudiantes y perfil de usuario',
      },
      {
        name: 'Departamentos Académicos',
        description: 'Bloque B: Gestión de facultades y departamentos de Veritas AI (Especialidades)',
      },
      {
        name: 'Docentes y Auditores',
        description: 'Bloque C: Gestión de profesores auditores de ética e integridad académica (Médicos)',
      },
      {
        name: 'Estudiantes y Autores',
        description: 'Bloque D: Gestión de perfiles de estudiantes y autores académicos (Pacientes)',
      },
      {
        name: 'Laboratorios de Cómputo',
        description: 'Bloque D: Infraestructura de cómputo y auditoría ética de Veritas AI (Consultorios)',
      },
      {
        name: 'Revisiones Éticas y Agenda',
        description: 'Bloques E y F: Agendamiento, control de solapamiento (409) y defensa BOLA/IDOR (Citas)',
      },
      {
        name: 'Security',
        description: 'Identificación de la aplicación cliente que consume la API a partir de su API Key (Lab 6)',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key requerida para consumir los endpoints (ej. 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0).',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT obtenido mediante el endpoint de login (POST /api/auth/login).',
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  apis: docFiles,
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  // 1. Endpoint público para exportar la especificación OpenAPI en JSON
  app.get('/openapi.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // 2. Interfaz interactiva Swagger UI con persistencia de autorización
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
      },
      customSiteTitle: 'Veritas AI — Documentación Interactiva OpenAPI (Lab 11)',
    })
  );
};

export default setupSwagger;
