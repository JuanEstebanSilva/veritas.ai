-- ============================================================================
-- VERITAS AI — FASE 1: ÍNDICES PARCIALES ANTI-CONFLICTO Y RENDIMIENTO (BLOQUE 11)
-- Adaptado al modelo académico: Docentes, Estudiantes, Laboratorios y Revisiones
-- ============================================================================

-- 1. Índices parciales en tablas de recuperación para búsqueda rápida de tokens y códigos activos
CREATE INDEX IF NOT EXISTS idx_prt_token_hash_activo 
ON public.password_reset_tokens (token_hash) 
WHERE fecha_uso IS NULL;

CREATE INDEX IF NOT EXISTS idx_codigos_recup_usuario_activo 
ON public.codigos_recuperacion (usuario_id, codigo_hash) 
WHERE fecha_uso IS NULL;

-- 2. Índices parciales anti-conflicto en revisiones éticas de integridad académica
-- Si existía una restricción que bloqueaba incluso revisiones canceladas, la reemplazamos
ALTER TABLE public.revisiones DROP CONSTRAINT IF EXISTS uq_docente_horario_revision;
DROP INDEX IF EXISTS public.uq_docente_horario_revision;

-- Evitar que un docente tenga dos revisiones asignadas en la misma fecha y hora (salvo canceladas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_recurso_horario_unique 
ON public.revisiones (docente_id, fecha, hora) 
WHERE estado != 'cancelada';

-- Evitar que un laboratorio/nodo de cómputo se reserve dos veces en la misma fecha y hora (salvo canceladas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_espacio_horario_unique 
ON public.revisiones (laboratorio_id, fecha, hora) 
WHERE estado != 'cancelada';
