# GUÍA DE EJECUCIÓN Y RECOPILACIÓN DE EVIDENCIAS
## LABORATORIO No. 10: AUTORIZACIÓN SEGURA EN APIS REST — RBAC, IDOR/BOLA Y CONTROL DE ACCESO A RECURSOS
### PROYECTO: VERITAS AI (@veritas.com)

---

## 1. INTRODUCCIÓN Y CONTEXTO DEL LABORATORIO EN VERITAS AI

El presente documento constituye la guía paso a paso para la reproducción, validación y recopilación de evidencias fotográficas (capturas de pantalla) requeridas para el informe final en formato Word del **Laboratorio No. 10 — Bloques 6A, 6B y 6C**.

En la plataforma **Veritas AI**, la arquitectura de seguridad evoluciona de un esquema puramente autenticado (¿Quién eres?) a un control de acceso de defensa en profundidad multicapa que responde a dos preguntas críticas:
1. **RBAC (Role-Based Access Control)**: ¿Tiene el rol del usuario permisos para realizar esta operación general?
2. **BOLA / IDOR (Broken Object Level Authorization / Insecure Direct Object Reference)**: ¿Tiene este usuario específico autorización para consultar o modificar **este recurso concreto** (esta cita, este paciente, este expediente)?

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
                  [4] RBAC: autorizarRoles (administrador, medico, paciente)
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
PORT=3000
ALLOWED_ORIGIN=http://localhost:5173

# API Key de desarrollo para Postman / Swagger UI (Hash SHA-256 en BD)
API_KEY_POSTMAN=61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0

# Secreto criptográfico JWT
JWT_SECRET=super_secret_jwt_key_veritas_ai_2026_academics_secure_signature_production
JWT_EXPIRES_IN=1h

# Administrador Bootstrap Veritas AI (Bloque 6A - Parte 14)
ADMIN_NOMBRE="Administrador Veritas"
ADMIN_EMAIL="admin@veritas.com"
ADMIN_PASSWORD="SANTOTO_2026—2"
```

### 2.2. Arranque del Servidor
Abre una terminal en `veritas-ai/backend` y ejecuta:

```bash
npm run dev
```

#### Salida esperada en consola (Captura de Inicio):
```
Administrador inicial creado
Servidor ejecutándose en http://localhost:3000
Swagger UI: http://localhost:3000/api-docs
OpenAPI JSON: http://localhost:3000/openapi.json
```

> **EVIDENCIA DE INICIO**: Toma una captura de la consola de Node.js donde se aprecie claramente el mensaje `Administrador inicial creado` y el servidor levantado en el puerto 3000.

---

## 3. PROCEDIMIENTO DE AUTENTICACIÓN EN SWAGGER UI Y POSTMAN

La API de Veritas AI está documentada de forma interactiva en OpenAPI / Swagger en:
👉 **`http://localhost:3000/api-docs`**

### 3.1. Configuración del Botón "Authorize" en Swagger UI
Haz clic en el botón verde **Authorize** (arriba a la derecha) y llena las dos ventanas modales:
1. **ApiKeyAuth (apiKey)**:
   - Valor: `61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0`
   - Clic en *Authorize*.
2. **BearerAuth (http, Bearer)**:
   - Aquí pegarás el token JWT obtenido tras iniciar sesión con cada rol correspondiente.
   - Cada vez que cambies de usuario para probar permisos (Admin -> Paciente -> Médico), solo debes cambiar el token en este campo.

---

## 4. CUENTAS DE USUARIO Y PROCEDIMIENTO DE GENERACIÓN DE TOKENS

Para ejecutar todas las pruebas del laboratorio, se utilizan tres tipos de identidades en **Veritas AI**:

### 4.1. Administrador (Bootstrap del Sistema)
- **Email**: `admin@veritas.com`
- **Contraseña**: `SANTOTO_2026—2`
- **Rol**: `administrador`
- **Obtención de Token**:
  - `POST /api/auth/login`
  - Body:
    ```json
    {
      "email": "admin@veritas.com",
      "password": "SANTOTO_2026—2"
    }
    ```
  - Copia el campo `token` y guárdalo como `TOKEN_ADMIN`.

### 4.2. Creación del Médico (Gestión Administrativa Privilegiada - Bloque 6B)
Con el `TOKEN_ADMIN` activo en Swagger/Postman:
- **Petición**: `POST /api/usuarios`
- **Body**:
  ```json
  {
    "nombre": "Médico Veritas",
    "email": "medico@veritas.com",
    "password": "ClaveMedico2026!",
    "rol": "medico"
  }
  ```
- **Respuesta esperada**: `201 Created`
- **Login del Médico**:
  - `POST /api/auth/login`
  - Body:
    ```json
    {
      "email": "medico@veritas.com",
      "password": "ClaveMedico2026!"
    }
    ```
  - Copia el campo `token` y guárdalo como `TOKEN_MEDICO_A`.

### 4.3. Registro Público de Pacientes (Bloque 6A / 6C)
Cualquier persona puede registrarse públicamente; el servidor siempre fuerza el rol `paciente`:
- **Paciente A**:
  - `POST /api/auth/registro`
  - Body:
    ```json
    {
      "nombre": "Paciente A Veritas",
      "email": "paciente.a@veritas.com",
      "password": "ClavePaciente2026!"
    }
    ```
  - Respuesta: `201 Created` (rol `user` / `paciente`).
  - Login en `POST /api/auth/login` con sus credenciales y guardar `TOKEN_PACIENTE_A`.

- **Paciente B**:
  - `POST /api/auth/registro`
  - Body:
    ```json
    {
      "nombre": "Paciente B Veritas",
      "email": "paciente.b@veritas.com",
      "password": "ClavePaciente2026!"
    }
    ```
  - Respuesta: `201 Created`.
  - Login en `POST /api/auth/login` con sus credenciales y guardar `TOKEN_PACIENTE_B`.

---

## 5. GUÍA DETALLADA DE LAS 30 PRUEBAS OBLIGATORIAS

A continuación se detalla la ejecución de cada una de las 30 pruebas obligatorias del laboratorio para tomar las capturas requeridas en el documento final de Word.

---

### PRUEBA 1: Acceso sin JWT a Recurso Protegido
- **Objetivo**: Demostrar que un recurso protegido rechaza solicitudes anónimas sin cabecera `Authorization`.
- **Método y URL**: `GET /api/pacientes`
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
- **Qué capturar para Word**: El código HTTP 401 y el mensaje de error indicando la ausencia de token.
- **Justificación**: Primera línea de defensa: no se permite acceder a recursos internos sin autenticar la identidad del llamador.

---

### PRUEBA 2: JWT Inválido o Alterado
- **Objetivo**: Verificar que la firma criptográfica HS256 previene la manipulación de tokens.
- **Método y URL**: `GET /api/pacientes`
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
- **Qué capturar para Word**: Petición con token truncado o modificado recibiendo `401 Unauthorized`.
- **Justificación**: Integridad de sesión: si un atacante altera un solo bit del payload o firma, `jwt.verify` rechaza la petición.

---

### PRUEBA 3: Paciente Intenta Operación Exclusiva de Admin/Médico (GET /api/pacientes)
- **Objetivo**: Validar el control RBAC bloqueando la exposición de la lista global de pacientes a un paciente.
- **Método y URL**: `GET /api/pacientes`
- **Cabeceras**:
  - `X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0`
  - `Authorization: Bearer <TOKEN_PACIENTE_A>`
- **Resultado Esperado**: `403 Forbidden`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "No tiene permisos para realizar esta operación"
  }
  ```
- **Qué capturar para Word**: Código 403 Forbidden demostrando que el token es válido pero el rol `paciente` carece de privilegios.
- **Justificación**: Principio de Menor Privilegio (PoLP): un paciente individual no debe tener visibilidad del padrón de todos los pacientes.

---

### PRUEBA 4: Médico Consulta Lista de Pacientes
- **Objetivo**: Validar que el rol `medico` sí está autorizado por la política RBAC para consultar pacientes.
- **Método y URL**: `GET /api/pacientes`
- **Cabeceras**:
  - `X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0`
  - `Authorization: Bearer <TOKEN_MEDICO_A>`
- **Resultado Esperado**: `200 OK`
- **Cuerpo de Respuesta**:
  ```json
  {
    "total": 3,
    "pacientes": [
      {
        "id": 1,
        "nombre": "Laura Gómez",
        "email": "laura@veritas.com"
      }
    ]
  }
  ```
- **Qué capturar para Word**: Código 200 OK y la lista de pacientes obtenida con token de médico.
- **Justificación**: Política RBAC permite a personal médico ver registros clínicos para asignación y consulta asistencial.

---

### PRUEBA 5: Administrador Consulta Lista de Pacientes
- **Objetivo**: Validar que el rol `administrador` tiene acceso global de consulta.
- **Método y URL**: `GET /api/pacientes`
- **Cabeceras**:
  - `X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0`
  - `Authorization: Bearer <TOKEN_ADMIN>`
- **Resultado Esperado**: `200 OK`
- **Qué capturar para Word**: Código 200 OK con usuario admin.
- **Justificación**: El administrador ostenta permisos de auditoría y gestión de recursos en toda la organización.

---

### PRUEBA 6: Paciente Intenta Crear un Paciente
- **Objetivo**: Demostrar restricción de escritura RBAC para rol paciente.
- **Método y URL**: `POST /api/pacientes`
- **Cabeceras**:
  - `X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0`
  - `Authorization: Bearer <TOKEN_PACIENTE_A>`
- **Body**:
  ```json
  {
    "nombre": "Paciente Intruso",
    "documento": "1009998881",
    "email": "intruso@veritas.com",
    "telefono": "3000000000",
    "fechaNacimiento": "1990-01-01"
  }
  ```
- **Resultado Esperado**: `403 Forbidden`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "No tiene permisos para realizar esta operación"
  }
  ```
- **Qué capturar para Word**: Código 403 Forbidden. Nótese que la petición ni siquiera alcanza la capa de validación ni el servicio.
- **Justificación**: La creación de expedientes de pacientes es una operación reservada para administración.

---

### PRUEBA 7: Médico Intenta Crear un Paciente
- **Objetivo**: Demostrar que los médicos tienen permiso de lectura pero no de creación administrativa de expedientes.
- **Método y URL**: `POST /api/pacientes`
- **Cabeceras**:
  - `X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0`
  - `Authorization: Bearer <TOKEN_MEDICO_A>`
- **Body**: Mismo JSON de paciente.
- **Resultado Esperado**: `403 Forbidden`
- **Qué capturar para Word**: Código 403 Forbidden al médico.
- **Justificación**: Separación de responsabilidades: los médicos no realizan altas administrativas de expedientes.

---

### PRUEBA 8: Administrador Crea un Paciente
- **Objetivo**: Demostrar que el administrador puede dar de alta pacientes legítimamente.
- **Método y URL**: `POST /api/pacientes`
- **Cabeceras**:
  - `X-API-Key: 61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0`
  - `Authorization: Bearer <TOKEN_ADMIN>`
- **Body**:
  ```json
  {
    "nombre": "Paciente Nuevo Veritas",
    "documento": "1002003004",
    "email": "nuevo.paciente@veritas.com",
    "telefono": "3015556677",
    "fechaNacimiento": "1997-03-15"
  }
  ```
- **Resultado Esperado**: `201 Created`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "Paciente creado correctamente",
    "paciente": {
      "id": 4,
      "nombre": "Paciente Nuevo Veritas",
      "email": "nuevo.paciente@veritas.com"
    }
  }
  ```
- **Qué capturar para Word**: Código 201 Created con el paciente nuevo y su ID generado por el servidor.
- **Justificación**: Operación autorizada por la política RBAC para el rol `administrador`.

---

### PRUEBA 9: Paciente Intenta Eliminar Paciente
- **Objetivo**: Demostrar bloqueo de operaciones destructivas por rol.
- **Método y URL**: `DELETE /api/pacientes/1`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_PACIENTE_A>`
- **Resultado Esperado**: `403 Forbidden`
- **Qué capturar para Word**: Código 403 Forbidden al paciente al intentar DELETE.
- **Justificación**: Prevención de sabotaje o destrucción de expedientes por usuarios no autorizados.

---

### PRUEBA 10: Administrador Intenta Eliminar Paciente con Citas Asociadas (Integridad Referencial)
- **Objetivo**: Demostrar que la autorización no sustituye las reglas de negocio e integridad referencial.
- **Método y URL**: `DELETE /api/pacientes/1`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ADMIN>`
- **Resultado Esperado**: `409 Conflict`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "No se puede eliminar el paciente porque tiene citas asociadas"
  }
  ```
- **Qué capturar para Word**: Código 409 Conflict a pesar de que la petición proviene de un administrador.
- **Justificación**: Principio de Defensa en Profundidad: Ser administrador permite superar el control de acceso, pero jamás violar la integridad referencial del sistema.

---

### PRUEBA 11: Registro Público Normal Asigna Rol Paciente por Servidor
- **Objetivo**: Demostrar que el registro público asigna rol controlado estrictamente por el servidor.
- **Método y URL**: `POST /api/auth/registro`
- **Cabeceras**:
  - `X-API-Key: ...`
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
- **Qué capturar para Word**: Código 201 Created con `rol: "user"` (mapeado a `paciente`).
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
- **Resultado Esperado**: `201 Created`, pero el usuario queda registrado con `rol: "user"` / `paciente`.
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

### PRUEBA 16: Administrador Crea un Médico desde Gestión Privilegiada
- **Objetivo**: Validar el endpoint administrativo seguro para roles privilegiados (Bloque 6B).
- **Método y URL**: `POST /api/usuarios`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_ADMIN>`
- **Body**:
  ```json
  {
    "nombre": "Dr. Fernando Veritas",
    "email": "fernando.medico@veritas.com",
    "password": "ClaveSegura2026!",
    "rol": "medico"
  }
  ```
- **Resultado Esperado**: `201 Created`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "Usuario creado correctamente",
    "usuario": {
      "nombre": "Dr. Fernando Veritas",
      "email": "fernando.medico@veritas.com",
      "rol": "medico",
      "activo": true
    }
  }
  ```
- **Qué capturar para Word**: Código 201 Created con el usuario creado con rol `medico`.
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

### PRUEBA 18: Médico Intenta Crear Otro Médico en `POST /api/usuarios`
- **Objetivo**: Verificar que un rol no administrativo no puede crear usuarios privilegiados.
- **Método y URL**: `POST /api/usuarios`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_MEDICO_A>`
- **Body**: Datos de usuario médico.
- **Resultado Esperado**: `403 Forbidden`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "No tiene permisos para realizar esta operación"
  }
  ```
- **Qué capturar para Word**: Código 403 Forbidden al médico.
- **Justificación**: Aunque el médico es un usuario de confianza interna, no posee autoridad de administración de identidades.

---

### PRUEBA 19: Paciente Intenta Crear Administrador en `POST /api/usuarios`
- **Objetivo**: Demostrar bloqueo de escalada directa de privilegios en endpoints administrativos.
- **Método y URL**: `POST /api/usuarios`
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_PACIENTE_A>`
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
- **Cuerpo de Respuesta**:
  ```json
  {
    "errores": [
      {
        "msg": "El rol debe ser medico o administrador",
        "path": "rol"
      }
    ]
  }
  ```
- **Qué capturar para Word**: Código 400 Bad Request con el error de validación en el campo `rol`.
- **Justificación**: Validación de tipos y dominios permitidos: ser administrador no exime del cumplimiento del esquema de datos.

---

### PRUEBA 21: Paciente A Consulta sus Propias Citas (`/api/citas/paciente/{A}`)
- **Objetivo**: Demostrar acceso legítimo a recursos propios mediante verificación BOLA / Propiedad (Bloque 6C).
- **Método y URL**: `GET /api/citas/paciente/4` *(donde 4 es el ID de recurso de Paciente A)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_PACIENTE_A>`
- **Resultado Esperado**: `200 OK`
- **Cuerpo de Respuesta**:
  ```json
  {
    "total": 1,
    "citas": [
      {
        "id": 1,
        "pacienteId": 4,
        "motivo": "Control Paciente A Veritas",
        "estado": "programada"
      }
    ]
  }
  ```
- **Qué capturar para Word**: Código 200 OK con la cita perteneciente al Paciente A.
- **Justificación**: El middleware de propiedad valida que `req.usuario.id` coincide con el perfil asociado a `pacienteId: 4`.

---

### PRUEBA 22: Paciente A Intenta Consultar Citas de Paciente B (Ataque BOLA / IDOR Neutralizado)
- **Objetivo**: Demostrar la neutralización del ataque BOLA por manipulación de identificador directo en URL.
- **Método y URL**: `GET /api/citas/paciente/5` *(donde 5 es el ID de recurso de Paciente B)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_PACIENTE_A>`
- **Resultado Esperado**: `403 Forbidden`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "No tiene permisos para acceder a este recurso"
  }
  ```
- **Qué capturar para Word**: Código 403 Forbidden al intentar acceder a las citas del paciente 5 con token del paciente 4.
- **Justificación**: **Defensa contra OWASP API1:2023 - BOLA**: El token es válido y el usuario tiene rol paciente, pero el objeto solicitado pertenece a un tercero.

---

### PRUEBA 23: Paciente A Consulta Cita Individual Propia (`GET /api/citas/:id`)
- **Objetivo**: Validar autorización a nivel de objeto sobre una cita específica.
- **Método y URL**: `GET /api/citas/1` *(Cita 1 pertenece al Paciente A)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_PACIENTE_A>`
- **Resultado Esperado**: `200 OK`
- **Cuerpo de Respuesta**:
  ```json
  {
    "cita": {
      "id": 1,
      "pacienteId": 4,
      "motivo": "Control Paciente A Veritas"
    }
  }
  ```
- **Qué capturar para Word**: Código 200 OK mostrando la cita individual autorizada.
- **Justificación**: `autorizarAccesoCita` verifica que el usuario autenticado es el titular de la cita consultada.

---

### PRUEBA 24: Paciente A Intenta Consultar Cita Individual de Paciente B
- **Objetivo**: Evitar bypass de control BOLA mediante acceso por ID individual de recurso.
- **Método y URL**: `GET /api/citas/2` *(Cita 2 pertenece al Paciente B)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_PACIENTE_A>`
- **Resultado Esperado**: `403 Forbidden`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "No tiene permisos para acceder a esta cita"
  }
  ```
- **Qué capturar para Word**: Código 403 Forbidden al intentar leer la cita 2.
- **Justificación**: Prevención de acceso cruzado horizontal a datos sensibles de salud.

---

### PRUEBA 25: Médico A Consulta sus Propias Citas (`GET /api/citas/medico/{A}`)
- **Objetivo**: Validar acceso legítimo de un profesional médico a su agenda asistencial.
- **Método y URL**: `GET /api/citas/medico/1` *(donde 1 es el ID del Médico A)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_MEDICO_A>`
- **Resultado Esperado**: `200 OK`
- **Qué capturar para Word**: Código 200 OK con las citas asignadas al Médico A.
- **Justificación**: `autorizarMedicoPropio` valida la correspondencia entre la identidad del JWT y el ID de médico solicitado.

---

### PRUEBA 26: Médico A Intenta Consultar Citas de Médico B
- **Objetivo**: Verificar que los médicos no pueden espiar la agenda de otros profesionales de la institución.
- **Método y URL**: `GET /api/citas/medico/2` *(donde 2 es el ID del Médico B)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_MEDICO_A>`
- **Resultado Esperado**: `403 Forbidden`
- **Cuerpo de Respuesta**:
  ```json
  {
    "mensaje": "No tiene permisos para acceder a este recurso"
  }
  ```
- **Qué capturar para Word**: Código 403 Forbidden.
- **Justificación**: Aislamiento estricto de expedientes y agendas médicas entre profesionales.

---

### PRUEBA 27: Médico A Consulta Cita Individual Asignada a Él
- **Objetivo**: Validar consulta individual autorizada por parte del médico tratante.
- **Método y URL**: `GET /api/citas/1` *(Cita asignada al Médico A)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_MEDICO_A>`
- **Resultado Esperado**: `200 OK`
- **Qué capturar para Word**: Código 200 OK con la cita individual.
- **Justificación**: La cita tiene `medicoId: 1`, coincidente con el médico autenticado.

---

### PRUEBA 28: Médico A Intenta Consultar Cita Individual Asignada a Otro Médico
- **Objetivo**: Bloqueo de acceso por ID directo a citas ajenas al médico.
- **Método y URL**: `GET /api/citas/2` *(Cita asignada al Médico B)*
- **Cabeceras**:
  - `X-API-Key: ...`
  - `Authorization: Bearer <TOKEN_MEDICO_A>`
- **Resultado Esperado**: `403 Forbidden`
- **Qué capturar para Word**: Código 403 Forbidden.
- **Justificación**: El médico A no es ni el paciente ni el médico tratante de la cita 2.

---

### PRUEBA 29: Paciente y Médico Utilizan `/api/citas/mis-citas`
- **Objetivo**: Demostrar el patrón de diseño seguro donde el identificador se deriva exclusivamente del token JWT.
- **Método y URL**: `GET /api/citas/mis-citas`
- **Cabeceras (Paso 1)**: `Authorization: Bearer <TOKEN_PACIENTE_A>`
  - Resultado: `200 OK` (Devuelve únicamente las citas de Paciente A sin requerir IDs en la URL).
- **Cabeceras (Paso 2)**: `Authorization: Bearer <TOKEN_MEDICO_A>`
  - Resultado: `200 OK` (Devuelve únicamente las citas asignadas a Médico A).
- **Qué capturar para Word**: Ambas respuestas 200 OK demostrando la auto-resolución de identidad.
- **Justificación**: **Arquitectura Inmune a IDOR**: Al eliminar el parámetro de la URL, el cliente es incapaz de manipular el objeto consultado.

---

### PRUEBA 30: Petición sin `X-API-Key` a Endpoint Protegido
- **Objetivo**: Comprobar la primera barrera de acceso de la arquitectura en capas.
- **Método y URL**: `GET /api/pacientes`
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
| **1** | Acceso sin JWT | Anónimo | `GET /api/pacientes` | **401** | Autenticación Requerida |
| **2** | JWT con firma manipulada | Atacante | `GET /api/pacientes` | **401** | Integridad Criptográfica JWT |
| **3** | Listar pacientes con paciente | Paciente | `GET /api/pacientes` | **403** | RBAC (Restricción por Rol) |
| **4** | Listar pacientes con médico | Médico | `GET /api/pacientes` | **200** | Rol Médico Autorizado |
| **5** | Listar pacientes con admin | Admin | `GET /api/pacientes` | **200** | Rol Administrador Autorizado |
| **6** | Crear paciente con paciente | Paciente | `POST /api/pacientes` | **403** | Restricción RBAC de Escritura |
| **7** | Crear paciente con médico | Médico | `POST /api/pacientes` | **403** | Restricción RBAC de Escritura |
| **8** | Crear paciente con admin | Admin | `POST /api/pacientes` | **201** | Operación Administrativa Legítima |
| **9** | Eliminar paciente con paciente | Paciente | `DELETE /api/pacientes/:id` | **403** | Protección contra Destrucción |
| **10** | Eliminar paciente referenciado | Admin | `DELETE /api/pacientes/1` | **409** | Integridad Referencial |
| **11** | Registro público estándar | Público | `POST /api/auth/registro` | **201** (rol user) | Rol Controlado por Servidor |
| **12** | Registro con `rol:"administrador"` | Público | `POST /api/auth/registro` | **201** (queda user) | Prevención Escalada Privilegios |
| **13** | Registro con `activo:false` | Público | `POST /api/auth/registro` | **201** (queda true) | Mitigación Mass Assignment |
| **14** | Registro enviando `passwordHash` | Público | `POST /api/auth/registro` | **201** (ignorado) | Allowlisting de Campos |
| **15** | Registro con `esSuperAdmin:true` | Público | `POST /api/auth/registro` | **201** (ignorado) | Blindaje de Atributos Internos |
| **16** | Admin crea médico | Admin | `POST /api/usuarios` | **201** | Gestión Privilegiada |
| **17** | Admin crea administrador | Admin | `POST /api/usuarios` | **201** | Gestión Privilegiada |
| **18** | Médico intenta crear médico | Médico | `POST /api/usuarios` | **403** | RBAC Administrativo |
| **19** | Paciente intenta crear admin | Paciente | `POST /api/usuarios` | **403** | Prevención de Escalamiento |
| **20** | Admin asigna rol inválido | Admin | `POST /api/usuarios` | **400** | Validación de Esquema / Enums |
| **21** | Paciente A consulta sus citas | Paciente A | `GET /api/citas/paciente/A` | **200** | Propiedad del Recurso |
| **22** | Paciente A consulta citas de B | Paciente A | `GET /api/citas/paciente/B` | **403** | Protección BOLA / IDOR |
| **23** | Paciente A consulta cita 1 | Paciente A | `GET /api/citas/1` | **200** | BOLA a Nivel de Objeto |
| **24** | Paciente A consulta cita 2 (de B) | Paciente A | `GET /api/citas/2` | **403** | Bloqueo Bypass por ID |
| **25** | Médico A consulta sus citas | Médico A | `GET /api/citas/medico/A` | **200** | Propiedad de Agenda Médica |
| **26** | Médico A consulta citas de B | Médico A | `GET /api/citas/medico/B` | **403** | Aislamiento Entre Médicos |
| **27** | Médico A consulta cita propia | Médico A | `GET /api/citas/1` | **200** | BOLA Objeto Médico |
| **28** | Médico A consulta cita ajena | Médico A | `GET /api/citas/2` | **403** | Bloqueo Bypass por ID |
| **29** | Paciente/Médico `/mis-citas` | Paciente/Médico | `GET /api/citas/mis-citas` | **200** (propias) | Identidad Derivada de JWT |
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
