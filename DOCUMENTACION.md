# Veritas AI — Documentación del Proyecto

Plataforma inteligente para la **detección de autoría de Inteligencia Artificial**, **rastreo de plagio web en tiempo real con citas académicas** y **humanización ética de redacción**.

---

## 1. ¿Qué es y de qué se encarga el programa?

El programa se encarga de recibir textos o documentos Word (`.docx`) y realizar tres tareas principales:

1. **Detección de IA:** Analiza la cadencia, el ritmo oracional (*burstiness*), la variedad de vocabulario y la presencia de clichés para calcular qué probabilidad existe de que el texto haya sido generado por herramientas como ChatGPT, Claude o Gemini.
2. **Detección de Plagio en Vivo con Citas:** Toma las frases clave del texto y realiza búsquedas reales en internet para comprobar si fueron copiadas de páginas web, noticias o artículos. Si encuentra coincidencias, identifica la fuente original y genera automáticamente la referencia bibliográfica formal en formato **APA 7** e **IEEE**.
3. **Humanizador y Mejora de Redacción:** Reescribe el texto eliminando fórmulas robóticas, variando la longitud de las oraciones y enriqueciendo el vocabulario, reduciendo el índice de IA mientras preserva intactas las ideas, cifras y citas entre comillas. Permite descargar el resultado en Word (`.docx`) o texto plano (`.txt`).

---

## 2. ¿Cómo funciona el sistema?

El flujo de trabajo es muy sencillo y transparente:

```text
[Usuario pega texto o sube Word .docx]
                 │
                 ▼
     ┌───────────────────────┐
     │  Frontend (React)     │ ── Envía petición autenticada (JWT + X-API-Key)
     └───────────────────────┘
                 │
                 ▼
     ┌───────────────────────┐
     │  Backend (Node/Express)│
     └───────────────────────┘
         │               │
         ├───────────────┼───────────────┐
         ▼               ▼               ▼
 ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
 │  Motor NLP   │ │ Búsqueda Web │ │ Humanizador  │
 │  Detección   │ │  en Vivo     │ │  Estilístico │
 │  de IA real  │ │  (Google)    │ │  (Offline/IA)│
 └──────────────┘ └──────────────┘ └──────────────┘
         │               │               │
         └───────────────┼───────────────┘
                         ▼
     ┌───────────────────────────────────┐
     │ Base de Datos PostgreSQL (Prisma) │
     └───────────────────────────────────┘
```

1. **Entrada:** El usuario ingresa texto o sube un archivo `.docx` en el analizador.
2. **Procesamiento:**
   - El motor lingüístico mide métricas estadísticas reales (riqueza léxica, desviación de oraciones, clichés).
   - El motor de búsqueda consulta internet en tiempo real y extrae fuentes verídicas.
   - Si se solicita humanización, el asistente reestructura la sintaxis para darle cadencia humana.
3. **Salida:** El usuario ve un informe interactivo con porcentaje de IA, porcentaje de similitud web, fuentes con enlaces directos, citas APA/IEEE y el texto humanizado listo para copiar o exportar.

---

## 3. Estructura del Proyecto

El código está organizado de manera limpia y modular en dos partes principales:

```text
veritas-ai/
├── backend/                  # Servidor de aplicación y lógica de negocio
│   ├── prisma/               # Esquema de base de datos relacional y migraciones
│   ├── scripts/              # Herramientas CLI de ciberseguridad (cifrado de claves)
│   ├── src/
│   │   ├── config/           # Variables de entorno y conexión con Prisma
│   │   ├── controllers/      # Controladores HTTP (Auth, Análisis, Humanizador, Pagos)
│   │   ├── middleware/       # Seguridad (JWT, X-API-Key, límite diario, subidas)
│   │   ├── routes/           # Definición de rutas del servidor
│   │   ├── services/         # Servicios de IA, búsqueda web en vivo, DOCX, Stripe
│   │   └── utils/            # Motores de NLP, similitud, citas APA/IEEE y CryptoVault
│   └── tests/                # 48 pruebas unitarias, de integración y seguridad DAST
│
├── frontend/                 # Interfaz visual de usuario
│   ├── src/
│   │   ├── components/       # Componentes visuales (Analizador, DiffViewer, Modales)
│   │   ├── context/          # Estados globales (Autenticación, Tema, Notificaciones)
│   │   ├── pages/            # Vistas principales (Analyzer, Dashboard, Admin, Login)
│   │   └── services/         # Clientes de consumo HTTP hacia la API
│   └── index.html
│
├── DOCUMENTACION.md          # Esta documentación simplificada
└── README.md                 # Guía de inicio rápido
```

---

## 4. APIs Utilizadas

El sistema utiliza las siguientes APIs y servicios externos:

* **Google Serper API (`https://google.serper.dev/search`):** Búsqueda web ultrarrápida en Google en tiempo real para rastreo de plagio.
* **Google Custom Search JSON API:** Alternativa directa de búsqueda web mediante motor programable de Google.
* **Tavily Search API:** Proveedor complementario de búsqueda web profunda y académica.
* **Crossref & OpenAlex APIs:** APIs abiertas de literatura científica para enriquecer fuentes y metadatos bibliográficos.
* **OpenAI API (`gpt-4o-mini` / `gpt-4o`):** Opcional, para reescritura estilística avanzada si se configura en el backend.
* **Google Gemini API (`gemini-1.5-flash`):** Opcional, alternativa para reescritura de alta velocidad asistida por IA.
* **Stripe API:** Procesamiento de pagos seguros con tarjeta para la suscripción Premium (con simulador Sandbox incluido para pruebas locales sin costo).

---

## 5. Ciberseguridad y Protección de Secretos

Para que nadie pueda ver ni sustraer tus API keys ni la información sensible:

1. **Encriptación de Claves (CryptoVault AES-256-GCM):**
   - Todas las API keys en el archivo `.env` se almacenan encriptadas (`enc:iv:authTag:textoCifrado`).
   - El backend las descifra únicamente en memoria RAM al arrancar. Nadie que abra el archivo `.env` o mire tu pantalla podrá ver las claves en texto plano.
   - Para encriptar tus claves automáticamente, solo ejecutas:
     ```bash
     cd backend
     npm run vault:secure
     ```
   - Para verificar el estado de cifrado sin revelar secretos:
     ```bash
     cd backend
     npm run vault:check
     ```
2. **Hasheo de Contraseñas:** 
   - Todas las contraseñas de los usuarios se hashean con **bcrypt** y salting de costo 12 antes de persistir en la base de datos.
3. **Autenticación Dual:** 
   - Se requiere token **JWT** firmado + header de seguridad interno `X-API-Key` en cada petición hacia endpoints protegidos.
4. **Protección Anti-Fuga (Zero-Leak):** 
   - Ninguna respuesta JSON ni registro de consola imprime jamás una API key completa.
5. **Control de Límites (Rate Limiting & Daily Limit):** 
   - Límite estricto de 5 análisis diarios para usuarios gratuitos (ilimitado para usuarios Premium).

---

## 6. ¿Cómo subir todo a GitHub sin exponer claves?

El repositorio está blindado para que **NUNCA** se suban tus API keys ni credenciales:

1. **El archivo `.gitignore` ya está configurado:**
   - Bloquea `.env`, `**/.env`, `**/.env.*`, `node_modules`, certificados `*.key` y `*.pem`.
   - Solo se sube `.env.example`, que contiene únicamente nombres de variables con valores vacíos o de ejemplo.

2. **Pasos para subir a GitHub:**
   ```bash
   # 1. Comprobar que no haya ningún .env en el control de versiones
   git status

   # 2. Agregar los archivos modificados
   git add .

   # 3. Confirmar que .env NO está en la lista de archivos a subir
   git status

   # 4. Crear el commit
   git commit -m "feat: mejoras de ciberseguridad, busqueda web y optimizacion de nlp"

   # 5. Subir a tu repositorio
   git push origin <tu-rama>
   ```

---

## 7. Puesta en Marcha Rápida

### Requisitos:
* Node.js v18 o superior.
* PostgreSQL instalado y activo.

### Comandos de Ejecución:

```bash
# 1. Iniciar Base de Datos y Backend
cd backend
npm install
npx prisma db push
npm run vault:secure   # Encripta tus API keys en .env con AES-256-GCM
npm run dev            # Inicia en http://localhost:5000

# 2. Iniciar Frontend (en otra terminal)
cd frontend
npm install
npm run dev            # Inicia en http://localhost:5173
```

### Ejecutar Pruebas Automatizadas:
```bash
cd backend
npm test               # Corre las 48 pruebas unitarias y de seguridad
```
