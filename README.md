# Plagelio — Plataforma Integral de Detección de IA, Similitud y Mejora de Redacción

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748.svg)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/Tests-21%20Passed-emerald.svg)](https://jestjs.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 💡 ¿Qué es Plagelio? (En Breve)

**Plagelio** es una solución web integral y funcional de extremo a extremo inspirada en herramientas líderes del sector educativo y editorial como **Turnitin**, **Grammarly** y **QuillBot**. 

Evalúa la autenticidad estilística y académica de textos y documentos **.DOCX**, estimando la probabilidad de generación por inteligencia artificial mediante análisis estilométrico (perplejidad y burstiness), indexando coincidencias contra fuentes de acceso abierto distinguiendo citas legítimas de presunto plagio, y ofreciendo un asistente de reescritura ética que permite descargar el documento optimizado en formato nativo de Microsoft Word.

---

## 🚀 Inicio Rápido: Paso a Paso para Correr el Aplicativo

> [!IMPORTANT]
> **Prerrequisitos del Sistema:**
> - **Node.js**: Versión 18 o superior instalada.
> - **PostgreSQL**: Versión 14 o superior en ejecución en el puerto local predeterminado `5432` con una base de datos llamada `plagelio` (o las credenciales configuradas en tu `.env`).

---

### Paso 1: Configurar y Levantar el Backend (API & Base de Datos)

Abre tu primera terminal en la raíz del proyecto y ejecuta la siguiente secuencia de comandos:

```powershell
# 1. Navegar al directorio del backend
cd backend

# 2. Instalar todas las dependencias
npm install

# 3. Sincronizar el esquema de Prisma con PostgreSQL
npx prisma db push

# 4. Poblar la base de datos con las cuentas iniciales (Admin y Usuario Demo)
npm run seed

# 5. Iniciar el servidor backend en modo desarrollo
npm run dev
```

* **Estado esperado:** El servidor backend iniciará en: `http://localhost:5000` (API base en `http://localhost:5000/api`).

---

### Paso 2: Iniciar la Interfaz de Usuario (Frontend)

Abre una **segunda terminal** en la raíz del proyecto y ejecuta:

```powershell
# 1. Navegar al directorio del frontend
cd frontend

# 2. Instalar dependencias del cliente
npm install

# 3. Iniciar el servidor web de desarrollo Vite
npm run dev
```

* **Estado esperado:** La aplicación web estará disponible de inmediato en tu navegador en: `http://localhost:5173`.

---

### Paso 3: Ejecutar la Suite de Pruebas Automatizadas (21 Tests)

Para validar la integridad de la autenticación, roles, límite diario de 5 análisis, procesamiento de archivos Word y flujo sandbox de pagos, ejecuta en la terminal del backend:

```powershell
cd backend
npm test
```

* **Resultado esperado:** 21 pruebas de integración y unitarias superadas exitosamente (100% de efectividad).

---

## 🔑 Credenciales Predeterminadas para Pruebas (Seed)

El comando `npm run seed` inicializa de forma determinista las siguientes cuentas de prueba:

| Rol | Correo Electrónico | Contraseña | Privilegios y Funcionalidades |
| :--- | :--- | :--- | :--- |
| 👑 **ADMIN** | `admin@plagelio.com` | `Admin123!Secure*` | Panel administrativo exclusivo (`/admin`), métricas globales en tiempo real, auditoría de transacciones y gestión completa (CRUD) de usuarios del sistema. |
| 👤 **USER (Demo)** | `usuario@plagelio.com` | `User123!Secure*` | 5 análisis diarios gratuitos con contador en tiempo real, analizador de texto y archivos DOCX, y simulación de pase Premium Vitalicio por US$2. |

> [!TIP]
> En la página de **Inicio de Sesión** (`/login`) del Frontend, puedes hacer clic en los botones de acceso rápido o navegar a `/login?demo=admin` o `/login?demo=user` para que las credenciales se completen automáticamente.

---

## 📂 Estructura del Repositorio

```
plagelio/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # Modelos de datos: User, Analysis, AnalysisResult, AnalysisSource, Payment
│   │   └── seed.ts                  # Sembrado determinista del Administrador único y usuario demo
│   ├── src/
│   │   ├── config/                  # Variables de entorno (env.ts), cliente Prisma y Stripe
│   │   ├── controllers/             # Auth, Analysis, Writing, User CRUD y Payment/Sandbox
│   │   ├── middleware/              # JWT, RoleGuard (ADMIN/USER), DailyLimitGuard (5/día) y Multer DOCX
│   │   ├── routes/                  # /api/auth, /api/analyses, /api/writing, /api/users, /api/payments
│   │   ├── services/                # AIService (IA, similitud, reescritura), DocxService y PaymentService
│   │   ├── utils/                   # Motor lingüístico (burstiness, perplejidad, TTR) y corpus público
│   │   ├── app.ts                   # Middlewares globales, CORS y enrutador Express
│   │   └── server.ts                # Inicialización del servidor HTTP
│   ├── tests/                       # Suite de 21 pruebas automatizadas (Jest + Supertest)
│   │   ├── auth.test.ts             # Registro, login, hashing bcrypt y emisión de JWT
│   │   ├── roles.test.ts            # Bloqueo 403 a usuarios comunes y protección de endpoints admin
│   │   ├── dailyLimit.test.ts       # Control estricto de límite 5/día (HTTP 429) y pase Premium
│   │   ├── docxAndWriting.test.ts   # Parseo DOCX con mammoth y generación de documento_mejorado.docx
│   │   └── payments.test.ts         # Transacciones sandbox, estado PENDING y activación de Premium
│   ├── .env.example                 # Plantilla de variables de entorno seguras
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/              # QuickStartSection, Navbar, Sidebar, ModalCheckout, DiffViewer, ResultScoreCard
│   │   ├── context/                 # AuthContext (JWT y roles), ThemeContext (modo claro/oscuro)
│   │   ├── pages/                   # LandingPage, LoginPage, RegisterPage, UserDashboard, AnalyzerPage, HistoryPage, AdminDashboard
│   │   ├── services/                # Cliente API tipado (Axios/Fetch con multipart para DOCX)
│   │   ├── types/                   # Definiciones compartidas de TypeScript
│   │   ├── App.tsx                  # Enrutamiento protegido por autenticación y rol
│   │   ├── main.tsx
│   │   └── index.css                # Tailwind CSS y estilos de diseño
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── .gitignore                       # Exclusión estricta de node_modules, dist y archivos .env sensibles
└── README.md                        # Documentación técnica y guía de inicio
```

---

## 🛠️ Tecnologías Empleadas

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, GSAP + ScrollTrigger (coreografía de scroll), Lucide Icons, React Router DOM v6.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JSON Web Tokens (JWT), Bcryptjs, Multer.
- **Base de Datos**: PostgreSQL (Nativo local).
- **Procesamiento de Documentos DOCX**:
  - `mammoth`: Extracción de estructura tipográfica y párrafos desde archivos Word `.docx`.
  - `docx`: Compilación profesional y formateada del archivo descargable `documento_mejorado.docx`.
- **Pasarela de Pagos**: Stripe SDK (Test Mode) + Simulador Sandbox con confirmación criptográfica en backend.
- **Pruebas Automatizadas**: Jest, Supertest y ts-jest.

---

## 🧪 Cobertura de las 21 Pruebas Automatizadas

La suite de pruebas automatizadas garantiza la robustez del sistema frente a vulnerabilidades y casos de borde:

```
PASS tests/auth.test.ts (4 tests)
  ✓ Registro exitoso de nuevos usuarios con contraseña segura
  ✓ Rechazo de contraseñas débiles que no cumplen políticas de seguridad
  ✓ Login exitoso y emisión de token JWT firmado
  ✓ Rechazo de credenciales incorrectas

PASS tests/roles.test.ts (4 tests)
  ✓ Acceso concedido al Administrador único a endpoints /api/users
  ✓ Rechazo (HTTP 403 Forbidden) cuando un usuario normal intenta acceder a /api/users
  ✓ Rechazo de manipulación de payloads para auto-otorgarse rol ADMIN en el registro
  ✓ Protección contra auto-eliminación o desactivación del Administrador del sistema

PASS tests/dailyLimit.test.ts (4 tests)
  ✓ Permite realizar análisis sucesivos dentro del cupo diario (1 a 5)
  ✓ Bloqueo estricto con HTTP 429 Too Many Requests al alcanzar el 6to análisis
  ✓ Mensaje de error informativo invitando al usuario a desbloquear Premium
  ✓ Análisis ilimitados para usuarios con estado Premium activo sin importar la cuota

PASS tests/docxAndWriting.test.ts (4 tests)
  ✓ Extracción fiel de texto de un archivo .docx mediante mammoth
  ✓ Detección y sustitución de clichés lingüísticos respetando citas entrecomilladas
  ✓ Generación de documento_mejorado.docx compilado con la librería docx
  ✓ Descarga y consistencia de encabezados y párrafos reescritos

PASS tests/payments.test.ts (5 tests)
  ✓ Creación de intento de pago Sandbox en estado PENDING
  ✓ Rechazo simulado de tarjeta con fondos insuficientes sin modificar privilegios
  ✓ Aprobación de tarjeta válida, actualización de is_premium = true y registro en base de datos
  ✓ Verificación en backend que impide saltarse la pasarela mediante inyección en frontend
  ✓ Registro histórico inmutable de la transacción para auditoría contable
```

---

## 📋 Guía de Escenarios para Probar las Funcionalidades

### 1. Probar el límite de 5 análisis diarios (Usuario Gratuito)
1. Inicia sesión con el usuario demo: `usuario@plagelio.com` / `User123!Secure*`.
2. Ingresa a **Analizar Contenido** (`/analyzer`).
3. Realiza análisis sucesivos pegando fragmentos de texto.
4. Observa cómo el contador en el Navbar y la pantalla avanza (ej. `1/5`, `2/5`, ..., `5/5`).
5. Al intentar realizar el 6to análisis, el sistema responderá con un bloqueo amigable (HTTP 429):
   > *"Has alcanzado tus 5 análisis gratuitos de hoy. Obtén Premium para disfrutar de análisis ilimitados."*

### 2. Probar la Suscripción Premium Vitalicia (US$2)
1. Haz clic en el botón **"Obtener Premium ($2)"** ubicado en el Navbar o en el mensaje de límite diario.
2. Se abrirá el modal de pago seguro (Sandbox):
   - Selecciona la tarjeta **"Visa Éxito" (4242 •••• 4242)** para simular aprobación.
   - Presiona **"Completar Pago de Prueba ($2 USD)"**.
3. El backend validará la transacción, actualizará tu registro a `is_premium = true` y almacenará el comprobante en la tabla `payments`.
4. El indicador cambiará a **"⭐ Premium Vitalicio"** y podrás analizar sin ningún límite de cuota.
5. Puedes probar también la tarjeta **"Mastercard Fallo" (5555 •••• 5555)** para comprobar el manejo robusto de cobros declinados sin alterar los permisos del usuario.

### 3. Probar la Detección Estilométrica de IA
1. En el analizador, ingresa un texto generado por IA o contenido redactado por un humano.
2. El sistema calculará el porcentaje estimado de IA acompañado de una advertencia probabilística transparente:
   > *"Aviso: Este resultado es una estimación estadística probabilística y puede contener falsos positivos o falsos negativos."*
3. Observa los factores estilométricos detectados: `[Alta uniformidad]`, `[Patrones sintácticos repetitivos]`, `[Transiciones demasiado predecibles]` o `[Baja variabilidad léxica (Burstiness)]`.
4. Examina el desglose por párrafos coloreados según su nivel de probabilidad.

### 4. Probar el Índice de Similitud vs. Citas Académicas
1. En el mismo informe de resultados, revisa el **Índice de Similitud**.
2. El motor compara contra repositorios académicos y fuentes abiertas (Wikipedia, Dialnet, SciELO, UNESCO, BOE).
3. Muestra las fuentes y fragmentos coincidentes en paralelo, aclarando expresamente que una coincidencia no equivale a plagio cuando corresponde a citas textuales normalizadas o terminología científica estándar.

### 5. Probar el Asistente de Redacción y Descarga DOCX
1. En la tarjeta de resultados del análisis, presiona **"Mejorar Redacción"**.
2. La aplicación abrirá un visor comparativo de dos columnas (Original vs. Versión Mejorada).
3. Comprueba que las citas entrecomilladas o referencias no hayan sido alteradas.
4. Presiona **"Descargar .DOCX"**: el sistema generará y descargará automáticamente el archivo `documento_mejorado.docx` listo para ser abierto en Microsoft Word o LibreOffice.

### 6. Probar el Panel Administrativo (ADMIN)
1. Cierra sesión e ingresa con las credenciales del Administrador: `admin@plagelio.com` / `Admin123!Secure*`.
2. Dirígete a **Panel Admin** (`/admin`).
3. Inspecciona las métricas globales del sistema (total de usuarios, análisis del día, suscripciones activas).
4. En la tabla de gestión de usuarios puedes crear usuarios, editar información, activar/desactivar accesos y alternar el estado Premium de cualquier cuenta. El sistema cuenta con protección activa para evitar que el Administrador sea eliminado o desactivado.
