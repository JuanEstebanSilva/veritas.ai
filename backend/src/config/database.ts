import { Pool, PoolConfig, QueryResult } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno si aún no han sido inicializadas
dotenv.config();

const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  throw new Error('Falta DATABASE_URL en el entorno (backend/.env).');
}

// Detección de necesidad de SSL (Supabase Transaction Pooler, puertos 6543 o parámetros sslmode)
const requiresSSL =
  connectionString.includes('supabase.co') ||
  connectionString.includes('supabase.com') ||
  connectionString.includes('pooler.supabase.com') ||
  connectionString.includes(':6543') ||
  connectionString.includes('sslmode=require') ||
  process.env.PGSSLMODE === 'require';

// Búsqueda del certificado CA intermedio/raíz de Supabase (prod-ca-2021.crt)
const possibleCertPaths = [
  path.resolve(__dirname, '../../certs/prod-ca-2021.crt'),
  path.resolve(__dirname, '../../../certs/prod-ca-2021.crt'),
  path.resolve(process.cwd(), 'certs/prod-ca-2021.crt'),
  path.resolve(process.cwd(), 'backend/certs/prod-ca-2021.crt'),
];

let sslConfig: PoolConfig['ssl'] = undefined;

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

const poolConfig: PoolConfig = {
  connectionString,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL/Supabase Pool Error inesperado en cliente inactivo]:', err.message);
});

/**
 * Helper de ejecución de consultas parametrizadas SQL para PostgreSQL / Supabase
 * @param sql Sentencia SQL parametrizada con $1, $2, etc.
 * @param params Arreglo opcional de parámetros
 * @returns Promesa con el resultado de la consulta (QueryResult)
 */
export const consultar = async (sql: string, params: any[] = []): Promise<QueryResult<any>> => {
  return await pool.query(sql, params);
};

/**
 * Cierre controlado de conexiones PostgreSQL / Supabase
 */
export const cerrarPool = async (): Promise<void> => {
  await pool.end();
};

export default {
  pool,
  consultar,
  cerrarPool,
};
