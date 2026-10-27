-- ============================================================================
-- VERITAS AI — PLATAFORMA DE INTEGRIDAD ACADÉMICA Y DETECCIÓN ANTIPLAGIO
-- SCRIPT: 04_bloque_7_5_1_y_8_roles_usuarios.sql
-- ============================================================================
-- 1. Tabla 'roles' y 'usuarios' para dar soporte al Bootstrap (Bloque 7.5.1)
--    y a las consultas de auditoría del Laboratorio 8.
-- 2. Vistas de compatibilidad bidireccional:
--    pacientes <-> estudiantes
--    medicos <-> docentes
--    especialidades <-> departamentos
--    consultorios <-> laboratorios
--    citas <-> revisiones
-- ============================================================================

-- 1. TABLA: roles
CREATE TABLE IF NOT EXISTS public.roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO public.roles (id, nombre, descripcion, activo)
VALUES
  (1, 'administrador', 'Control total de la plataforma y administración general de Veritas AI', true),
  (2, 'docente', 'Auditor de integridad académica y evaluador de trabajos', true),
  (3, 'estudiante', 'Autor de documentos académicos y solicitante de revisiones', true),
  (4, 'medico', 'Alias para docente/auditor (rúbrica hospitalaria)', true),
  (5, 'paciente', 'Alias para estudiante/autor (rúbrica hospitalaria)', true)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  activo = EXCLUDED.activo;

SELECT setval('roles_id_seq', (SELECT GREATEST(MAX(id), 5) FROM roles));

-- 2. TABLA: usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol_id INT NOT NULL REFERENCES public.roles(id),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. VISTAS DE COMPATIBILIDAD
CREATE OR REPLACE VIEW public.pacientes AS
SELECT 
  id,
  usuario_id,
  nombre,
  documento,
  email,
  telefono,
  fecha_nacimiento,
  created_at
FROM public.estudiantes;

CREATE OR REPLACE VIEW public.medicos AS
SELECT 
  id,
  usuario_id,
  nombre,
  registro_academico AS registro_profesional,
  email,
  telefono,
  departamento_id AS especialidad_id,
  activo,
  created_at
FROM public.docentes;

CREATE OR REPLACE VIEW public.especialidades AS
SELECT 
  id,
  nombre,
  descripcion,
  activo,
  created_at
FROM public.departamentos;

CREATE OR REPLACE VIEW public.consultorios AS
SELECT 
  id,
  numero,
  piso,
  activo,
  created_at
FROM public.laboratorios;

CREATE OR REPLACE VIEW public.citas AS
SELECT 
  id,
  estudiante_id AS paciente_id,
  docente_id AS medico_id,
  laboratorio_id AS consultorio_id,
  fecha,
  hora,
  motivo,
  estado,
  created_at
FROM public.revisiones;
