-- ============================================================================
-- VERITAS AI — LAB 11.3: CONTROL DE VERSIÓN DE SESIÓN
-- ============================================================================
-- Agrega a public.usuarios la columna version_sesion para invalidar tokens JWT
-- emitidos antes de un cambio o restablecimiento de contraseña.
-- Conserva usuarios, roles, perfiles y contraseñas existentes.
-- ============================================================================

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS version_sesion INTEGER NOT NULL DEFAULT 0;

SELECT id, email, version_sesion FROM public.usuarios ORDER BY id;
