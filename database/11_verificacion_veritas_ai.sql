-- ============================================================================
-- VERITAS AI — LAB 11: CONSULTAS DE AUDITORÍA Y VERIFICACIÓN
-- Dominio Académico: Estudiantes, Docentes, Departamentos, Laboratorios,
-- Revisiones Éticas, Usuarios, Tokens y Códigos de Recuperación
-- ============================================================================

-- ============================================================================
-- 1. Comprobación inicial de tablas del dominio Veritas AI
-- ============================================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'roles', 'usuarios', 'departamentos', 'estudiantes',
    'docentes', 'laboratorios', 'revisiones',
    'password_reset_tokens', 'codigos_recuperacion'
  )
ORDER BY table_name;

-- ============================================================================
-- 2. Roles vigentes en Veritas AI (administrador, docente, estudiante)
-- ============================================================================
SELECT id, nombre, activo FROM public.roles ORDER BY id;

-- ============================================================================
-- 3. Usuarios existentes y sus perfiles académicos (sin exponer contraseñas)
-- ============================================================================
SELECT u.id AS usuario_id, u.email, r.nombre AS rol, u.version_sesion,
       e.id AS estudiante_id, d.id AS docente_id
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
LEFT JOIN public.estudiantes e ON e.usuario_id = u.id::text OR e.usuario_id = u.id::varchar
LEFT JOIN public.docentes d ON d.usuario_id = u.id::text OR d.usuario_id = u.id::varchar
ORDER BY u.id;

-- ============================================================================
-- 4. Verificación de RLS habilitado en las nueve tablas del dominio
-- ============================================================================
SELECT c.relname AS tabla, c.relrowsecurity AS rls_habilitado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r','p')
  AND c.relname IN (
    'roles','usuarios','departamentos','estudiantes','docentes',
    'laboratorios','revisiones','password_reset_tokens','codigos_recuperacion'
  )
ORDER BY c.relname;

-- ============================================================================
-- 5. Columna version_sesion en usuarios
-- ============================================================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'usuarios'
  AND column_name = 'version_sesion';

-- ============================================================================
-- 6. Columnas de las dos nuevas tablas de recuperación
-- ============================================================================
SELECT table_name, ordinal_position, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('password_reset_tokens','codigos_recuperacion')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 7. Claves foráneas de las tablas de recuperación y perfiles académicos
-- ============================================================================
SELECT tc.table_name AS tabla_origen, kcu.column_name AS columna_origen,
       ccu.table_schema AS esquema_destino,
       ccu.table_name AS tabla_destino,
       ccu.column_name AS columna_destino
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.constraint_schema = kcu.constraint_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
 AND tc.constraint_schema = ccu.constraint_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('usuarios','estudiantes','docentes',
                       'password_reset_tokens','codigos_recuperacion')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 8. Índices y restricciones de las nuevas tablas
-- ============================================================================
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('password_reset_tokens','codigos_recuperacion')
ORDER BY tablename, indexname;

SELECT conrelid::regclass AS tabla, conname AS restriccion,
       pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conrelid IN (
    'public.password_reset_tokens'::regclass,
    'public.codigos_recuperacion'::regclass
  )
ORDER BY tabla, restriccion;

-- ============================================================================
-- 9. Estado de tokens temporales emitidos por administradores
-- ============================================================================
SELECT usuario_id, administrador_id, fecha_creacion,
       fecha_expiracion, fecha_uso,
       CASE WHEN fecha_uso IS NOT NULL THEN 'UTILIZADO'
            WHEN fecha_expiracion <= NOW() THEN 'EXPIRADO'
            ELSE 'VIGENTE' END AS estado
FROM public.password_reset_tokens
ORDER BY fecha_creacion DESC;

-- ============================================================================
-- 10. Conteo de códigos de respaldo generados y consumidos por usuario
-- ============================================================================
SELECT usuario_id, COUNT(*) AS total,
       COUNT(*) FILTER (WHERE fecha_uso IS NULL) AS disponibles,
       COUNT(*) FILTER (WHERE fecha_uso IS NOT NULL) AS utilizados
FROM public.codigos_recuperacion
GROUP BY usuario_id
ORDER BY usuario_id;

-- ============================================================================
-- 11. Auditoría de conexión y privilegios de sesión en backend
-- ============================================================================
SELECT current_user AS usuario,
       session_user AS sesion,
       current_setting('row_security') AS rls_configuracion,
       rolbypassrls AS puede_omitir_rls
FROM pg_roles
WHERE rolname = current_user;
