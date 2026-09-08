# Veritas AI — Plataforma Integral de Detección de IA, Similitud y Mejora de Redacción

Veritas AI es una solución completa y funcional de extremo a extremo (Frontend, Backend, Base de Datos, Autenticación, Procesamiento de Documentos DOCX, Detección de IA Probabilística, Índice de Similitud, Asistente de Redacción y Pasarela de Pagos), inspirada en herramientas líderes como Turnitin, Grammarly y QuillBot.

---

## 1. Estructura del Proyecto

```
veritas-ai/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # Modelos: User, Analysis, AnalysisResult, AnalysisSource, Payment
│   │   └── seed.ts                  # Sembrado inicial del Administrador único y usuario demo
│   ├── src/
│   │   ├── config/                  # Variables de entorno, Prisma y configuración Stripe
│   │   ├── controllers/             # Auth, Analysis, Writing, User CRUD, Payment/Sandbox
│   │   ├── middleware/              # JWT, RoleGuard (ADMIN/USER), DailyLimitGuard, Upload DOCX
│   │   ├── routes/                  # /api/auth, /api/analyses, /api/writing, /api/users, /api/payments
│   │   ├── services/                # AIService (IA, similitud, reescritura), DocxService, PaymentService
│   │   ├── utils/                   # Motor lingüístico (burstiness, perplejidad, TTR) y corpus público
│   │   ├── app.ts                   # Configuración de Express, CORS y middlewares
│   │   └── server.ts                # Inicialización del servidor HTTP
│   ├── tests/                       # 21 pruebas automatizadas (Jest + Supertest)
│   │   ├── auth.test.ts
│   │   ├── roles.test.ts
│   │   ├── dailyLimit.test.ts
│   │   ├── docxAndWriting.test.ts
│   │   └── payments.test.ts
│   ├── .env                         # Variables de entorno locales
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/              # Navbar, Sidebar, ModalCheckout, DiffViewer, ResultScoreCard
│   │   ├── context/                 # AuthContext, ThemeContext (claro/oscuro)
│   │   ├── pages/                   # LandingPage, LoginPage, RegisterPage, UserDashboard, AnalyzerPage, HistoryPage, AdminDashboard
│   │   ├── services/                # Cliente API tipado con JWT y multipart/form-data
│   │   ├── types/                   # Tipos compartidos en TypeScript
│   │   ├── App.tsx                  # Enrutamiento protegido por rol
│   │   ├── main.tsx
│   │   └── index.css                # Tailwind CSS
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── README.md
```

---

## 2. Tecnologías Empleadas

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM v6.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JSON Web Tokens (JWT), Bcryptjs, Multer.
- **Base de Datos**: PostgreSQL (Nativo local).
- **Procesamiento DOCX**:
  - `mammoth`: Extracción tipográfica y estructural de párrafos y títulos desde archivos .docx.
  - `docx`: Compilación y formateo profesional de `documento_mejorado.docx`.
- **Pasarela de Pagos**: Stripe SDK (Test Mode) + Simulador Sandbox con validación estricta en backend.
- **Pruebas Automatizadas**: Jest, Supertest y ts-jest.

---

## 3. Credenciales Predeterminadas (Seed)

| Rol | Correo Electrónico | Contraseña | Privilegios |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@veritas.ai` | `Admin123!Secure*` | Panel exclusivo, métricas globales, CRUD de usuarios |
| **USER** | `usuario@veritas.ai` | `User123!Secure*` | 5 análisis diarios (o desbloqueo Premium por US$2) |

---

## 4. Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js (v18 o superior)
- PostgreSQL 14+ en ejecución local (Puerto 5432)

### Paso A: Configuración del Backend y Base de Datos

1. Ingresa al directorio del backend:
   ```powershell
   cd backend
   ```

2. Instala dependencias:
   ```powershell
   npm install
   ```

3. Revisa o edita el archivo `.env`:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://postgres:admin123@localhost:5432/veritas_ai?schema=public"
   JWT_SECRET="veritas_ai_super_secret_jwt_token_key_change_in_production_998811"
   ADMIN_EMAIL="admin@veritas.ai"
   ADMIN_PASSWORD="Admin123!Secure*"
   FRONTEND_URL="http://localhost:5173"
   ```

4. Sincroniza el esquema con PostgreSQL y genera el cliente Prisma:
   ```powershell
   npx prisma db push
   ```

5. Ejecuta el sembrado de datos (crea el Administrador único y datos de prueba):
   ```powershell
   npx ts-node prisma/seed.ts
   ```

6. Inicia el servidor backend en modo desarrollo:
   ```powershell
   npm run dev
   ```
   *El servidor quedará disponible en:* `http://localhost:5000/api`

---

### Paso B: Puesta en Marcha del Frontend

1. En una nueva terminal, ingresa a la carpeta del frontend:
   ```powershell
   cd frontend
   ```

2. Instala las dependencias:
   ```powershell
   npm install
   ```

3. Inicia el servidor de desarrollo Vite:
   ```powershell
   npm run dev
   ```
   *La aplicación web estará disponible en:* `http://localhost:5173`

---

## 5. Ejecución de la Suite de Pruebas Automatizadas

El proyecto incluye 21 pruebas de integración y unitarias que validan la seguridad, autenticación, límites y lógica de negocio:

```powershell
cd backend
npm test
```

### Cobertura de las pruebas:
- `auth.test.ts`: Registro, validaciones de contraseña, login y emisión de JWT.
- `roles.test.ts`: Verificación de que `USER !== ADMIN`, bloqueo de endpoints administrativos para usuarios normales y rechazo de manipulación de payloads.
- `dailyLimit.test.ts`: Validación del límite de 5 análisis diarios para usuarios gratuitos (HTTP 429) y análisis ilimitados para usuarios Premium.
- `docxAndWriting.test.ts`: Extracción de archivos .docx, sustitución de clichés sin alterar citas y generación descargable de `documento_mejorado.docx`.
- `payments.test.ts`: Flujo seguro de pago sandbox, registro en estado `PENDING`, rechazo en fallos simulados y activación de Premium vitalicio solo tras verificación en backend.

---

## 6. Guía de Pruebas y Funcionalidades

### 1. Probar el límite de 5 análisis diarios (Usuario Gratuito)
1. Inicia sesión con `usuario@veritas.ai` (o regístrate con un nuevo usuario).
2. Dirígete a **Analizar Contenido** (`/analyzer`).
3. Realiza análisis sucesivos pegando texto.
4. Observa cómo el contador diario avanza (ej. `4/5 hoy`).
5. Al alcanzar el 5to análisis, el 6to intento mostrará el mensaje:
   > *"Has alcanzado tus 5 análisis gratuitos de hoy. Obtén Premium para disfrutar de análisis ilimitados."*
6. El límite se controla a nivel de backend en base de datos (`daily_analysis_count` y `last_analysis_date`) y se reinicia automáticamente con el nuevo día.

### 2. Probar la Suscripción Premium Vitalicia (US$2)
1. Haz clic en el botón **"Obtener Premium ($2)"** en el Navbar o en el modal que se abre al alcanzar el límite.
2. En el modal interactivo de pago:
   - Selecciona la tarjeta **"Visa Éxito" (4242 •••• 4242)** para simular una aprobación exitosa.
   - Presiona **"Completar Pago de Prueba ($2 USD)"**.
3. El backend verificará la transacción, actualizará tu cuenta con `is_premium = true` y registrará el pago en la tabla `payments`.
4. El badge del usuario cambiará inmediatamente a **"⭐ Premium Vitalicio"** y podrás realizar análisis ilimitados.
5. Puedes probar también la tarjeta **"Mastercard Fallo" (5555 •••• 5555)** para comprobar el manejo seguro de pagos rechazados sin alterar la cuenta.

### 3. Probar la Detección de IA y Explicación de Factores
1. Pega un texto o sube un documento.
2. El sistema calculará la probabilidad estimada de IA con una advertencia probabilística explícita:
   > *"Aviso: Este resultado es una estimación estadística probabilística y puede contener falsos positivos o falsos negativos."*
3. Observa las etiquetas de factores identificados, tales como `[Alta uniformidad]`, `[Patrones sintácticos repetitivos]`, `[Transiciones demasiado predecibles]` o `[Lenguaje genérico]`.
4. Revisa el desglose por párrafos con sus respectivos porcentajes y justificaciones estilométricas.

### 4. Probar el Índice de Similitud vs. Plagio
1. El informe desglosa el porcentaje de similitud con fuentes públicas (Wikipedia, Dialnet, SciELO, UNESCO, BOE).
2. Muestra los fragmentos coincidentes lado a lado.
3. Se aclara que la similitud no implica plagio automático, pues términos técnicos y citas legítimas producen coincidencias válidas.

### 5. Probar el Asistente de Redacción y Descarga DOCX
1. En el informe del análisis, presiona el botón **"Mejorar Redacción"**.
2. El sistema generará una versión optimizada en un visor de dos columnas (Original vs. Versión Mejorada).
3. Podrás:
   - **Copiar el texto mejorado** al portapapeles.
   - **Descargar el archivo TXT**.
   - **Descargar el archivo Word (.DOCX)** compilado profesionalmente con el nombre `documento_mejorado.docx`.
   - **Re-analizar la versión mejorada** para ver la comparativa de puntuaciones antes y después.

### 6. Probar el Panel Administrativo (ADMIN Único)
1. Inicia sesión como administrador: `admin@veritas.ai` / `Admin123!Secure*`.
2. Accede a **Panel Admin** (`/admin`).
3. Visualiza las tarjetas de métricas en tiempo real (total de usuarios, análisis realizados hoy, usuarios premium vs gratuitos).
4. En el directorio de usuarios puedes:
   - **Crear nuevos usuarios**.
   - **Editar datos**.
   - **Activar o desactivar cuentas** (con bloqueo para evitar que el admin se desactive a sí mismo).
   - **Otorgar o revocar Premium**.
   - **Eliminar usuarios** (con protección contra borrado del administrador).
