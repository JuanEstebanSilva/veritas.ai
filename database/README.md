# Veritas AI — Base de Datos Relacional (PostgreSQL / Supabase)

Este directorio contiene los scripts DDL, DML y de verificación para la base de datos relacional de **Veritas AI** (Plataforma de Integridad Académica, Detección de IA y Antiplagio).

---

## 📁 Estructura de Scripts SQL

```
database/
├── 01_esquema.sql          # Creación de tablas, claves primarias, claves foráneas, restricciones e índices
├── 02_datos_seguridad.sql  # Población inicial de catálogos y activación de Row Level Security (RLS)
├── 03_verificacion.sql     # Consultas de auditoría, comprobación de integridad y políticas RLS
└── README.md               # Esta documentación técnica
```

---

## 🚀 Orden de Ejecución en Supabase SQL Editor

Para desplegar la base de datos desde la consola web de **Supabase**:

1. Abre tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2. Dirígete a la pestaña **SQL Editor** (icono de terminal `>_`).
3. Ejecuta los scripts en el siguiente orden estricto:

### Paso 1: `01_esquema.sql`
- Habilita la extensión `pgcrypto`.
- Crea las tablas fundamentales adaptadas al dominio académico de Veritas AI:
  - `users`: Cuentas de usuario y metadatos de cuotas de análisis.
  - `departamentos`: Facultades y áreas académicas (Ingeniería, Ciencias Sociales, Salud).
  - `docentes`: Profesores y auditores de integridad académica.
  - `estudiantes`: Autores de documentos académicos y tesistas.
  - `laboratorios`: Nodos de cómputo e inferencia de modelos de IA.
  - `revisiones`: Sesiones y auditorías de integridad académica entre estudiante y docente.
- Establece restricciones `UNIQUE`, `CHECK`, `NOT NULL`, integridad referencial `ON DELETE RESTRICT/SET NULL` e índices de búsqueda rápida.

### Paso 2: `02_datos_seguridad.sql`
- Inserta los catálogos y registros semilla iniciales con `ON CONFLICT DO UPDATE`.
- Ajusta las secuencias autoincrementales (`setval`).
- Habilita **Row Level Security (RLS)** en todas las tablas operativas.
- Define políticas de lectura (`SELECT`) y de servicio autenticado (`ALL`).

### Paso 3: `03_verificacion.sql`
- Ejecuta consultas diagnósticas para auditar:
  - Existencia de las 6 tablas principales.
  - Reglas de integridad referencial activas.
  - Restricciones `CHECK` y unicidad de emails, documentos y registros académicos.
  - Estado de RLS y lista de políticas aplicadas.
  - Consulta integral `JOIN` de revisiones académicas.

---

## ⚡ Ejecución Automatizada desde Node.js

También puedes aplicar y probar los scripts directamente desde la consola del backend con las credenciales de tu archivo `.env`:

```bash
# 1. Probar conectividad con PostgreSQL / Supabase
node scripts/probar-conexion.js

# 2. Ejecutar DDL y DML automáticamente
node scripts/ejecutar-ddl.js

# 3. Correr la suite de pruebas E2E completa
npx ts-node scripts/probar-integracion-e2e.ts
```

---

## 🔐 Configuración de Conexión en Supabase

En el panel de **Supabase** (`Project Settings -> Database -> Connection String`):
- **Modo Transaction Pooler (Recomendado)**:
  - Puerto: `6543`
  - URL: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Modo Direct Connection**:
  - Puerto: `5432`
  - URL: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- **Certificado SSL**: Colocar `prod-ca-2021.crt` en la carpeta `certs/` del proyecto.
