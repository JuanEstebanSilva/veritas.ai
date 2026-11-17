#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { pool } = require('../src/config/database');

async function ejecutarDDL() {
  console.log('🚀 Aplicando scripts DDL y catálogos en PostgreSQL / Supabase...');

  const esquemaPath = path.resolve(__dirname, '../database/01_esquema.sql');
  const datosPath = path.resolve(__dirname, '../database/02_datos_seguridad.sql');

  const client = await pool.connect();
  try {
    const sqlEsquema = fs.readFileSync(esquemaPath, 'utf8');
    console.log('1. Ejecutando 01_esquema.sql...');
    await client.query(sqlEsquema);
    console.log('✓ Tablas, claves foráneas, restricciones e índices creados correctamente.');

    const sqlDatos = fs.readFileSync(datosPath, 'utf8');
    console.log('2. Ejecutando 02_datos_seguridad.sql...');
    await client.query(sqlDatos);
    console.log('✓ Catálogos iniciales y políticas RLS aplicadas correctamente.');

    console.log('========================================================');
    console.log('✅ Esquema y seguridad inicializados exitosamente.');
    console.log('========================================================');
  } catch (error) {
    console.error('❌ Error aplicando scripts DDL:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

ejecutarDDL();
