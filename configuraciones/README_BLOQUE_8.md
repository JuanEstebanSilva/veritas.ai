# LABORATORIO 8 — Validación Integral de la API Veritas AI
## Plataforma de Integridad Académica, Detección de IA y Antiplagio

---

## 1. Objetivo del Laboratorio

Ejecutar, documentar y validar integralmente los controles funcionales, de seguridad, persistencia, autorización basada en roles (RBAC), control de acceso por objeto (BOLA / IDOR) y restricciones transaccionales de la **API Veritas AI** (Node.js, Express, TypeScript y PostgreSQL / Supabase).

### Metáfora de Validación
El Bloque 7.5 y 7.5.1 construyeron los módulos del campus digital de Veritas AI y asignaron la llave maestra (bootstrap). El **Laboratorio 8** es la inspección rigurosa de cada puerta, permiso de acceso, agenda de revisión y resguardo de datos para garantizar que ningún estudiante pueda vulnerar documentos ajenos y ningún docente inactivo pueda emitir dictámenes.

---

## 2. Equivalencia y Compatibilidad de Dominio

Para garantizar coherencia con la misión del proyecto (Veritas AI) y a la vez permitir compatibilidad transparente con cualquier instrumento o script de evaluación basado en la rúbrica original, la plataforma implementa una capa de **equivalencias duales**:

| Dominio Veritas AI (Principal) | Dominio Rúbrica (Alias de Compatibilidad) | Descripción en el Sistema |
|---|---|---|
| **`estudiantes`** | `pacientes` | Autores de trabajos de grado, ensayos y artículos académicos. |
| **`docentes`** / `auditores` | `medicos` | Profesores y evaluadores encargados de dictaminar integridad y plagio. |
| **`departamentos`** | `especialidades` | Facultades o áreas académicas (Ingeniería, Ciencias, Humanidades, etc.). |
| **`laboratorios`** / `nodos` | `consultorios` | Nodos de cómputo dedicados al procesamiento de modelos de IA e inferencia. |
| **`revisiones`** / `escaneos` | `citas` | Solicitudes formales de escaneo, verificación de similitud y peritaje. |

> **Nota Técnica:** Tanto las rutas HTTP (`/api/estudiantes` y `/api/pacientes`, `/api/docentes` y `/api/medicos`, `/api/laboratorios` y `/api/consultorios`, `/api/revisiones` y `/api/citas`), como las tablas y vistas SQL en PostgreSQL responden de forma idéntica con el 100% de los atributos requeridos.

---

## 3. Arquitectura y Capas de Seguridad Probadas

```text
=============================================================================
PIPELINE DE SEGURIDAD Y CONTROL DE ACCESO PROBADO
=============================================================================

Cliente HTTP (Postman / Swagger UI / Tests Automatizados)
   │
   ├── [Capa 1: API Key]  -> Header X-API-Key (64 caracteres hex)
   │                           -> Valida cliente activo (Módulo de seguridad)
   │                           -> 401 Unauthorized si está ausente/inválido
   │
   ├── [Capa 2: JWT]      -> Header Authorization: Bearer <token>
   │                           -> Valida firma, vigencia y extrae usuarioId y rol
   │                           -> 401 Unauthorized si falta o está vencido
   │
   ├── [Capa 3: RBAC]     -> autorizarRoles('admin', 'docente', 'estudiante')
   │                           -> 403 Forbidden si el rol no tiene privilegio
   │
   ├── [Capa 4: BOLA]     -> autorizarAccesoRevision (Propiedad de objeto)
   │                           -> Estudiante A NO puede ver revisiones de Estudiante B
   │                           -> Docente A NO puede ver revisiones de Docente B
   │                           -> Administrador tiene acceso global auditado
   │
   ├── [Capa 5: Validador]-> Express-Validator
   │                           -> Tipado, normalización camelCase/snake_case, ISO8601
   │                           -> 400 Bad Request si faltan campos obligatorios
   │
   └── [Capa 6: SQL & DB] -> Consultas Parametrizadas en PostgreSQL ($1, $2, ...)
                               -> Advisory locks para transacciones críticas
                               -> Restricciones UNIQUE (documento, correo, horario)
                               -> Integridad referencial FK (ON DELETE RESTRICT)
```

---

## 4. Matriz Completa de Pruebas y Resultados (43 / 43 Aprobadas)

### 8.1 Usuarios y Autenticación (P01 – P07)
| ID | Caso de Prueba | Método y Endpoint | HTTP Esperado | Estado |
|:--:|---|---|:--:|:--:|
| **P01** | Registro de usuario válido | `POST /api/auth/registro` | **201 Created** | **APROBADA** |
| **P02** | Registro con correo ya existente | `POST /api/auth/registro` | **409 Conflict** | **APROBADA** |
| **P03** | Inicio de sesión con credenciales válidas | `POST /api/auth/login` | **200 OK** (JWT) | **APROBADA** |
| **P04** | Inicio de sesión con contraseña incorrecta | `POST /api/auth/login` | **401 Unauthorized** | **APROBADA** |
| **P05** | Consulta de perfil propio con JWT válido | `GET /api/auth/perfil` | **200 OK** | **APROBADA** |
| **P06** | Consulta de perfil sin cabecera Authorization | `GET /api/auth/perfil` | **401 Unauthorized** | **APROBADA** |
| **P07** | Intento de solicitar rol administrador en registro público | `POST /api/auth/registro` (envía `rol: admin`) | **201** (Asigna rol user sin elevación) | **APROBADA** |

### 8.2 Estudiantes / Autores (P08 – P14)
| ID | Caso de Prueba | Método y Endpoint | HTTP Esperado | Estado |
|:--:|---|---|:--:|:--:|
| **P08** | Creación de estudiante con datos válidos | `POST /api/estudiantes` | **201 Created** | **APROBADA** |
| **P09** | Listado general de estudiantes | `GET /api/estudiantes` | **200 OK** | **APROBADA** |
| **P10** | Consulta de estudiante por ID | `GET /api/estudiantes/:id` | **200 OK** | **APROBADA** |
| **P11** | Creación de estudiante con documento duplicado | `POST /api/estudiantes` | **409 Conflict** | **APROBADA** |
| **P12** | Modificación parcial de estudiante | `PATCH /api/estudiantes/:id` | **200 OK** | **APROBADA** |
| **P13** | Asociación de usuario con rol incompatible (docente/admin) | `POST /api/estudiantes` | **409 Conflict** | **APROBADA** |
| **P14** | Eliminación de estudiante con revisiones activas | `DELETE /api/estudiantes/:id` | **409 Conflict** | **APROBADA** |

### 8.3 Docentes / Auditores de Integridad (P15 – P21)
| ID | Caso de Prueba | Método y Endpoint | HTTP Esperado | Estado |
|:--:|---|---|:--:|:--:|
| **P15** | Creación de docente con departamento activo | `POST /api/docentes` | **201 Created** | **APROBADA** |
| **P16** | Registro académico / profesional duplicado | `POST /api/docentes` | **409 Conflict** | **APROBADA** |
| **P17** | Listado de docentes por departamento | `GET /api/docentes` | **200 OK** | **APROBADA** |
| **P18** | Vinculación de usuario con rol docente | `POST /api/docentes` | **201 Created** | **APROBADA** |
| **P19** | Vinculación de usuario con rol estudiante | `POST /api/docentes` | **409 Conflict** | **APROBADA** |
| **P20** | Modificación parcial de docente | `PATCH /api/docentes/:id` | **200 OK** | **APROBADA** |
| **P21** | Eliminación de docente con revisiones asignadas | `DELETE /api/docentes/:id` | **409 Conflict** | **APROBADA** |

### 8.4 Laboratorios y Nodos de Cómputo (P22 – P25)
| ID | Caso de Prueba | Método y Endpoint | HTTP Esperado | Estado |
|:--:|---|---|:--:|:--:|
| **P22** | Registro de nuevo laboratorio / nodo de cómputo | `POST /api/laboratorios` | **201 Created** | **APROBADA** |
| **P23** | Registro con código o número de laboratorio duplicado | `POST /api/laboratorios` | **409 Conflict** | **APROBADA** |
| **P24** | Actualización de ubicación / piso de laboratorio | `PATCH /api/laboratorios/:id` | **200 OK** | **APROBADA** |
| **P25** | Eliminación de laboratorio con revisiones asociadas | `DELETE /api/laboratorios/:id` | **409 Conflict** | **APROBADA** |

### 8.5 Revisiones de Integridad Académica (P26 – P33)
| ID | Caso de Prueba | Método y Endpoint | HTTP Esperado | Estado |
|:--:|---|---|:--:|:--:|
| **P26** | Programación de revisión con datos válidos | `POST /api/revisiones` | **201 Created** | **APROBADA** |
| **P27** | Programación con docente inexistente en base de datos | `POST /api/revisiones` | **400 / 404** | **APROBADA** |
| **P28** | Programación con docente inactivo | `POST /api/revisiones` | **409 Conflict** | **APROBADA** |
| **P29** | Solapamiento de agenda: Docente ocupado en misma fecha y hora | `POST /api/revisiones` | **409 Conflict** | **APROBADA** |
| **P30** | Solapamiento de recurso: Laboratorio ocupado en misma fecha y hora | `POST /api/revisiones` | **409 Conflict** | **APROBADA** |
| **P31** | Máquina de estados: Transición `programada` → `confirmada` | `PATCH /api/revisiones/:id/estado` | **200 OK** | **APROBADA** |
| **P32** | Máquina de estados: Transición `confirmada` → `atendida` | `PATCH /api/revisiones/:id/estado` | **200 OK** | **APROBADA** |
| **P33** | Máquina de estados: Transición inválida `atendida` → `programada` | `PATCH /api/revisiones/:id/estado` | **409 Conflict** | **APROBADA** |

### 8.6 Seguridad, RBAC, Control BOLA/IDOR y Persistencia (P34–P36, SEG01–SEG08)
| ID | Caso de Prueba | Método y Endpoint | HTTP Esperado | Estado |
|:--:|---|---|:--:|:--:|
| **P34 / SEG-02** | BOLA/IDOR: Estudiante A consulta revisión ajena de Estudiante B | `GET /api/revisiones/:id_de_B` con JWT de A | **403 Forbidden** | **APROBADA** |
| **SEG-01** | Propiedad legítima: Estudiante A consulta su propia revisión | `GET /api/revisiones/:id_de_A` con JWT de A | **200 OK** | **APROBADA** |
| **SEG-03** | Estudiante consulta sus revisiones personales | `GET /api/revisiones/mis-revisiones` | **200 OK** (Solo propias) | **APROBADA** |
| **SEG-04** | Docente consulta sus revisiones asignadas | `GET /api/revisiones/mis-revisiones` | **200 OK** (Solo asignadas) | **APROBADA** |
| **SEG-05** | BOLA: Docente A intenta consultar agenda de Docente B | `GET /api/revisiones/docente/:id_de_B` con JWT de A | **403 Forbidden** | **APROBADA** |
| **SEG-06** | BOLA: Docente A consulta revisión individual de Docente B | `GET /api/revisiones/:id_de_B` con JWT de Docente A | **403 Forbidden** | **APROBADA** |
| **SEG-07** | Control de Roles: Docente intenta crear revisión administrativa | `POST /api/revisiones` con JWT de Docente | **403 Forbidden** | **APROBADA** |
| **SEG-08** | Acceso Global: Administrador consulta cualquier revisión | `GET /api/revisiones/:id` con JWT de Admin | **200 OK** | **APROBADA** |
| **P35** | Capa 1: Petición sin cabecera `X-API-Key` | `GET /api/estudiantes` sin API Key | **401 Unauthorized** | **APROBADA** |
| **P36** | Persistencia: Datos y estados conservados tras operaciones | `GET /api/revisiones/:id` | **200 OK** (`atendida`) | **APROBADA** |

---

## 5. Comandos para Ejecutar las Pruebas

```bash
# Ejecutar la suite completa del Laboratorio 8
npm run test:bloque8

# Ejecutar la suite de Bootstrap 7.5.1
npm run test:bloque7.5.1

# Ejecutar todas las suites de prueba del sistema
npm test
```
