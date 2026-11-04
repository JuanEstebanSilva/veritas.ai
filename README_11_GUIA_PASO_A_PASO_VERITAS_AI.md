# README 11 — Actualización Progresiva de la API Segura: Veritas AI

**Guía de trabajo para la Plataforma de Integridad Académica y Detección de Plagio e IA (Veritas AI)**  
**Tecnologías:** Node.js, Express, TypeScript, Swagger/OpenAPI 3.0.3, PostgreSQL (Supabase / Local), JWT (HS256 con `version_sesion`), API Key (SHA-256), bcrypt y Jest/Supertest.  
**Alcance:** Actualización progresiva de la base de datos, invalidación de sesiones activas (`version_sesion`), recuperación administrativa con tokens SHA-256 temporales (15 min), códigos de respaldo de un solo uso (8 códigos formateados), desacoplamiento de API Key para login y recursos de usuario, RBAC, defensa BOLA/IDOR y habilitación de CORS para desarrollo en React + Vite (`http://localhost:5173`).

---

## 1. ¿Qué se logró en esta actualización?

Conservando las **siete entidades del dominio académico de Veritas AI**, se incorporaron los mecanismos de seguridad de cuenta:

1. **`usuarios.version_sesion`**: Columna `INTEGER NOT NULL DEFAULT 0` que rastrea la versión de sesión. Cada cambio de contraseña o restablecimiento incrementa este contador, revocando automáticamente cualquier token JWT previo (`vs !== usuario.version_sesion` -> `401 Sesión revocada`).
2. **`password_reset_tokens`**: Tabla que almacena tokens temporales de 15 minutos generados por un administrador para un estudiante o docente. El token solo se envía una vez en plano y se almacena en BD exclusivamente como hash SHA-256 de 64 caracteres hexadecimales.
3. **`codigos_recuperacion`**: Tabla que almacena un lote de ocho códigos de respaldo de un solo uso en formato `XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`, almacenados de forma segura como hash SHA-256. Al consumirse uno, se marca con `fecha_uso` y no puede ser reutilizado.

### Mapeo de Dominio: Veritas AI vs. Rúbrica de Laboratorio

| Concepto de Rúbrica Base | Dominio Veritas AI | Descripción en Veritas AI |
|---|---|---|
| Pacientes | **Estudiantes / Autores** | Estudiantes que someten tesis, artículos o trabajos académicos a revisión. |
| Médicos | **Docentes / Auditores de Ética** | Profesores y evaluadores que auditan similitud, originalidad y ética. |
| Citas | **Revisiones Éticas de Integridad** | Evaluaciones agendadas de trabajos con estados: `programada`, `confirmada`, `atendida`, `cancelada`. |
| Especialidades | **Departamentos Académicos** | Facultades o líneas de investigación (ej. Ingeniería de Sistemas, Derecho, etc.). |
| Consultorios | **Laboratorios de Cómputo / Nodos** | Infraestructura de cómputo y auditoría asignada a las revisiones. |
| Roles | **`administrador`, `docente`, `estudiante`** | Matriz de control de acceso basada en roles (RBAC). |

---

## 2. Paso 1. Preparación del Proyecto y Entorno

1. Instalar dependencias en el backend:
   ```bash
   cd backend
   npm install
   ```
2. Verificar variables en `.env`:
   ```env
   PORT=5000
   ALLOWED_ORIGIN=http://localhost:5173
   JWT_SECRET=super_secret_jwt_key_veritas_ai_2026_academico
   JWT_EXPIRES_IN=2h
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/veritas_ai
   ADMIN_NOMBRE=Administrador Veritas
   ADMIN_EMAIL=admin@veritas.ai
   ADMIN_PASSWORD=SANTOTO_2026--2
   CLIENT_API_KEY=61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0
   ```
3. Scripts de migración SQL aplicados (ubicados en `database/`):
   - `database/11_3_version_sesion.sql`
   - `database/11_4_password_reset_tokens.sql`
   - `database/11_4_2_codigos_recuperacion.sql`
   - `database/11_verificacion_veritas_ai.sql`

---

## 3. Paso 2. Comprobación del Estado Inicial de la Base de Datos

Ejecutar las consultas de auditoría en PostgreSQL:

```sql
-- BD-00A: Siete tablas base del dominio académico
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'roles', 'usuarios', 'departamentos', 'estudiantes',
    'docentes', 'laboratorios', 'revisiones'
  )
ORDER BY table_name;

-- BD-00B: Roles vigentes en Veritas AI
SELECT id, nombre, activo FROM public.roles ORDER BY id;

-- BD-00C: Usuarios y vinculación con perfiles académicos (sin exponer contraseñas)
SELECT u.id AS usuario_id, u.email, r.nombre AS rol,
       e.id AS estudiante_id, d.id AS docente_id
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
LEFT JOIN public.estudiantes e ON e.usuario_id = u.id::text
LEFT JOIN public.docentes d ON d.usuario_id = u.id::text
ORDER BY u.id;
```

---

## 4. Paso 3. Control de Versión de Sesión (`version_sesion`)

El script `database/11_3_version_sesion.sql` incorpora:
```sql
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS version_sesion INTEGER NOT NULL DEFAULT 0;
```

**Verificación:**
```sql
SELECT u.id, u.email, r.nombre AS rol, u.version_sesion,
       (u.password_hash IS NOT NULL) AS tiene_password_hash
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
ORDER BY u.id;
```

---

## 5. Paso 4. Recuperación Administrativa de Contraseñas

El script `database/11_4_password_reset_tokens.sql` genera la tabla `public.password_reset_tokens`:
- `id SERIAL PRIMARY KEY`
- `usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE`
- `administrador_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT`
- `token_hash VARCHAR(64) NOT NULL` (SHA-256)
- `fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `fecha_expiracion TIMESTAMPTZ NOT NULL`
- `fecha_uso TIMESTAMPTZ NULL`

**Verificación:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'password_reset_tokens'
ORDER BY ordinal_position;
```

---

## 6. Paso 5. Códigos de Respaldo de Un Solo Uso

El script `database/11_4_2_codigos_recuperacion.sql` genera `public.codigos_recuperacion`:
- `id SERIAL PRIMARY KEY`
- `usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE`
- `codigo_hash VARCHAR(64) NOT NULL` (SHA-256 del código normalizado sin guiones y en mayúsculas)
- `fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `fecha_uso TIMESTAMPTZ NULL`

**Verificación:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'codigos_recuperacion'
ORDER BY ordinal_position;
```

---

## 7. Paso 6. Verificación Estructural del Esquema (9 Tablas)

Ejecutar en PostgreSQL para auditar estructura, claves foráneas y RLS:

```sql
-- 1. Nueve tablas en esquema public
SELECT c.relname AS tabla, c.relrowsecurity AS rls_habilitado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r','p')
  AND c.relname IN (
    'roles','usuarios','departamentos','estudiantes','docentes',
    'laboratorios','revisiones','password_reset_tokens','codigos_recuperacion'
  )
ORDER BY c.relname;

-- 2. Claves foráneas de recuperación
SELECT tc.table_name AS tabla_origen, kcu.column_name AS columna_origen,
       ccu.table_name AS tabla_destino, ccu.column_name AS columna_destino
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('password_reset_tokens', 'codigos_recuperacion');
```

---

## 8. Paso 7. Arquitectura de Endpoints y Desacoplamiento

El backend de Veritas AI implementa la arquitectura de seguridad requerida:

| Funcionalidad | Método y Endpoint | Seguridad Exigida | Comportamiento |
|---|---|---|---|
| Login Público | `POST /api/auth/login` | **Público Controlado** (Sin API Key, sin Bearer) | Emite JWT con `{ id, email, rol, vs }`. Permite conexión directa desde React + Vite. |
| Perfil Protegido | `GET /api/auth/perfil` | `BearerAuth` (JWT) | Retorna información del usuario si su `version_sesion` coincide. |
| Cambio de Contraseña | `PATCH /api/auth/cambiar-password` | `BearerAuth` (JWT) | Valida contraseña actual, almacena nuevo hash bcrypt e incrementa `version_sesion` (+1). |
| Recuperación Admin | `POST /api/auth/recuperacion/admin/:usuarioId` | `BearerAuth` (Rol `administrador`) | Emite token temporal de 15 minutos en plano e inserta hash SHA-256 en BD. |
| Restablecer con Token | `POST /api/auth/restablecer-password` | `ApiKeyAuth` (`X-API-Key`) | Consume el token, actualiza contraseña, incrementa `version_sesion` e invalida tokens previos. |
| Generar Códigos | `POST /api/auth/codigos-recuperacion` | `BearerAuth` (JWT) | Reautentica con clave actual y retorna 8 códigos de respaldo únicos. |
| Consultar Códigos | `GET /api/auth/codigos-recuperacion/estado` | `BearerAuth` (JWT) | Retorna la cantidad de códigos no consumidos (`{ disponibles: N }`). |
| Regenerar Códigos | `POST /api/auth/codigos-recuperacion/regenerar` | `BearerAuth` (JWT) | Invalida códigos anteriores y emite un nuevo lote de 8 códigos. |
| Restablecer con Código | `POST /api/auth/restablecer-con-codigo` | `ApiKeyAuth` (`X-API-Key`) | Consume un código de respaldo, actualiza contraseña e incrementa `version_sesion`. |
| Mis Revisiones | `GET /api/revisiones/mis-revisiones` | `BearerAuth` (JWT) | **Desacoplado de API Key**. Estudiante solo ve sus revisiones; docente solo las asignadas. |
| Revisión por ID | `GET /api/revisiones/:id` | `BearerAuth` (JWT) | **Defensa BOLA/IDOR**: Si un estudiante intenta ver una revisión ajena, responde `403 Forbidden`. |
| Integración Privada | `GET /api/seguridad/cliente` | `ApiKeyAuth` (`X-API-Key`) | Exige API Key privada de cliente corporativo (401 si falta). |

---

## 9. Paso 8. Las 25 Pruebas de Seguridad en Veritas AI

Todas las 25 pruebas fueron adaptadas y automatizadas en la suite Jest (`tests/bloque11_veritas.test.ts`) y en la colección Postman (`Postman_Lab11_VeritasAI.json`):

| No. | Prueba | Endpoint | Rol / Auth | HTTP | Resultado Esperado |
|---|---|---|---|---|---|
| **1** | Login válido | `POST /api/auth/login` | Público | `200` | Devuelve JWT firmado con claim `vs: 0`. |
| **2** | Login con JSON inválido | `POST /api/auth/login` | Público | `400` | Bad Request por validación de esquema. |
| **3** | Perfil sin JWT | `GET /api/auth/perfil` | Sin cabecera | `401` | Unauthorized ("Token de autenticación requerido"). |
| **4** | Cambio de contraseña con clave actual | `PATCH /api/auth/cambiar-password` | `BearerAuth` (Estudiante) | `200` | Clave cambiada, `version_sesion` incrementa a `1`. |
| **5** | Reutilizar JWT anterior | `GET /api/auth/perfil` | `BearerAuth` (JWT vs: 0) | `401` | **Sesión revocada** (`payload.vs < version_sesion`). |
| **6** | Login con nueva clave | `POST /api/auth/login` | Público | `200` | Éxito y nuevo JWT emitido con `vs: 1`. |
| **7** | Cambio con clave errónea | `PATCH /api/auth/cambiar-password` | `BearerAuth` (JWT vs: 1) | `401` | Rechazado ("Contraseña actual inválida"), sin alterar BD. |
| **8** | Generar recuperación admin | `POST /api/auth/recuperacion/admin/:id` | `BearerAuth` (Admin) | `201` | Emite token hex de 64 caracteres; persiste hash. |
| **9** | Restablecer con token | `POST /api/auth/restablecer-password` | `X-API-Key` | `200` | Clave restablecida, token marcado con `fecha_uso`. |
| **10** | Reutilizar token ya usado | `POST /api/auth/restablecer-password` | `X-API-Key` | `400` | Rechazado ("Token inválido, utilizado o expirado"). |
| **11** | Estudiante intenta recuperación admin | `POST /api/auth/recuperacion/admin/:id` | `BearerAuth` (Estudiante) | `403` | **Forbidden por RBAC** (Solo rol `administrador`). |
| **12** | Generar 8 códigos de respaldo | `POST /api/auth/codigos-recuperacion` | `BearerAuth` (Estudiante) | `201` | Emite arreglo de 8 códigos `XXXX-XXXX-...`. |
| **13** | Consultar estado de códigos | `GET /api/auth/codigos-recuperacion/estado` | `BearerAuth` (Estudiante) | `200` | `{ "disponibles": 8 }`. |
| **14** | Regenerar lote de códigos | `POST /api/auth/codigos-recuperacion/regenerar`| `BearerAuth` (Estudiante) | `201` | Invalida los 8 anteriores y emite 8 nuevos. |
| **15** | Restablecer con código válido | `POST /api/auth/restablecer-con-codigo` | `X-API-Key` | `200` | Clave restablecida y código marcado con `fecha_uso`. |
| **16** | Reutilizar código consumido | `POST /api/auth/restablecer-con-codigo` | `X-API-Key` | `400` | Rechazado ("Código o cuenta inválidos"). |
| **17** | Estudiante consulta mis-revisiones | `GET /api/revisiones/mis-revisiones` | `BearerAuth` (Estudiante) | `200` | Retorna lista de revisiones donde es autor. |
| **18** | Estudiante consulta revisión ajena | `GET /api/revisiones/:idAjeno` | `BearerAuth` (Estudiante) | `403` | **Defensa BOLA/IDOR activa**: Acceso bloqueado. |
| **19** | Estudiante intenta GET global | `GET /api/revisiones` | `BearerAuth` (Estudiante) | `403` | **RBAC activo**: Solo accesible por docentes/admin. |
| **20** | Cliente privado sin API Key | `GET /api/seguridad/cliente` | Sin cabecera | `401` | Unauthorized ("API Key requerida"). |
| **21** | Cliente privado con API Key | `GET /api/seguridad/cliente` | `X-API-Key` válida | `200` | OK, cliente autenticado con éxito. |
| **22** | Login sin API Key y datos inválidos | `POST /api/auth/login` | Sin cabecera | `400` | Bad Request de datos (no exige API Key). |
| **23** | mis-revisiones sin JWT ni API Key | `GET /api/revisiones/mis-revisiones` | Sin cabecera | `401` | Unauthorized ("Token requerido"). |
| **24** | mis-revisiones con JWT sin API Key | `GET /api/revisiones/mis-revisiones` | Solo `BearerAuth` | `200` | **Recurso desacoplado exitosamente de la API Key**. |
| **25** | Swagger expone seguridad explícita | `GET /api/docs/swagger.json` | Público | `200` | Especificación OpenAPI 3.0.3 con esquemas definidos. |

---

## 10. Paso 9. Comprobación Post-Pruebas en PostgreSQL

Ejecutar las consultas de auditoría para verificar el estado de los registros:

```sql
-- 1. Tokens de recuperación utilizados
SELECT usuario_id, administrador_id, fecha_creacion,
       fecha_expiracion, fecha_uso,
       CASE WHEN fecha_uso IS NOT NULL THEN 'UTILIZADO'
            WHEN fecha_expiracion <= NOW() THEN 'EXPIRADO'
            ELSE 'VIGENTE' END AS estado
FROM public.password_reset_tokens
ORDER BY fecha_creacion DESC;

-- 2. Códigos de respaldo utilizados vs disponibles
SELECT usuario_id, COUNT(*) AS total,
       COUNT(*) FILTER (WHERE fecha_uso IS NULL) AS disponibles,
       COUNT(*) FILTER (WHERE fecha_uso IS NOT NULL) AS utilizados
FROM public.codigos_recuperacion
GROUP BY usuario_id
ORDER BY usuario_id;
```

---

## 11. Paso 10. Comprobación de Preflight CORS para React + Vite

El backend de Veritas AI tiene configurado el soporte CORS en `backend/src/app.ts`:

```powershell
curl.exe -i -X OPTIONS "http://localhost:5000/api/auth/login" `
  -H "Origin: http://localhost:5173" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: content-type"
```

**Resultado obtenido:**
```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-API-Key
Access-Control-Max-Age: 86400
```

---

## 12. Paso 11. Ejecución de Pruebas y Evidencias de Validación

Para ejecutar las suites completas:

```bash
# 1. Pruebas oficiales del Bloque 11 (26 pruebas: 25 del Paso 8 + CORS)
npm run test:bloque11

# 2. Pruebas de regresión del Bloque 8 (43 pruebas)
npm run test:bloque8

# 3. Pruebas del Laboratorio 11 (22 pruebas)
npm run test:lab11
```

### Resultados de Ejecución

```text
PASS tests/bloque11_veritas.test.ts (26 passed, 26 total)
PASS tests/bloque8_validacion.test.ts (43 passed, 43 total)
PASS tests/lab11.test.ts (22 passed, 22 total)
Total: 91 pruebas ejecutadas exitosamente (100% aprobado).
```

### Conclusión Técnica de Seguridad

1. **Express vs. RLS en PostgreSQL**:
   - Habilitar RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) en PostgreSQL no aísla las consultas si el backend se conecta con el rol superusuario `postgres` (el cual posee `rolbypassrls = true`).
   - Por esta razón, la seguridad de Veritas AI está garantizada de forma autónoma en la capa de aplicación (Express) mediante:
     - Verificación estricta de firma criptográfica y claim `vs` en `autenticarJWT`.
     - Control de acceso basado en roles (RBAC) en `autorizarRoles`.
     - Validación de propiedad de autor en recursos sensibles para mitigar vulnerabilidades BOLA/IDOR (Broken Object Level Authorization).
2. **Desacoplamiento Seguro**:
   - El inicio de sesión (`/api/auth/login`) y la consulta de recursos propios (`/api/revisiones/mis-revisiones`) operan sin exponer la API Key en el cliente de React + Vite.
   - Las operaciones privilegiadas de integración cliente-servidor continúan protegidas con `X-API-Key` y hash criptográfico en base de datos.
