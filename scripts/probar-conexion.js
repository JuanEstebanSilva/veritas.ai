#!/usr/bin/env node
/**
 * Veritas AI — Script de Verificación de Conexión a Base de Datos (Root Wrapper)
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const { consultar, pool } = require('../backend/src/config/database');

async function probarConexion() {
  console.log('========================================================');
  console.log('🔍 Veritas AI: Verificando conectividad con PostgreSQL/Supabase...');
  console.log('========================================================');

  try {
    const inicio = Date.now();
    const resultado = await consultar('SELECT current_database(), current_user, NOW()');
    const duracion = Date.now() - inicio;

    if (!resultado || !resultado.rows || resultado.rows.length === 0) {
      throw new Error('La consulta no retornó registros.');
    }

    const { current_database, current_user, now } = resultado.rows[0];

    console.log('✓ CONEXIÓN EXITOSA ESTABLECIDA');
    console.log(`  • Base de datos:  ${current_database}`);
    console.log(`  • Usuario DB:     ${current_user}`);
    console.log(`  • Fecha/Hora DB:  ${new Date(now).toISOString()}`);
    console.log(`  • Latencia:       ${duracion} ms`);
    console.log('========================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR AL CONECTAR A POSTGRESQL / SUPABASE:');
    console.error(`  • Mensaje: ${error.message}`);
    if (error.code) {
      console.error(`  • Código SQL: ${error.code}`);
    }
    console.error('========================================================');
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch {}
  }
}

probarConexion();
