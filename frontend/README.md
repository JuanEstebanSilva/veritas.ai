# Plagelio — Frontend Web SPA (React + Vite + TypeScript)

Interfaz de usuario moderna, reactiva y segura para la plataforma de integridad académica, detección de inteligencia artificial y auditoría de documentos **Plagelio**.

Desarrollada como una **Single Page Application (SPA)** con **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **Framer Motion** y **Lucide React**. Se comunica mediante peticiones asíncronas HTTP/JSON con la API REST del backend utilizando tokens **JWT Bearer**, ofreciendo paneles especializados para estudiantes/autores y administradores.

---

## 🎨 1. Arquitectura y Tecnologías del Frontend

```text
Navegador Web (Chrome, Edge, Firefox)
         │
         ▼ Servidor de Desarrollo Vite (http://localhost:5173)
┌─────────────────────────────────────────────────────────────────┐
│                    React 18 + Vite + TypeScript                 │
├─────────────────────────────────────────────────────────────────┤
│ 1. Enrutamiento y Protección de Navegación                      │
│    - React Router DOM 6/7                                       │
│    - Layouts Protegidos: AppLayout (Usuarios) y AdminLayout     │
│    - Redirección automática ante sesiones inválidas o expiradas │
├─────────────────────────────────────────────────────────────────┤
│ 2. Gestión de Estado Global y Contextos                         │
│    - AuthContext: Estado de autenticación, JWT, roles y sesión │
│    - ThemeContext: Modo Claro / Oscuro con persistencia local   │
├─────────────────────────────────────────────────────────────────┤
│ 3. Módulos y Páginas de Negocio                                 │
│    - LandingPage: Portal público institucional y planes         │
│    - LoginPage / RegisterPage: Formularios con validación       │
│    - UserDashboard: Panel del estudiante, métricas de IA y citas│
│    - AdminDashboard: Gestión de usuarios, roles y métricas      │
│    - AnalyzerPage: Carga de documentos (.DOCX/.PDF) y texto     │
│    - HistoryPage: Historial cronológico de análisis realizados  │
├─────────────────────────────────────────────────────────────────┤
│ 4. Capa de Servicios y Comunicación HTTP                        │
│    - client.ts: Cliente centralizado con fetch y Bearer JWT     │
│    - Endpoints modulares: auth, admin, analysis, writing, pay   │
├─────────────────────────────────────────────────────────────────┤
│ 5. Experiencia de Usuario y Animaciones                        │
│    - Tailwind CSS + Tokens de diseño suizo editorial            │
│    - Framer Motion para transiciones suaves de página           │
│    - Efectos sonoros de accesibilidad (Web Audio API)          │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼ HTTP JSON + Authorization: Bearer <token>
Backend API REST (http://localhost:5000/api)
```

---

## 📋 2. Requisitos Previos

- **Node.js**: Versión `18.x` o superior (`node -v`).
- **npm**: Versión `9.x` o superior (`npm -v`).
- Backend de Plagelio corriendo en `http://localhost:5000`.

---

## ⚙️ 3. Configuración del Entorno (`.env`)

Crea tu archivo `.env` en la raíz de `frontend/` a partir de `.env.example`:

```bash
cp .env.example .env
```

### Contenido de `.env`:

```dotenv
# URL base de la API REST del backend de Plagelio
VITE_API_URL=http://localhost:5000/api
```

> [!CAUTION]
> **Regla de Seguridad Fundamental en el Frontend:**
> Las variables que comienzan con `VITE_` son públicas y quedan expuestas en el código cliente empaquetado para el navegador.
> **NUNCA** coloques contraseñas, claves secretas (`JWT_SECRET`), URLs de base de datos (`DATABASE_URL`) ni API Keys confidenciales en este archivo.

---

## 🚀 4. Instalación y Ejecución

Ejecuta los siguientes comandos en tu terminal dentro del directorio `frontend/`:

```powershell
# 1. Instalar dependencias del cliente
npm install

# 2. Verificar tipos y reglas de TypeScript
npx tsc --noEmit

# 3. Iniciar el servidor web de desarrollo Vite
npm run dev
```

* **Aplicación disponible de inmediato en:** `http://localhost:5173`

---

## 📁 5. Anatomía de Componentes y Páginas

| Ruta / Archivo | Responsabilidad y Función |
|---|---|
| `index.html` | Documento raíz que monta el nodo `#root` y carga tipografías institucionales. |
| `src/main.tsx` | Punto de entrada; envuelve la aplicación en `BrowserRouter`, `ThemeProvider` y `AuthProvider`. |
| `src/App.tsx` | Declaración central de rutas, layouts protegidos y modales globales. |
| `src/context/AuthContext.tsx` | Control del ciclo de vida de sesión, token JWT en `localStorage` y expiración. |
| `src/context/ThemeContext.tsx` | Proveedor del tema visual (Light / Dark) y contraste. |
| `src/pages/LandingPage.tsx` | Página de bienvenida, explicación de autenticidad y acceso a la plataforma. |
| `src/pages/LoginPage.tsx` | Formulario de acceso con política de contraseñas y redirección según rol. |
| `src/pages/RegisterPage.tsx` | Registro público de nuevos autores y estudiantes con medidor de seguridad. |
| `src/pages/UserDashboard.tsx` | Dashboard con indicadores clave: índice de IA, similitud, histórico y cuotas. |
| `src/pages/AdminDashboard.tsx` | Gestión institucional de cuentas: creación de usuarios, roles, activación y KPIs. |
| `src/pages/AnalyzerPage.tsx` | Panel de escaneo de texto en tiempo real y subida de archivos `.docx` y `.pdf`. |
| `src/pages/HistoryPage.tsx` | Auditoría de revisiones previas con visualización de diferencias y reportes. |
| `src/services/api/client.ts` | Envoltorio HTTP que inyecta automáticamente `Authorization: Bearer <token>` y gestiona errores 401/403. |
| `src/utils/passwordPolicy.ts` | Validador estricto de contraseñas de al menos 12 caracteres con complejidad alta. |
| `src/utils/soundEffects.ts` | Respuestas auditivas sutiles ante acciones exitosas o errores (Web Audio API). |

---

## 🔒 6. Medidas de Seguridad en el Frontend

1. **Gestión Segura de Tokens JWT**:
   - El token de sesión se almacena bajo la clave `plagelio_token`.
   - Se inyecta exclusivamente mediante la cabecera estándar `Authorization: Bearer <token>` en peticiones al backend.
   - Ante cualquier respuesta HTTP `401 Unauthorized` (sesión revocada por cambio de clave o expiración), la sesión se limpia automáticamente y el usuario es redirigido a `/login`.

2. **Control de Rutas por Rol (RBAC Visual)**:
   - Rutas administrativas (`/admin`) están restringidas a usuarios con rol `ADMIN`.
   - Si un usuario estándar intenta ingresar, se le deniega el acceso visual y se le redirige al dashboard.
   - *Nota de seguridad*: La protección visual en el cliente se complementa obligatoriamente con la verificación en el backend mediante el middleware `roles.middleware`.

3. **Neutralización de Ataques XSS**:
   - Todo el contenido renderizado utiliza el escape automático de React (`JSX`).
   - No se utiliza `dangerouslySetInnerHTML` para contenido suministrado por el usuario sin sanitización.
   - Los archivos subidos son validados por tipo MIME y extensión antes de su envío.

---

## 🛠️ 7. Compilación para Producción

Para compilar el proyecto y generar los artefactos finales listos para despliegue en un servidor estático (Nginx, Netlify, Vercel, Firebase Hosting):

```powershell
# Generar versión optimizada de producción
npm run build

# Previsualizar localmente los archivos compilados en dist/
npm run preview
```

> **Verificación**: `npm run build` compila con Vite y TypeScript en menos de 20 segundos sin advertencias críticas ni errores.

