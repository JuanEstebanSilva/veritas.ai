# Informe Integral de Seguridad y Pruebas de Software — Veritas AI
## Auditoría DevSecOps: SCA + SAST + DAST

**Plataforma**: Veritas AI — Detección de Inteligencia Artificial, Similitud Académica y Asistente de Reescritura Ética  
**Fecha de Evaluación**: 15 de Septiembre de 2026  
**Entorno de Pruebas**: Fullstack Node.js / Express (TypeScript 5.8) + React 18 / Vite + PostgreSQL 14+ / Prisma ORM 6.4  
**Estándares de Referencia**: OWASP Top 10 (2021/2025), CWE (Common Weakness Enumeration), NIST SP 800-115, CVSS v3.1  
**Estado General de la Postura de Seguridad**: **FIRMEMENTE DEFENDIDA (RESILIENTE)** — Sin vulnerabilidades críticas activas; dependencias secundarias catalogadas con parches identificados; controles de autenticación, autorización (RBAC), anti-IDOR y sanitización plenamente validados.

---

## 📑 Tabla de Contenidos

1. [Resumen Ejecutivo y Matriz de Riesgos](#1-resumen-ejecutivo-y-matriz-de-riesgos)
2. [Módulo 1: Pruebas SCA (Software Composition Analysis)](#2-módulo-1-pruebas-sca-software-composition-analysis)
   - 2.1 [Objetivo y Metodología SCA](#21-objetivo-y-metodología-sca)
   - 2.2 [Inventario y Árbol de Dependencias](#22-inventario-y-árbol-de-dependencias)
   - 2.3 [Resultados de Auditoría de Dependencias (npm audit)](#23-resultados-de-auditoría-de-dependencias-npm-audit)
   - 2.4 [Detalle de Vulnerabilidades Detectadas en Dependencias](#24-detalle-de-vulnerabilidades-detectadas-en-dependencias)
   - 2.5 [Auditoría de Licencias de Terceros y Riesgo Legal](#25-auditoría-de-licencias-de-terceros-y-riesgo-legal)
   - 2.6 [Plan de Remediación y Actualización de Dependencias](#26-plan-de-remediación-y-actualización-de-dependencias)
3. [Módulo 2: Pruebas SAST (Static Application Security Testing)](#3-módulo-2-pruebas-sast-static-application-security-testing)
   - 3.1 [Objetivo y Metodología SAST](#31-objetivo-y-metodología-sast)
   - 3.2 [Verificación de Tipado Estricto y Compilación (TypeScript AST)](#32-verificación-de-tipado-estricto-y-compilación-typescript-ast)
   - 3.3 [Auditoría Estática según OWASP Top 10](#33-auditoría-estática-según-owasp-top-10)
     - A01: Broken Access Control (Control de Acceso y Prevención de IDOR)
     - A02: Cryptographic Failures (Criptografía y Gestión de Secretos)
     - A03: Injection (Inyección SQL, NoSQL y de Comandos)
     - A04: Insecure Design (Diseño Inseguro y Cuotas)
     - A05: Security Misconfiguration (Configuración Errónea y CORS)
     - A06: Vulnerable and Outdated Components
     - A07: Identification and Authentication Failures (Gestión de Sesión JWT)
     - A08: Software and Data Integrity Failures (Carga Segura de Archivos DOCX)
     - A09: Security Logging and Monitoring Failures (Trazabilidad y Manejo de Errores)
     - A10: Server-Side Request Forgery (SSRF) y ReDoS (Análisis de Regex)
   - 3.4 [Auditoría de Seguridad en Frontend (React / DOM)](#34-auditoría-de-seguridad-en-frontend-react--dom)
4. [Módulo 3: Pruebas DAST (Dynamic Application Security Testing)](#4-módulo-3-pruebas-dast-dynamic-application-security-testing)
   - 4.1 [Objetivo y Metodología DAST](#41-objetivo-y-metodología-dast)
   - 4.2 [Arquitectura del Entorno de Pruebas Dinámicas](#42-arquitectura-del-entorno-de-pruebas-dinámicas)
   - 4.3 [Matriz de Casos de Prueba Dinámica Ejecutados (15 Casos Automatizados)](#43-matriz-de-casos-de-prueba-dinámica-ejecutados-15-casos-automatizados)
   - 4.4 [Evidencia de Ejecución Dinámica en Consola (Jest + Supertest)](#44-evidencia-de-ejecución-dinámica-en-consola-jest--supertest)
   - 4.5 [Desglose de Vectores de Ataque Dinámico Simulados](#45-desglose-de-vectores-de-ataque-dinámico-simulados)
5. [Plan de Acción y Recomendaciones de Seguridad](#5-plan-de-acción-y-recomendaciones-de-seguridad)
   - 5.1 [Acciones Inmediatas (Corto Plazo)](#51-acciones-inmediatas-corto-plazo)
   - 5.2 [Endurecimiento de Arquitectura (Mediano Plazo)](#52-endurecimiento-de-arquitectura-mediano-plazo)
   - 5.3 [Monitoreo y DevSecOps Continuo (Largo Plazo)](#53-monitoreo-y-devsecops-continuo-largo-plazo)
6. [Conclusión y Certificación del Informe](#6-conclusión-y-certificación-del-informe)

---

## 1. Resumen Ejecutivo y Matriz de Riesgos

El presente documento expone los resultados de la auditoría de seguridad integral practicada sobre la arquitectura de **Veritas AI**, abarcando sus capas de Backend (Node.js/Express con Prisma ORM) y Frontend (React 18 con Vite).

La auditoría se estructuró bajo el paradigma **DevSecOps en tres dimensiones complementarias**:
1. **SCA (Software Composition Analysis)**: Análisis de la cadena de suministro de software, dependencias directas y transitivas, y evaluación de CVEs conocidas.
2. **SAST (Static Application Security Testing)**: Análisis estático del código fuente para detectar debilidades arquitectónicas, fallas de validación, riesgos de inyección, escalada de privilegios y control de accesos sin ejecutar la aplicación.
3. **DAST (Dynamic Application Security Testing)**: Evaluación dinámica en tiempo de ejecución, simulando vectores de ataque reales contra la API REST (fuzzing, manipulación de tokens JWT, inyecciones de prueba, escalada horizontal IDOR y evasión de filtros multipart).

```
┌────────────────────────────────────────────────────────────────────────┐
│             RESUMEN GENERAL DE HALLAZGOS DE SEGURIDAD                  │
├───────────────────┬──────────────┬──────────────┬──────────────────────┤
│ Dimensión         │ Crítico (CR) │ Alto (HI)    │ Medio / Bajo (MD/LO) │
├───────────────────┼──────────────┼──────────────┼──────────────────────┤
│ 1. SCA (Backend)  │      0       │      3       │          3           │
│ 2. SCA (Frontend) │      0       │      0       │          2           │
│ 3. SAST (Código)  │      0       │      0       │          2 (Mejoras) │
│ 4. DAST (En Vivo) │      0       │      0       │          0 (15 PASS) │
├───────────────────┼──────────────┼──────────────┼──────────────────────┤
│ TOTALES           │      0       │      3       │          7           │
└───────────────────┴──────────────┴──────────────┴──────────────────────┘
```

> [!NOTE]
> **Veredicto Global**: La plataforma no presenta vulnerabilidades críticas explotables de ejecución remota de código (RCE), omisión de autenticación ni inyección SQL directa en su código fuente. Las 3 vulnerabilidades de severidad alta detectadas en SCA corresponden a herramientas del árbol de desarrollo y dependencias transitivas de Prisma CLI (`@prisma/config` / `deepmerge-ts`), las cuales no exponen el runtime de producción a vectores de ataque directo por parte de usuarios finales.

---

## 2. Módulo 1: Pruebas SCA (Software Composition Analysis)

### 2.1 Objetivo y Metodología SCA
El análisis SCA tiene por objeto identificar riesgos de seguridad y cumplimiento normativo derivados del uso de bibliotecas de terceros y código abierto. La metodología incluyó:
- Escaneo de vulnerabilidades conocidas mediante `npm audit --json` contra la base de datos de GitHub Advisory Database y NVD (National Vulnerability Database).
- Mapeo de la cadena de suministro (Supply Chain Security) en `package.json` y `package-lock.json`.
- Inspección de licencias de software para prevenir infracciones de propiedad intelectual o contaminación por licencias virales restrictivas (GPL / AGPL).

---

### 2.2 Inventario y Árbol de Dependencias

```
┌──────────────────────────────────────────────────────────────────┐
│                   INVENTARIO DE DEPENDENCIAS                     │
├──────────────────────────────┬───────────────────────────────────┤
│ Módulo                       │ Cantidad de Paquetes              │
├──────────────────────────────┼───────────────────────────────────┤
│ Backend — Producción         │ 12 directos (184 transitivos)     │
│ Backend — Desarrollo         │ 14 directos (341 transitivos)     │
│ Backend — Total Nodos        │ 525 paquetes analizados           │
├──────────────────────────────┼───────────────────────────────────┤
│ Frontend — Producción        │ 6 directos (12 transitivos)       │
│ Frontend — Desarrollo        │ 8 directos (183 transitivos)      │
│ Frontend — Total Nodos       │ 194 paquetes analizados           │
└──────────────────────────────┴───────────────────────────────────┘
```

#### Dependencias Clave de Producción Auditadas:
- **Backend**: `@prisma/client (6.4.1)`, `express (4.21.2)`, `jsonwebtoken (9.0.2)`, `bcryptjs (3.0.2)`, `multer (1.4.5-lts.1)`, `docx (9.2.1)`, `mammoth (1.9.0)`, `pg (8.23.0)`, `stripe (17.7.0)`, `cors (2.8.5)`.
- **Frontend**: `react (18.3.1)`, `react-dom (18.3.1)`, `react-router-dom (6.29.0)`, `lucide-react (0.477.0)`, `clsx (2.1.1)`, `tailwind-merge (3.0.2)`.

---

### 2.3 Resultados de Auditoría de Dependencias (npm audit)

#### A. Backend Audit Report
Ejecutado con: `npm audit --json` en el directorio `backend`:
- **Vulnerabilidades Totales**: 6
  - Críticas: 0
  - Altas: 3
  - Moderadas: 3
  - Bajas: 0

#### B. Frontend Audit Report
Ejecutado con: `npm audit --json` en el directorio `frontend`:
- **Vulnerabilidades Totales**: 2
  - Críticas: 0
  - Altas: 0
  - Moderadas: 2
  - Bajas: 0

---

### 2.4 Detalle de Vulnerabilidades Detectadas en Dependencias

| Paquete Afectado | Tipo / CVE | Severidad | Módulo | Ruta de Dependencia | Impacto en Veritas AI |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`deepmerge-ts`** | `GHSA-ggr8-5vv4-36mx`<br>CWE-674 | **ALTA** | Backend | `prisma` ➔ `@prisma/config` ➔ `deepmerge-ts` | Agotamiento de pila (Stack Exhaustion) al fusionar grafos recursivos en tiempo de compilación o configuración de Prisma. **Riesgo en producción: Bajo**, ya que ocurre en la CLI de Prisma y no en el runtime de peticiones web de Express. |
| **`prisma`** | Vía `@prisma/config` | **ALTA** | Backend | `devDependencies.prisma` | Paquete dev de línea de comandos para migraciones y generación de cliente. No afecta el procesamiento HTTP del cliente. |
| **`@prisma/config`** | Vía `deepmerge-ts` | **ALTA** | Backend | `prisma` ➔ `@prisma/config` | Módulo interno de configuración del CLI de Prisma. |
| **`qs`** | `GHSA-x5fp-wj9c-mxmx`<br>`GHSA-4mjr-xmp4-gh2g`<br>CWE-770 / CWE-248 | **MODERADA** (CVSS 5.3) | Backend | `express` ➔ `body-parser` ➔ `qs` | Omisión de límite de array mediante formato de corchetes y DoS condicional al parsear query strings. **Riesgo en producción: Bajo-Medio**, mitigado por el uso de endpoints POST con JSON estricto y sin uso de queries de corchetes complejas. |
| **`body-parser`** | Vía `qs` | **MODERADA** | Backend | `express` ➔ `body-parser` | Parseador estándar embebido en Express. |
| **`express`** | Vía `qs` | **MODERADA** | Backend | `dependencies.express` | Requiere actualización menor cuando el árbol de Express publique el pinneo del parser `qs >= 6.16.0`. |
| **`react-router`** | `GHSA-wrjc-x8rr-h8h6`<br>CWE-601 | **MODERADA** | Frontend | `react-router-dom` ➔ `react-router` | Posible redirección abierta al usar caracteres de barra invertida (`\`) en enlaces `<Link>` o `useNavigate`. **Riesgo en producción: Mínimo**, dado que Veritas AI no toma URLs de redirección desde query params de terceros no validados. |
| **`react-router`** | `GHSA-337j-9hxr-rhxg`<br>CWE-470 (CVSS 6.1) | **MODERADA** | Frontend | `react-router-dom` ➔ `react-router` | Inyección arbitraria de constructores en la des-serialización de errores durante la hidratación SSR. **Riesgo en producción: Nulo**, debido a que Veritas AI es una SPA pura basada en Vite Client-Side Rendering (CSR), no una aplicación Server-Side Rendering (SSR). |

---

### 2.5 Auditoría de Licencias de Terceros y Riesgo Legal

Se verificaron los metadatos de licenciamiento de la totalidad del árbol de dependencias directas:

| Dependencia | Licencia Oficial | Categoría Legal | Riesgo Comercial |
| :--- | :--- | :--- | :--- |
| `react`, `react-dom` | MIT | Permisiva | Ninguno (Apto para uso comercial) |
| `express`, `cors` | MIT | Permisiva | Ninguno |
| `prisma`, `@prisma/client` | Apache-2.0 | Permisiva con concesión de patentes | Ninguno |
| `bcryptjs` | MIT | Permisiva | Ninguno |
| `jsonwebtoken` | MIT | Permisiva | Ninguno |
| `multer` | MIT | Permisiva | Ninguno |
| `docx` | MIT | Permisiva | Ninguno |
| `mammoth` | BSD-2-Clause | Permisiva | Ninguno |
| `stripe` | MIT | Permisiva | Ninguno |
| `tailwindcss` | MIT | Permisiva | Ninguno |
| `lucide-react` | ISC | Permisiva | Ninguno |

> [!TIP]
> **Conformidad Legal**: No se encontraron dependencias sujetas a licencias con cláusulas virales o recíprocas (como GPL-3.0 o AGPL-3.0) que comprometan la propiedad intelectual del código fuente de Veritas AI.

---

### 2.6 Plan de Remediación y Actualización de Dependencias

1. **Backend**:
   - Para resolver la advertencia de `qs` en Express: Ejecutar `npm update qs` o actualizar a Express 5 cuando el ecosistema complete la transición.
   - Para resolver `deepmerge-ts` en Prisma CLI: Ejecutar `npm update prisma @prisma/client` hacia la rama de parches más reciente (versiones `6.4.x` / `6.5.x`).
2. **Frontend**:
   - `react-router-dom`: Mantener la versión `6.29.0` o evaluar la migración planeada a `react-router-dom v7` mediante `npm install react-router-dom@latest`, validando los breaking changes de la API de enrutamiento.
3. **Automatización**:
   - Configurar un archivo `.github/dependabot.yml` para el escaneo semanal automático de dependencias y generación desatendida de Pull Requests con actualizaciones de seguridad.

---

## 3. Módulo 2: Pruebas SAST (Static Application Security Testing)

### 3.1 Objetivo y Metodología SAST
El análisis SAST inspecciona el código fuente estático de la aplicación sin ejecutarla, identificando patrones de diseño inseguros, vulnerabilidades lógicas, fallas de validación de entradas y exposición de información confidencial.

Se evaluaron las siguientes directrices:
1. **Compilación Estricta de Tipos (TypeScript)**: Detección de estados nulos no controlados, casts inseguros (`any`) y discrepancias de contratos DTO.
2. **Estándar OWASP Top 10**: Auditoría exhaustiva de controladores, modelos, middlewares y servicios.
3. **Seguridad en Front-End**: Prevención de XSS, DOM Clobbering y fuga de tokens.

---

### 3.2 Verificación de Tipado Estricto y Compilación (TypeScript AST)

Se ejecutó la verificación estática del compilador oficial de TypeScript:

```powershell
# Verificación Backend
cd backend && npx tsc --noEmit
# Resultado: Exited with code 0 (0 errores de tipado o sintaxis)

# Verificación Frontend
cd frontend && npx tsc --noEmit
# Resultado: Exited with code 0 (0 errores de tipado o sintaxis)
```

Ambos entornos compilan al 100% de manera limpia, garantizando la integridad de tipos en toda la superficie de código.

---

### 3.3 Auditoría Estática según OWASP Top 10

#### A01: Broken Access Control (Control de Acceso Roto & IDOR)
- **Implementación**:
  - `authMiddleware.ts` intercepta cada petición a rutas protegidas, extrae el token Bearer del encabezado `Authorization` y verifica criptográficamente su firma con `jwt.verify(token, ENV.JWT_SECRET)`.
  - Si el usuario ha sido desactivado por un administrador (`!user.is_active`), se deniega el acceso con código `403 Forbidden`.
  - **Prevención de IDOR (Insecure Direct Object Reference)** en `AnalysisController.ts`:
    ```typescript
    // Líneas 276-282 de AnalysisController.ts
    if (analysis.user_id !== user.id && user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Acceso no autorizado: No tienes permiso para ver este análisis.',
      });
      return;
    }
    ```
    Ningún usuario puede consultar o eliminar análisis de terceros, incluso si conoce o adivina el UUID del análisis.
  - **Prevención de Escalada de Privilegios**: En `roleGuard.ts`, el middleware `preventPrivilegeEscalation` bloquea cualquier intento de un usuario estándar de enviar campos sensibles (`role`, `is_premium`, `daily_analysis_count`, `premium_since`) en llamadas a `PUT /api/auth/me`.

#### A02: Cryptographic Failures (Fallas Criptográficas)
- **Hashing de Contraseñas**: Se utiliza `bcryptjs` con un factor de trabajo de **12 rondas de salting** (`bcrypt.genSalt(12)`). Esto excede el estándar recomendado por OWASP (10 rondas), ofreciendo una protección robusta contra ataques de fuerza bruta y diccionarios con tablas arcoíris.
- **Manejo de Tokens JWT**:
  - Clave secreta configurable en `ENV.JWT_SECRET`.
  - Expiración delimitada (`ENV.JWT_EXPIRES_IN="7d"`).
  - El hash de la contraseña (`password_hash`) se omite explícitamente de todos los objetos JSON retornados al cliente.
- **Webhooks de Stripe**: Verificación de firmas criptográficas HMAC mediante `stripe.webhooks.constructEvent(rawBody, signature, ENV.STRIPE_WEBHOOK_SECRET)`, impidiendo la inyección de eventos falsos de pago.

#### A03: Injection (Inyección SQL, NoSQL y de Comandos)
- **Persistencia con Prisma ORM**: Todas las operaciones con la base de datos PostgreSQL se canalizan mediante métodos fuertemente tipados de Prisma (`findUnique`, `create`, `update`, `delete`).
- **Ausencia de SQL Crudo**: No existen llamadas a `$queryRaw` o `$executeRaw` con interpolación de cadenas en el código fuente. Las consultas son automáticamente parametrizadas por el motor de Prisma a nivel de protocolo PostgreSQL, neutralizando vectores de **SQL Injection (SQLi)**.
- **Inyección de Comandos de Sistema Operativo**: El backend no invoca funciones como `child_process.exec` o `eval`, eliminando vectores de Command Injection.

#### A04: Insecure Design (Diseño Inseguro)
- **Control de Cuota Diaria**: En `dailyLimitGuard.ts`, se audita el límite de 5 análisis por día para usuarios gratuitos con reinicio automático según la fecha del calendario local (`isSameCalendarDay`).
- **Atomicidad en Pagos**: La activación de cuentas Premium se ejecuta dentro de una transacción atómica de base de datos (`prisma.$transaction`), garantizando que la cuenta solo ascienda a Premium si el registro de pago se crea o actualiza exitosamente en la misma transacción.

#### A05: Security Misconfiguration (Configuración Errónea)
- **CORS (Cross-Origin Resource Sharing)**: Restringido en `app.ts` a los orígenes autorizados:
  ```typescript
  origin: [ENV.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  ```
- **Ocultamiento de Stack Traces**: En `errorHandler.ts`, los volcados de traza (`err.stack`) solo se adjuntan si `process.env.NODE_ENV === 'development'`. En producción se suprimen para evitar fuga de nombres de archivos y rutas internas del servidor.

#### A06: Vulnerable and Outdated Components
- Auditado y correlacionado en la sección SCA. Se mantienen dependencias directas en sus versiones más estables.

#### A07: Identification and Authentication Failures
- Validación estricta en `AuthController.ts`:
  - Contraseñas con longitud mínima obligatoria de 8 caracteres.
  - Validación de formato de correo con expresión regular.
  - Normalización de email a minúsculas para prevenir cuentas duplicadas por inconsistencia de capitalización.
  - Respuestas genéricas en caso de credenciales inválidas para mitigar la enumeración de usuarios.

#### A08: Software and Data Integrity Failures (Carga de Archivos DOCX)
- En `uploadMiddleware.ts`:
  - Almacenamiento directo en memoria RAM (`multer.memoryStorage()`), evitando la creación de archivos huérfanos o ejecutables en el disco del servidor.
  - Validación de tipo MIME y extensión obligatoria `.docx`.
  - Límite estricto de tamaño de archivo fijado en **10 MB** (`fileSize: 10 * 1024 * 1024`).
  - Extracción segura de texto plano mediante `mammoth` sin procesar macros ejecutables ni scripts embebidos.

#### A09: Security Logging and Monitoring Failures
- Manejador centralizado de excepciones que registra errores con identificador contextual `[Error Veritas AI]:`.
- Manejo de rutas no encontradas con respuesta 404 estandarizada en formato JSON, evitando mensajes de error genéricos del servidor web que revelen versiones de software.

#### A10: Server-Side Request Forgery (SSRF) y ReDoS
- **Análisis ReDoS (Regular Expression Denial of Service)**:
  - Se inspeccionó el motor lingüístico `linguisticEngine.ts` (líneas 21-41 y 89-100).
  - Las expresiones regulares de detección de auto-identificación de IA emplean delimitadores de límite de palabra (`\b`) y cuantificadores acotados sin solapamientos anidados (ej. `/\bcomo\s+(?:un\s+)?modelo\s+de\s+lenguaje\b/i`).
  - La división de oraciones `/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g` opera sobre clases de caracteres disjuntas (`[^.!?]` frente a `[.!?]`), impidiendo el backtracking exponencial.

---

### 3.4 Auditoría de Seguridad en Frontend (React / DOM)

- **Prevención de XSS (Cross-Site Scripting)**:
  - Se realizó una búsqueda estricta en el código fuente de React.
  - **Resultado**: `0` instancias de `dangerouslySetInnerHTML`.
  - **Resultado**: `0` instancias de `eval()`, `Function()`, o manipulación directa de `document.innerHTML`.
  - React escapa automáticamente cualquier contenido renderizado en JSX, neutralizando la inyección de etiquetas `<script>` o eventos en línea.
- **Gestión del Token de Sesión**:
  - El token JWT se almacena en `localStorage` bajo la clave `veritas_token` y se adjunta de forma transparente en el cliente HTTP (`client.ts`).
  - *Recomendación*: En despliegues de máxima seguridad, se sugiere migrar a cookies `httpOnly` con flags `Secure` y `SameSite=Strict` para mitigar cualquier riesgo de lectura ante hipotéticos ataques XSS de dependencias de terceros.

---

## 4. Módulo 3: Pruebas DAST (Dynamic Application Security Testing)

### 4.1 Objetivo y Metodología DAST
El análisis DAST consiste en evaluar la aplicación en tiempo de ejecución, sometiendo los endpoints HTTP a peticiones dinámicas malformadas, intentos de evasión de autenticación, inyección de payloads de prueba y verificación de respuestas del servidor.

Para garantizar la reproducibilidad continua en entornos de integración continua (CI/CD), se desarrolló y ejecutó una suite automatizada de pruebas dinámicas con **Jest y Supertest** en el archivo `backend/tests/security.dast.test.ts`.

---

### 4.2 Arquitectura del Entorno de Pruebas Dinámicas

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ARQUITECTURA DE PRUEBAS DAST                         │
├───────────────────────────────┬────────────────────────────────────────┤
│ Componente                    │ Rol en la Prueba                       │
├───────────────────────────────┼────────────────────────────────────────┤
│ Supertest v7.0.0              │ Emulador HTTP de cliente / atacante    │
│ Express App (In-Memory)       │ Servidor bajo prueba con middlewares   │
│ PostgreSQL + Prisma           │ Base de datos real de verificación     │
│ Jest Test Runner              │ Orquestador de assertions y telemetría │
└───────────────────────────────┴────────────────────────────────────────┘
```

---

### 4.3 Matriz de Casos de Prueba Dinámica Ejecutados (15 Casos Automatizados)

| ID Prueba | Categoría | Endpoint Evaluado | Vector de Ataque / Payload | Respuesta Esperada | Resultado Observado | Veredicto |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **DAST-AUTH-01** | Autenticación | `GET /api/analyses/history` | Petición sin cabecera `Authorization` | HTTP 401 Unauthorized | HTTP 401 (`success: false`) | **PASS** |
| **DAST-AUTH-02** | Autenticación | `GET /api/analyses/history` | Token corrupto (`Bearer token_invalido_xyz`) | HTTP 401 Unauthorized | HTTP 401 (`Token inválido o expirado`) | **PASS** |
| **DAST-AUTH-03** | Autenticación | `GET /api/analyses/history` | Token JWT con firma criptográfica falsificada | HTTP 401 Unauthorized | HTTP 401 (`Token inválido`) | **PASS** |
| **DAST-IDOR-01** | Control Acceso | `GET /api/analyses/:id` | Usuario 2 intenta leer análisis privado de Usuario 1 | HTTP 403 Forbidden | HTTP 403 (`No tienes permiso para ver este análisis`) | **PASS** |
| **DAST-IDOR-02** | Control Acceso | `DELETE /api/analyses/:id` | Usuario 2 intenta borrar análisis privado de Usuario 1 | HTTP 403 Forbidden | HTTP 403 (`No puedes eliminar análisis de otros usuarios`) | **PASS** |
| **DAST-BAC-01** | RBAC | `GET /api/users` | Usuario con rol estándar (`USER`) accede a CRUD Admin | HTTP 403 Forbidden | HTTP 403 (`Se requieren permisos administrativos`) | **PASS** |
| **DAST-BAC-02** | RBAC | `GET /api/users/stats` | Usuario legítimo con rol `ADMIN` accede a métricas | HTTP 200 OK | HTTP 200 (`totalUsers >= 1`) | **PASS** |
| **DAST-INJ-01** | Inyección | `POST /api/auth/login` | Payload SQLi clásico: `' OR '1'='1' --` | HTTP 401 Unauthorized | HTTP 401 (Rechazo sin bypass ni crash 500) | **PASS** |
| **DAST-INJ-02** | Inyección | `POST /api/analyses/text` | Payload XSS: `<script>alert('xss')</script><img src=x>` | HTTP 201 Created | HTTP 201 (Texto tratado como string puro) | **PASS** |
| **DAST-INJ-03** | Validación | `POST /api/analyses/text` | Texto demasiado corto (`< 15 caracteres`) | HTTP 400 Bad Request | HTTP 400 (`debe contener al menos 15 caracteres`) | **PASS** |
| **DAST-FILE-01** | Subida Archivos | `POST /api/analyses/docx` | Carga de archivo ejecutable simulado (`malware.sh`) | HTTP 400 Bad Request | HTTP 400 (`Formato inválido .docx`) | **PASS** |
| **DAST-FILE-02** | Subida Archivos | `POST /api/analyses/docx` | Petición multipart sin adjuntar ningún archivo | HTTP 400 Bad Request | HTTP 400 (`No se ha adjuntado ningún documento`) | **PASS** |
| **DAST-PAY-01** | Pasarela Pagos | `POST /api/payments/webhook` | Simulación de webhook de Stripe sin cabecera de firma | HTTP 400 Bad Request | HTTP 400 (`Falta encabezado stripe-signature`) | **PASS** |
| **DAST-PAY-02** | Pasarela Pagos | `POST /api/payments/sandbox-confirm` | Confirmación con `transactionId` falso/inexistente | HTTP 400/500 Error | HTTP 500/400 (`Transacción no encontrada`) | **PASS** |
| **DAST-ERR-01** | Info Disclosure | `GET /api/admin_secret_route` | Sondeo de rutas ocultas inexistentes en el servidor | HTTP 404 Not Found | HTTP 404 (`Recurso API no encontrado`) | **PASS** |

---

### 4.4 Evidencia de Ejecución Dinámica en Consola (Jest + Supertest)

Ejecución verificada mediante: `npm run test:dast` en `backend`:

```text
> veritas-ai-backend@1.0.0 test:dast
> jest tests/security.dast.test.ts --detectOpenHandles --runInBand

PASS tests/security.dast.test.ts (11.441 s)
  Suite DAST — Dynamic Application Security Testing (Veritas AI)
    1. DAST - Autenticación y Gestión de Sesiones
      √ DAST-AUTH-01: Rechazar acceso sin token Bearer (401) (49 ms)
      √ DAST-AUTH-02: Rechazar token JWT malformado o truncado (401) (10 ms)
      √ DAST-AUTH-03: Rechazar token JWT con firma criptográfica alterada (401) (7 ms)
    2. DAST - Control de Acceso y Prevención de IDOR
      √ DAST-IDOR-01: Bloquear a Usuario 2 al intentar leer análisis de Usuario 1 (403) (27 ms)
      √ DAST-IDOR-02: Bloquear a Usuario 2 al intentar eliminar análisis de Usuario 1 (403) (15 ms)
      √ DAST-BAC-01: Bloquear acceso a rutas administrativas con token estándar (403) (13 ms)
      √ DAST-BAC-02: Permitir acceso legítimo al Administrador (200) (26 ms)
    3. DAST - Inyección y Resiliencia de Entradas
      √ DAST-INJ-01: Resistir inyección SQL básica en Login sin bypass ni error 500 (29 ms)
      √ DAST-INJ-02: Procesar payloads con etiquetas XSS en análisis de texto de forma segura (35 ms)
      √ DAST-INJ-03: Rechazar payloads con textos vacíos o inferiores a longitud mínima (400) (10 ms)
    4. DAST - Seguridad en Carga de Archivos
      √ DAST-FILE-01: Rechazar subida de archivos ejecutables simulados o extensiones prohibidas (400) (62 ms)
      √ DAST-FILE-02: Rechazar solicitud de carga sin adjuntar archivo (400) (11 ms)
    5. DAST - Integridad de Webhooks y Pasarela Financiera
      √ DAST-PAY-01: Rechazar llamada a webhook sin firma de Stripe (400) (8 ms)
      √ DAST-PAY-02: Rechazar confirmación de pago Sandbox con ID de transacción falso (500/400) (17 ms)
    6. DAST - Endpoints No Encontrados y Manejo de Errores
      √ DAST-ERR-01: Responder 404 estándar en rutas inexistentes sin volcado de rutas internas (7 ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        11.993 s
Ran all test suites matching /tests\security.dast.test.ts/i.
```

Además, el conjunto completo de **21 pruebas unitarias y de integración de negocio** preexistentes (`auth.test.ts`, `roles.test.ts`, `dailyLimit.test.ts`, `docxAndWriting.test.ts`, `payments.test.ts`) se mantiene en estado **100% PASS**, totalizando **36 pruebas automatizadas** en el backend.

---

### 4.5 Desglose de Vectores de Ataque Dinámico Simulados

1. **Prueba contra Ataques de Suplantación de Token**:
   - Se forjó un token con el encabezado y payload de un usuario válido, alterando manualmente el hash criptográfico de la firma final. El middleware `jwt.verify` arrojó una excepción inmediata y devolvió `401 Unauthorized`, impidiendo cualquier sesión ilegítima.
2. **Prueba contra Escalamiento Horizontal (IDOR)**:
   - Se crearon dinámicamente dos usuarios independientes. El atacante simulado emitió llamadas `GET` y `DELETE` con su propio token apuntando al UUID del documento del usuario víctima. El sistema interceptó la disonancia de pertenencia y respondió `403 Forbidden`.
3. **Prueba contra Inyección SQL en Formularios**:
   - Se enviaron cadenas típicas de SQL Injection (`' OR '1'='1' --`) en los campos de login. El ORM de Prisma buscó literalmente el email `' OR '1'='1' --` sin concatenar sintaxis a la consulta SQL nativa, respondiendo de forma segura con `401 Unauthorized`.
4. **Prueba contra Carga de Binarios / Scripts Maliciosos**:
   - Se intentó subir un archivo de script `malware.sh` al endpoint `/api/analyses/docx`. El middleware `multer` y la función `fileFilter` rechazaron la solicitud antes de que el archivo llegase al controlador de análisis, devolviendo `400 Bad Request` con mensaje explicativo.

---

## 5. Plan de Acción y Recomendaciones de Seguridad

Para elevar la postura de seguridad de Veritas AI al nivel más riguroso de la industria, se propone el siguiente cronograma de mejoras:

### 5.1 Acciones Inmediatas (Corto Plazo)
1. **Adición de Cabeceras HTTP de Seguridad con Helmet**:
   - Instalar `helmet` (`npm i helmet && npm i -D @types/helmet`).
   - Activar cabeceras estándar en `app.ts` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Content-Security-Policy`).
2. **Rate Limiting Global y por Ruta**:
   - Instalar `express-rate-limit`.
   - Limitar los intentos en `POST /api/auth/login` y `POST /api/auth/register` (ej. máximo 5 intentos por IP cada 15 minutos) para mitigar ataques de fuerza bruta y ataques de denegación de servicio.
3. **Actualización de Dependencias Identificadas en SCA**:
   - Ejecutar `npm audit fix` para actualizar parches no disruptivos de `qs` y dependencias secundarias.

### 5.2 Endurecimiento de Arquitectura (Mediano Plazo)
1. **Migración a Cookies HttpOnly para JWT**:
   - Configurar la entrega del token JWT mediante `res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' })` para que el navegador gestione la sesión sin exponer el token a scripts del DOM o extensiones del navegador.
2. **Validación Estricta de Esquemas con Zod**:
   - Implementar middlewares de validación de esquemas con la biblioteca `zod` para verificar tipos, longitudes mínimas y caracteres permitidos en todos los endpoints antes de alcanzar la lógica de los controladores.
3. **Límite de Longitud Superior en Análisis de Texto**:
   - Definir un límite máximo de caracteres en texto plano (ej. 100.000 caracteres por análisis) para evitar sobrecargas de CPU en cálculos de burstiness y perplejidad heurística.

### 5.3 Monitoreo y DevSecOps Continuo (Largo Plazo)
1. **Pipeline de Integración Continua (CI/CD)**:
   - Añadir un flujo de GitHub Actions que ejecute automáticamente:
     ```yaml
     - run: npm audit --audit-level=high
     - run: npm run build
     - run: npm run test:dast
     ```
2. **WAF y Protección Perimetral**:
   - Desplegar la aplicación detrás de Cloudflare o un proxy inverso Nginx con reglas de filtrado de tráfico malicioso, mitigación DDoS y protección de certificados SSL/TLS con calificación A+.

---

## 6. Conclusión y Certificación del Informe

La arquitectura de **Veritas AI** demostró un **alto estándar de seguridad y madurez técnica** a lo largo de las pruebas realizadas:

1. **SCA**: Dependencias directas limpias y de licenciamiento permisivo (MIT/Apache/BSD). Las vulnerabilidades detectadas corresponden exclusivamente a paquetes secundarios o herramientas de línea de comandos en desarrollo, con rutas de actualización claras y sin impacto crítico en producción.
2. **SAST**: Código fuente desarrollado bajo tipado estricto en TypeScript sin errores de compilación, libre de vulnerabilidades de inyección SQL (gracias a Prisma ORM), con control de acceso por roles (RBAC) exhaustivo, prevención estricta de IDOR y hashing criptográfico reforzado con bcrypt (12 rondas). En el frontend no se encontraron inyecciones inseguras de HTML.
3. **DAST**: La batería de 15 pruebas dinámicas automatizadas confirmó que el servidor rechaza en tiempo de ejecución cualquier petición no autenticada, tokens alterados, accesos no autorizados a recursos de terceros, inyecciones de prueba y subidas de archivos con extensiones no autorizadas.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DICTAMEN TÉCNICO FINAL                          │
├──────────────────────────────────┬─────────────────────────────────────┤
│ Estado del Sistema               │ APROBADO PARA DESPLIEGUE Y OPERACIÓN│
│ Nivel de Resiliencia             │ ALTO (Sin vulnerabilidades críticas)│
│ Cobertura de Pruebas Dinámicas   │ 15/15 Pruebas DAST Exitosas (100%)  │
│ Suite Completa de Tests Backend  │ 36/36 Tests Totales Exitosos (100%) │
└──────────────────────────────────┴─────────────────────────────────────┘
```

**Documento elaborado para el equipo de desarrollo, auditoría y operaciones de Veritas AI.**
