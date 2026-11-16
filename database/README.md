# Plagelio — Base de Datos Relacional (PostgreSQL / Supabase)

Arquitectura, catálogo de scripts SQL, modelo relacional e instrucciones de despliegue para la base de datos de **Plagelio** (Plataforma de Integridad Académica, Detección de IA y Auditoría de Documentos).

---

## 🗄️ 1. Modelo de Datos y Entidades

El modelo relacional de **Plagelio** está compuesto por **9 tablas principales** en el esquema `public`, diseñadas para garantizar la integridad referencial, el principio de mínimo privilegio, el versionado de sesiones y la recuperación segura de cuentas:

```
┌──────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│    roles     │◀──────│       usuarios       │──────▶│ password_reset_tokens  │
└──────────────┘   1:N └──────────────────────┘ 1:N   └────────────────────────┘
                               │         │
                        1:1 (O)│         │ 1:N
                               ▼         ▼
    ┌──────────────┐   ┌─────────────┐ ┌────────────────────────┐
    │departamentos │   │ estudiantes │ │  codigos_recuperacion  │
    └──────────────┘   └─────────────┘ └────────────────────────┘
           │ 1:N               │ 1:N
           ▼                   ▼
    ┌──────────────┐   ┌──────────────────────┐       ┌────────────────────────┐
    │   docentes   │◀──│      revisiones      │──────▶│      laboratorios      │
    └──────────────┘1:N└──────────────────────┘   N:1 └────────────────────────┘
```

### Descripción de Tablas y Relaciones:

| Tabla | Dominio Académico de Plagelio | Equivalencia Hospital | Propósito y Relaciones |
|---|---|---|---|
| `roles` | Catálogo de perfiles | `roles` | Define los roles `administrador`, `docente` y `estudiante`. |
| `usuarios` | Cuentas y credenciales | `usuarios` | Almacena correo, hash bcrypt, estado activo y columna crítica `version_sesion` (INT). |
| `departamentos` | Facultades / Áreas | `especialidades` | Catálogo académico (Ingeniería, Humanidades, Salud). |
| `docentes` | Profesores auditores de ética | `medicos` | Profesionales vinculados a departamentos y cuentas de usuario (`usuario_id`). |
| `estudiantes` | Autores y tesistas | `pacientes` | Perfiles académicos vinculados a cuentas de usuario (`usuario_id`). |
| `laboratorios` | Nodos de cómputo e inferencia | `consultorios` | Infraestructura de auditoría y análisis de IA. |
| `revisiones` | Revisiones de integridad académica | `citas` | Auditorías y sesiones de revisión entre estudiante, docente y laboratorio. |
| `password_reset_tokens` | Recuperación administrativa | `password_reset_tokens` | Tokens de recuperación generados por admin, protegidos con hash SHA-256. |
| `codigos_recuperacion` | Códigos de respaldo | `codigos_recuperacion` | Lotes de códigos alfanuméricos de un solo uso protegidos con hash SHA-256. |

---

## 📁 2. Estructura y Catálogo de Scripts SQL

```
database/
├── 01_esquema.sql                              # Creación de tablas base, llaves primarias, foráneas e índices
├── 02_datos_seguridad.sql                      # Catálogos semilla, secuencias y activación de Row Level Security (RLS)
├── 03_verificacion.sql                         # Consultas de verificación de esquema y políticas RLS
├── 04_bloque_7_5_1_y_8_roles_usuarios.sql       # Tablas de roles y usuarios para autorización RBAC
├── 11_3_version_sesion.sql                     # Migración Bloque 11: Columna version_sesion para revocación JWT
├── 11_4_password_reset_tokens.sql              # Migración Bloque 11: Tabla de tokens de recuperación administrativa
├── 11_4_2_codigos_recuperacion.sql             # Migración Bloque 11: Tabla de códigos de respaldo
├── 11_5_indices_anticonflicto_y_rendimiento.sql# Migración Bloque 11: Índices parciales anticonflicto de horario
├── 11_verificacion_plagelio.sql                # Auditoría integral de 25 pruebas del Bloque 11
└── README.md                                   # Esta documentación técnica
```

---

## 🚀 3. Procedimiento de Despliegue

### Opción A: Despliegue en PostgreSQL Local (`plagelio`)

Para desplegar la base de datos completa en tu PostgreSQL local:

```powershell
# 1. Crear la base de datos (si aún no existe)
psql -U postgres -c "CREATE DATABASE plagelio;"

# 2. Ejecutar esquema base y catálogos
psql -U postgres -d plagelio -f database/01_esquema.sql
psql -U postgres -d plagelio -f database/02_datos_seguridad.sql
psql -U postgres -d plagelio -f database/04_bloque_7_5_1_y_8_roles_usuarios.sql

# 3. Aplicar migraciones del Bloque 11
psql -U postgres -d plagelio -f database/11_3_version_sesion.sql
psql -U postgres -d plagelio -f database/11_4_password_reset_tokens.sql
psql -U postgres -d plagelio -f database/11_4_2_codigos_recuperacion.sql
psql -U postgres -d plagelio -f database/11_5_indices_anticonflicto_y_rendimiento.sql

# 4. Verificar integridad y pruebas
psql -U postgres -d plagelio -f database/11_verificacion_plagelio.sql
```

### Opción B: Despliegue en la Nube (Supabase SQL Editor)

1. Ingresa a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2. Dirígete a la pestaña **SQL Editor**.
3. Ejecuta los scripts en el siguiente orden estricto:
   1. `01_esquema.sql` (Crea tablas, llaves y restricciones)
   2. `02_datos_seguridad.sql` (Puebla catálogos y activa políticas RLS)
   3. `04_bloque_7_5_1_y_8_roles_usuarios.sql` (Puebla roles institucionales)
   4. `11_3_version_sesion.sql` (Añade `version_sesion`)
   5. `11_4_password_reset_tokens.sql` (Crea tabla de recuperación administrativa)
   6. `11_4_2_codigos_recuperacion.sql` (Crea tabla de códigos de respaldo)
   7. `11_5_indices_anticonflicto_y_rendimiento.sql` (Crea índices anticonflicto)
   8. `11_verificacion_plagelio.sql` (Ejecuta la batería de comprobaciones)

---

## 🔒 4. Medidas de Seguridad en la Base de Datos

1. **Protección Criptográfica en Reposo**:
   - Las contraseñas se almacenan exclusivamente como hashes `bcrypt` generados con salt de 10-12 rondas.
   - Los tokens de recuperación administrativa se almacenan como hashes **SHA-256** hexadecimales de 64 caracteres (`token_hash`), evitando fugas incluso ante accesos no autorizados a la base de datos.
   - Los códigos de respaldo se almacenan igualmente con hash **SHA-256** (`codigo_hash`).

2. **Revocación de Sesiones (`version_sesion`)**:
   - Cada cuenta en `public.usuarios` posee un entero `version_sesion DEFAULT 1`.
   - Cuando un usuario cambia su contraseña, se ejecuta:
     ```sql
     UPDATE public.usuarios SET password_hash = $1, version_sesion = version_sesion + 1 WHERE id = $2;
     ```
   - Los tokens JWT en circulación portan la versión previa (`payload.version_sesion`). El middleware `autenticarJWT` compara ambas versiones; si la del token es menor, el token queda revocado inmediatamente.

3. **Prevención de Solapamiento de Horarios (Anticonflicto)**:
   - Índices únicos parciales en PostgreSQL evitan citas duplicadas en el mismo horario para un mismo docente o laboratorio cuando la revisión no está cancelada:
     ```sql
     CREATE UNIQUE INDEX IF NOT EXISTS uq_revisiones_docente_horario_activo
     ON public.revisiones (docente_id, fecha, hora)
     WHERE estado != 'cancelada';
     ```

4. **Row Level Security (RLS)**:
   - RLS habilitado en todas las tablas sensibles para garantizar aislamiento multi-tenant cuando se consulta mediante el cliente Supabase.
