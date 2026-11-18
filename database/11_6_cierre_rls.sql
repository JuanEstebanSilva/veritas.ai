-- ============================================================================
-- 11.6  Cierre de RLS: sin políticas abiertas y sin acceso de los roles de la API pública
-- ----------------------------------------------------------------------------
-- 02_datos_seguridad.sql habilitó RLS en las tablas académicas, pero con políticas
-- USING (true) para todos los roles: en Supabase eso deja leer y modificar
-- departamentos, docentes, estudiantes, laboratorios y revisiones a cualquiera que
-- tenga la URL del proyecto y la clave anónima (PostgREST). Las tablas que crea
-- Prisma (users, analyses, payments, api_clients...) ni siquiera tenían RLS.
--
-- Plagelio no expone la base a los navegadores: todo pasa por el backend, que se
-- conecta con el rol dueño de las tablas (postgres). El dueño no está sujeto a RLS
-- mientras no se use FORCE ROW LEVEL SECURITY, así que el backend sigue funcionando
-- y los roles anon y authenticated quedan sin acceso.
--
-- Si algún día el backend se conecta con un rol que NO sea el dueño, ese rol
-- necesitará BYPASSRLS o políticas propias.
-- Idempotente: se puede ejecutar más de una vez.
-- ============================================================================

-- 1. Retirar las políticas abiertas
DROP POLICY IF EXISTS "rls_departamentos_lectura" ON departamentos;
DROP POLICY IF EXISTS "rls_departamentos_servicio" ON departamentos;
DROP POLICY IF EXISTS "rls_docentes_lectura" ON docentes;
DROP POLICY IF EXISTS "rls_docentes_servicio" ON docentes;
DROP POLICY IF EXISTS "rls_estudiantes_lectura" ON estudiantes;
DROP POLICY IF EXISTS "rls_estudiantes_servicio" ON estudiantes;
DROP POLICY IF EXISTS "rls_laboratorios_lectura" ON laboratorios;
DROP POLICY IF EXISTS "rls_laboratorios_servicio" ON laboratorios;
DROP POLICY IF EXISTS "rls_revisiones_lectura" ON revisiones;
DROP POLICY IF EXISTS "rls_revisiones_servicio" ON revisiones;

-- 2. RLS activa (sin políticas = nadie salvo el dueño) y sin privilegios para la API pública
DO $$
DECLARE
  t text;
  r text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'departamentos', 'docentes', 'estudiantes', 'laboratorios', 'revisiones',
    'usuarios', 'roles', 'codigos_recuperacion', 'password_reset_tokens',
    'users', 'analyses', 'analysis_results', 'analysis_sources', 'payments', 'api_clients'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', t);
      FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
          EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', t, r);
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- Las secuencias del esquema tampoco se usan desde la API pública
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
      -- Y las tablas que se creen después tampoco les quedan concedidas por defecto
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', r);
    END IF;
  END LOOP;
END $$;

-- 3. Verificación: debe devolver cero filas
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public' AND (qual = 'true' OR with_check = 'true');
