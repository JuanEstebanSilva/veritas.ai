-- ============================================================================
-- VERITAS AI — LAB 11.4: RECUPERACIÓN ADMINISTRATIVA
-- ============================================================================
-- Registra recuperaciones autorizadas por un docente o administrador de Veritas AI
-- mediante tokens temporales de un solo uso almacenados como hash SHA-256.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    usuario_id BIGINT NOT NULL
        REFERENCES public.usuarios(id)
        ON DELETE CASCADE,

    administrador_id BIGINT NOT NULL
        REFERENCES public.usuarios(id),

    token_hash VARCHAR(64) NOT NULL UNIQUE,

    fecha_creacion TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    fecha_expiracion TIMESTAMPTZ NOT NULL,

    fecha_uso TIMESTAMPTZ,

    CONSTRAINT ck_reset_expiracion
        CHECK (fecha_expiracion > fecha_creacion),

    CONSTRAINT ck_reset_uso
        CHECK (
            fecha_uso IS NULL
            OR fecha_uso >= fecha_creacion
        )
);

CREATE INDEX IF NOT EXISTS idx_reset_usuario
ON public.password_reset_tokens(usuario_id);

CREATE INDEX IF NOT EXISTS idx_reset_expiracion
ON public.password_reset_tokens(fecha_expiracion);

ALTER TABLE public.password_reset_tokens
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.password_reset_tokens FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.password_reset_tokens FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.password_reset_tokens FROM authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'S' AND c.relname = 'password_reset_tokens_id_seq') THEN
    EXECUTE 'REVOKE ALL ON SEQUENCE public.password_reset_tokens_id_seq FROM PUBLIC';
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE 'REVOKE ALL ON SEQUENCE public.password_reset_tokens_id_seq FROM anon';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE 'REVOKE ALL ON SEQUENCE public.password_reset_tokens_id_seq FROM authenticated';
    END IF;
  END IF;
END $$;

COMMIT;
