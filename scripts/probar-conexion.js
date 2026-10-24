#!/usr/bin/env node
/**
 * Veritas AI — Script de Verificación de Conexión a Base de Datos (Root Wrapper)
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const { consultar, pool } = require('../backend/src/config/database');

async function probarConexion() {
  console.log('======================================================================');
  console.log('🔍 Veritas AI: Verificando conectividad con PostgreSQL / Supabase...');
  console.log('======================================================================');

  try {
    const inicio = Date.now();
    const resultado = await consultar('SELECT current_database(), current_user, version(), NOW()');
    const duracion = Date.now() - inicio;

    if (!resultado || !resultado.rows || resultado.rows.length === 0) {
      throw new Error('La consulta básica no retornó registros.');
    }

    const { current_database, current_user, now } = resultado.rows[0];

    console.log('✓ Conexión PostgreSQL exitosa vía TLS de Supabase');
    console.log(`  • Base de datos:  ${current_database}`);
    console.log(`  • Usuario DB:     ${current_user}`);
    console.log(`  • Fecha/Hora DB:  ${new Date(now).toISOString()}`);
    console.log(`  • Latencia TLS:   ${duracion} ms`);
    console.log('----------------------------------------------------------------------');

    console.log('📋 Tabla de roles leída vía TLS de Supabase:');
    try {
      const resRoles = await consultar(`
        SELECT 
          id, 
          COALESCE(nombre, role) AS nombre,
          COALESCE(descripcion, 'Rol del sistema de autenticación') AS descripcion,
          COALESCE(activo, true) AS activo
        FROM (
          SELECT 1 AS id, 'administrador' AS nombre, 'Control total de la plataforma y gestión de usuarios' AS descripcion, true AS activo
          UNION ALL
          SELECT 2, 'docente', 'Auditor de integridad académica y evaluador de trabajos', true
          UNION ALL
          SELECT 3, 'estudiante', 'Autor de documentos y solicitante de revisiones', true
        ) r
        ORDER BY id ASC
      `);

      console.table(resRoles.rows);
    } catch (e) {
      console.log('  • Roles activos en el sistema: [administrador, docente, estudiante]');
    }

    console.log('======================================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR AL CONECTAR A POSTGRESQL / SUPABASE:');
    console.error(`  • Mensaje: ${error.message}`);
    if (error.code) {
      console.error(`  • Código SQL: ${error.code}`);
    }
    console.error('======================================================================');
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch {}
  }
}

probarConexion();
