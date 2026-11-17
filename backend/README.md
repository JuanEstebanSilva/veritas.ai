# Plagelio — Backend API REST Segura

API REST robusta, escalable y segura para la plataforma de integridad académica, detección de inteligencia artificial y auditoría de documentos **Plagelio**.

Construida con **Node.js**, **Express**, **TypeScript**, **PostgreSQL** y **Prisma ORM**, implementando seguridad en capas bajo los estándares **OWASP Top 10 API Security**, versionado de sesión (`version_sesion`), control de acceso basado en roles (**RBAC**), prevención de acceso no autorizado a nivel de objeto (**BOLA/IDOR**), recuperación de cuentas multifactor y documentación interactiva **OpenAPI 3.0.3 (Swagger UI)**.

---

## 🏗️ 1. Arquitectura y Tecnologías del Backend

```text
Navegador / Cliente API (Frontend React / Postman)
          │
          ▼ HTTP/JSON + Cabeceras (X-API-Key / Authorization: Bearer <JWT>)
┌─────────────────────────────────────────────────────────────────┐
│                    Express 4.21 + TypeScript                    │
├─────────────────────────────────────────────────────────────────┤
│ 1. Middlewares de Seguridad Global                              │
│    - Helmet (Cabeceras HTTP seguras)                            │
│    - CORS (Control de orígenes permitidos: localhost:5173)      │
│    - Rate Limiting (Prevención de ataques DoS y fuerza bruta)   │
│    - API Key Middleware (Identificación de aplicación cliente)  │
├─────────────────────────────────────────────────────────────────┤
│ 2. Middlewares de Autenticación y Autorización                 │
│    - autenticarJWT (Verificación de firma HS256 y version_sesion│
│    - autorizarRoles (RBAC: administrador, docente, estudiante)  │
│    - verificarPropiedad (Defensa contra vulnerabilidades BOLA)  │
│    - express-validator (Sanitización y validación estricta DTO) │
├─────────────────────────────────────────────────────────────────┤
│ 3. Controladores y Servicios de Dominio Académico               │
│    - Auth & Sesiones (/api/auth)                                │
│    - Usuarios y Perfiles (/api/usuarios, /api/users)            │
│    - Docentes y Auditores de Ética (/api/docentes)              │
│    - Estudiantes y Autores Académicos (/api/estudiantes)        │
│    - Departamentos Académicos (/api/departamentos)              │
│    - Laboratorios de Cómputo e Inferencia (/api/laboratorios)   │
│    - Revisiones de Integridad y Agenda (/api/revisiones)        │
│    - Análisis de Texto, DOCX y PDF (/api/analyses)              │
├─────────────────────────────────────────────────────────────────┤
│ 4. Capa de Persistencia y Criptografía                          │
│    - Prisma ORM 6.4 + pg.Pool (Consultas parametrizadas)        │
│    - CryptoVault (Cifrado AES-256-GCM para variables sensibles) │
│    - bcryptjs (Hashing con salt rounds para contraseñas)        │
│    - crypto.util (Generación segura de tokens y hashes SHA-256) │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼ Conexión TLS / SSL
PostgreSQL 14+ / Supabase Database (`plagelio`)
```

---

## 📋 2. Requisitos Previos

- **Node.js**: Versión `18.x` o superior (`node -v`).
- **npm**: Versión `9.x` o superior (`npm -v`).
- **PostgreSQL**: Servidor local versión 14+ o instancia administrada en **Supabase**.
- Base de datos creada: `plagelio` (o según `DATABASE_URL`).
- **Git** para clonación y versionamiento.

---

## ⚙️ 3. Configuración del Entorno (`.env`)

Crea tu archivo `.env` en la raíz de `backend/` a partir de `.env.example`:

```bash
cp .env.example .env
```

### Variables requeridas en `.env`:

```dotenv
# Servidor y Entorno
PORT=5000
NODE_ENV=development

# Base de Datos Relacional (PostgreSQL / Supabase)
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/plagelio?schema=public"

# Seguridad y Criptografía JWT
JWT_SECRET="plagelio_super_secure_jwt_secret_2026_production_key_santoto_token"
JWT_EXPIRES_IN="24h"

# Control de Orígenes CORS (Frontend Vite)
ALLOWED_ORIGIN="http://localhost:5173"

# Identificación de Clientes Privados (API Keys SHA-256)
API_KEY_POSTMAN="61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0"
API_KEY_WEB="61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0"
API_KEY_MOVIL="61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0"

# Administrador Inicial (Bootstrap Idempotente)
ADMIN_NOMBRE="Administrador Plagelio"
ADMIN_EMAIL="admin@plagelio.com"
ADMIN_PASSWORD="SANTOTO_2026--2"
```

---

## 🚀 4. Instalación y Puesta en Marcha

Sigue estos pasos en tu terminal dentro de la carpeta `backend/`:

```powershell
# 1. Instalar dependencias del proyecto
npm install

# 2. Generar cliente de Prisma ORM
npm run prisma:generate

# 3. Aplicar esquema y migraciones sobre PostgreSQL
npm run prisma:push

# 4. Probar la conectividad con la base de datos
npm run db:test

# 5. Ejecutar seed inicial (crea usuario administrador y catálogos de prueba)
npm run prisma:seed

# 6. Iniciar el servidor en modo desarrollo con recarga en caliente
npm run dev
```

* **Servidor activo en:** `http://localhost:5000`
* **Health Check:** `http://localhost:5000/api/health`
* **Documentación Interactiva Swagger:** `http://localhost:5000/api-docs`
* **Especificación OpenAPI (JSON):** `http://localhost:5000/openapi.json`

---

## 🛡️ 5. Mecanismos de Seguridad Implementados

El backend implementa de manera estricta las cuatro disciplinas de aseguramiento de software:

### A. Software Composition Analysis (SCA)
- Auditoría automatizada de dependencias con `npm audit`.
- Monitoreo de vulnerabilidades directas y transitivas (CVE).
- Control de versiones reproducibles mediante `package-lock.json`.

### B. Static Application Security Testing (SAST)
- Verificación de tipos estricta con TypeScript (`npx tsc --noEmit`).
- **Arquitectura de Dos Defensas**:
  1. *Primera Defensa (Capa Web)*: `express-validator` con `matchedData()` para neutralizar ataques de asignación masiva (*Mass Assignment*).
  2. *Segunda Defensa (Capa de Servicio)*: El servicio `usuarios.service` fuerza explícitamente el rol `user` y `is_active: true`, ignorando cualquier parámetro privilegiado enviado por el cliente.
- Prevención de inyección SQL mediante consultas preparadas en `pg.Pool` y consultas tipadas en Prisma.
- Política de contraseñas robusta: mínimo 12 caracteres, mayúsculas, minúsculas, números y caracteres especiales.

### C. Dynamic Application Security Testing (DAST)
- Batería de pruebas dinámicas con simulación de vectores de ataque en `tests/security.dast.test.ts`:
  - Inyección SQL en formularios de autenticación.
  - Carga maliciosa de archivos (scripts ejecutables `.sh`, `.exe` neutralizados).
  - Intentos de acceso horizontal (BOLA/IDOR) entre usuarios no autorizados.
  - Validación de firmas manipuladas en tokens JWT.
  - Integridad en endpoints de webhooks financieros.

### D. Autenticación y Control de Acceso (Bloque 11)
- **Versionado de Sesión (`version_sesion`)**: Cada cambio de contraseña incrementa el contador de versión en base de datos. Cualquier token JWT emitido previamente con una versión inferior es revocado de forma inmediata (HTTP 401 Unauthorized).
- **Recuperación Administrativa**: Generación de tokens de recuperación de un solo uso protegidos con hash SHA-256 y expiración a 15 minutos.
- **Códigos de Respaldo**: Lote de códigos alfanuméricos de un solo uso con hash SHA-256 para recuperación autónoma.
- **Defensa BOLA en Revisiones**: Estudiantes y docentes solo pueden consultar y actualizar revisiones que les correspondan legalmente; administradores poseen visibilidad global para auditoría institucional.

---

## 🧪 6. Ejecución de Pruebas Automatizadas

El proyecto cuenta con suites de prueba automatizadas completas en Jest:

```powershell
# 1. Pruebas DAST (Seguridad Dinámica y Resiliencia)
npm run test:dast

# 2. Pruebas de Integración Bloque 11 (26 pruebas de autenticación y sesiones)
npm run test:bloque11

# 3. Pruebas del Plan de Seguridad de Fases (15 pruebas de recuperación y BOLA)
npm run test:plan

# 4. Pruebas de Dominio Académico Bloque 8 (43 pruebas de roles y entidades)
npm run test:bloque8

# 5. Pruebas de Autenticación y Cuentas Lab 11 (22 pruebas)
npm run test:lab11

# 6. Pruebas de Autorización y BOLA Lab 10 (41 pruebas)
npm run test:lab10

# 7. Pruebas de JWT y Claims Lab 9 (17 pruebas)
npm run test:lab9

# 8. Pruebas de Prevención de Escalada de Privilegios Lab 8 (7 pruebas)
npm run test:lab8

# 9. Pruebas de Inicialización Segura (Bootstrap Admin) Bloque 7.5.1 (9 pruebas)
npm run test:bloque7.5.1

# 10. Ejecutar TODAS las suites consecutivamente
npm test
```

> **Certificación**: Todas las 180+ pruebas de integración y seguridad se ejecutan al 100% de aprobación.

---

## 📦 7. Scripts del `package.json`

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el backend en modo desarrollo con `ts-node-dev`. |
| `npm run build` | Compila TypeScript a código JavaScript optimizado en `dist/`. |
| `npm start` | Ejecuta la versión compilada en `dist/server.js`. |
| `npm run prisma:generate` | Genera los tipos de Prisma Client. |
| `npm run prisma:push` | Sincroniza el modelo Prisma con PostgreSQL sin crear archivos de migración. |
| `npm run prisma:seed` | Puebla la base de datos con cuentas y catálogos iniciales. |
| `npm run test:dast` | Ejecuta la batería de pruebas DAST de seguridad dinámica. |
| `npm run test:bloque11` | Ejecuta las pruebas formales del Bloque 11. |
| `npm run test:db` | Prueba la conexión activa con PostgreSQL/Supabase. |

---

## 📄 8. Estructura de Directorios

```
backend/
├── certs/                 # Certificados SSL / TLS para conexiones remotas
├── database/              # Scripts SQL relacionales (01 a 11)
├── prisma/
│   ├── schema.prisma      # Esquema Prisma con modelos y relaciones
│   └── seed.ts            # Datos semilla iniciales
├── scripts/               # Scripts de diagnóstico, vault y generación
├── src/
│   ├── config/            # Base de datos, variables de entorno y Prisma
│   ├── controllers/       # Controladores HTTP de cada recurso
│   ├── data/              # Datos semilla en memoria
│   ├── docs/              # Documentación Swagger / OpenAPI
│   ├── middleware/        # Middlewares de seguridad, validación y uploads
│   ├── middlewares/       # Middlewares de roles, JWT y BOLA
│   ├── routes/            # Definición de rutas y montaje de endpoints
│   ├── services/          # Lógica de negocio y consultas parametrizadas
│   ├── utils/             # Criptografía, JWT y contraseñas
│   ├── app.ts             # Ensamblado principal de la aplicación Express
│   └── server.ts          # Punto de entrada y escucha de sockets HTTP
├── tests/                 # Suites de pruebas Jest (SCA, SAST, DAST, API)
├── package.json
└── tsconfig.json
```

