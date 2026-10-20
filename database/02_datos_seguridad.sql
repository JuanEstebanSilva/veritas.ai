-- ============================================================================
-- VERITAS AI — PLATAFORMA DE INTEGRIDAD ACADÉMICA Y DETECCIÓN ANTIPLAGIO
-- SCRIPT DML & SEGURIDAD: 02_datos_seguridad.sql (Root Reference)
-- ============================================================================
-- 1. Inserción de Catálogos Iniciales (Departamentos, Docentes, Estudiantes,
--    Laboratorios y Revisiones).
-- 2. Habilitación de Row Level Security (RLS) y Políticas Mínimas de Lectura
--    y Control de Acceso.
-- ============================================================================

-- ============================================================================
-- 1. INSERCIÓN DE CATÁLOGOS INICIALES
-- ============================================================================

-- Departamentos Académicos
INSERT INTO departamentos (id, nombre, descripcion, activo)
VALUES
  (1, 'Ingeniería y Ciencias de la Computación', 'Auditoría de código, algoritmos y proyectos tecnológicos', true),
  (2, 'Ciencias Sociales y Humanidades', 'Análisis de ensayos, papers sociológicos y tesis de grado', true),
  (3, 'Ciencias de la Salud y Biomédicas', 'Revisión de investigaciones clínicas y publicaciones científicas', true)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  activo = EXCLUDED.activo;

SELECT setval('departamentos_id_seq', (SELECT GREATEST(MAX(id), 3) FROM departamentos));

-- Laboratorios y Nodos de Cómputo
INSERT INTO laboratorios (id, numero, piso, activo)
VALUES
  (1, 'Lab-GPU-01', 'Servidor Lingüístico NLP', true),
  (2, 'Lab-Cluster-02', 'Motor de Comparación Vectorial', true),
  (3, 'Lab-Neural-03', 'Detector de Generación IA', true)
ON CONFLICT (id) DO UPDATE SET
  numero = EXCLUDED.numero,
  piso = EXCLUDED.piso,
  activo = EXCLUDED.activo;

SELECT setval('laboratorios_id_seq', (SELECT GREATEST(MAX(id), 3) FROM laboratorios));

-- Docentes Iniciales
INSERT INTO docentes (id, usuario_id, nombre, registro_academico, email, telefono, departamento_id, activo)
VALUES
  (1, NULL, 'Carlos Rodríguez', 'DOC-45871', 'carlos.rodriguez@veritas.com', '3109876543', 2, true)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  registro_academico = EXCLUDED.registro_academico,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  departamento_id = EXCLUDED.departamento_id,
  activo = EXCLUDED.activo;

SELECT setval('docentes_id_seq', (SELECT GREATEST(MAX(id), 1) FROM docentes));

-- Estudiantes Iniciales
INSERT INTO estudiantes (id, usuario_id, nombre, documento, email, telefono, fecha_nacimiento)
VALUES
  (1, NULL, 'Laura Gómez', '1001001001', 'laura@veritas.com', '3001234567', '1995-04-10'),
  (2, NULL, 'Carlos Ramírez', '1001001002', 'carlos@veritas.com', '3012345678', '1988-08-22'),
  (3, NULL, 'Ana Martínez', '1001001003', 'ana@veritas.com', '3023456789', '2000-01-15')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  documento = EXCLUDED.documento,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento;

SELECT setval('estudiantes_id_seq', (SELECT GREATEST(MAX(id), 3) FROM estudiantes));

-- Revisiones Iniciales
INSERT INTO revisiones (id, estudiante_id, docente_id, fecha, hora, motivo, estado)
VALUES
  (1, 1, 1, '2026-11-20', '10:00:00', 'Evaluación y escaneo de integridad académica Veritas AI', 'programada')
ON CONFLICT (id) DO UPDATE SET
  estudiante_id = EXCLUDED.estudiante_id,
  docente_id = EXCLUDED.docente_id,
  fecha = EXCLUDED.fecha,
  hora = EXCLUDED.hora,
  motivo = EXCLUDED.motivo,
  estado = EXCLUDED.estado;

SELECT setval('revisiones_id_seq', (SELECT GREATEST(MAX(id), 1) FROM revisiones));

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS) EN SUPABASE / POSTGRESQL
-- ============================================================================
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE docentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisiones ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "rls_departamentos_lectura" ON departamentos
  FOR SELECT USING (true);

CREATE POLICY "rls_laboratorios_lectura" ON laboratorios
  FOR SELECT USING (true);

CREATE POLICY "rls_docentes_lectura" ON docentes
  FOR SELECT USING (activo = true);

CREATE POLICY "rls_estudiantes_lectura" ON estudiantes
  FOR SELECT USING (true);

CREATE POLICY "rls_revisiones_lectura" ON revisiones
  FOR SELECT USING (true);

CREATE POLICY "rls_departamentos_servicio" ON departamentos
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "rls_docentes_servicio" ON docentes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "rls_estudiantes_servicio" ON estudiantes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "rls_laboratorios_servicio" ON laboratorios
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "rls_revisiones_servicio" ON revisiones
  FOR ALL USING (true) WITH CHECK (true);
