-- ============================================================================
-- VERITAS AI — PLATAFORMA DE INTEGRIDAD ACADÉMICA Y DETECCIÓN ANTIPLAGIO
-- SCRIPT DDL: 01_esquema.sql
-- ============================================================================
-- Define las tablas relacionales con tipos de datos nativos de PostgreSQL,
-- claves foráneas (REFERENCES) con integridad referencial ON DELETE RESTRICT/SET NULL,
-- restricciones CHECK, NOT NULL, DEFAULT e índices únicos para prevenir duplicados.
-- ============================================================================

-- Habilitar extensión pgcrypto / uuid si no está activa
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLA: users (Usuarios del Sistema Veritas AI)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(150) NOT NULL,
  last_name VARCHAR(150) NOT NULL DEFAULT '',
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  premium_since TIMESTAMPTZ,
  daily_analysis_count INT NOT NULL DEFAULT 0,
  last_analysis_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_users_role CHECK (role IN ('USER', 'ADMIN')),
  CONSTRAINT chk_users_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================================================
-- 2. TABLA: departamentos (Departamentos / Facultades Académicas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS departamentos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE,
  descripcion TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. TABLA: docentes (Docentes / Profesores / Auditores de Integridad)
-- ============================================================================
CREATE TABLE IF NOT EXISTS docentes (
  id SERIAL PRIMARY KEY,
  usuario_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
  nombre VARCHAR(150) NOT NULL,
  registro_academico VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  telefono VARCHAR(30) NOT NULL,
  departamento_id INT NOT NULL REFERENCES departamentos(id) ON DELETE RESTRICT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_docente_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT chk_docente_telefono CHECK (LENGTH(TRIM(telefono)) >= 7)
);

-- ============================================================================
-- 4. TABLA: estudiantes (Estudiantes / Autores de Documentos Académicos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS estudiantes (
  id SERIAL PRIMARY KEY,
  usuario_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
  nombre VARCHAR(150) NOT NULL,
  documento VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  telefono VARCHAR(30) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_estudiante_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT chk_estudiante_documento CHECK (LENGTH(TRIM(documento)) >= 4),
  CONSTRAINT chk_estudiante_fecha_nacimiento CHECK (fecha_nacimiento <= CURRENT_DATE)
);

-- ============================================================================
-- 5. TABLA: laboratorios (Laboratorios y Nodos de Cómputo e Inferencia de IA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS laboratorios (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  piso VARCHAR(100) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. TABLA: revisiones (Revisiones y Escaneos de Integridad Académica)
-- ============================================================================
CREATE TABLE IF NOT EXISTS revisiones (
  id SERIAL PRIMARY KEY,
  estudiante_id INT NOT NULL REFERENCES estudiantes(id) ON DELETE RESTRICT,
  docente_id INT NOT NULL REFERENCES docentes(id) ON DELETE RESTRICT,
  laboratorio_id INT REFERENCES laboratorios(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL,
  hora TIME NOT NULL DEFAULT '10:00:00',
  motivo TEXT NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'programada',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_revision_estado CHECK (estado IN ('programada', 'confirmada', 'atendida', 'cancelada')),
  CONSTRAINT chk_revision_motivo CHECK (LENGTH(TRIM(motivo)) >= 3),
  -- Restricción única para prevenir solapamiento de horario de un docente
  CONSTRAINT uq_docente_horario_revision UNIQUE (docente_id, fecha, hora)
);

-- ============================================================================
-- ÍNDICES DE RENDIMIENTO Y BÚSQUEDA
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_docentes_departamento ON docentes(departamento_id);
CREATE INDEX IF NOT EXISTS idx_docentes_usuario ON docentes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_docentes_email ON docentes(email);

CREATE INDEX IF NOT EXISTS idx_estudiantes_usuario ON estudiantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_email ON estudiantes(email);
CREATE INDEX IF NOT EXISTS idx_estudiantes_documento ON estudiantes(documento);

CREATE INDEX IF NOT EXISTS idx_revisiones_estudiante ON revisiones(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_revisiones_docente ON revisiones(docente_id);
CREATE INDEX IF NOT EXISTS idx_revisiones_laboratorio ON revisiones(laboratorio_id);
CREATE INDEX IF NOT EXISTS idx_revisiones_fecha ON revisiones(fecha);
CREATE INDEX IF NOT EXISTS idx_revisiones_estado ON revisiones(estado);
