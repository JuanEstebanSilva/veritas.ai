const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:admin123@localhost:5432/veritas_ai?schema=public';

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
  const foundCertPath = possibleCertPaths.find((p) => fs.existsSync(p));
  if (foundCertPath) {
    sslConfig = {
      ca: fs.readFileSync(foundCertPath, 'utf8'),
      rejectUnauthorized: true,
    };
  } else {
    sslConfig = {
      rejectUnauthorized: false,
    };
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

module.exports = {
  pool,
  consultar,
};
module.exports.default = {
  pool,
  consultar,
};
