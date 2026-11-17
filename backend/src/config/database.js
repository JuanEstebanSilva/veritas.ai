const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  throw new Error('Falta DATABASE_URL en el entorno (backend/.env).');
}

const requiresSSL =
  connectionString.includes('supabase.co') ||
  connectionString.includes('supabase.com') ||
  connectionString.includes('pooler.supabase.com') ||
  connectionString.includes(':6543') ||
  connectionString.includes('sslmode=require') ||
  process.env.PGSSLMODE === 'require';

const possibleCertPaths = [
  path.resolve(__dirname, '../../certs/prod-ca-2021.crt'),
  path.resolve(__dirname, '../../../certs/prod-ca-2021.crt'),
  path.resolve(process.cwd(), 'certs/prod-ca-2021.crt'),
  path.resolve(process.cwd(), 'backend/certs/prod-ca-2021.crt'),
];

let sslConfig = undefined;

if (requiresSSL) {
  // Por defecto se verifica el certificado del servidor con la CA de Supabase. Desactivar la
  // verificación exige declararlo de forma explícita (PGSSL_REJECT_UNAUTHORIZED=false): sin ella,
  // la conexión va cifrada pero no autenticada y admite un intermediario.
  const verificar = process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false';
  const foundCertPath = possibleCertPaths.find((p) => fs.existsSync(p));
  if (verificar && foundCertPath) {
    sslConfig = { ca: fs.readFileSync(foundCertPath, 'utf8'), rejectUnauthorized: true };
  } else if (verificar) {
    sslConfig = { rejectUnauthorized: true };
  } else {
    console.warn('[database] Aviso: verificación TLS desactivada por PGSSL_REJECT_UNAUTHORIZED=false.');
    sslConfig = { rejectUnauthorized: false };
  }
}

const poolConfig = {
  connectionString,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL/Supabase Pool Error inesperado en cliente inactivo]:', err.message);
});

/**
 * Helper de ejecución de consultas parametrizadas SQL para PostgreSQL / Supabase
 * @param {string} sql Sentencia SQL parametrizada con $1, $2, etc.
 * @param {any[]} [params] Arreglo opcional de parámetros
 * @returns {Promise<import('pg').QueryResult>}
 */
const consultar = async (sql, params = []) => {
  return await pool.query(sql, params);
};

/**
 * Cierre controlado de conexiones PostgreSQL / Supabase
 */
const cerrarPool = async () => {
  await pool.end();
};

module.exports = {
  pool,
  consultar,
  cerrarPool,
};
module.exports.default = {
  pool,
  consultar,
  cerrarPool,
};
