# GUÍA DE EJECUCIÓN Y RECOPILACIÓN DE EVIDENCIAS
## LABORATORIO No. 10: AUTORIZACIÓN SEGURA EN APIS REST — RBAC, IDOR/BOLA Y CONTROL DE ACCESO A RECURSOS
### PROYECTO: VERITAS AI — PLATAFORMA DE INTEGRIDAD ACADÉMICA Y DETECCIÓN ANTIPLAGIO (@veritas.com)

---

## 1. INTRODUCCIÓN Y CONTEXTO DEL LABORATORIO EN VERITAS AI

El presente documento constituye la guía paso a paso para la reproducción, validación y recopilación de evidencias fotográficas (capturas de pantalla) requeridas para el informe final en formato Word del **Laboratorio No. 10 — Bloques 6A, 6B y 6C**.

En la plataforma **Veritas AI** (sistema de análisis de similitud, detección de IA generativa y auditoría de integridad académica), la arquitectura de seguridad evoluciona de un esquema puramente autenticado (¿Quién eres?) a un control de acceso de defensa en profundidad multicapa que responde a dos preguntas críticas:
1. **RBAC (Role-Based Access Control)**: ¿Tiene el rol del usuario permisos para realizar esta operación general (ej. Administrador, Docente/Auditor, Estudiante)?
2. **BOLA / IDOR (Broken Object Level Authorization / Insecure Direct Object Reference)**: ¿Tiene este usuario específico autorización para consultar o modificar **este recurso concreto** (esta revisión o escaneo, este perfil de estudiante, este reporte de similitud)?

### 1.1. Arquitectura de Defensa en Capas de Veritas AI

```
                        PETICIÓN HTTP ENTRANTE (REQUEST)
                                      │
                                      ▼
                        [1] RATE LIMITER (Control de Tasa)
                                      │
                                      ▼
                      [2] X-API-Key (Identificación de Cliente)
                                      │
                                      ▼
                    [3] JWT (Autenticación y Firma HS256)
                                      │
                                      ▼
            [4] RBAC: autorizarRoles (administrador, docente/auditor, estudiante/usuario)
                                      │
                                      ▼
               [5] BOLA / IDOR: propiedad.middleware (Control por Objeto)
                                      │
                                      ▼
              [6] VALIDADOR: express-validator (Sanitización y Allowlisting)
                                      │
                                      ▼
                          [7] CONTROLADOR (Controller)
                                      │
                                      ▼
                            [8] SERVICIO (Service)
                                      │
                                      ▼
                [9] REGLAS DE NEGOCIO & INTEGRIDAD REFERENCIAL
```

---

## 2. CONFIGURACIÓN DEL ENTORNO LOCAL Y ARRANQUE DEL SERVIDOR

### 2.1. Variables de Entorno (`backend/.env`)
Asegúrate de que el archivo `.env` del backend contenga las credenciales del Administrador Bootstrap y la configuración de API Key adaptada a **Veritas AI**:

```ini
PORT=5000
ALLOWED_ORIGIN=http://localhost:5173

# API Key de desarrollo para Postman / Swagger UI (Hash SHA-256 en BD)
API_KEY_POSTMAN=61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0

# Secreto criptográfico JWT
JWT_SECRET=super_secret_jwt_key_veritas_ai_2026_academics_secure_signature_production
JWT_EXPIRES_IN=1h

# Administrador Bootstrap Veritas AI (Bloque 6A - Inicialización Segura)
ADMIN_NOMBRE="Administrador Veritas"
ADMIN_EMAIL="admin@veritas.com"
ADMIN_PASSWORD="ClaveAdmin2026!"
```

### 2.2. Arranque del Servidor
Abre una terminal en `veritas-ai/backend` y ejecuta:

```bash
npm run dev
```

#### Salida esperada en consola (Captura de Inicio):
```
✓ Administrador inicial sincronizado
Servidor ejecutándose en http://localhost:5000
Swagger UI: http://localhost:5000/api-docs
OpenAPI JSON: http://localhost:5000/openapi.json
```

> **EVIDENCIA DE INICIO**: Toma una captura de la consola de Node.js donde se aprecie claramente el mensaje `Administrador inicial sincronizado` y el servidor levantado en el puerto 5000.

---

## 3. PROCEDIMIENTO DE AUTENTICACIÓN EN SWAGGER UI Y POSTMAN

La API de Veritas AI está documentada de forma interactiva en OpenAPI / Swagger en:
👉 **`http://localhost:5000/api-docs`**

### 3.1. Configuración del Botón "Authorize" en Swagger UI
Haz clic en el botón verde **Authorize** (arriba a la derecha) y llena las dos ventanas modales:
1. **ApiKeyAuth (apiKey)**:
   - Valor: `61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0`
   - Clic en *Authorize*.
2. **BearerAuth (HTTP Bearer)**:
   - Valor: `<Pega aquí el Token JWT obtenido al hacer login>` (sin la palabra Bearer).
   - Clic en *Authorize*.
   - Clic en *Close*.

---

## 4. SECUENCIA PREVIA DE INICIALIZACIÓN DE IDENTIDADES Y PERFILES

Antes de ejecutar las 30 pruebas, se requiere inicializar las identidades de prueba en Veritas AI. La colección de Postman incluye la carpeta **`00 - Setup Automático`** que realiza este proceso de forma desatendida.

### 4.1. Login del Administrador
- **Endpoint**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "email": "admin@veritas.com",
    "password": "ClaveAdmin2026!"
  }
  ```
- **Respuesta**: `200 OK` con `token`. Guardar como `TOKEN_ADMIN`.

### 4.2. Registro y Alta de Docente/Auditor de Integridad Académica (Bloque 6B)
1. **Crear usuario docente** (`POST /api/usuarios` con token admin):
   ```json
   {
     "nombre": "Dr. Fernando Veritas",
     "email": "docente.a@veritas.com",
     "password": "ClaveDocente2026!",
     "rol": "docente"
   }
   ```
2. **Login del docente** (`POST /api/auth/login`): Guardar `TOKEN_DOCENTE_A`.
3. **Crear perfil de docente/auditor** (`POST /api/docentes` con token admin):
   ```json
   {
     "nombre": "Dr. Fernando Veritas",
     "registroAcademico": "DOC-VERITAS-01",
     "email": "docente.a@veritas.com",
     "telefono": "3105559988",
     "departamentoId": 1,
     "usuarioId": <USUARIO_DOCENTE_ID>
   }
   ```

### 4.3. Registro Público de Estudiantes (Bloque 6A / 6C)
Cualquier estudiante o investigador puede registrarse públicamente; el servidor siempre fuerza el rol `estudiante` / `user`:
- **Estudiante A**:
  - `POST /api/auth/registro`
  - Body:
    ```json
    {
      "nombre": "Estudiante A Veritas",
      "email": "estudiante.a@veritas.com",
      "password": "ClaveEstudiante2026!"
    }
    ```
  - Respuesta: `201 Created` (rol `user` / `estudiante`).
  - Login en `POST /api/auth/login` y guardar `TOKEN_ESTUDIANTE_A`.
  - Crear perfil de estudiante en `POST /api/estudiantes` (vía admin): Guardar `ESTUDIANTE_A_ID`.

- **Estudiante B**:
  - `POST /api/auth/registro` (`email: "estudiante.b@veritas.com"`, `password: "ClaveEstudiante2026!"`).
  - Login en `POST /api/auth/login` y guardar `TOKEN_ESTUDIANTE_B`.
  - Crear perfil de estudiante en `POST /api/estudiantes`: Guardar `ESTUDIANTE_B_ID`.

---

## 5. GUÍA DETALLADA DE LAS 30 PRUEBAS OBLIGATORIAS

A continuación se detalla la ejecución de cada una de las 30 pruebas obligatorias del laboratorio para tomar las capturas requeridas en el documento final de Word.

---

### PRUEBA 1: Acceso sin JWT a Recurso Protegido
- **Objetivo**: Demostrar que un recurso protegido rechaza solicitudes anónimas sin cabecera `Authorization`.
- **Método y URL**: `GET /api/estudiantes`
- **Cabeceras**:
  - `X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0`
  - *(Sin cabecera Authorization)*
- **Resultado Esperado**: `401 Unauthorized`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "Token de autenticación requerido"
  }
  ```
- **Qué capturar para Word**: El código HTTP 401 y el mensaje indicando ausencia de token.
- **Justificación**: Primera línea de defensa: no se permite acceder a recursos internos de integridad académica sin autenticar la identidad del llamador.

---

### PRUEBA 2: JWT Inválido o Alterado
- **Objetivo**: Verificar que la firma criptográfica HS256 previene la manipulación de tokens.
- **Método y URL**: `GET /api/estudiantes`
- **Cabeceras**:
  - `X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0`
  - `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.FIRMA_MANIPULADA_XYZ`
- **Resultado Esperado**: `401 Unauthorized`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "Token inválido o expirado"
  }
  ```
- **Qué capturar para Word**: Petición con token manipulado recibiendo `401 Unauthorized`.
- **Justificación**: Integridad de sesión: si un atacante altera un solo bit del payload o firma, `jwt.verify` rechaza la petición.

---

### PRUEBA 3: Estudiante Intenta Operación Exclusiva de Admin/Docente (GET /api/estudiantes)
- **Objetivo**: Validar el control RBAC bloqueando la exposición de la lista global de estudiantes a un estudiante individual.
- **Método y URL**: `GET /api/estudiantes`
- **Cabeceras**:
  - `X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0`
  - `Authorization: Bearer <TOKEN_ESTUDIANTE_A>`
- **Resultado Esperado**: `403 Forbidden`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "No tiene permisos para realizar esta operación"
  }
  ```
- **Qué capturar para Word**: Código 403 Forbidden demostrando que el token es válido pero el rol `estudiante` carece de privilegios.
- **Justificación**: Principio de Menor Privilegio (PoLP): un estudiante individual no debe tener visibilidad del padrón de todos los estudiantes de la institución.

---

### PRUEBA 4: Docente / Auditor Consulta Lista de Estudiantes
- **Objetivo**: Validar que el rol `docente` sí está autorizado por la política RBAC para consultar estudiantes y evaluar sus trabajos.
- **Método y URL**: `GET /api/estudiantes`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_DOCENTE_A>`
- **Resultado Esperado**: `200 OK`
- **Cuerpo de Respuesta**:
  ```json
  {
    "total": 3,
    "estudiantes": [
      {
        "id": 1,
        "nombre": "Laura Gómez",
        "email": "laura@veritas.com"
      }
    ]
  }
  ```
- **Qué capturar para Word**: Código 200 OK y la lista de estudiantes obtenida con token de docente/auditor.
- **Justificación**: Política RBAC permite a docentes y auditores consultar registros académicos para asignación y evaluación de revisiones.

---

### PRUEBA 5: Administrador Consulta Lista de Estudiantes
- **Objetivo**: Validar que el rol `administrador` tiene acceso global de consulta.
- **Método y URL**: `GET /api/estudiantes`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ADMIN>`
- **Resultado Esperado**: `200 OK`
- **Qué capturar para Word**: Código 200 OK con usuario admin.
- **Justificación**: El administrador ostenta permisos de auditoría y gestión de recursos en toda la plataforma Veritas AI.

---

### PRUEBA 6: Estudiante Intenta Crear un Estudiante
- **Objetivo**: Demostrar restricción de escritura RBAC para rol estudiante.
- **Método y URL**: `POST /api/estudiantes`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ESTUDIANTE_A>`
- **Body**:
  ```json
  {
    "nombre": "Estudiante Intruso",
    "documento": "1009998881",
    "email": "intruso@veritas.com",
    "telefono": "3000000000",
    "fechaNacimiento": "2002-01-01"
  }
  ```
- **Resultado Esperado**: `403 Forbidden`
- **Qué capturar para Word**: Código 403 Forbidden. La petición es bloqueada por el middleware RBAC antes de alcanzar la lógica de negocio.
- **Justificación**: La creación de expedientes y registros de estudiantes es una operación reservada para administración académica.

---

### PRUEBA 7: Docente Intenta Crear un Estudiante
- **Objetivo**: Demostrar que los docentes tienen permiso de lectura pero no de creación administrativa de expedientes.
- **Método y URL**: `POST /api/estudiantes`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_DOCENTE_A>`
- **Body**: Mismo JSON de estudiante.
- **Resultado Esperado**: `403 Forbidden`
- **Qué capturar para Word**: Código 403 Forbidden al docente.
- **Justificación**: Separación de responsabilidades: los docentes revisan trabajos pero no dan de alta registros académicos oficiales.

---

### PRUEBA 8: Administrador Crea un Estudiante
- **Objetivo**: Demostrar que el administrador puede dar de alta perfiles de estudiantes legítimamente.
- **Método y URL**: `POST /api/estudiantes`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ADMIN>`
- **Body**:
  ```json
  {
    "nombre": "Estudiante Nuevo Veritas",
    "documento": "1002003004",
    "email": "nuevo.estudiante@veritas.com",
    "telefono": "3015556677",
    "fechaNacimiento": "2003-03-15"
  }
  ```
- **Resultado Esperado**: `201 Created`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "Estudiante creado correctamente",
    "estudiante": {
      "id": 4,
      "nombre": "Estudiante Nuevo Veritas",
      "email": "nuevo.estudiante@veritas.com"
    }
  }
  ```
- **Qué capturar para Word**: Código 201 Created con el estudiante nuevo y su ID generado por el servidor.
- **Justificación**: Operación autorizada por la política RBAC para el rol `administrador`.

---

### PRUEBA 9: Estudiante Intenta Eliminar Estudiante
- **Objetivo**: Demostrar bloqueo de operaciones destructivas por rol.
- **Método y URL**: `DELETE /api/estudiantes/1`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ESTUDIANTE_A>`
- **Resultado Esperado**: `403 Forbidden`
- **Qué capturar para Word**: Código 403 Forbidden al estudiante al intentar DELETE.
- **Justificación**: Prevención de sabotaje o destrucción de expedientes por usuarios no autorizados.

---

### PRUEBA 10: Administrador Intenta Eliminar Estudiante con Revisiones Asociadas (Integridad Referencial)
- **Objetivo**: Demostrar que la autorización no sustituye las reglas de negocio e integridad referencial.
- **Método y URL**: `DELETE /api/estudiantes/1`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ADMIN>`
- **Resultado Esperado**: `409 Conflict`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "No se puede eliminar el estudiante porque tiene revisiones asociadas"
  }
  ```
- **Qué capturar para Word**: Código 409 Conflict a pesar de que la petición proviene de un administrador.
- **Justificación**: Principio de Defensa en Profundidad: Ser administrador permite superar el control de acceso, pero jamás violar la integridad referencial del sistema antiplagio.

---

### PRUEBA 11: Registro Público Normal Asigna Rol Estudiante por Servidor
- **Objetivo**: Demostrar que el registro público asigna rol controlado estrictamente por el servidor.
- **Método y URL**: `POST /api/auth/registro`
- **Body**:
  ```json
  {
    "nombre": "Estudiante Veritas",
    "email": "estudiante@veritas.com",
    "password": "ClaveSegura2026!"
  }
  ```
- **Resultado Esperado**: `201 Created`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "Usuario registrado correctamente",
    "usuario": {
      "email": "estudiante@veritas.com",
      "rol": "user",
      "activo": true
    }
  }
  ```
- **Qué capturar para Word**: Código 201 Created con `rol: "user"` (mapeado a estudiante).
- **Justificación**: El servidor es la única autoridad con potestad para asignar roles en registros públicos.

---

### PRUEBA 12: Intento de Registro con `rol: "administrador"` (Neutralización de Escalada)
- **Objetivo**: Verificar mitigación de escalada de privilegios en registro público.
- **Método y URL**: `POST /api/auth/registro`
- **Body**:
  ```json
  {
    "nombre": "Atacante Escalada",
    "email": "atacante@veritas.com",
    "password": "ClaveSegura2026!",
    "rol": "administrador",
    "role": "ADMIN"
  }
  ```
- **Resultado Esperado**: `201 Created`, pero el usuario queda registrado con `rol: "user"` / estudiante.
- **Qué capturar para Word**: Respuesta donde el campo `rol: "administrador"` enviado en el body fue completamente descartado.
- **Justificación**: Primera y Segunda defensa en profundidad: `matchedData()` ignora el campo y el servicio asigna `Role.USER`.

---

### PRUEBA 13: Intento de Envío de `activo: false` en Registro
- **Objetivo**: Mitigación de Mass Assignment en atributos de estado del usuario.
- **Método y URL**: `POST /api/auth/registro`
- **Body**:
  ```json
  {
    "nombre": "Usuario Estado",
    "email": "estado@veritas.com",
    "password": "ClaveSegura2026!",
    "activo": false
  }
  ```
- **Resultado Esperado**: `201 Created`, con `activo: true` fijado por el servidor.
- **Qué capturar para Word**: Código 201 Created demostrando que `activo: false` fue ignorado.
- **Justificación**: Control inmutable en el backend: solo los procesos del servidor determinan el estado de activación de cuentas recién creadas.

---

### PRUEBA 14: Envío de `passwordHash` en Registro
- **Objetivo**: Evitar inyección de hashes precomputados de contraseñas.
- **Método y URL**: `POST /api/auth/registro`
- **Body**:
  ```json
  {
    "nombre": "Inyección Hash",
    "email": "hash@veritas.com",
    "password": "ClaveSegura2026!",
    "passwordHash": "$2b$10$HASH_FALSO_INYECTADO_POR_ATACANTE"
  }
  ```
- **Resultado Esperado**: `201 Created`. El hash interno generado utiliza bcrypt con salt fresco sobre la contraseña provista.
- **Qué capturar para Word**: Registro exitoso confirmando que ningún hash provisto externamente es persistido.
- **Justificación**: Protección contra fijación de credenciales criptográficas.

---

### PRUEBA 15: Envío de `esSuperAdmin: true` en Registro
- **Objetivo**: Neutralizar campos inventados de privilegios.
- **Método y URL**: `POST /api/auth/registro`
- **Body**:
  ```json
  {
    "nombre": "Falso Superadmin",
    "email": "superadmin@veritas.com",
    "password": "ClaveSegura2026!",
    "esSuperAdmin": true
  }
  ```
- **Resultado Esperado**: `201 Created`. El atributo `esSuperAdmin` es descartado.
- **Qué capturar para Word**: Respuesta sin rastro del atributo `esSuperAdmin`.
- **Justificación**: Allowlisting estricto: los campos no explícitamente autorizados son destruidos.

---

### PRUEBA 16: Administrador Crea un Docente/Auditor desde Gestión Privilegiada
- **Objetivo**: Validar el endpoint administrativo seguro para roles privilegiados (Bloque 6B).
- **Método y URL**: `POST /api/usuarios`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ADMIN>`
- **Body**:
  ```json
  {
    "nombre": "Dr. Fernando Veritas",
    "email": "fernando.docente@veritas.com",
    "password": "ClaveSegura2026!",
    "rol": "docente"
  }
  ```
- **Resultado Esperado**: `201 Created`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "Usuario creado correctamente",
    "usuario": {
      "nombre": "Dr. Fernando Veritas",
      "email": "fernando.docente@veritas.com",
      "rol": "docente",
      "activo": true
    }
  }
  ```
- **Qué capturar para Word**: Código 201 Created con el usuario creado con rol `docente`.
- **Justificación**: Operación administrativa legítima donde la asignación de rol está protegida por RBAC.

---

### PRUEBA 17: Administrador Crea un Nuevo Administrador
- **Objetivo**: Validar la delegación controlada de roles de administración.
- **Método y URL**: `POST /api/usuarios`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ADMIN>`
- **Body**:
  ```json
  {
    "nombre": "Admin Secundario Veritas",
    "email": "admin2@veritas.com",
    "password": "ClaveSegura2026!",
    "rol": "administrador"
  }
  ```
- **Resultado Esperado**: `201 Created` con rol `administrador`.
- **Qué capturar para Word**: Código 201 Created confirmando la creación privilegiada.
- **Justificación**: Solo un administrador existente puede crear administradores adicionales.

---

### PRUEBA 18: Docente Intenta Crear Otro Docente en `POST /api/usuarios`
- **Objetivo**: Verificar que un rol no administrativo no puede crear usuarios privilegiados.
- **Método y URL**: `POST /api/usuarios`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_DOCENTE_A>`
- **Body**: Datos de usuario docente.
- **Resultado Esperado**: `403 Forbidden`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "No tiene permisos para realizar esta operación"
  }
  ```
- **Qué capturar para Word**: Código 403 Forbidden al docente.
- **Justificación**: Aunque el docente es un usuario de confianza académica, no posee autoridad de administración de identidades.

---

### PRUEBA 19: Estudiante Intenta Crear Administrador en `POST /api/usuarios`
- **Objetivo**: Demostrar bloqueo de escalada directa de privilegios en endpoints administrativos.
- **Método y URL**: `POST /api/usuarios`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ESTUDIANTE_A>`
- **Body**:
  ```json
  {
    "nombre": "Admin Ilegítimo",
    "email": "falsoadmin@veritas.com",
    "password": "ClaveSegura2026!",
    "rol": "administrador"
  }
  ```
- **Resultado Esperado**: `403 Forbidden`
- **Qué capturar para Word**: Código 403 Forbidden.
- **Justificación**: El control RBAC detiene de inmediato el intento de invocación de endpoints reservados.

---

### PRUEBA 20: Administrador Intenta Asignar Rol No Permitido (ej: "superadmin")
- **Objetivo**: Demostrar que las reglas de validación aplican incluso al Administrador.
- **Método y URL**: `POST /api/usuarios`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ADMIN>`
- **Body**:
  ```json
  {
    "nombre": "Prueba Rol Inválido",
    "email": "rolinvalido@veritas.com",
    "password": "ClaveSegura2026!",
    "rol": "superadmin"
  }
  ```
- **Resultado Esperado**: `400 Bad Request`
- **Qué capturar para Word**: Código 400 Bad Request con el error de validación en el campo `rol`.
- **Justificación**: Validación de tipos y dominios permitidos: ser administrador no exime del cumplimiento del esquema de datos.

---

### PRUEBA 21: Estudiante A Consulta sus Propias Revisiones (`/api/revisiones/estudiante/{A}`)
- **Objetivo**: Demostrar acceso legítimo a recursos propios mediante verificación BOLA / Propiedad (Bloque 6C).
- **Método y URL**: `GET /api/revisiones/estudiante/4` *(donde 4 es el ID de recurso de Estudiante A)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ESTUDIANTE_A>`
- **Resultado Esperado**: `200 OK`
- **Cuerpo de Respuesta**:
  ```json
  {
    "total": 1,
    "revisiones": [
      {
        "id": 1,
        "estudianteId": 4,
        "motivo": "Revisión Antiplagio Tesis A Veritas",
        "estado": "programada"
      }
    ]
  }
  ```
- **Qué capturar para Word**: Código 200 OK con la revisión perteneciente al Estudiante A.
- **Justificación**: El middleware de propiedad valida que `req.usuario.id` coincide con el perfil asociado a `estudianteId: 4`.

---

### PRUEBA 22: Estudiante A Intenta Consultar Revisiones de Estudiante B (Ataque BOLA / IDOR Neutralizado)
- **Objetivo**: Demostrar la neutralización del ataque BOLA por manipulación de identificador directo en URL.
- **Método y URL**: `GET /api/revisiones/estudiante/5` *(donde 5 es el ID de recurso de Estudiante B)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ESTUDIANTE_A>`
- **Resultado Esperado**: `403 Forbidden`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "No tiene permisos para acceder a este recurso"
  }
  ```
- **Qué capturar para Word**: Código 403 Forbidden al intentar acceder a las revisiones del estudiante B con token del estudiante A.
- **Justificación**: **Defensa contra OWASP API1:2023 - BOLA**: El token es válido y el usuario tiene rol estudiante, pero el objeto solicitado pertenece a un tercero.

---

### PRUEBA 23: Estudiante A Consulta Revisión Individual Propia (`GET /api/revisiones/:id`)
- **Objetivo**: Validar autorización a nivel de objeto sobre un escaneo/revisión específica.
- **Método y URL**: `GET /api/revisiones/1` *(Revisión 1 pertenece al Estudiante A)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ESTUDIANTE_A>`
- **Resultado Esperado**: `200 OK`
- **Cuerpo de Respuesta**:
  ```json
  {
    "revision": {
      "id": 1,
      "estudianteId": 4,
      "motivo": "Revisión Antiplagio Tesis A Veritas"
    }
  }
  ```
- **Qué capturar para Word**: Código 200 OK mostrando la revisión individual autorizada.
- **Justificación**: `autorizarAccesoRevision` verifica que el usuario autenticado es el autor de la revisión consultada.

---

### PRUEBA 24: Estudiante A Intenta Consultar Revisión Individual de Estudiante B
- **Objetivo**: Evitar bypass de control BOLA mediante acceso por ID individual de recurso.
- **Método y URL**: `GET /api/revisiones/2` *(Revisión 2 pertenece al Estudiante B)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ESTUDIANTE_A>`
- **Resultado Esperado**: `403 Forbidden`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "No tiene permisos para acceder a este recurso"
  }
  ```
- **Qué capturar para Word**: Código 403 Forbidden al intentar leer la revisión 2.
- **Justificación**: Prevención de acceso cruzado horizontal a documentos y análisis de autoría ajenos.

---

### PRUEBA 25: Docente A Consulta sus Propias Revisiones (`GET /api/revisiones/docente/{A}`)
- **Objetivo**: Validar acceso legítimo de un docente a las revisiones asignadas para su auditoría.
- **Método y URL**: `GET /api/revisiones/docente/2` *(donde 2 es el ID del Docente A)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_DOCENTE_A>`
- **Resultado Esperado**: `200 OK`
- **Cuerpo de Respuesta**:
  ```json
  {
    "total": 1,
    "revisiones": [
      {
        "id": 1,
        "docenteId": 2,
        "motivo": "Revisión Antiplagio Tesis A Veritas"
      }
    ]
  }
  ```
- **Qué capturar para Word**: Código 200 OK con las revisiones asignadas al Docente A.
- **Justificación**: `autorizarDocentePropio` valida la correspondencia entre la identidad del JWT y el ID de docente solicitado.

---

### PRUEBA 26: Docente A Intenta Consultar Revisiones de Docente B
- **Objetivo**: Verificar que los docentes no pueden auditar ni espiar las revisiones asignadas a otros docentes sin autorización.
- **Método y URL**: `GET /api/revisiones/docente/1` *(donde 1 es el ID del Docente B)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_DOCENTE_A>`
- **Resultado Esperado**: `403 Forbidden`
- **Qué capturar para Word**: Código 403 Forbidden.
- **Justificación**: Aislamiento estricto de expedientes y revisiones académicas entre docentes.

---

### PRUEBA 27: Docente A Consulta Revisión Individual Asignada a Él
- **Objetivo**: Validar consulta individual autorizada por parte del docente asignado.
- **Método y URL**: `GET /api/revisiones/1` *(Revisión asignada al Docente A)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_DOCENTE_A>`
- **Resultado Esperado**: `200 OK`
- **Qué capturar para Word**: Código 200 OK con la revisión individual.
- **Justificación**: La revisión tiene `docenteId: 2`, coincidente con el docente autenticado.

---

### PRUEBA 28: Docente A Intenta Consultar Revisión Individual Asignada a Otro Docente
- **Objetivo**: Bloqueo de acceso por ID directo a revisiones no asignadas al docente.
- **Método y URL**: `GET /api/revisiones/2` *(Revisión asignada a otro docente)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_DOCENTE_A>`
- **Resultado Esperado**: `403 Forbidden`
- **Qué capturar para Word**: Código 403 Forbidden.
- **Justificación**: El docente A no es ni el autor (estudiante) ni el auditor asignado de la revisión 2.

---

### PRUEBA 29: Estudiante y Docente Utilizan `/api/revisiones/mis-revisiones`
- **Objetivo**: Demostrar el patrón de diseño seguro donde el identificador se deriva exclusivamente del token JWT.
- **Método y URL**: `GET /api/revisiones/mis-revisiones`
- **Cabeceras (Paso 1)**: `Authorization: Bearer <TOKEN_ESTUDIANTE_A>`
  - Resultado: `200 OK` (Devuelve únicamente las revisiones del Estudiante A sin requerir IDs en la URL).
- **Cabeceras (Paso 2)**: `Authorization: Bearer <TOKEN_DOCENTE_A>`
  - Resultado: `200 OK` (Devuelve únicamente las revisiones asignadas al Docente A).
- **Qué capturar para Word**: Ambas respuestas 200 OK demostrando la auto-resolución de identidad.
- **Justificación**: **Arquitectura Inmune a IDOR**: Al eliminar el parámetro de la URL, el cliente es incapaz de manipular el objeto consultado.

---

### PRUEBA 30: Petición sin `X-API-Key` a Endpoint Protegido
- **Objetivo**: Comprobar la primera barrera de acceso de la arquitectura en capas.
- **Método y URL**: `GET /api/estudiantes`
- **Cabeceras**: *(Ninguna o sin X-API-Key)*
- **Resultado Esperado**: `401 Unauthorized`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "API Key requerida"
  }
  ```
- **Qué capturar para Word**: Código 401 Unauthorized por ausencia de clave API.
- **Justificación**: La API Key autentica a la aplicación cliente autorizada antes de procesar cualquier credencial de usuario o sesión.

---

## 6. MATRIZ CONSOLIDADA DE PRUEBAS DEL LABORATORIO 10

| No. | Prueba / Acción | Rol Emisor | Endpoint | Código Esperado | Propiedad de Seguridad Validada |
|---|---|---|---|---|---|
| **1** | Acceso sin JWT | Anónimo | `GET /api/estudiantes` | **401** | Autenticación Requerida |
| **2** | JWT con firma manipulada | Atacante | `GET /api/estudiantes` | **401** | Integridad Criptográfica JWT |
| **3** | Listar estudiantes con estudiante | Estudiante | `GET /api/estudiantes` | **403** | RBAC (Restricción por Rol) |
| **4** | Listar estudiantes con docente | Docente | `GET /api/estudiantes` | **200** | Rol Docente Autorizado |
| **5** | Listar estudiantes con admin | Admin | `GET /api/estudiantes` | **200** | Rol Administrador Autorizado |
| **6** | Crear estudiante con estudiante | Estudiante | `POST /api/estudiantes` | **403** | Restricción RBAC de Escritura |
| **7** | Crear estudiante con docente | Docente | `POST /api/estudiantes` | **403** | Restricción RBAC de Escritura |
| **8** | Crear estudiante con admin | Admin | `POST /api/estudiantes` | **201** | Operación Administrativa Legítima |
| **9** | Eliminar estudiante con estudiante | Estudiante | `DELETE /api/estudiantes/:id` | **403** | Protección contra Destrucción |
| **10** | Eliminar estudiante referenciado | Admin | `DELETE /api/estudiantes/1` | **409** | Integridad Referencial |
| **11** | Registro público estándar | Público | `POST /api/auth/registro` | **201** (rol user) | Rol Controlado por Servidor |
| **12** | Registro con `rol:"administrador"` | Público | `POST /api/auth/registro` | **201** (queda user) | Prevención Escalada Privilegios |
| **13** | Registro con `activo:false` | Público | `POST /api/auth/registro` | **201** (queda true) | Mitigación Mass Assignment |
| **14** | Registro enviando `passwordHash` | Público | `POST /api/auth/registro` | **201** (ignorado) | Allowlisting de Campos |
| **15** | Registro con `esSuperAdmin:true` | Público | `POST /api/auth/registro` | **201** (ignorado) | Blindaje de Atributos Internos |
| **16** | Admin crea docente | Admin | `POST /api/usuarios` | **201** | Gestión Privilegiada |
| **17** | Admin crea administrador | Admin | `POST /api/usuarios` | **201** | Gestión Privilegiada |
| **18** | Docente intenta crear docente | Docente | `POST /api/usuarios` | **403** | RBAC Administrativo |
| **19** | Estudiante intenta crear admin | Estudiante | `POST /api/usuarios` | **403** | Prevención de Escalamiento |
| **20** | Admin asigna rol inválido | Admin | `POST /api/usuarios` | **400** | Validación de Esquema / Enums |
| **21** | Estudiante A consulta sus revisiones | Estudiante A | `GET /api/revisiones/estudiante/A` | **200** | Propiedad del Recurso |
| **22** | Estudiante A consulta revisiones de B | Estudiante A | `GET /api/revisiones/estudiante/B` | **403** | Protección BOLA / IDOR |
| **23** | Estudiante A consulta revisión 1 | Estudiante A | `GET /api/revisiones/1` | **200** | BOLA a Nivel de Objeto |
| **24** | Estudiante A consulta revisión 2 (de B) | Estudiante A | `GET /api/revisiones/2` | **403** | Bloqueo Bypass por ID |
| **25** | Docente A consulta sus revisiones | Docente A | `GET /api/revisiones/docente/A` | **200** | Propiedad de Auditoría Docente |
| **26** | Docente A consulta revisiones de B | Docente A | `GET /api/revisiones/docente/B` | **403** | Aislamiento Entre Docentes |
| **27** | Docente A consulta revisión propia | Docente A | `GET /api/revisiones/1` | **200** | BOLA Objeto Docente |
| **28** | Docente A consulta revisión ajena | Docente A | `GET /api/revisiones/2` | **403** | Bloqueo Bypass por ID |
| **29** | Estudiante/Docente `/mis-revisiones` | Estudiante/Docente | `GET /api/revisiones/mis-revisiones` | **200** (propias) | Identidad Derivada de JWT |
| **30** | Solicitud sin `X-API-Key` | Cualquiera | `GET /api/...` | **401** | Primera Barrera de Acceso |

---

## 7. CONCLUSIÓN TÉCNICA PARA EL INFORME DE WORD

Al redactar la conclusión en el informe, destaca los siguientes logros de ingeniería de seguridad implementados en **Veritas AI**:

1. **Desacoplamiento Efectivo de Autenticación y Autorización**:
   - `401 Unauthorized` se reserva rigurosamente para cuando la identidad no puede ser verificada (ausencia de token, firma corrupta o expiración).
   - `403 Forbidden` se emite cuando la identidad está plenamente comprobada pero el rol o la titularidad del recurso rechazan el acceso.

2. **Mitigación Completa de OWASP API1:2023 (BOLA / IDOR)**:
   - La inclusión de `propiedad.middleware.ts` garantiza que ningún identificador numérico o alfanumérico en la URL permita el acceso horizontal cruzado sin una verificación explícita de correspondencia contra el `req.usuario.id`.

3. **Arquitectura Zero-Trust con Allowlisting**:
   - La combinación de `express-validator matchedData()` y la lógica estricta de `usuarios.service.ts` elimina cualquier vector de ataque por **Mass Assignment** y **Escalada de Privilegios**.
