# GUÍA MAESTRA DE EVIDENCIAS: BLOQUE 7.5.1 Y BLOQUE 8
## Proyecto: Veritas AI (Plataforma de Integridad Académica y Detección de IA)

Esta guía detalla con total precisión **dónde termina el Bloque 7.5.1** y **dónde comienza el Bloque 8**, qué capturas de pantalla debes tomar, qué herramientas utilizar (Terminal, Postman, Swagger UI, SQL Editor) y qué resultados deben verse en cada una.

---

## ÍNDICE RÁPIDO

1. [Línea Divisoria Clara: ¿Hasta dónde es el 7.5.1 y desde dónde es el 8?](#1-línea-divisoria-clara)
2. [EVIDENCIAS DEL BLOQUE 7.5.1 — Bootstrap Administrativo](#2-evidencias-del-bloque-751--bootstrap-administrativo)
   - [Evidencia 7.5.1-A: Terminal - Primera ejecución de `npm run seed:admin`](#evidencia-751-a-terminal---primera-ejecución)
   - [Evidencia 7.5.1-B: Terminal - Segunda ejecución (Idempotencia estricta)](#evidencia-751-b-terminal---segunda-ejecución)
   - [Evidencia 7.5.1-C: Base de Datos SQL - Registro único en `public.usuarios`](#evidencia-751-c-base-de-datos-sql)
   - [Evidencia 7.5.1-D: Terminal - Suite Automatizada `test:bloque7.5.1`](#evidencia-751-d-suite-automatizada)
3. [EVIDENCIAS DEL BLOQUE 8 — Validación Integral de la API (P01–P36 y SEG01–SEG08)](#3-evidencias-del-bloque-8--validación-integral-de-la-api)
   - [Evidencia 8-A: Terminal - Suite Automatizada `test:bloque8` (43/43 Tests)](#evidencia-8-a-terminal---suite-automatizada-bloque-8)
   - [Evidencia 8-B: Swagger / Postman - Autenticación y Registro (P01–P07)](#evidencia-8-b-autenticación-y-usuarios)
   - [Evidencia 8-C: Swagger / Postman - Estudiantes / Autores (P08–P14)](#evidencia-8-c-estudiantes--autores)
   - [Evidencia 8-D: Swagger / Postman - Docentes / Auditores (P15–P21)](#evidencia-8-d-docentes--auditores)
   - [Evidencia 8-E: Swagger / Postman - Laboratorios / Nodos (P22–P25)](#evidencia-8-e-laboratorios--nodos-de-cómputo)
   - [Evidencia 8-F: Swagger / Postman - Revisiones y Agenda (P26–P33)](#evidencia-8-f-revisiones-y-agenda)
   - [Evidencia 8-G: Swagger / Postman - Seguridad BOLA/IDOR y RBAC (P34–P36, SEG01–SEG08)](#evidencia-8-g-seguridad-bolaidor-y-rbac)
4. [Valores de Prueba Rápidos (Cheat Sheet)](#4-valores-de-prueba-rápidos-cheat-sheet)

---

## 1. Línea Divisoria Clara

| Bloque | Nombre Oficial | Qué Abarca Exclusivamente | Dónde Termina |
|---|---|---|---|
| **Bloque 7.5.1** | **Bootstrap Administrativo Desacoplado** | • Creación del script `src/scripts/crearAdmin.js`<br>• Eliminación del auto-arranque en `src/server.ts`<br>• Cierre de pool con `cerrarPool()`<br>• Transacción con advisory lock `pg_advisory_xact_lock(7505, 1)`<br>• Script `npm run seed:admin`<br>• Pruebas BA01–BA09 | **TERMINA AQUÍ:** Al demostrar que el administrador inicial se crea por comando de terminal independiente, sin duplicarse ni interferir con el arranque de Express (`server.ts`). |
| **Bloque 8** | **Validación Integral de la API** | • Verificación de las 43 pruebas funcionales y de seguridad<br>• Pruebas P01–P36 (Usuarios, Estudiantes, Docentes, Labs, Revisiones)<br>• Pruebas SEG-01–SEG-08 (Protección BOLA/IDOR, RBAC, API Key)<br>• Evidencias en Swagger UI / Postman de respuestas HTTP 200, 201, 400, 401, 403, 404, 409 | **COMIENZA AQUÍ:** En el momento en que se prueba la API en ejecución mediante Swagger, Postman o Jest, verificando endpoints y códigos HTTP. |

---

## 2. EVIDENCIAS DEL BLOQUE 7.5.1 — Bootstrap Administrativo

### Evidencia 7.5.1-A: Terminal - Primera ejecución
- **Herramienta:** Terminal (PowerShell / VS Code).
- **Comando:**
  ```powershell
  npm run seed:admin
  ```
- **Captura requerida:** La ventana de terminal mostrando el comando y la salida:
  ```text
  Iniciando bootstrap administrativo...
  Administrador inicial creado correctamente.
  ID del administrador: 1
  Bootstrap finalizado correctamente.
  ```
  *(Esta captura coincide exactamente con la imagen de WhatsApp proporcionada).*

---

### Evidencia 7.5.1-B: Terminal - Segunda ejecución (Idempotencia)
- **Herramienta:** Terminal.
- **Comando:** Ejecutar inmediatamente de nuevo el mismo comando:
  ```powershell
  npm run seed:admin
  ```
- **Captura requerida:** La terminal mostrando que **no crea duplicados**:
  ```text
  Iniciando bootstrap administrativo...
  Ya existe una cuenta administradora.
  No se realizaron modificaciones.
  Bootstrap finalizado correctamente.
  ```

---

### Evidencia 7.5.1-C: Base de Datos SQL - Registro único
- **Herramienta:** Supabase SQL Editor / pgAdmin / DBeaver / Terminal psql.
- **Consulta SQL a ejecutar:**
  ```sql
  SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.creado_en
  FROM public.usuarios u
  JOIN public.roles r ON r.id = u.rol_id
  WHERE r.nombre = 'administrador';
  ```
- **Captura requerida:** La tabla de resultados mostrando **una sola fila** correspondiente al administrador (ID 1, correo `admin@veritas.com`, rol `administrador`). Demuestra que no existen duplicados.

---

### Evidencia 7.5.1-D: Suite Automatizada BA01–BA09
- **Herramienta:** Terminal.
- **Comando:**
  ```powershell
  npm run test:bloque7.5.1
  ```
- **Captura requerida:** La pantalla verde de Jest confirmando **9 passed, 9 total** (BA01 a BA09).

---

## 3. EVIDENCIAS DEL BLOQUE 8 — Validación Integral de la API

> **Preparación Previa:**  
> Inicia el servidor backend en una terminal:
> ```powershell
> npm run dev:backend
> ```
> Abre tu navegador en Swagger UI: **`http://localhost:3000/api-docs`** (o utiliza Postman).

---

### Evidencia 8-A: Terminal - Suite Automatizada Bloque 8
- **Herramienta:** Terminal.
- **Comando:**
  ```powershell
  npm run test:bloque8
  ```
- **Captura requerida:** Terminal mostrando **43 passed, 43 total** con los grupos 8.1, 8.2, 8.3, 8.4, 8.5 y 8.6 todos en verde.

---

### Evidencia 8-B: Autenticación y Usuarios (P01–P07)
En Swagger UI o Postman, configurar la cabecera:
`X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0`

1. **P01 — Registro exitoso (201 Created):**
   - **Endpoint:** `POST /api/auth/registro`
   - **Body:**
     ```json
     {
       "nombre": "Carlos Estudiante",
       "email": "carlos.estudiante@veritas.com",
       "password": "PasswordSegura2026!"
     }
     ```
   - **Captura:** Respuesta `201 Created` con el objeto usuario (`rol: "user"`).

2. **P02 — Correo duplicado (409 Conflict):**
   - Enviar exactamente el mismo Body anterior otra vez.
   - **Captura:** Respuesta `409 Conflict`.

3. **P03 — Login correcto (200 OK y JWT):**
   - **Endpoint:** `POST /api/auth/login`
   - **Body:**
     ```json
     {
       "email": "carlos.estudiante@veritas.com",
       "password": "PasswordSegura2026!"
     }
     ```
   - **Captura:** Respuesta `200 OK` con la propiedad `"token": "eyJhbGciOi..."`.

4. **P04 — Contraseña errónea (401 Unauthorized):**
   - **Body:** Misma petición con contraseña incorrecta `"ClaveMala123"`.
   - **Captura:** Respuesta `401 Unauthorized`.

5. **P06 / P05 — Perfil sin JWT (401) y con JWT (200):**
   - `GET /api/auth/perfil` sin Authorization -> **401 Unauthorized**.
   - `GET /api/auth/perfil` con `Bearer <token>` -> **200 OK**.

6. **P07 — Intento de elevación de privilegio:**
   - `POST /api/auth/registro` enviando `"rol": "administrador"`.
   - **Captura:** El servidor responde `201 Created`, pero el campo asignado es estrictamente `"rol": "user"`.

---

### Evidencia 8-C: Estudiantes / Autores (P08–P14)
*Usar token JWT del administrador en el botón **Authorize** de Swagger o en Postman (`Bearer <tokenAdmin>`).*

1. **P08 — Crear Estudiante (201 Created):**
   - **Endpoint:** `POST /api/estudiantes` (o `/api/pacientes`)
   - **Body:**
     ```json
     {
       "nombre": "Mariana Gómez",
       "documento": "CC10203040",
       "email": "mariana.gomez@veritas.com",
       "telefono": "3001234567",
       "fechaNacimiento": "2000-03-15"
     }
     ```
   - **Captura:** Respuesta `201 Created` con el ID generado.

2. **P11 — Documento duplicado (409 Conflict):**
   - Reenviar con el mismo documento `"CC10203040"`.
   - **Captura:** Respuesta `409 Conflict`.

3. **P09 / P10 — Listar y Consultar por ID (200 OK):**
   - `GET /api/estudiantes` -> Lista con `total` y array de estudiantes.
   - `GET /api/estudiantes/1` -> Datos del estudiante 1.

4. **P14 — Eliminar estudiante con revisiones asociadas (409 Conflict):**
   - `DELETE /api/estudiantes/1` (el estudiante 1 tiene revisiones asociadas).
   - **Captura:** Respuesta `409 Conflict` ("No se puede eliminar porque tiene revisiones asociadas").

---

### Evidencia 8-D: Docentes / Auditores (P15–P21)

1. **P15 — Crear Docente válido (201 Created):**
   - **Endpoint:** `POST /api/docentes` (o `/api/medicos`)
   - **Body:**
     ```json
     {
       "nombre": "Dr. Fernando Ruiz",
       "registroAcademico": "DOC-AI-999",
       "email": "fernando.ruiz@veritas.com",
       "telefono": "3159876543",
       "departamentoId": 1
     }
     ```
   - **Captura:** Respuesta `201 Created`.

2. **P16 — Registro académico duplicado (409 Conflict):**
   - Reenviar con el mismo `"registroAcademico": "DOC-AI-999"`.
   - **Captura:** Respuesta `409 Conflict`.

3. **P17 — Listar Docentes (200 OK):**
   - `GET /api/docentes` -> Lista de docentes activos con su departamento.

4. **P21 — Eliminar docente con revisiones asociadas (409 Conflict):**
   - `DELETE /api/docentes/1`
   - **Captura:** Respuesta `409 Conflict`.

---

### Evidencia 8-E: Laboratorios / Nodos de Cómputo (P22–P25)

1. **P22 — Registrar Laboratorio (201 Created):**
   - **Endpoint:** `POST /api/laboratorios` (o `/api/consultorios`)
   - **Body:**
     ```json
     {
       "numero": "LAB-GPU-01",
       "piso": "Piso 3 - Clúster de Inferencia"
     }
     ```
   - **Captura:** Respuesta `201 Created`.

2. **P23 — Código duplicado (409 Conflict):**
   - Reenviar con el mismo `"numero": "LAB-GPU-01"`.
   - **Captura:** Respuesta `409 Conflict`.

3. **P24 — Actualización PATCH (200 OK):**
   - `PATCH /api/laboratorios/:id` con `{"piso": "Piso 4 - Nodo Cuántico"}`.
   - **Captura:** Respuesta `200 OK`.

4. **P25 — Eliminar laboratorio con revisiones asociadas (409 Conflict):**
   - `DELETE /api/laboratorios/1`
   - **Captura:** Respuesta `409 Conflict`.

---

### Evidencia 8-F: Revisiones y Agenda (P26–P33)

1. **P26 — Crear Revisión de Documento válida (201 Created):**
   - **Endpoint:** `POST /api/revisiones` (o `/api/citas`)
   - **Body:**
     ```json
     {
       "estudiante_id": 1,
       "docente_id": 1,
       "laboratorio_id": 1,
       "fecha": "2026-12-15",
       "hora": "10:00:00",
       "motivo": "Revisión pericial de similitud y antiplagio de tesis"
     }
     ```
   - **Captura:** Respuesta `201 Created` (`estado: "programada"`).

2. **P29 — Solapamiento de Docente (409 Conflict):**
   - Enviar otra revisión para el **mismo docente (1)** en la **misma fecha y hora** (`2026-12-15 10:00:00`), pero para otro estudiante.
   - **Captura:** Respuesta `409 Conflict` ("El docente ya tiene una revisión programada").

3. **P30 — Solapamiento de Laboratorio (409 Conflict):**
   - Enviar otra revisión para el **mismo laboratorio (1)** en la **misma fecha y hora**, pero con otro docente.
   - **Captura:** Respuesta `409 Conflict` ("El laboratorio ya se encuentra reservado").

4. **P31, P32, P33 — Máquina de Estados de Revisión:**
   - **P31:** `PATCH /api/revisiones/:id/estado` enviando `{"estado": "confirmada"}` -> **200 OK**.
   - **P32:** `PATCH /api/revisiones/:id/estado` enviando `{"estado": "atendida"}` -> **200 OK**.
   - **P33:** `PATCH /api/revisiones/:id/estado` enviando `{"estado": "programada"}` -> **409 Conflict** (Transición ilegal desde `atendida`).

---

### Evidencia 8-G: Seguridad BOLA/IDOR y RBAC (P34–P36, SEG01–SEG08)

1. **P34 / SEG-02 — Protección BOLA / IDOR (403 Forbidden):**
   - El **Estudiante A** intenta consultar el detalle de una revisión que pertenece al **Estudiante B**:
   - `GET /api/revisiones/:id_de_B` con el JWT del Estudiante A.
   - **Captura:** Respuesta **`403 Forbidden`** ("No tiene autorización para acceder a esta revisión ajena").

2. **SEG-01 — Propiedad legítima (200 OK):**
   - El **Estudiante A** consulta su propia revisión:
   - `GET /api/revisiones/:id_de_A` con su propio JWT.
   - **Captura:** Respuesta **`200 OK`**.

3. **SEG-03 / SEG-04 — Mis Revisiones Filtradas:**
   - `GET /api/revisiones/mis-revisiones`
   - Con JWT de estudiante: devuelve únicamente las revisiones donde es autor.
   - Con JWT de docente: devuelve únicamente las revisiones donde es evaluador asignado.

4. **SEG-08 — Acceso Administrativo Global (200 OK):**
   - `GET /api/revisiones/:id` con el JWT del Administrador.
   - **Captura:** Respuesta **`200 OK`** (El administrador puede auditar cualquier revisión del campus).

5. **P35 — API Key Ausente (401 Unauthorized):**
   - Hacer cualquier petición a `/api/estudiantes` quitando la cabecera `X-API-Key`.
   - **Captura:** Respuesta **`401 Unauthorized`** ("API Key requerida").

---

## 4. Valores de Prueba Rápidos (Cheat Sheet)

| Concepto | Valor Configurado en el Sistema |
|---|---|
| **API Key Global** | `61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0` |
| **Cabecera API Key** | `X-API-Key` |
| **Correo Admin Bootstrap** | `admin@veritas.com` |
| **Clave Admin Bootstrap** | `SANTOTO_2026—2` |
| **URL Swagger UI** | `http://localhost:3000/api-docs` |
| **Comando Tests Bloque 7.5.1** | `npm run test:bloque7.5.1` |
| **Comando Tests Bloque 8** | `npm run test:bloque8` |
| **Comando Seed Admin** | `npm run seed:admin` |
