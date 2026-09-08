import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'veritas_default_jwt_secret_change_me_123',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Administrador',
  ADMIN_LAST_NAME: process.env.ADMIN_LAST_NAME || 'Sistema',
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || 'admin@veritas.ai').toLowerCase().trim(),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin123!Secure*',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_PROVIDER: process.env.AI_PROVIDER || 'demo',
};
