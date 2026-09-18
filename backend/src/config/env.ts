import dotenv from 'dotenv';
import path from 'path';
import { CryptoVault } from '../utils/cryptoVault';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'veritas_ai_default_jwt_secret_change_me_123',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Administrador',
  ADMIN_LAST_NAME: process.env.ADMIN_LAST_NAME || 'Sistema',
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || 'admin@veritas.ai').toLowerCase().trim(),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin123!Secure*',
  STRIPE_SECRET_KEY: CryptoVault.decrypt(process.env.STRIPE_SECRET_KEY || ''),
  STRIPE_WEBHOOK_SECRET: CryptoVault.decrypt(process.env.STRIPE_WEBHOOK_SECRET || ''),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  AI_API_KEY: CryptoVault.decrypt(process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || ''),
  AI_PROVIDER: process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'demo'),
  AI_MODEL: process.env.AI_MODEL || '',
  AI_TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE || '0.75'),
  OPENAI_API_KEY: CryptoVault.decrypt(process.env.OPENAI_API_KEY || ''),
  GEMINI_API_KEY: CryptoVault.decrypt(process.env.GEMINI_API_KEY || ''),

  // Proveedores de búsqueda web en tiempo real
  GOOGLE_SEARCH_API_KEY: CryptoVault.decrypt(process.env.GOOGLE_SEARCH_API_KEY || ''),
  GOOGLE_SEARCH_CX: CryptoVault.decrypt(process.env.GOOGLE_SEARCH_CX || ''),
  TAVILY_API_KEY: CryptoVault.decrypt(process.env.TAVILY_API_KEY || ''),
  SERPER_API_KEY: CryptoVault.decrypt(process.env.SERPER_API_KEY || ''),
  SEARCH_API_KEY: CryptoVault.decrypt(
    process.env.SEARCH_API_KEY ||
      process.env.GOOGLE_SEARCH_API_KEY ||
      process.env.SERPER_API_KEY ||
      process.env.TAVILY_API_KEY ||
      ''
  ),
  SEARCH_PROVIDER: (process.env.SEARCH_PROVIDER || 'auto').toLowerCase(), // "google" | "tavily" | "serper" | "auto"
  API_KEY: CryptoVault.decrypt(process.env.API_KEY || ''),
};
