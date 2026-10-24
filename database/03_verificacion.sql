-- ============================================================================
-- VERITAS AI — PLATAFORMA DE INTEGRIDAD ACADÉMICA Y DETECCIÓN ANTIPLAGIO
-- SCRIPT DE VERIFICACIÓN: 03_verificacion.sql
-- ============================================================================
-- Valida que el esquema relacional, claves foráneas, restricciones de integridad,
-- índices y políticas Row Level Security (RLS) estén correctamente configurados
-- en la base de datos PostgreSQL / Supabase.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. VERIFICACIÓN DE TABLAS EXISTENTES EN EL ESQUEMA PÚBLICO
-- ----------------------------------------------------------------------------
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) AS total_columnas
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'departamentos', 'docentes', 'estudiantes', 'laboratorios', 'revisiones')
ORDER BY table_name;

-- ----------------------------------------------------------------------------
-- 2. VERIFICACIÓN DE CLAVES PRIMARIAS Y FORÁNEAS (INTEGRIDAD REFERENCIAL)
-- ----------------------------------------------------------------------------
SELECT
  tc.table_name, 
  kcu.column_name, 
  tc.constraint_type,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule AS accion_on_delete
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('departamentos', 'docentes', 'estudiantes', 'laboratorios', 'revisiones')
ORDER BY tc.table_name, tc.constraint_type DESC;

-- ----------------------------------------------------------------------------
-- 3. VERIFICACIÓN DE RESTRICCIONES CHECK Y UNIQUE
-- ----------------------------------------------------------------------------
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('users', 'docentes', 'estudiantes', 'revisiones')
  AND tc.constraint_type IN ('CHECK', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_name;

-- ----------------------------------------------------------------------------
-- 4. VERIFICACIÓN DE ÍNDICES DE RENDIMIENTO Y BÚSQUEDA
-- ----------------------------------------------------------------------------
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('docentes', 'estudiantes', 'revisiones')
ORDER BY tablename, indexname;

-- ----------------------------------------------------------------------------
-- 5. VERIFICACIÓN DE ROW LEVEL SECURITY (RLS) ACTIVO
-- ----------------------------------------------------------------------------
SELECT 
  relname AS tabla,
  relrowsecurity AS rls_habilitado,
  relforcerowsecurity AS rls_forzado
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN ('departamentos', 'docentes', 'estudiantes', 'laboratorios', 'revisiones')
ORDER BY relname;

-- ----------------------------------------------------------------------------
-- 6. VERIFICACIÓN DE POLÍTICAS RLS CONFIGURADAS
-- ----------------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('departamentos', 'docentes', 'estudiantes', 'laboratorios', 'revisiones')
ORDER BY tablename, policyname;

-- ----------------------------------------------------------------------------
-- 7. CONSULTA INTEGRAL DE VERIFICACIÓN (JOIN COMPLETO DE REVISIONES)
-- ----------------------------------------------------------------------------
SELECT 
  r.id AS revision_id,
  r.fecha,
  r.hora,
  r.estado,
  r.motivo,
  e.nombre AS estudiante_nombre,
  e.documento AS estudiante_documento,
  e.email AS estudiante_email,
  d.nombre AS docente_nombre,
  d.registro_academico,
  dep.nombre AS departamento_academico
FROM revisiones r
JOIN estudiantes e ON r.estudiante_id = e.id
JOIN docentes d ON r.docente_id = d.id
JOIN departamentos dep ON d.departamento_id = dep.id
ORDER BY r.id ASC;

-- ----------------------------------------------------------------------------
-- 8. CONTEO TOTAL DE REGISTROS POR TABLA
-- ----------------------------------------------------------------------------
SELECT 'departamentos' AS tabla, COUNT(*) AS registros FROM departamentos
UNION ALL
SELECT 'laboratorios', COUNT(*) FROM laboratorios
UNION ALL
SELECT 'docentes', COUNT(*) FROM docentes
UNION ALL
SELECT 'estudiantes', COUNT(*) FROM estudiantes
UNION ALL
SELECT 'revisiones', COUNT(*) FROM revisiones
UNION ALL
SELECT 'users', COUNT(*) FROM users;
