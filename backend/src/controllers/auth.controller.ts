import { AuthController } from './AuthController';

/**
 * Laboratorio No. 9 y Bloque 11 — Veritas AI
 * Controlador de Autenticación, Recuperación Administrativa y Códigos de Respaldo
 */
export const registrar = AuthController.register;
export const login = AuthController.login;
export const cambiarPassword = AuthController.cambiarPassword;
export const generarRecuperacionAdmin = AuthController.generarRecuperacionAdmin;
export const restablecerPassword = AuthController.restablecerPassword;
export const generarCodigos = AuthController.generarCodigos;
export const estadoCodigos = AuthController.estadoCodigos;
export const restablecerConCodigo = AuthController.restablecerConCodigo;

export default {
  registrar,
  login,
  cambiarPassword,
  generarRecuperacionAdmin,
  restablecerPassword,
  generarCodigos,
  estadoCodigos,
  restablecerConCodigo,
  AuthController,
};
