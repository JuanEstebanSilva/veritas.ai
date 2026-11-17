import { body } from 'express-validator';

/**
 * Laboratorio No. 10 — Autorización Segura en APIs REST: RBAC, IDOR/BOLA y Control de Acceso
 * BLOQUE 6B — PARTE 2: Crear el validator administrativo
 *
 * Permite a un administrador crear usuarios privileged (médico o administrador)
 * Deliberadamente descarta: activo, passwordHash, id, esSuperAdmin, permisos.
 */
export const validarCreacionUsuario = [
  body('nombre')
    .isString()
    .withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre debe tener entre 3 y 100 caracteres'),

  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un correo electrónico válido')
    .normalizeEmail(),

  body('password')
    .isString()
    .withMessage('La contraseña debe ser texto')
    .isLength({ min: 10, max: 72 })
    .withMessage('La contraseña debe tener entre 10 y 72 caracteres'),

  body('rol')
    .isIn(['medico', 'administrador', 'admin', 'auditor', 'docente', 'profesor'])
    .withMessage('El rol debe ser docente, medico o administrador'),
];

export default {
  validarCreacionUsuario,
};
