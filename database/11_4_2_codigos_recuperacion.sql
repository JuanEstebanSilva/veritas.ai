-- ============================================================================
-- VERITAS AI — LAB 11.4.2: CÓDIGOS DE RECUPERACIÓN DE RESPALDO
-- ============================================================================
-- Conserva hashes de códigos de respaldo de un solo uso generados por estudiantes,
-- docentes o administradores de Veritas AI mientras se encuentran autenticados.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.codigos_recuperacion (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    codigo_hash VARCHAR(64) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_uso TIMESTAMPTZ,
    CONSTRAINT ck_codigos_fecha_uso CHECK (fecha_uso IS NULL OR fecha_uso >= fecha_creacion)
);

CREATE INDEX IF NOT EXISTS idx_codigos_recuperacion_usuario ON public.codigos_recuperacion(usuario_id);

ALTER TABLE public.codigos_recuperacion ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.codigos_recuperacion FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.codigos_recuperacion FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.codigos_recuperacion FROM authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'S' AND c.relname = 'codigos_recuperacion_id_seq') THEN
    EXECUTE 'REVOKE ALL ON SEQUENCE public.codigos_recuperacion_id_seq FROM PUBLIC';
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE 'REVOKE ALL ON SEQUENCE public.codigos_recuperacion_id_seq FROM anon';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE 'REVOKE ALL ON SEQUENCE public.codigos_recuperacion_id_seq FROM authenticated';
    END IF;
  END IF;
END $$;

COMMIT;
