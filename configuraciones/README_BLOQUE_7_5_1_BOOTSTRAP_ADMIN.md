# Bloque 7.5.1 — Inicialización Segura del Administrador mediante Script Independiente (Bootstrap)
## Plataforma: Veritas AI (Detección de IA, Integridad Académica y Antiplagio)

---

## 1. Objetivo del Bloque

Separar la creación del **primer usuario administrador** del arranque habitual del servidor HTTP de la **API Veritas AI** (Node.js, Express, TypeScript y PostgreSQL / Supabase). 

- El bootstrap administrativo se ejecuta de manera explícita y controlada mediante el comando:
  ```bash
  npm run seed:admin
  ```
- El arranque del servicio HTTP (`npm run dev` o `npm start` ejecutando `src/server.ts`) **únicamente** inicializa el servidor web y escucha peticiones, sin crear usuarios administradores automáticamente en cada encendido.

> **Compatibilidad de Dominio:** Veritas AI modela un ecosistema de integridad académica con **Estudiantes (Autores)**, **Docentes (Auditores)**, **Departamentos**, **Laboratorios / Nodos de Cómputo** y **Revisiones**. Para garantizar 100% de cumplimiento con la rúbrica de evaluación académica, el sistema mantiene vistas y alias de compatibilidad equivalentes (`pacientes`, `medicos`, `consultorios`, `citas`, `especialidades`).

---

## 2. Metáfora de Arquitectura: Instalación vs. Operación

El bootstrap administrativo equivale a entregar la **primera llave maestra** durante la instalación de un campus o centro de cómputo:
- No tiene sentido forjar una nueva llave maestra cada vez que se encienden las luces del edificio (`server.ts`).
- Una vez creado el primer administrador, la gestión de nuevas cuentas administrativas corresponde a operaciones autorizadas y auditadas dentro de la plataforma con roles RBAC.

```text
=============================================================================
ARQUITECTURA DESACOPLADA VERITAS AI
=============================================================================

INICIALIZACIÓN CONTROLADA (Bootstrap)        OPERACIÓN HABITUAL (Servidor HTTP)
--------------------------------------        ----------------------------------
npm run seed:admin                            npm run dev / npm start
         │                                                     │
         ▼                                                     ▼
backend/src/scripts/crearAdmin.js                     backend/src/server.ts
         │                                                     │
         ▼                                                     ▼
backend/src/services/usuarios.service.ts              Express (Helmet, CORS, Rate Limit)
         │                                                     │
         ▼                                                     ▼
PostgreSQL Advisory Lock (7505, 1)                    Middlewares (API Key, JWT, RBAC)
Verificación de Idempotencia                                  │
Bcrypt Hash (Costo >= 10)                                      ▼
Transacción Atómica (BEGIN/COMMIT)                    Controladores & Rutas Académicas
         │                                                     │
         ▼                                                     ▼
Supabase / PostgreSQL Pool                            Supabase / PostgreSQL Pool
(Tablas roles, usuarios, users)                       (Consultas Parametrizadas)
```

---

## 3. Componentes Implementados y Modificados

| Componente | Archivo | Modificación Realizada |
|---|---|---|
| **Script Bootstrap JS** | `backend/src/scripts/crearAdmin.js` | Script ejecutable directamente con Node. Carga variables de entorno, valida requisitos de seguridad, invoca `crearAdministradorInicial()`, garantiza formato idéntico a la terminal de referencia y cierra el pool con `cerrarPool()`. |
| **Script Bootstrap TS** | `backend/src/scripts/crearAdmin.ts` | Versión tipada en TypeScript para interoperabilidad completa con `ts-node`. |
| **Cierre de Pool** | `backend/src/config/database.ts` y `.js` | Exporta la función `cerrarPool()` para terminar limpiamente las conexiones del cliente `pg.Pool` al finalizar el script. |
| **Servicio de Usuarios** | `backend/src/services/usuarios.service.ts` | Implementa `crearAdministradorInicial()` con: <br>• Advisory lock `pg_advisory_xact_lock(7505, 1)`. <br>• Validación de longitud mínima de contraseña (12 caracteres). <br>• Transacción SQL estricta (BEGIN / COMMIT / ROLLBACK). <br>• Prevención de elevación accidental si el correo ya pertenece a un estudiante o usuario ordinario. |
| **Desacople en Server** | `backend/src/server.ts` | Eliminada la invocación automática `crearAdministradorInicial()` y su importación del flujo de arranque de Express. |
| **Scripts en package.json** | `package.json` y `backend/package.json` | Agregado `"seed:admin": "node src/scripts/crearAdmin.js"` y proxy en la raíz `"seed:admin": "npm --prefix backend run seed:admin"`. |
| **Suite de Pruebas** | `backend/tests/bloque7_5_1_bootstrap.test.ts` | 9 pruebas automatizadas (BA01–BA09) que verifican bloqueo, idempotencia, integridad de hashes, inicio de sesión y restricciones de seguridad. |

---

## 4. Salida en Terminal (Concordancia con Evidencia)

Al ejecutar por primera vez:
```bash
npm run seed:admin
```
Salida obtenida:
```text
Iniciando bootstrap administrativo...
Administrador inicial creado correctamente.
ID del administrador: 1
Bootstrap finalizado correctamente.
```

Al ejecutar por segunda vez consecutiva (demostración de idempotencia estricta):
```bash
npm run seed:admin
```
Salida obtenida:
```text
Iniciando bootstrap administrativo...
Ya existe una cuenta administradora.
No se realizaron modificaciones.
Bootstrap finalizado correctamente.
```

---

## 5. Matriz de Pruebas del Bootstrap (BA01 - BA09)

Todas las pruebas se encuentran implementadas y verificadas al 100% en `backend/tests/bloque7_5_1_bootstrap.test.ts`:

| ID | Caso de Prueba | Resultado Esperado | Estado |
|:--:|---|---|:--:|
| **BA01** | Ejecución con administrador existente | No duplica, no altera cuenta, log informativo | **APROBADA** |
| **BA02** | Ejecución doble consecutiva (Idempotencia) | Segunda ejecución no modifica datos | **APROBADA** |
| **BA03** | Verificación SQL en `usuarios` + `roles` | Registro único con rol `administrador` (rol_id = 1) | **APROBADA** |
| **BA04** | Login con credenciales de bootstrap | HTTP 200 OK + JWT válido con rol `administrador` | **APROBADA** |
| **BA05** | Arranque de la API sin variables `ADMIN_*` | Express inicia sin errores y responde `/api/health` | **APROBADA** |
| **BA06** | Acceso a ruta administrativa con JWT de admin | HTTP 200 OK autorizado por middleware RBAC | **APROBADA** |
| **BA07** | Bootstrap sin variables `ADMIN_*` definidas | Error controlado, salida limpia | **APROBADA** |
| **BA08** | Intento con contraseña < 12 caracteres | Rechazo inmediato por política de robustez | **APROBADA** |
| **BA09** | Correo asignado previamente a estudiante | Rechazo por conflicto; impide elevación de privilegios | **APROBADA** |

Para ejecutar esta suite:
```bash
npm run test:bloque7.5.1
```
