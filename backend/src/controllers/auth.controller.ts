import { AuthController } from './AuthController';

/**
 * Laboratorio No. 9 — Construcción del proyecto — Autenticación con JWT
 * PARTE 7 — Modificar auth.controller.js
 * Puente de compatibilidad con nomenclatura del laboratorio.
 */
export const registrar = AuthController.register;
export const login = AuthController.login;

export default {
  registrar,
  login,
  AuthController,
};
