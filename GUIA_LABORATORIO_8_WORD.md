# Laboratorio No. 8 — Construcción del Proyecto (Veritas AI)
## Control del Rol y Prevención de Escalada de Privilegios (Bloque 4B)
### Guía Paso a Paso para la Documentación en Microsoft Word

---

## 📌 1. Resumen de la Implementación en Veritas AI

En este laboratorio se integró una **estrategia de defensa en profundidad (Defense in Depth)** en **Veritas AI** para proteger el sistema contra ataques de **Escalada de Privilegios (Privilege Escalation)** y **Asignación Masiva (Mass Assignment)**.

### Arquitectura de Dos Barreras de Seguridad:

```
[ Petición del Cliente / Atacante ]
  (role: "ADMIN", is_active: false, is_premium: true, esSuperAdmin: true, id: 9999)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 1ª BARRERA: Validador + Allowlisting                        │
│ (src/middleware/authValidator.ts)                          │
│                                                             │
│ • Valida formato de nombre, email y contraseña.             │
│ • Se eliminó completamente "role" / "rol" del validador.    │
│ • matchedData(req, { locations: ['body'] }) extrae          │
│   ÚNICAMENTE los campos permitidos del contrato.            │
│ • Desaparecen: role ❌, is_active ❌, esSuperAdmin ❌      │
└─────────────────────────────────────────────────────────────┘
                           │ (datos sanitizados)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2ª BARRERA: Capa de Servicio (Valores del Servidor)         │
│ (src/services/usuarios.service.ts)                         │
│                                                             │
│ • No confía en lo que envíe el cliente ni el controlador.   │
│ • Fija explícitamente en el registro:                       │
│     role: Role.USER (rol: "user")       <- SERVIDOR         │
│     is_active: true                     <- SERVIDOR         │
│     is_premium: false                   <- SERVIDOR         │
│ • Genera hash seguro con bcrypt (coste 12 y salt propio).   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
[ Usuario creado de forma segura en PostgreSQL / Prisma con rol USER ]
```

---

## 🛠️ 2. Archivos del Backend Configurados para Veritas AI

1. **`backend/src/middleware/authValidator.ts`**:
   - `validarRegistro`: Valida `nombre` / `name`, `email` y `password` (10 a 72 caracteres). **Se eliminó completamente la validación de rol**.
   - `validarLogin`: Valida `email` y `password`.
   - `verificarErroresValidacion`: Si hay fallas de validación, responde `400 Bad Request`.
2. **`backend/src/services/usuarios.service.ts`**:
   - Capa de servicio desacoplada. En `crearUsuario`, fuerza de forma inmutable `role: Role.USER` e `is_active: true`.
3. **`backend/src/controllers/AuthController.ts`**:
   - Implementa `matchedData(req, { locations: ['body'] })` (Allowlisting) y delega la creación en `usuariosService`.
4. **`backend/src/routes/authRoutes.ts`**:
   - Rutas `/api/auth/register`, `/api/auth/registro` y `/api/auth/login` protegidas por el validador y middleware de roles.
5. **`backend/src/docs/authSwagger.ts`**:
   - Documentación OpenAPI donde `RegistroUsuario` no incluye rol y se detalla: *"El rol es asignado por el servidor y no puede ser definido por el cliente"*.
6. **`backend/tests/lab8.test.ts`**:
   - 7 pruebas dinámicas automatizadas (100% PASS) para validar el Checkpoint del Bloque 4B con dominio `@veritas.ai`.

---

## 📋 3. Guía Paso a Paso para Documentar en Word (Postman o Swagger)

> [!NOTE]
> Para ejecutar las pruebas, levanta el backend en una terminal:
> ```bash
> cd backend
> npm run dev
> ```
> - Servidor API: `http://localhost:5000`
> - Documentación Swagger UI: `http://localhost:5000/api/docs`
>
> **Credencial de Cliente (API Key - Lab 6)**:
> - En Postman, agrega en Headers: `X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0`
> - En Swagger UI, pulsa el botón **Authorize** (arriba a la derecha), pega `61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0` y pulsa **Authorize**.

---

### CASO 1: Registro Normal en Veritas AI (Prueba Base)

* **Objetivo en Word**: Demostrar que un nuevo usuario se registra sin enviar rol, y el servidor le asigna automáticamente el rol estándar de Veritas AI (`user` / `Role.USER`).
* **Método**: `POST`
* **URL**: `http://localhost:5000/api/auth/registro` (o `/api/auth/register`)
* **Headers**:
  ```http
  Content-Type: application/json
  X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0
  ```
* **Body (JSON)**:
  ```json
  {
    "nombre": "Estudiante Veritas",
    "email": "estudiante@veritas.ai",
    "password": "ClaveSegura2026!"
  }
  ```
* **Respuesta Esperada (`201 Created`)**:
  ```json
  {
    "success": true,
    "mensaje": "Usuario registrado correctamente",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "usuario": {
      "id": "c1f7a08b-...",
      "nombre": "Estudiante Veritas",
      "email": "estudiante@veritas.ai",
      "rol": "user",
      "activo": true
    }
  }
  ```
* **Captura para el Word**:
  - Captura de Postman o Swagger mostrando `201 Created` y el cuerpo devuelto con `rol: "user"` y `activo: true`.
* **Texto explicativo para el Word**:
  > *"En esta prueba se envió un registro legítimo sin especificar rol. El servidor validó los campos permitidos y asignó automáticamente el rol base (`'user'`) y el estado activo (`true`). El cliente nunca tuvo control sobre estos atributos."*

---

### CASO 2: Intento de Escalada de Privilegios a Administrador (Ataque 1)

* **Objetivo en Word**: Demostrar que el servidor neutraliza el intento de un atacante de autoasignarse permisos administrativos (`role: "ADMIN"` / `rol: "administrador"`), desactivarse o inyectar flags de superusuario.
* **Método**: `POST`
* **URL**: `http://localhost:5000/api/auth/registro`
* **Headers**:
  ```http
  Content-Type: application/json
  X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0
  ```
* **Body (JSON)**:
  ```json
  {
    "nombre": "Usuario Ataque",
    "email": "ataque@veritas.ai",
    "password": "ClaveSegura2026!",
    "rol": "administrador",
    "role": "ADMIN",
    "activo": false,
    "esSuperAdmin": true
  }
  ```
* **Respuesta Esperada (`201 Created`)**:
  ```json
  {
    "success": true,
    "mensaje": "Usuario registrado correctamente",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "usuario": {
      "id": "e2d8b19a-...",
      "nombre": "Usuario Ataque",
      "email": "ataque@veritas.ai",
      "rol": "user",
      "activo": true
    }
  }
  ```
* **Tabla comparativa para el Word**:
  | Atributo Enviado por Atacante | Valor Persistido por el Servidor | Resultado de Seguridad |
  | :--- | :--- | :--- |
  | `rol: "administrador"` / `role: "ADMIN"` | `rol: "user"` (`Role.USER`) | ❌ Escalada neutralizada |
  | `activo: false` | `activo: true` | ❌ Manipulación neutralizada |
  | `esSuperAdmin: true` | *Descartado* | ❌ Campo inexistente |
* **Captura para el Word**:
  - Captura del Request y Response mostrando que el usuario fue creado pero con `rol: "user"` y `activo: true`.
* **Texto explicativo para el Word**:
  > *"El atacante intentó forzar privilegios administrativos en el registro público. Gracias a la 1ª Defensa (Allowlisting con matchedData) y a la 2ª Defensa (Capa de Servicio), los atributos no autorizados fueron ignorados y el rol se fijó de manera estricta como `'user'`. Se responde 201 Created porque bajo allowlisting los campos fuera de contrato simplemente se descartan sin revelar la estructura interna del sistema."*

---

### CASO 3: Ataque de Mass Assignment Masivo (Ataque 2)

* **Objetivo en Word**: Probar la resiliencia del sistema ante una inyección múltiple de atributos privilegiados (`id`, `passwordHash`, `permisos`, `esSuperAdmin`).
* **Método**: `POST`
* **URL**: `http://localhost:5000/api/auth/registro`
* **Headers**:
  ```http
  Content-Type: application/json
  X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0
  ```
* **Body (JSON)**:
  ```json
  {
    "nombre": "Ataque Mass Assignment",
    "email": "mass@veritas.ai",
    "password": "ClaveSegura2026!",
    "id": 9999,
    "rol": "administrador",
    "role": "ADMIN",
    "activo": false,
    "passwordHash": "HASH_CONTROLADO",
    "esSuperAdmin": true,
    "permisos": [
      "DELETE_ALL",
      "ADMIN"
    ]
  }
  ```
* **Respuesta Esperada (`201 Created`)**:
  ```json
  {
    "success": true,
    "mensaje": "Usuario registrado correctamente",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "usuario": {
      "id": "7a3e9c4d-...",
      "nombre": "Ataque Mass Assignment",
      "email": "mass@veritas.ai",
      "rol": "user",
      "activo": true
    }
  }
  ```
* **Captura para el Word**:
  - Captura de Postman mostrando que `id: 9999` fue ignorado (el servidor generó su propio UUID), `passwordHash` fue ignorado (bcrypt calculó el hash real), y `permisos` no fue inyectado.
* **Texto explicativo para el Word**:
  > *"El sistema resiste ataques de Mass Assignment: todos los campos adicionales fueron filtrados en la capa del validador y neutralizados en el servicio. La contraseña se hasheó de forma segura con bcrypt (coste 12 y salt propio) y el ID fue generado por el ORM."*

---

### CASO 4: Inicio de Sesión Legítimo (Login con Éxito)

* **Objetivo en Word**: Confirmar que el flujo normal de inicio de sesión con bcrypt sigue funcionando con normalidad.
* **Método**: `POST`
* **URL**: `http://localhost:5000/api/auth/login`
* **Headers**:
  ```http
  Content-Type: application/json
  X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0
  ```
* **Body (JSON)**:
  ```json
  {
    "email": "estudiante@veritas.ai",
    "password": "ClaveSegura2026!"
  }
  ```
* **Respuesta Esperada (`200 OK`)**:
  ```json
  {
    "success": true,
    "mensaje": "Autenticación correcta",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "usuario": {
      "id": "c1f7a08b-...",
      "nombre": "Estudiante Veritas",
      "email": "estudiante@veritas.ai",
      "rol": "user"
    }
  }
  ```
* **Captura para el Word**:
  - Captura de Postman mostrando `200 OK` y el token JWT retornado.

---

### CASO 5: Inicio de Sesión con Credenciales Incorrectas

* **Objetivo en Word**: Verificar que las credenciales erróneas son rechazadas con `401 Unauthorized` de manera uniforme contra ataques de enumeración.
* **Método**: `POST`
* **URL**: `http://localhost:5000/api/auth/login`
* **Headers**:
  ```http
  Content-Type: application/json
  X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0
  ```
* **Body (JSON)**:
  ```json
  {
    "email": "estudiante@veritas.ai",
    "password": "PasswordInvalida999!"
  }
  ```
* **Respuesta Esperada (`401 Unauthorized`)**:
  ```json
  {
    "success": false,
    "message": "Credenciales inválidas. Verifica tu correo y contraseña.",
    "mensaje": "Credenciales inválidas"
  }
  ```
* **Captura para el Word**:
  - Captura mostrando `401 Unauthorized`.

---

### CASO 6: Evidencia en Swagger UI (Contrato de Seguridad)

* **Objetivo en Word**: Demostrar que la documentación OpenAPI refleja el contrato seguro:
  1. Abrir: `http://localhost:5000/api/docs`.
  2. Localizar `POST /api/auth/registro`.
  3. Comprobar que en la descripción dice: *"Registra un nuevo usuario utilizando bcrypt para proteger la contraseña. El rol es asignado por el servidor y no puede ser definido por el cliente."*
  4. Localizar en **Schemas** el modelo `RegistroUsuario` y verificar que el atributo `rol` no existe.
* **Captura para el Word**:
  - Captura de Swagger UI en la descripción del endpoint y en el Schema `RegistroUsuario`.

---

### CASO 7: Evidencia de Pruebas Automatizadas (Terminal)

* **Objetivo en Word**: Evidenciar la ejecución formal de las 7 pruebas unitarias y de integración del laboratorio.
* **Comando**:
  ```bash
  cd backend
  npm run test:lab8
  ```
* **Salida en Terminal**:
  ```text
  PASS tests/lab8.test.ts
    Laboratorio No. 8 — Control del rol y prevención de escalada de privilegios (Veritas AI)
      √ Checkpoint 1: Registro sin rol debe responder 201 y asignar rol "user" por el servidor
      √ Checkpoint 2 & 3 & 5: Intento de enviar rol: "ADMIN" / "administrador", activo: false, esSuperAdmin: true -> Ignorados
      √ Checkpoint 4 & 5: Ataque Mass Assignment con passwordHash, id, rol, activo, permisos -> Todos ignorados
      √ Checkpoint 6: Login con credenciales correctas debe responder 200 OK
      √ Checkpoint 7: Login con credenciales incorrectas debe responder 401 Unauthorized
      Verificación arquitectónica de las Dos Defensas en Veritas AI
        √ Primera defensa: express-validator matchedData() filtra y elimina rol, activo y esSuperAdmin
        √ Segunda defensa: el servicio usuariosService.crearUsuario SIEMPRE asigna rol Role.USER e is_active: true

  Test Suites: 1 passed, 1 total
  Tests:       7 passed, 7 total
  Snapshots:   0 total
  ```
* **Captura para el Word**:
  - Captura de la terminal con las pruebas en color verde.

---

## 🏆 4. Tabla de Checkpoint Oficial (Para copiar a Word)

| Prueba Realizada | Resultado Esperado en Veritas AI | Estado |
| :--- | :--- | :---: |
| **Registro sin rol** | `201 Created` + `rol: "user"` (`Role.USER`) | **OK ✅** |
| **Registro intentando rol: "ADMIN" / "administrador"** | `201 Created` + `rol: "user"` (servidor ignora el ataque) | **OK ✅** |
| **Intento de enviar activo: false** | Se mantiene `activo: true` | **OK ✅** |
| **Intento de enviar passwordHash falso** | Campo ignorado, bcrypt genera hash seguro | **OK ✅** |
| **Intento de enviar esSuperAdmin: true / permisos** | Campos ignorados por allowlisting | **OK ✅** |
| **Login con credenciales correctas** | `200 OK` + Autenticación correcta | **OK ✅** |
| **Login con credenciales incorrectas** | `401 Unauthorized` + Credenciales inválidas | **OK ✅** |
