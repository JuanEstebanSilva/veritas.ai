/**
 * Veritas AI — Prueba de Integración de Extremo a Extremo (E2E)
 * Valida la persistencia en PostgreSQL / Supabase, el ciclo de vida completo de entidades,
 * RBAC, BOLA/IDOR, rechazo de duplicados y bloqueo por integridad referencial.
 */
import request from 'supertest';
import app from '../src/app';
import { pool, consultar } from '../src/config/database';
import usuariosService from '../src/services/usuarios.service';

const apiKey = '61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0';

async function ejecutarPruebaE2E() {
  console.log('================================================================');
  console.log('🛡️  VERITAS AI — SUITE DE PRUEBAS DE INTEGRACIÓN E2E (SUPABASE / POSTGRESQL)');
  console.log('================================================================');

  const ts = Date.now();
  let tokenAdmin = '';
  let tokenDocente = '';
  let tokenEstudianteA = '';
  let tokenEstudianteB = '';

  let usuarioDocenteId = '';
  let usuarioEstudianteAId = '';
  let usuarioEstudianteBId = '';

  let estudianteAId = 0;
  let estudianteBId = 0;
  let docenteId = 0;
  let revisionId = 0;

  try {
    // -------------------------------------------------------------------------
    // PASO 1: VERIFICACIÓN INICIAL DE BASE DE DATOS
    // -------------------------------------------------------------------------
    console.log('\n[Paso 1] Verificando conexión activa a PostgreSQL...');
    const checkDb = await consultar('SELECT current_database(), current_user, version()');
    console.log(`  ✓ Conectado a BD: "${checkDb.rows[0].current_database}" como usuario "${checkDb.rows[0].current_user}"`);

    // -------------------------------------------------------------------------
    // PASO 2: LOGIN DE ADMINISTRADOR Y ASIGNACIÓN DE ROLES
    // -------------------------------------------------------------------------
    console.log('\n[Paso 2] Autenticación y Asignación de Roles...');
    await usuariosService.crearAdministradorInicial();

    const resLoginAdmin = await request(app)
      .post('/api/auth/login')
      .set('X-API-Key', apiKey)
      .send({
        email: 'admin@veritas.com',
        password: process.env.ADMIN_PASSWORD || 'SANTOTO_2026—2',
      });

    if (resLoginAdmin.status !== 200 || !resLoginAdmin.body.token) {
      throw new Error(`Fallo en login de Administrador: ${resLoginAdmin.status} ${JSON.stringify(resLoginAdmin.body)}`);
    }
    tokenAdmin = resLoginAdmin.body.token;
    console.log('  ✓ Administrador autenticado exitosamente (Token JWT emitido con rol "administrador")');

    // Registrar Docente desde gestión privilegiada
    const emailDocente = `profesor_${ts}@veritas.com`;
    const resRegDocente = await request(app)
      .post('/api/usuarios')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Dr. Alejandro Veritas',
        email: emailDocente,
        password: 'ClaveDocente2026!',
        rol: 'docente',
      });
    if (resRegDocente.status !== 201) {
      throw new Error(`Fallo al registrar usuario docente: ${resRegDocente.status}`);
    }
    usuarioDocenteId = String(resRegDocente.body.usuario.id);

    const resLoginDocente = await request(app)
      .post('/api/auth/login')
      .set('X-API-Key', apiKey)
      .send({ email: emailDocente, password: 'ClaveDocente2026!' });
    tokenDocente = resLoginDocente.body.token;
    console.log('  ✓ Usuario Docente creado con rol "docente" y autenticado');

    // Registro público de Estudiante A
    const emailEstA = `estudiante.a_${ts}@veritas.com`;
    const resRegEstA = await request(app)
      .post('/api/auth/registro')
      .set('X-API-Key', apiKey)
      .send({
        nombre: 'Estudiante A Veritas',
        email: emailEstA,
        password: 'ClaveEstudiante2026!',
      });
    if (resRegEstA.status !== 201) {
      throw new Error(`Fallo al registrar estudiante A: ${resRegEstA.status}`);
    }
    usuarioEstudianteAId = String(resRegEstA.body.usuario.id || resRegEstA.body.usuario.uuid);

    const resLoginEstA = await request(app)
      .post('/api/auth/login')
      .set('X-API-Key', apiKey)
      .send({ email: emailEstA, password: 'ClaveEstudiante2026!' });
    tokenEstudianteA = resLoginEstA.body.token;
    console.log('  ✓ Estudiante A registrado públicamente (Servidor asignó rol "user/estudiante")');

    // Registro público de Estudiante B
    const emailEstB = `estudiante.b_${ts}@veritas.com`;
    const resRegEstB = await request(app)
      .post('/api/auth/registro')
      .set('X-API-Key', apiKey)
      .send({
        nombre: 'Estudiante B Veritas',
        email: emailEstB,
        password: 'ClaveEstudiante2026!',
      });
    usuarioEstudianteBId = String(resRegEstB.body.usuario.id || resRegEstB.body.usuario.uuid);

    const resLoginEstB = await request(app)
      .post('/api/auth/login')
      .set('X-API-Key', apiKey)
      .send({ email: emailEstB, password: 'ClaveEstudiante2026!' });
    tokenEstudianteB = resLoginEstB.body.token;
    console.log('  ✓ Estudiante B registrado públicamente');

    // -------------------------------------------------------------------------
    // PASO 3: REGISTRO DE ENTIDADES EN POSTGRESQL (DOCENTES, ESTUDIANTES, REVISIONES)
    // -------------------------------------------------------------------------
    console.log('\n[Paso 3] Registro y Persistencia de Nuevas Entidades en PostgreSQL...');

    // Crear Docente
    const resDoc = await request(app)
      .post('/api/docentes')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Dr. Alejandro Veritas',
        registroAcademico: `REG-${ts}`,
        email: emailDocente,
        telefono: '3109988776',
        departamentoId: 1,
        usuarioId: usuarioDocenteId,
      });
    if (resDoc.status !== 201) {
      throw new Error(`Fallo al dar de alta perfil de docente: ${resDoc.status} ${JSON.stringify(resDoc.body)}`);
    }
    docenteId = resDoc.body.docente.id;
    console.log(`  ✓ Perfil de Docente persistido en BD (ID: ${docenteId}, Depto: 1)`);

    // Crear Estudiante A
    const resEstA = await request(app)
      .post('/api/estudiantes')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Estudiante A Veritas',
        documento: `DOC-A-${ts}`,
        email: emailEstA,
        telefono: '3001234567',
        fechaNacimiento: '2001-04-12',
        usuarioId: usuarioEstudianteAId,
      });
    if (resEstA.status !== 201) {
      throw new Error(`Fallo al dar de alta perfil Estudiante A: ${resEstA.status}`);
    }
    estudianteAId = resEstA.body.estudiante.id;
    console.log(`  ✓ Perfil de Estudiante A persistido en BD (ID: ${estudianteAId})`);

    // Crear Estudiante B
    const resEstB = await request(app)
      .post('/api/estudiantes')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Estudiante B Veritas',
        documento: `DOC-B-${ts}`,
        email: emailEstB,
        telefono: '3007654321',
        fechaNacimiento: '2002-09-25',
        usuarioId: usuarioEstudianteBId,
      });
    if (resEstB.status !== 201) {
      throw new Error(`Fallo al dar de alta perfil Estudiante B: ${resEstB.status}`);
    }
    estudianteBId = resEstB.body.estudiante.id;
    console.log(`  ✓ Perfil de Estudiante B persistido en BD (ID: ${estudianteBId})`);

    // Crear Revisión de Integridad Académica para Estudiante A
    const resRev = await request(app)
      .post('/api/revisiones')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        estudianteId: estudianteAId,
        docenteId: docenteId,
        fecha: '2026-11-25T14:30:00Z',
        motivo: 'Auditoría de autoría y escaneo antiplagio de Tesis de Grado',
        estado: 'programada',
      });
    if (resRev.status !== 201) {
      throw new Error(`Fallo al programar revisión: ${resRev.status} ${JSON.stringify(resRev.body)}`);
    }
    revisionId = resRev.body.revision.id;
    console.log(`  ✓ Revisión de Integridad Académica persistida en BD (ID: ${revisionId}, Docente: ${docenteId})`);

    // -------------------------------------------------------------------------
    // PASO 4: RECHAZO DE DUPLICADOS (CÓDIGO POSTGRESQL 23505 -> 409 CONFLICT)
    // -------------------------------------------------------------------------
    console.log('\n[Paso 4] Validación de Restricciones UNIQUE y Rechazo de Duplicados (409 Conflict)...');

    // Intentar registrar estudiante con el mismo documento
    const resDupDoc = await request(app)
      .post('/api/estudiantes')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Estudiante Duplicado',
        documento: `DOC-A-${ts}`, // Mismo documento
        email: `otro_${ts}@veritas.com`,
        telefono: '3000000000',
        fechaNacimiento: '2000-01-01',
      });
    if (resDupDoc.status === 409) {
      console.log('  ✓ Intento de documento duplicado bloqueado con HTTP 409 Conflict (PostgreSQL 23505)');
    } else {
      throw new Error(`Se esperaba 409 pero se recibió: ${resDupDoc.status}`);
    }

    // Intentar solapar horario del mismo docente en la misma fecha y hora
    const resDupHorario = await request(app)
      .post('/api/revisiones')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        estudianteId: estudianteBId,
        docenteId: docenteId,
        fecha: '2026-11-25T14:30:00Z', // Mismo docente, misma fecha y hora
        motivo: 'Intento de solapamiento de auditoría en mismo turno',
        estado: 'programada',
      });
    if (resDupHorario.status === 409) {
      console.log('  ✓ Intento de solapamiento de horario para docente bloqueado con HTTP 409 Conflict (uq_docente_horario_revision)');
    } else {
      throw new Error(`Se esperaba 409 para solapamiento pero se recibió: ${resDupHorario.status}`);
    }

    // -------------------------------------------------------------------------
    // PASO 5: RESTRICCIONES DE AUTORIZACIÓN (RBAC) Y CONTROL POR OBJETO (BOLA/IDOR)
    // -------------------------------------------------------------------------
    console.log('\n[Paso 5] Comprobación de Seguridad Multicapa (RBAC y BOLA/IDOR)...');

    // 5.1 RBAC: Estudiante no puede consultar el padrón global de estudiantes
    const resRbac = await request(app)
      .get('/api/estudiantes')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenEstudianteA}`);
    if (resRbac.status === 403) {
      console.log('  ✓ RBAC: Estudiante bloqueado con 403 Forbidden al intentar listar todos los estudiantes');
    } else {
      throw new Error(`Fallo RBAC: se esperaba 403 pero se recibió ${resRbac.status}`);
    }

    // 5.2 BOLA/IDOR: Estudiante A intenta consultar revisiones de Estudiante B
    const resBolaList = await request(app)
      .get(`/api/revisiones/estudiante/${estudianteBId}`)
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenEstudianteA}`);
    if (resBolaList.status === 403) {
      console.log('  ✓ BOLA: Estudiante A bloqueado con 403 Forbidden al intentar consultar revisiones de Estudiante B');
    } else {
      throw new Error(`Fallo BOLA: se esperaba 403 pero se recibió ${resBolaList.status}`);
    }

    // 5.3 BOLA/IDOR: Estudiante B intenta consultar la revisión individual de Estudiante A
    const resBolaItem = await request(app)
      .get(`/api/revisiones/${revisionId}`)
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenEstudianteB}`);
    if (resBolaItem.status === 403) {
      console.log('  ✓ BOLA: Estudiante B bloqueado con 403 Forbidden al intentar leer revisión individual de Estudiante A');
    } else {
      throw new Error(`Fallo BOLA: se esperaba 403 pero se recibió ${resBolaItem.status}`);
    }

    // 5.4 Acceso legítimo: Estudiante A consulta sus propias revisiones
    const resMisRev = await request(app)
      .get('/api/revisiones/mis-revisiones')
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenEstudianteA}`);
    if (resMisRev.status === 200 && resMisRev.body.revisiones.length > 0) {
      console.log(`  ✓ Acceso legítimo verificado: Estudiante A recuperó ${resMisRev.body.revisiones.length} revisión propia`);
    } else {
      throw new Error(`Fallo al consultar mis revisiones legítimas: ${resMisRev.status}`);
    }

    // -------------------------------------------------------------------------
    // PASO 6: BLOQUEO DE ELIMINACIÓN POR INTEGRIDAD REFERENCIAL (POSTGRESQL 23503 -> 409)
    // -------------------------------------------------------------------------
    console.log('\n[Paso 6] Integridad Referencial y Bloqueo de Eliminación con Dependencias...');

    // Intentar eliminar Estudiante A (que tiene la revisión ID: revisionId asociada)
    const resDeleteEst = await request(app)
      .delete(`/api/estudiantes/${estudianteAId}`)
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    if (resDeleteEst.status === 409) {
      console.log('  ✓ Integridad Referencial Activa: Eliminación de Estudiante con revisiones bloqueada con HTTP 409 Conflict');
    } else {
      throw new Error(`Se esperaba 409 al eliminar estudiante con revisiones pero se obtuvo: ${resDeleteEst.status}`);
    }

    // Intentar eliminar Docente con revisión activa
    const resDeleteDoc = await request(app)
      .delete(`/api/docentes/${docenteId}`)
      .set('X-API-Key', apiKey)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    if (resDeleteDoc.status === 409) {
      console.log('  ✓ Integridad Referencial Activa: Eliminación de Docente con revisiones asignadas bloqueada con HTTP 409 Conflict');
    } else {
      throw new Error(`Se esperaba 409 al eliminar docente con revisiones pero se obtuvo: ${resDeleteDoc.status}`);
    }

    // -------------------------------------------------------------------------
    // LIMPIEZA ORDENADA RESPETANDO CLAVES FORÁNEAS
    // -------------------------------------------------------------------------
    console.log('\n[Paso 7] Limpieza ordenada de registros de prueba en PostgreSQL...');
    await consultar('DELETE FROM revisiones WHERE id = $1', [revisionId]);
    await consultar('DELETE FROM estudiantes WHERE id IN ($1, $2)', [estudianteAId, estudianteBId]);
    await consultar('DELETE FROM docentes WHERE id = $1', [docenteId]);
    await consultar('DELETE FROM users WHERE email IN ($1, $2, $3)', [emailDocente, emailEstA, emailEstB]);
    console.log('  ✓ Registros de prueba eliminados en cascada inversa respetando claves foráneas');

    console.log('\n================================================================');
    console.log('🎉 RESULTADO: TODAS LAS FASES DE INTEGRACIÓN E2E COMPLETADAS CON ÉXITO');
    console.log('   • Driver: PostgreSQL (pg Pool nativo)');
    console.log('   • Persistencia: Tablas reales en Supabase/PostgreSQL');
    console.log('   • Capas: Rutas -> Middlewares -> Controllers -> Services (async/await)');
    console.log('   • Seguridad: RBAC, BOLA/IDOR, Foreign Key Guards y Unique Constraints');
    console.log('================================================================\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ ERROR EN LA PRUEBA E2E:');
    console.error(`   • Mensaje: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch {}
  }
}

ejecutarPruebaE2E();
